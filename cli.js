#!/usr/bin/env node
'use strict';

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

async function apiFetch(path, opts) {
  try {
    return await fetch(BASE + path, opts);
  } catch (err) {
    die(`Error: cannot reach backend at ${BASE} (${err.message})`);
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function add(url) {
  if (!url) die('Usage: snip add <url>');

  let parsed;
  try { parsed = new URL(url); } catch { die('Error: not a valid URL'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    die('Error: URL must use the http or https scheme');
  }

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    die(`Error: ${body.error || res.statusText}`);
  }

  const link = await res.json();
  process.stdout.write(link.shortUrl + '\n');
}

async function ls() {
  const res = await apiFetch('/api/links');
  if (!res.ok) die(`Error: ${res.status} ${res.statusText}`);

  const links = await res.json();
  if (links.length === 0) { process.stdout.write('No links yet.\n'); return; }

  const codeW = Math.max(4, ...links.map(l => l.code.length));
  const hitsW = Math.max(4, ...links.map(l => String(l.hits).length));
  const row   = (code, hits, url) =>
    `${code.padEnd(codeW)}  ${String(hits).padStart(hitsW)}  ${url}`;

  process.stdout.write(row('CODE', 'HITS', 'URL') + '\n');
  process.stdout.write('-'.repeat(codeW + hitsW + 2 + 2 + 4) + '\n');
  for (const link of links) {
    process.stdout.write(row(link.code, link.hits, link.url) + '\n');
  }
}

async function open(code) {
  if (!code) die('Usage: snip open <code>');

  const res = await apiFetch(`/${code}`, { redirect: 'manual' });

  if (res.status === 404) die(`Error: unknown code "${code}"`);
  if (res.status < 300 || res.status >= 400) {
    die(`Error: unexpected response status ${res.status}`);
  }

  const location = res.headers.get('location');
  if (!location) die('Error: backend redirect had no Location header');

  // Validate before handing off to the OS
  try { new URL(location); } catch { die('Error: invalid redirect location'); }

  const { spawn } = require('child_process');
  const [bin, args] = process.platform === 'win32'
    ? ['cmd',      ['/c', 'start', '', location]]
    : process.platform === 'darwin'
      ? ['open',     [location]]
      : ['xdg-open', [location]];

  spawn(bin, args, { stdio: 'ignore', detached: true }).unref();
  process.stdout.write('Opening ' + location + '\n');
}

function usage() {
  process.stdout.write(`\
snip — Snip URL shortener CLI

Usage:
  snip add <url>     Shorten a URL and print the short link
  snip ls            List all links (code / hits / original URL)
  snip open <code>   Open the original URL for a code in the default browser
  snip help          Show this help

Environment:
  SNIP_API  Backend base URL (default: http://localhost:3000)
`);
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

(async () => {
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    usage();
  } else if (cmd === 'add') {
    await add(arg);
  } else if (cmd === 'ls') {
    await ls();
  } else if (cmd === 'open') {
    await open(arg);
  } else {
    process.stderr.write(`Error: unknown command "${cmd}" — run "snip help"\n`);
    process.exit(1);
  }
})();
