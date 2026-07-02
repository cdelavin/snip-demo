# Snip CLI

A zero-dependency Node.js CLI for the [Snip](https://github.com/your-org/snip) URL shortener. Requires Node.js 18+ (built-in global `fetch`).

## Install

```bash
# from this directory — installs the "snip" command globally
npm install -g .

# or symlink for development
npm link
```

## Usage

```
snip add <url>     Shorten a URL → prints the short link
snip ls            List all links (code / hits / original URL)
snip open <code>   Open the original URL for a code in the default browser
snip help          Show usage
```

### Examples

```bash
$ snip add https://example.com/very/long/path
http://localhost:3000/aB3xYz

$ snip ls
CODE    HITS  URL
--------------
aB3xYz     4  https://example.com/very/long/path

$ snip open aB3xYz
Opening https://example.com/very/long/path
```

## Configuration

| Variable   | Default                  | Description           |
|---|---|---|
| `SNIP_API` | `http://localhost:3000`  | Backend base URL      |

```bash
SNIP_API=https://snip.example.com snip ls
```

## Wrappers

Three thin wrappers forward all arguments to `cli.js`:

| File       | Shell           |
|---|---|
| `snip`     | POSIX sh        |
| `snip.cmd` | Windows CMD     |
| `snip.ps1` | PowerShell      |

Use the wrapper for your shell if `npm link` is not available, or set the shebang-based `snip` as executable (`chmod +x snip`) and put it on `$PATH`.
