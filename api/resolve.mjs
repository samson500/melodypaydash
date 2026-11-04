// nuAlt NUBAN account-name resolver proxy (server-side, avoids browser CORS).
const NU_BASE = "https://nu-alt.shop/v1";
const KEY = "nualt_ZtgW6_WpX9-Al_xAo9gQP1Zi8ipfxkWrTWAiQiq2DOM";

export async function resolveAccount(accNo, bank) {
  const acc = String(accNo || "").replace(/\D/g, "");
  const bankQ = String(bank || "").trim();
  if (!/^\d{10}$/.test(acc) || !bankQ) {
    return { status: 422, body: { ok: false, detail: "acc_no must be exactly 10 digits and bank is required" } };
  }
  try {
    const r = await fetch(
      `${NU_BASE}/resolve?acc_no=${encodeURIComponent(acc)}&bank=${encodeURIComponent(bankQ)}`,
      { headers: { Authorization: "Bearer " + KEY, Accept: "application/json" } }
    );
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { ok: false, detail: text || "Upstream error" }; }
    return { status: r.status, body };
  } catch (err) {
    return { status: 502, body: { ok: false, detail: "Resolver unavailable: " + err.message } };
  }
}

export async function listBanks(q) {
  const url = `${NU_BASE}/banks${q ? "?q=" + encodeURIComponent(q) : ""}`;
  try {
    const r = await fetch(url, { headers: { Authorization: "Bearer " + KEY, Accept: "application/json" } });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { ok: false, detail: text || "Upstream error" }; }
    return { status: r.status, body };
  } catch (err) {
    return { status: 502, body: { ok: false, detail: "Bank list unavailable: " + err.message } };
  }
}

// Vercel serverless handler → /api/resolve
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (!KEY) { res.status(500).json({ ok: false, detail: "Resolver not configured (NUALT_API_KEY missing)" }); return; }
  const q = req.query || {};
  const out = await resolveAccount(q.acc_no, q.bank);
  res.status(out.status).json(out.body);
}
