# Snip — backend

Tiny URL shortener built with **Bun** — a single file, zero npm dependencies.

## Quick start

```bash
bun run server.js
# or
bun start
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | TCP port the server listens on |
| `BASE_URL` | `http://localhost:<PORT>` | Origin prepended to every `shortUrl`. Falls back to `https://$RAILWAY_PUBLIC_DOMAIN` when that variable is set. |
| `PUBLIC_DIR` | *(unset)* | When set, static files are served from this directory. `GET /` serves `index.html`. A real file always wins over a same-named short code. |

## API

### `POST /api/links`

Create a short link.

**Request body**
```json
{ "url": "https://example.com/very/long/path" }
```

**201 Created**
```json
{
  "code":     "aB3xYz",
  "url":      "https://example.com/very/long/path",
  "shortUrl": "http://localhost:3000/aB3xYz",
  "hits":     0,
  "createdAt":"2024-01-01T00:00:00.000Z"
}
```

**400 Bad Request** — invalid JSON or a URL that is not `http`/`https`.

---

### `GET /api/links`

Return all links as a JSON array (same shape as above).

---

### `GET /:code`

Redirect (`302`) to the original URL and increment `hits`.  
Returns `404` if the code is unknown.

---

All endpoints include open CORS headers so a browser app on any origin can call them.
