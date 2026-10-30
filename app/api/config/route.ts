import { MODEL } from '../../../lib/evidence.mjs';
export async function GET() { return Response.json({ nebius: !!process.env.NEBIUS_API_KEY, tavily: !!process.env.TAVILY_API_KEY, model: process.env.NEBIUS_MODEL || MODEL }, { headers: { 'Cache-Control': 'no-store' } }); }
