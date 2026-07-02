#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the `bundle` submodule from the three source layers and
 * commits + optionally pushes the result.
 *
 * Usage:
 *   node scripts/build-bundle.mjs          # assemble only
 *   node scripts/build-bundle.mjs --push   # assemble + push bundle & main
 *
 * Zero npm dependencies — pure Node.js built-ins.
 * Works on Windows, macOS, Linux, and in CI.
 */

import { spawnSync }                        from 'node:child_process';
import { cpSync, existsSync, mkdirSync,
         rmSync, writeFileSync }            from 'node:fs';
import { dirname, join, resolve }           from 'node:path';
import { fileURLToPath }                   from 'node:url';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');          // superproject root
const BUNDLE    = join(ROOT, 'bundle');
const FRONTEND  = join(ROOT, 'frontend');
const BACKEND   = join(ROOT, 'backend');
const CLI_DIR   = join(ROOT, 'cli');

const DIST_BROWSER = join(FRONTEND, 'dist', 'snip-frontend', 'browser');
const INDEX_HTML   = join(DIST_BROWSER, 'index.html');

const PUSH = process.argv.includes('--push');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Run a shell command, streaming output to the terminal.
 * Exits the process if the command fails.
 */
function run(cmd, { cwd = ROOT, env = process.env } = {}) {
  console.log(`\n▶ ${cmd}${cwd !== ROOT ? `  (in ${cwd})` : ''}`);
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd, env });
  if (r.status !== 0) {
    process.stderr.write(`\n✖ Command failed (exit ${r.status}): ${cmd}\n`);
    process.exit(r.status ?? 1);
  }
}

// ── 1. Update source submodules to their branch tips ─────────────────────────

console.log('\n━━━ 1. Updating source submodules ━━━');
run('git submodule update --init --remote backend frontend cli');

// ── 2. Build the Angular frontend ─────────────────────────────────────────────

console.log('\n━━━ 2. Building Angular frontend ━━━');
run('npm install --prefer-offline', { cwd: FRONTEND });
// NG_CLI_ANALYTICS=false suppresses the telemetry consent prompt in CI/scripts
run('npx ng build', { cwd: FRONTEND, env: { ...process.env, NG_CLI_ANALYTICS: 'false' } });

if (!existsSync(INDEX_HTML)) {
  process.stderr.write(`\n✖ Build artefact missing: ${INDEX_HTML}\n`);
  process.stderr.write('   Check the Angular build output above for errors.\n');
  process.exit(1);
}
console.log(`✔ Found ${INDEX_HTML}`);

// ── 3. Assemble bundle/ ────────────────────────────────────────────────────────

console.log('\n━━━ 3. Assembling bundle/ ━━━');

// 3a. Copy server.js and cli.js
cpSync(join(BACKEND, 'server.js'), join(BUNDLE, 'server.js'));
cpSync(join(CLI_DIR, 'cli.js'),    join(BUNDLE, 'cli.js'));
console.log('✔ Copied server.js and cli.js');

// 3b. Refresh public/ from the build output
const PUBLIC = join(BUNDLE, 'public');
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
cpSync(DIST_BROWSER, PUBLIC, { recursive: true });
console.log('✔ Copied dist/snip-frontend/browser → bundle/public/');

// 3c. .env  (Bun auto-loads this; PUBLIC_DIR switches static serving on)
writeFileSync(join(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n');
console.log('✔ Wrote .env');

// 3d. package.json — no "type" field so cli.js runs as CommonJS under plain node
writeFileSync(
  join(BUNDLE, 'package.json'),
  JSON.stringify(
    { name: 'snip-bundle', version: '1.0.0', scripts: { start: 'bun server.js' } },
    null, 2
  ) + '\n'
);
console.log('✔ Wrote package.json');

// 3e. Dockerfile
writeFileSync(join(BUNDLE, 'Dockerfile'), `\
FROM oven/bun:1-alpine
WORKDIR /app
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD bun server.js
`);
console.log('✔ Wrote Dockerfile');

// 3f. .dockerignore
writeFileSync(join(BUNDLE, '.dockerignore'), `.git
.env
node_modules
`);
console.log('✔ Wrote .dockerignore');

// 3g. railway.json — select the Dockerfile builder
writeFileSync(
  join(BUNDLE, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.app/railway.schema.json',
      build:  { builder: 'DOCKERFILE' },
      deploy: { restartPolicyType: 'ON_FAILURE' },
    },
    null, 2
  ) + '\n'
);
console.log('✔ Wrote railway.json');

// ── 4. Commit inside bundle/ ──────────────────────────────────────────────────

console.log('\n━━━ 4. Committing bundle/ ━━━');
run('git add -A', { cwd: BUNDLE });

{
  // Use `git commit` directly and inspect exit code + output.
  // git exits 0 on success, 1 when "nothing to commit".
  const r = spawnSync('git commit -m "chore: bundle release"', {
    shell: true, cwd: BUNDLE, encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  if (r.status === 0) {
    process.stdout.write(r.stdout || '');
    console.log('✔ Committed bundle changes');
  } else {
    const combined = (r.stdout ?? '') + (r.stderr ?? '');
    if (/nothing to commit|nothing added to commit/i.test(combined)) {
      console.log('✔ bundle/: nothing changed — skipping commit');
    } else {
      process.stderr.write(combined);
      process.exit(r.status ?? 1);
    }
  }
  if (PUSH) {
    // Push regardless of whether a new commit was made — covers pending local commits
    run('git push origin HEAD:bundle', { cwd: BUNDLE });
    console.log('✔ Pushed bundle branch');
  } else {
    console.log('ℹ  Run with --push to push bundle branch to origin');
  }
}

// ── 5. Bump submodule pointers in the superproject ────────────────────────────

console.log('\n━━━ 5. Bumping superproject submodule pointers ━━━');
// Also track the build script and .gitignore if new/changed
run('git add backend frontend cli bundle scripts/ .gitignore');

{
  const r = spawnSync('git commit -m "chore: bump submodule pointers"', {
    shell: true, cwd: ROOT, encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  if (r.status === 0) {
    process.stdout.write(r.stdout || '');
    console.log('✔ Committed superproject pointer update');
  } else {
    const combined = (r.stdout ?? '') + (r.stderr ?? '');
    if (/nothing to commit|nothing added to commit|no changes added to commit/i.test(combined)) {
      console.log('✔ superproject: nothing changed — skipping commit');
    } else {
      process.stderr.write(combined);
      process.exit(r.status ?? 1);
    }
  }
  if (PUSH) {
    // Push regardless of whether a new commit was made — covers pending local commits
    run('git push origin main');
    console.log('✔ Pushed main');
  } else {
    console.log('ℹ  Run with --push to push main to origin');
  }
}

console.log('\n✅  build-bundle done.\n');
