// lib/evidence.mjs
var MODEL = "nvidia/nemotron-3-super-120b-a12b";

// app/api/config/route.ts
async function GET() {
  return Response.json({ nebius: !!process.env.NEBIUS_API_KEY, tavily: !!process.env.TAVILY_API_KEY, model: process.env.NEBIUS_MODEL || MODEL }, { headers: { "Cache-Control": "no-store" } });
}
export {
  GET
};
