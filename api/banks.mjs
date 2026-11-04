import { listBanks } from "./resolve.mjs";

// Vercel serverless handler → /api/banks
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (!process.env.NUALT_API_KEY) { res.status(500).json({ ok: false, detail: "Resolver not configured (NUALT_API_KEY missing)" }); return; }
  const q = req.query || {};
  const out = await listBanks(q.q);
  res.status(out.status).json(out.body);
}
