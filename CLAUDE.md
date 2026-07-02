# CLAUDE.md — snip-demo coding guidelines

> Keep this file in sync with `.github/copilot-instructions.md`.

---

## What this repo is

**snip-demo** is a URL shortener built as a **git superproject** (`main` branch).
Every layer lives on its own **orphan branch** with no shared history:

| Branch     | Role                          | Tech              |
|------------|-------------------------------|-------------------|
| `backend`  | HTTP API + static file server | Bun, no npm deps  |
| `frontend` | SPA (served by backend)       | Angular 19        |
| `cli`      | Command-line client           | Node.js ≥ 18 CJS  |
| `bundle`   | **Generated output — do not hand-edit** | assembled by CI |
| `main`     | Superproject (`.gitmodules`, scripts, workflows) | — |

The superproject stores a **commit pointer** (gitlink) for each submodule.
`git status` in `snip-demo/` shows pointers; `git status` in `snip-demo/backend/`
shows the backend's own files.

---

## Layout

```
snip-demo/                   ← main branch (superproject)
├── backend/                 ← submodule → branch: backend
│   └── server.js
├── frontend/                ← submodule → branch: frontend
│   ├── src/app/
│   └── dist/snip-frontend/browser/   ← Angular build output (load-bearing path)
├── cli/                     ← submodule → branch: cli
│   └── cli.js
├── bundle/                  ← submodule → branch: bundle  (GENERATED — never edit)
│   ├── server.js            ← copy of backend/server.js
│   ├── cli.js               ← copy of cli/cli.js
│   ├── public/              ← copy of Angular dist/snip-frontend/browser/
│   ├── Dockerfile
│   ├── railway.json
│   ├── .env                 ← PUBLIC_DIR=./public
│   └── package.json
└── scripts/
    └── build-bundle.mjs     ← assembles bundle/, commits, optionally pushes
```

---

## API contract

All responses JSON. Backend default port **3000**.

| Method | Path         | Body                 | Response                                           |
|--------|--------------|----------------------|----------------------------------------------------|
| POST   | `/api/links` | `{ "url": "..." }`  | 201 `{ code, url, shortUrl, hits, createdAt }`     |
| GET    | `/api/links` | —                    | 200 array of link objects                          |
| GET    | `/:code`     | —                    | 302 redirect → original URL (increments hits)      |

**Change the contract everywhere or nowhere**: `backend/server.js`,
`frontend/src/app/links.service.ts`, `cli/cli.js`, and this doc must stay aligned.

Backend env vars: `PORT` (3000), `BASE_URL`, `PUBLIC_DIR` (enables static serving).

---

## Key commands

```bash
# Run backend
cd backend && bun run server.js

# Build Angular SPA (output must land at dist/snip-frontend/browser/)
cd frontend && npm install && npx ng build

# Run CLI
cd cli && node cli.js help

# Assemble bundle locally (dry-run)
node scripts/build-bundle.mjs

# Assemble + commit + push bundle and bump main
node scripts/build-bundle.mjs --push

# Clone from scratch
git clone --recurse-submodules https://github.com/cdelavin/snip-demo.git
```

---

## Edit → push → pointer-bump workflow

1. **Edit** files inside the submodule worktree (`backend/`, `frontend/`, or `cli/`).
2. **Commit and push** on the layer's own branch:
   ```bash
   cd backend          # or frontend / cli
   git add -A
   git commit -m "..."
   git push origin backend   # or frontend / cli
   ```
3. The **hourly CI** (`bundle.yml`) picks it up automatically:
   `git submodule update --remote` → Angular build → assemble `bundle/` → commit
   bundle branch → bump superproject pointers → push.
4. Bumping pointers **manually** (skip CI):
   ```bash
   # from superproject root
   node scripts/build-bundle.mjs --push
   ```
5. The **docker CI** (`docker.yml`) fires on `main` pushes that touch the `bundle`
   gitlink — i.e., exactly when a new bundle release is pinned.

---

## Do / Don't

### bundle/ is generated output
- **DO NOT** hand-edit any file inside `bundle/`.  
  All content is overwritten on every build-bundle run.  
  The only valid commit message on the `bundle` branch is `chore: bundle release`.

### cli.js must stay CommonJS
- `cli/package.json` has **no `"type": "module"` field** — intentional.  
  `cli.js` uses `require`-style CommonJS.  
  Do not add `"type": "module"` to `cli/package.json` or its copy in `bundle/`.

### Angular build output path is load-bearing
- `ng build` (without `--output-path`) writes to `dist/snip-frontend/browser/`.  
  The build script hard-codes this path; Bun's static server reads from `bundle/public/`
  which is a copy of that directory.  
  Do not change `angular.json`'s `outputPath` without updating `build-bundle.mjs`.

### Storage is in-memory by design
- `backend/server.js` stores links in a `Map`.  
  This is intentional for the demo.  
  Do not add persistence (DB, file) without updating the README and the API table above.

### bundle CI is schedule-only on purpose
- `bundle.yml` has no `push` trigger.  
  Because the workflow file only exists on `main`, a push trigger would never fire
  for commits on `backend`, `frontend`, or `cli`.  
  The hourly `cron` is the correct mechanism; use `workflow_dispatch` for manual runs.

### docker CI's paths filter watches the bundle gitlink, not files
- `docker.yml` fires on `paths: [bundle]`.  
  In GitHub Actions, `bundle` matches the **gitlink entry** (submodule pointer) in
  the tree, not any file named `bundle`.  
  It fires exactly once per `build-bundle --push` cycle, after the new bundle
  commit is pinned in `main`.

### `#` in the workspace path breaks `ng serve`
- Vite's `@fs` URL resolution treats `#` as a URL fragment, so `ng serve` fails when
  the repo is cloned into a path containing `#`.  
  Use `ng build` + Bun's static file server (`PUBLIC_DIR`) instead.
