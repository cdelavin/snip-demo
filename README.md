# Snip — URL Shortener

One backend, two clients.  
**Snip** is a minimal URL shortener built to illustrate a clean layer separation:
a single HTTP API consumed by both a web frontend and a CLI tool, each living in
its own orphan branch and mounted here as a git submodule.

---

## Architecture

```
snip-demo/          ← superproject (this branch: main)
├── backend/        ← submodule → branch: backend  (Bun HTTP server)
├── frontend/       ← submodule → branch: frontend (Angular 19 SPA)
└── cli/            ← submodule → branch: cli      (Node.js CLI)
```

| Layer    | Tech              | Entry point          |
|----------|-------------------|----------------------|
| backend  | Bun (no npm deps) | `server.js`          |
| frontend | Angular 19        | `src/main.ts`        |
| cli      | Node.js ≥ 18      | `cli.js`             |

---

## API contract

All responses are JSON. The backend listens on `PORT` (default **3000**).

| Method | Path            | Request body          | Response                                      |
|--------|-----------------|-----------------------|-----------------------------------------------|
| POST   | `/api/links`    | `{ "url": "<url>" }` | 201 `{ code, url, shortUrl, hits, createdAt }` |
| GET    | `/api/links`    | —                     | 200 array of link objects                     |
| GET    | `/:code`        | —                     | 302 redirect → original URL (increments hits) |

Error responses: `400 { error: "..." }` for bad input, `404 { error: "not found" }` for
unknown codes.

Environment variables accepted by the backend:

| Variable      | Default                                         | Description                  |
|---------------|-------------------------------------------------|------------------------------|
| `PORT`        | `3000`                                          | HTTP listen port             |
| `BASE_URL`    | `https://$RAILWAY_PUBLIC_DOMAIN` → `localhost`  | Prefix for generated `shortUrl` |
| `PUBLIC_DIR`  | _(unset)_                                       | Directory to serve as static files |

---

## Branch-per-layer + submodule layout

Each layer is an **orphan branch** — zero shared history with the others.
The `main` branch (this file) is itself an orphan that only contains `.gitmodules`
and this README; the real code lives inside the submodule folders.

`.gitmodules`:
```ini
[submodule "backend"]
    path = backend
    url  = https://github.com/cdelavin/snip-demo.git
    branch = backend

[submodule "frontend"]
    path = frontend
    url  = https://github.com/cdelavin/snip-demo.git
    branch = frontend

[submodule "cli"]
    path = cli
    url  = https://github.com/cdelavin/snip-demo.git
    branch = cli
```

The superproject stores a **commit pointer** for each submodule, not the files
themselves. `git status` inside `snip-demo/` shows the pointer; `git status` inside
`snip-demo/backend/` shows the backend layer's files.

---

## Cloning

A plain `git clone` leaves the submodule folders empty. Always use:

```bash
git clone --recurse-submodules https://github.com/cdelavin/snip-demo.git
```

If you already cloned without the flag:

```bash
git submodule update --init --recursive
```

---

## Running all three pieces

### 1 — Backend (requires [Bun](https://bun.sh))

```bash
cd backend
bun run server.js
# Server running on http://localhost:3000
```

### 2 — Frontend (Angular dev server)

```bash
cd frontend
npm install
npx ng serve
# Open http://localhost:4200 — points to backend at localhost:3000
```

### 3 — CLI

```bash
cd cli
npm install -g .   # or: npm link
snip help
snip add https://example.com/very/long/path
snip ls
snip open <code>
```

Override the backend URL:

```bash
SNIP_API=https://snip.example.com snip ls
```

---

## Update workflow

### Committing a change to a layer

```bash
cd backend                     # (or frontend / cli)
# ... edit files ...
git add .
git commit -m "fix: some change"
git push origin backend        # push the layer branch
cd ..                          # back to superproject
git submodule update --remote backend   # advance the pointer
git add backend
git commit -m "chore: bump backend submodule"
git push origin main
```

### Pulling the latest pointer after someone else bumped it

```bash
git pull                             # update superproject
git submodule update --recursive     # checkout the recorded commit in each submodule
```

### Advancing ALL submodule pointers at once

```bash
git submodule update --remote        # fetch latest commit on each tracked branch
git add backend frontend cli
git commit -m "chore: bump all submodules"
git push origin main
```
