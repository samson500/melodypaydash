// nuAlt NUBAN account-name resolver proxy (server-side, avoids browser CORS).
const NU_BASE = process.env.NUALT_BASE || "http://127.0.0.1:8790/v1";
const KEY = process.env.NUALT_API_KEY || "nualt_2KKY6qa7mhthb-vWMv5hYitAZRTXo3Vg0nvDD9YZ8mY";

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
