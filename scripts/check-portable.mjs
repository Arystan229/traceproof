import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:5173';
let checks = 0;
async function check(name, path, options, status, inspect) {
  const response = await fetch(base + path, options);
  assert.equal(response.status, status, name);
  if (inspect) await inspect(response);
  console.log(`PASS ${name}`); checks++;
}
const json = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body });
await check('Application shell', '/', {}, 200, async r => assert.match(await r.text(), /TraceProof/));
await check('Bundled JavaScript', '/app.js', {}, 200);
await check('Stylesheet', '/app.css', {}, 200);
await check('Configuration contains no keys', '/api/config', {}, 200, async r => {
  const config = await r.json();
  assert.equal(typeof config.nebius, 'boolean');
  assert.ok(!JSON.stringify(config).includes('API_KEY'));
});
await check('Private files unavailable', '/.env', {}, 404);
await check('Cross-origin denied', '/api/audit', { ...json('{}'), headers: { 'content-type': 'application/json', origin: 'https://untrusted.example' } }, 403);
await check('Wrong content type rejected', '/api/audit', { method: 'POST', body: '{}' }, 415);
await check('Malformed JSON rejected', '/api/audit', json('{'), 400);
await check('Null body rejected', '/api/audit', json('null'), 400);
await check('Array body rejected', '/api/audit', json('[]'), 400);
await check('Oversized body rejected', '/api/audit', json(JSON.stringify({ text: 'x'.repeat(181000) })), 413);
console.log(`${checks} HTTP checks passed. No provider calls were made.`);
