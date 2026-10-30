import { readFileSync } from 'node:fs';
import { digest } from '../lib/evidence.mjs';
const path = process.argv[2];
if (!path) { console.error('Usage: node scripts/verify-report.mjs exported-report.json'); process.exit(2); }
const report = JSON.parse(readFileSync(path, 'utf8'));
const errors = [];
if (await digest(report.document) !== report.documentHash) errors.push('Document hash mismatch');
for (const s of report.sources) if (await digest(s.text) !== s.hash) errors.push(`Hash mismatch: ${s.id}`);
let quotes = 0;
for (const c of report.claims) for (const e of c.evidence) {
  const s = report.sources.find(s => s.id === e.sourceId);
  if (!s || s.text.slice(e.start, e.end) !== e.quote) errors.push(`Quote mismatch: ${c.id} / ${e.sourceId}`);
  quotes++;
}
console.log(JSON.stringify({ valid: errors.length === 0, mode: report.mode, sources: report.sources.length, quotes, errors, limitation: 'Checks internal consistency only. Hashes are not signatures, and semantic truth is not verified.' }, null, 2));
if (errors.length) process.exitCode = 1;
