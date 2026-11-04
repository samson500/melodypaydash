// MelodyPay local dev server: serves the static site + the /api/resolve proxy.
// Run: node server.mjs   (then open http://localhost:4326)
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Local dev defaults: point at the local nu-alt instance unless env overrides.
process.env.NUALT_BASE = process.env.NUALT_BASE || "http://127.0.0.1:8790/v1";
process.env.NUALT_API_KEY = process.env.NUALT_API_KEY || "nualt_2KKY6qa7mhthb-vWMv5hYitAZRTXo3Vg0nvDD9YZ8mY";
const { resolveAccount, listBanks } = await import("./api/resolve.mjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4326;

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".gif": "image/gif", ".webp": "image/webp", ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg", ".mpeg": "audio/mpeg", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(u.pathname);

  if (pathname === "/api/resolve") {
    const out = await resolveAccount(u.searchParams.get("acc_no"), u.searchParams.get("bank"));
    res.writeHead(out.status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(out.body));
    return;
  }

  if (pathname === "/api/banks") {
    const out = await listBanks(u.searchParams.get("q"));
    res.writeHead(out.status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
    res.end(JSON.stringify(out.body));
    return;
  }

  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end("Forbidden"); return; }
  try {
    let stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    if (stat && stat.isDirectory()) { filePath = path.join(filePath, "index.html"); stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null; }
    if (!stat) {
      const alt = filePath + ".html";
      if (fs.existsSync(alt)) { filePath = alt; stat = fs.statSync(alt); }
    }
    if (!stat) { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); return; }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream" };
    if (ext === ".html" || ext === ".js" || ext === ".mjs" || ext === ".json" || ext === ".webmanifest") {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`MelodyPay running at http://localhost:${PORT}  (with /api/resolve proxy)`);
});
