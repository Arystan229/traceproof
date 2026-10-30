import test from 'node:test';
import assert from 'node:assert/strict';
import { digest, extractClaims, groundVerdict, parseModelJSON, safeUrl, toMarkdown, validateInput } from '../lib/evidence.mjs';
import { runAudit } from '../lib/audit.mjs';
import { makeSample, SAMPLE_DOCUMENT, SAMPLE_SOURCES } from '../lib/sample.mjs';

const claim = { id: 'C1', text: 'Single sign-on is included in every plan.' };
const quote = 'Single sign-on is available on the Enterprise plan only.';
const candidate = { explanation: 'Plan scope differs.', evidence: [{ sourceId: 'S1', quote, relation: 'contradicts' }] };
test('valid quotes retain exact source offsets', () => {
  const result = groundVerdict(claim, candidate, SAMPLE_SOURCES);
  assert.equal(result.status, 'contradicted');
  const e = result.evidence[0]; assert.equal(SAMPLE_SOURCES[0].text.slice(e.start, e.end), e.quote);
});
test('fabricated quotation cannot produce a supported verdict', () => {
  const result = groundVerdict(claim, { evidence: [{ sourceId: 'S1', quote: 'SSO is included in every single plan.', relation: 'supports' }] }, SAMPLE_SOURCES);
  assert.equal(result.status, 'insufficient'); assert.equal(result.evidence.length, 0); assert.equal(result.warnings.length, 1);
});
test('unknown source and non-semantic relation fail closed', () => {
  for (const evidence of [[{ sourceId: 'S999', quote, relation: 'supports' }], [{ sourceId: 'S1', quote, relation: 'verified' }]]) {
    assert.equal(groundVerdict(claim, { evidence }, SAMPLE_SOURCES).status, 'insufficient');
  }
});
test('conflicting sources remain mixed, not majority-voted', () => {
  const sources = [...SAMPLE_SOURCES, { id: 'S4', text: 'Single sign-on is included in every plan.' }];
  const result = groundVerdict(claim, { evidence: [...candidate.evidence, { sourceId: 'S4', quote: claim.text, relation: 'supports' }] }, sources);
  assert.equal(result.status, 'mixed'); assert.equal(result.evidence.length, 2);
});
test('duplicate evidence is not counted twice', () => {
  const r = groundVerdict(claim, { evidence: [...candidate.evidence, ...candidate.evidence] }, SAMPLE_SOURCES);
  assert.equal(r.evidence.length, 1);
});
test('missing model review remains visible as evidence gap', () => {
  const r = groundVerdict(claim, undefined, SAMPLE_SOURCES);
  assert.equal(r.status, 'insufficient'); assert.ok(r.warnings[0].includes('did not return'));
});
test('extracted claim must be an exact original substring', () => {
  assert.equal(extractClaims({ claims: [claim] }, SAMPLE_DOCUMENT, 5)[0].text, claim.text);
  assert.throws(() => extractClaims({ claims: [{ text: 'SSO is available everywhere.' }] }, SAMPLE_DOCUMENT, 5));
  assert.throws(() => extractClaims({ claims: [claim, claim] }, SAMPLE_DOCUMENT, 5));
});
test('input boundaries reject oversized documents, missing sources and invalid notes', () => {
  assert.throws(() => validateInput({ document: 'a'.repeat(12001), sources: SAMPLE_SOURCES }));
  assert.throws(() => validateInput({ document: SAMPLE_DOCUMENT, sources: [] }));
  assert.throws(() => validateInput({ document: SAMPLE_DOCUMENT, sources: [{ text: 'short' }] }));
  assert.equal(validateInput({ document: SAMPLE_DOCUMENT, sources: [], search: true, maxClaims: 99 }).maxClaims, 6);
});
test('unsafe URL protocols and URL credentials are rejected', () => {
  assert.equal(safeUrl('javascript:alert(1)'), null); assert.equal(safeUrl('data:text/html,test'), null);
  assert.equal(safeUrl('https://user:pass@example.org/'), null); assert.equal(safeUrl('https://example.org/'), 'https://example.org/');
});
test('invalid model JSON fails without inventing a result', () => {
  assert.deepEqual(parseModelJSON('```json\n{"claims":[]}\n```'), { claims: [] });
  assert.throws(() => parseModelJSON('Certainly! All claims look correct.'));
});
test('fixture is explicit, has no provider usage, and hashes source snapshots', async () => {
  const report = await makeSample(); assert.equal(report.mode, 'sample'); assert.equal(report.usage.nebiusCalls, 0); assert.equal(report.model, null);
  assert.deepEqual(report.claims.map(c => c.status), ['contradicted', 'contradicted', 'supported', 'contradicted', 'insufficient']);
  for (const s of report.sources) assert.equal(s.hash, await digest(s.text));
  assert.match(toMarkdown(report), /Illustrative fixture/); assert.match(toMarkdown(report), /SHA-256/);
});
test('missing credentials never falls back to sample or makes network calls', async () => {
  let called = false;
  await assert.rejects(runAudit({ document: SAMPLE_DOCUMENT, sources: SAMPLE_SOURCES }, {}, async () => { called = true; }), /Connect a Nebius/);
  assert.equal(called, false);
});
test('live pipeline uses Nebius twice and returns provider token counts', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    assert.match(url, /^https:\/\/api\.tokenfactory\.us-central1\.nebius\.com\/v1\/chat\/completions$/);
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    assert.equal(JSON.parse(options.body).model, 'nvidia/nemotron-3-super-120b-a12b');
    calls++;
    const content = calls === 1 ? { claims: [claim] } : { reviews: [{ claimId: 'C1', ...candidate }] };
    return Response.json({ choices: [{ message: { content: JSON.stringify(content) } }], usage: { prompt_tokens: 30, completion_tokens: 10 } });
  };
  const report = await runAudit({ document: SAMPLE_DOCUMENT, sources: SAMPLE_SOURCES }, { nebiusKey: 'test-key' }, fetcher);
  assert.equal(report.mode, 'live'); assert.equal(report.usage.nebiusCalls, 2); assert.equal(report.usage.promptTokens, 60);
  assert.equal(report.claims[0].status, 'contradicted'); assert.ok(!JSON.stringify(report).includes('test-key'));
});
test('Tavily is a runtime search, deduplicates URLs and preserves raw source text', async () => {
  let n = 0, searched = false;
  const fetcher = async (url, options) => {
    if (url.includes('tavily')) { searched = true; assert.equal(JSON.parse(options.body).include_raw_content, 'text'); return Response.json({ results: [{ title: 'Identity docs', url: 'https://example.org/docs', raw_content: quote }, { title: 'Duplicate', url: 'https://example.org/docs', content: quote }] }); }
    n++; return Response.json({ choices: [{ message: { content: JSON.stringify(n === 1 ? { claims: [claim] } : { reviews: [{ claimId: 'C1', ...candidate }] }) } }] });
  };
  const report = await runAudit({ document: SAMPLE_DOCUMENT, sources: [], search: true }, { nebiusKey: 'a', tavilyKey: 'b' }, fetcher);
  assert.equal(searched, true); assert.equal(report.usage.tavilyCalls, 1); assert.equal(report.sources.length, 1);
  assert.equal(report.sources[0].origin, 'tavily-page'); assert.equal(report.claims[0].status, 'contradicted');
});
test('provider rejection does not expose raw upstream errors or secrets', async () => {
  await assert.rejects(runAudit({ document: SAMPLE_DOCUMENT, sources: SAMPLE_SOURCES }, { nebiusKey: 'private-key' }, async () => new Response('private-key debugging data', { status: 401 })), e => e.message.includes('Nebius rejected') && !e.message.includes('private-key'));
});
