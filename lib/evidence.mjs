export class AuditError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export const VERDICTS = ['supported', 'contradicted', 'mixed', 'insufficient'];
export const MODEL = 'nvidia/nemotron-3-super-120b-a12b';
export const BASE_URL = 'https://api.tokenfactory.us-central1.nebius.com/v1';
export function safeUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function validateInput(input) {
  if (!input || typeof input !== 'object') throw new AuditError('Send a document and optional source notes.');
  const document = typeof input.document === 'string' ? input.document.trim() : '';
  if (document.length < 20 || document.length > 12000) throw new AuditError('The document must contain between 20 and 12,000 characters.');
  if (!Array.isArray(input.sources) || input.sources.length > 6) throw new AuditError('Add up to six source notes.');
  const sources = input.sources.map((s, i) => {
    if (!s || typeof s.text !== 'string' || s.text.trim().length < 20 || s.text.length > 12000) throw new AuditError(`Source ${i + 1} needs 20–12,000 characters.`);
    return { id: `S${i + 1}`, title: String(s.title || `Source ${i + 1}`).slice(0, 160), text: s.text.trim(), url: safeUrl(s.url), origin: 'provided', retrievedAt: null };
  });
  if (sources.reduce((sum, s) => sum + s.text.length, 0) > 48000) throw new AuditError('Keep the combined source notes below 48,000 characters.');
  const search = input.search === true;
  if (!sources.length && !search) throw new AuditError('Add at least one source note or enable web research.');
  return { title: String(input.title || 'Untitled review').slice(0, 100), document, sources, search, maxClaims: Math.min(6, Math.max(1, Number.isInteger(input.maxClaims) ? input.maxClaims : 5)) };
}
export function parseModelJSON(content) {
  if (typeof content !== 'string') throw new AuditError('The model returned no structured answer. Please retry.', 502);
  const clean = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { throw new AuditError('The model returned invalid JSON. No evidence verdict was accepted. Please retry.', 502); }
}
export async function digest(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('');
}
export function extractClaims(data, document, limit) {
  if (!Array.isArray(data?.claims) || !data.claims.length) throw new AuditError('No checkable claims were returned. Try a more factual document.', 422);
  const seen = new Set();
  return data.claims.slice(0, limit).map((c, i) => {
    if (typeof c?.text !== 'string' || c.text.length < 8 || c.text.length > 1000 || !document.includes(c.text) || seen.has(c.text)) throw new AuditError('Claim extraction could not be anchored to the original document. Please retry.', 502);
    seen.add(c.text);
    return { id: `C${i + 1}`, text: c.text, start: document.indexOf(c.text), end: document.indexOf(c.text) + c.text.length, query: String(c.query || c.text).slice(0, 300) };
  });
}
// Quote presence is deterministic. Whether it supports a claim is still model judgement.
export function groundVerdict(claim, candidate, sources) {
  const warnings = [], evidence = [], cited = new Set();
  for (const item of Array.isArray(candidate?.evidence) ? candidate.evidence.slice(0, 8) : []) {
    const source = sources.find(s => s.id === item?.sourceId);
    const quote = typeof item?.quote === 'string' ? item.quote : '';
    const start = source?.text.indexOf(quote) ?? -1;
    if (!source || quote.trim().length < 12 || quote.length > 1400 || start < 0 || !['supports', 'contradicts', 'context'].includes(item.relation)) {
      warnings.push('A proposed citation was rejected because its source, exact quote, or relationship was invalid.'); continue;
    }
    const key = `${source.id}:${start}:${item.relation}`;
    if (cited.has(key)) continue;
    cited.add(key);
    evidence.push({ sourceId: source.id, quote, start, end: start + quote.length, relation: item.relation, verified: true });
  }
  const support = evidence.some(e => e.relation === 'supports'), conflict = evidence.some(e => e.relation === 'contradicts');
  const status = support && conflict ? 'mixed' : conflict ? 'contradicted' : support ? 'supported' : 'insufficient';
  if (!candidate) warnings.push('The model did not return a review for this claim.');
  return { ...claim, status, evidence, warnings, explanation: String(candidate?.explanation || 'There is not enough verified evidence to decide.').slice(0, 1800), suggestedRevision: String(candidate?.suggestedRevision || '').slice(0, 1400), nextQuestion: String(candidate?.nextQuestion || 'What primary source would establish this claim?').slice(0, 700) };
}
export function toMarkdown(report, reviews = {}) {
  const lines = [`# ${report.title}`, '', `Mode: ${report.mode === 'live' ? 'Live Nebius inference' : 'Illustrative fixture — no AI inference'}`, `Created: ${report.createdAt}`, `Model: ${report.model || 'None (hand-authored fixture)'}`, '', '> Exact quote matching checks provenance, not the truth of a source or the model’s interpretation. Human review is required.', '', '## Document', '', report.document, '', '## Claim review', ''];
  for (const c of report.claims) {
    lines.push(`### ${c.id} · ${c.status.toUpperCase()}`, '', c.text, '', c.explanation, '');
    for (const e of c.evidence) {
      const s = report.sources.find(s => s.id === e.sourceId);
      lines.push(`> ${e.quote.replace(/\n/g, '\n> ')}`, '', `Source: ${s?.title || e.sourceId} (${e.sourceId}), characters ${e.start}–${e.end}, relation: ${e.relation}.`, s?.url ? `URL: ${s.url}` : 'User-provided / fixture source.', '');
    }
    if (c.suggestedRevision) lines.push(`Suggested revision (review before use): ${c.suggestedRevision}`, '');
    if (c.nextQuestion) lines.push(`Follow-up: ${c.nextQuestion}`, '');
    if (c.warnings.length) lines.push(`Validation notes: ${c.warnings.join(' ')}`, '');
    if (reviews[c.id]) lines.push(`Human review: ${reviews[c.id].decision || 'pending'}. ${reviews[c.id].note || ''}`, '');
  }
  lines.push('## Source snapshots', '');
  for (const s of report.sources) lines.push(`### ${s.id} · ${s.title}`, `SHA-256: ${s.hash}`, `Origin: ${s.origin}; retrieved: ${s.retrievedAt || 'not retrieved from web'}`, '', s.text, '');
  lines.push('## Run trace', '', ...report.trace.map(t => `- ${t.stage}: ${t.detail}`), '', `Usage: ${JSON.stringify(report.usage)}`);
  return lines.join('\n');
}
