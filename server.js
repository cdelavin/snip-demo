import { resolve, join } from "node:path";

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3000", 10);

let BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
}
BASE_URL = BASE_URL.replace(/\/+$/, "");

const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;

// ─── Storage ──────────────────────────────────────────────────────────────────

/** @type {Map<string, {code:string, url:string, shortUrl:string, hits:number, createdAt:string}>} */
const links = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += BASE62[Math.floor(Math.random() * 62)];
  }
  return code;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Attempt to serve a static file from PUBLIC_DIR; returns null if not found. */
async function tryStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const abs = resolve(join(PUBLIC_DIR, rel));

  // Path-traversal guard: resolved path must stay inside PUBLIC_DIR
  if (!abs.startsWith(PUBLIC_DIR + (PUBLIC_DIR.endsWith("/") ? "" : "/"))) {
    return null;
  }

  const file = Bun.file(abs);
  if (await file.exists()) {
    return new Response(file, { headers: CORS });
  }
  return null;
}

// ─── Server ───────────────────────────────────────────────────────────────────

Bun.serve({
  port: PORT,

  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // CORS pre-flight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // POST /api/links — create a short link
    if (pathname === "/api/links" && method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const rawUrl = body?.url;
      if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
        return json({ error: "url is required and must be a string" }, 400);
      }

      let parsed;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return json({ error: "Invalid URL" }, 400);
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return json({ error: "URL must use the http or https scheme" }, 400);
      }

      let code;
      do {
        code = generateCode();
      } while (links.has(code));

      const entry = {
        code,
        url: rawUrl,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, entry);
      return json(entry, 201);
    }

    // GET /api/links — list all links
    if (pathname === "/api/links" && method === "GET") {
      return json([...links.values()]);
    }

    // Static files win over short codes
    const staticRes = await tryStatic(pathname);
    if (staticRes) return staticRes;

    // GET /:code — redirect
    if (method === "GET" && pathname.length > 1) {
      const code = pathname.slice(1);
      const entry = links.get(code);
      if (entry) {
        entry.hits++;
        return new Response(null, {
          status: 302,
          headers: { ...CORS, Location: entry.url },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip listening on :${PORT}  BASE_URL=${BASE_URL}`);
