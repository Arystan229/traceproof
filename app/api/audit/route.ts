import { runAudit } from '../../../lib/audit.mjs';
import { AuditError, MODEL } from '../../../lib/evidence.mjs';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Send application/json.' }, { status: 415 });
  let input;
  try {
    const reader = request.body?.getReader(); if (!reader) throw new Error('Missing body');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 180000) { await reader.cancel(); return Response.json({ error: 'Request exceeds 180 KB.' }, { status: 413 }); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    input = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return Response.json({ error: 'Invalid JSON request.' }, { status: 400 }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return Response.json({ error: 'Send a JSON object.' }, { status: 400 });
  // Browser keys live only in component memory and this request. Never log request bodies.
  const nebiusKey = typeof input.credentials?.nebiusKey === 'string' && input.credentials.nebiusKey.trim() ? input.credentials.nebiusKey.trim() : process.env.NEBIUS_API_KEY;
  const tavilyKey = typeof input.credentials?.tavilyKey === 'string' && input.credentials.tavilyKey.trim() ? input.credentials.tavilyKey.trim() : process.env.TAVILY_API_KEY;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ async start(controller) {
    let connected = true;
    const send = (event: object) => { if (connected) { try { controller.enqueue(encoder.encode(JSON.stringify(event) + '\n')); } catch { connected = false; } } };
    try {
      const report = await runAudit(input, { nebiusKey, tavilyKey, model: process.env.NEBIUS_MODEL || MODEL }, fetch, (progress: object) => send({ type: 'progress', ...progress }));
      send({ type: 'result', report });
    } catch (error) { send({ type: 'error', error: error instanceof AuditError ? error.message : 'The review could not finish. Please try again.', status: error instanceof AuditError ? error.status : 500 }); }
    finally { if (connected) controller.close(); }
  } });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
