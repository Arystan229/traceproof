'use client';
import { useId, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, CheckCheck, ChevronDown, CircleHelp, Fingerprint, UserRound } from 'lucide-react';

export type Evidence = { sourceId: string; quote: string; start: number; end: number; relation: string; verified: boolean };
type Claim = { id: string; text: string; status: string; explanation: string; suggestedRevision: string; nextQuestion: string; evidence: Evidence[]; warnings: string[] };
type Source = { id: string; title: string; text: string; url: string | null; hash: string; origin: string; retrievedAt: string | null };
type Decision = { decision: string; note: string };
const labels: Record<string,string> = { supported: 'Supported', contradicted: 'Contradicted', mixed: 'Mixed evidence', insufficient: 'Evidence gap' };
export function claimCode(id: string) { return /^C\d+$/.test(id) ? `C${id.slice(1).padStart(2, '0')}` : id; }
export function EvidenceDesk({ claim, sources, review, onReview, onSource, mobile = false, sample }: { claim: Claim; sources: Source[]; review?: Decision; onReview: (field: string, value: string) => void; onSource: (source: Source, evidence: Evidence) => void; mobile?: boolean; sample: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const contentId = useId();
  const decided = review?.decision && review.decision !== 'pending';
  return <section className={`evidence-panel ${mobile ? 'mobile-evidence' : 'desktop-evidence'} finding-${claim.status}`} aria-label={`${claimCode(claim.id)} evidence dossier`}>
    {mobile && <button className="evidence-toggle" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(!expanded)}><span>Open evidence dossier · {claimCode(claim.id)}</span><ChevronDown className={expanded ? 'expanded' : ''} size={19}/></button>}
    <div id={contentId} hidden={mobile && !expanded}>
      <div className="dossier-head"><span className="eyebrow">01 / CLAIM UNDER REVIEW</span><span className="dossier-code">{claimCode(claim.id)}</span></div>
      <div className={`finding-stamp ${claim.status}`}>{labels[claim.status]}</div>
      <h2>{claim.text}</h2>
      <p className="explanation">{claim.explanation}</p>
      <div className="analysis-origin">{sample ? 'HAND-AUTHORED FINDING / NOT A MODEL RESULT' : 'NEMOTRON FINDING / HUMAN REVIEW REQUIRED'}</div>
      <div className="evidence-flow">
        <div className="evidence-divider"><span>02 / EVIDENCE</span><span>{claim.evidence.length.toString().padStart(2, '0')} EXACT {claim.evidence.length === 1 ? 'MATCH' : 'MATCHES'}</span></div>
        {claim.evidence.map((e, i) => { const s = sources.find(x => x.id === e.sourceId); return <article className={`quote-card ${e.relation} ${active === i ? 'trace-active' : ''}`} key={`${e.sourceId}-${e.start}-${i}`}>
          <svg className="evidence-connector" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 0 V88 Q12 98 24 98" pathLength="1"/></svg>
          <div className="quote-top"><span className="evidence-tag">EXHIBIT {String(i + 1).padStart(2, '0')}</span><span className="relation-tag">{e.relation}</span></div>
          <button className="quote-select" disabled={!s} onClick={() => { if (s) { setActive(i); onSource(s, e); } }} aria-label={`Inspect exact quote in source ${e.sourceId}`}><blockquote>“{e.quote}”</blockquote></button>
          <div className="quote-verified"><CheckCheck size={16}/><span>Exact match verified</span><code>chars {e.start}–{e.end}</code></div>
          <button className="source-link" disabled={!s} onClick={() => { if (s) { setActive(i); onSource(s, e); } }} aria-label={`Inspect source ${e.sourceId}`}><span className="source-letter">{e.sourceId}</span><span><small>03 / SOURCE SNAPSHOT</small><b>{s?.title || 'Source unavailable'}</b></span><ArrowUpRight size={20}/></button>
        </article>; })}
        {!claim.evidence.length && <div className="gap-box"><span className="missing-mark" aria-hidden="true">?</span><span className="eyebrow">MISSING PIECE</span><h3>No evidence is also a finding.</h3><p>No validated quotation settles this claim. This is not a falsehood verdict. Request a primary source before relying on it.</p></div>}
      </div>
      {claim.warnings.map((w,i) => <p className="warning" key={i}>{w}</p>)}
      {claim.suggestedRevision && <div className="revision"><span className="eyebrow">EDITOR’S NOTE / SUGGESTED REVISION</span><p>{claim.suggestedRevision}</p><small>Review this wording before use.</small></div>}
      {claim.nextQuestion && <div className="next-question"><CircleHelp size={17}/><p>{claim.nextQuestion}</p></div>}
      <div className="decision-connector" aria-hidden="true"><ArrowDown size={18}/></div>
      <section className="human-review" aria-label="Human decision"><div className="human-heading"><span className="eyebrow">04 / HUMAN DECISION</span><UserRound size={18}/></div><h3>Your judgement. On the record.</h3><p>The finding is a starting point. The decision is yours.</p><div className="decision-options" role="group" aria-label="Your judgement">{[['agree','Agree'],['disagree','Disagree'],['follow-up','Needs follow-up']].map(([value,label]) => <button key={value} aria-pressed={review?.decision === value} onClick={() => onReview('decision',value)}>{review?.decision === value && <Check size={14}/>} {label}</button>)}</div><label htmlFor={`${contentId}-note`}>REVIEWER NOTE</label><textarea id={`${contentId}-note`} aria-label="Reviewer note" placeholder="Record your reasoning or the next question…" value={review?.note || ''} onChange={e => onReview('note',e.target.value)} maxLength={2000}/><div className="human-footer"><span>{decided ? <><Fingerprint size={14}/> Human-reviewed · {review?.decision}</> : 'Awaiting human judgement'}</span>{decided && <button onClick={() => onReview('decision','pending')}>Clear decision</button>}</div></section>
    </div>
  </section>;
}

export function RunTrace({ report, completed }: { report: {mode: string; model: string | null; claims: Claim[]; usage: {nebiusCalls: number; tavilyCalls: number; promptTokens: number; completionTokens: number; durationMs: number}; trace: {stage:string; detail:string; elapsedMs:number}[]}; completed: number }) {
  const sample = report.mode === 'sample';
  return <><span className="eyebrow">PROCESS / RUN TRACE</span><h2>Nothing behind the curtain.</h2><p>{sample ? 'This is a hand-authored teaching example. No model ran, no searches were made, and no performance metrics were measured.' : 'Observed provider calls and deterministic checks from this review.'}</p><ol className="process-steps">{[['Extract','Select exact claims from the document.'],['Compare','Assess each claim against the available sources.'],['Verify','Check quotations and character spans in code.'],['Decide',`${completed}/${report.claims.length} claims have a human decision.`]].map(([name,detail],i) => <li key={name}><span>{String(i+1).padStart(2,'0')}</span><div><b>{name}</b><p>{detail}</p><small>{i === 3 ? 'Human activity' : sample ? i === 2 ? 'Quote checks run in code' : 'Hand-authored in this sample' : 'See recorded events below'}</small></div></li>)}</ol>{!sample && <><div className="live-engine">NVIDIA Nemotron + Nebius<code>{report.model}</code></div><div className="run-numbers">{[['Nebius calls',report.usage.nebiusCalls],['Tavily searches',report.usage.tavilyCalls],['Input tokens',report.usage.promptTokens],['Output tokens',report.usage.completionTokens],['Duration',`${(report.usage.durationMs/1000).toFixed(1)}s`]].map(([name,value]) => <div key={name}><span>{name}</span><b>{value}</b></div>)}</div><ol className="recorded-events">{report.trace.map((t,i) => <li key={i}><b>{t.stage}</b><span>{t.detail}</span><code>{(t.elapsedMs/1000).toFixed(1)}s</code></li>)}</ol><small>Usage is recorded from provider responses. No cost or confidence estimate is added.</small></>}</>;
}
