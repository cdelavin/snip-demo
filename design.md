# Snip Design System
> Inspired by Lovable.dev's visual language — dark canvas, warm ambient glows, generous rounding.

---

## Tokens

### Color
| Token | Value | Role |
|---|---|---|
| `--bg` | `#0c0c10` | Page background (near-black with warm undertone) |
| `--surface` | `rgba(255,255,255,.055)` | Prompt card / elevated surface (frosted glass) |
| `--surface-subtle` | `rgba(255,255,255,.03)` | Links card background |
| `--border` | `rgba(255,255,255,.1)` | Prompt card border |
| `--border-subtle` | `rgba(255,255,255,.07)` | Links card border |
| `--border-inner` | `rgba(255,255,255,.05)` | Table row dividers |
| `--text` | `#f2f2f3` | Primary text |
| `--muted` | `#71717a` | Subtitle / muted text |
| `--muted-strong` | `#3f3f46` | Very muted — eyebrows, hit counts |
| `--table-text` | `#a1a1aa` | Table cell text |
| `--accent-coral` | `#ff6b4a` | Glow blob 1 / gradient start |
| `--accent-pink` | `#e879a0` | Glow blob 2 / gradient end |
| `--accent-orange` | `#fb923c` | Glow blob 3 |
| `--accent-violet` | `#c4b5fd` | Short-code links / success link color |
| `--error` | `#f87171` | Error notice text |
| `--success` | `#86efac` | Success notice text |

### Gradient accent (button)
```css
linear-gradient(135deg, #ff6b4a 0%, #e879a0 100%)
```

### Glow blobs (ambient hero light)
```css
/* g1 — coral, top-left */
radial-gradient(ellipse, rgba(255,107,74,.28) 0%, transparent 70%);
/* g2 — pink, top-right */
radial-gradient(ellipse, rgba(232,121,160,.22) 0%, transparent 70%);
/* g3 — orange, bottom-center */
radial-gradient(ellipse, rgba(251,146,60,.18) 0%, transparent 70%);
/* All three: filter: blur(90px); z-index: 0; position: absolute */
```

---

### Typography
| Role | Value |
|---|---|
| Font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, 'Helvetica Neue', Arial, sans-serif` |
| Code font | `ui-monospace, 'SF Mono', 'Cascadia Code', monospace` |
| Hero heading | `clamp(2.25rem, 5vw, 3.75rem)`, weight 800, letter-spacing -0.04em |
| Subtitle | `1.0625rem`, color `--muted`, line-height 1.65 |
| Body | `1rem` |
| Small / label | `0.875rem` |
| Eyebrow | `0.6875rem`, uppercase, letter-spacing 0.08em |

---

### Spacing
| Name | Value |
|---|---|
| xs | `0.25rem` |
| sm | `0.5rem` |
| md | `0.875rem` / `1rem` |
| lg | `1.375rem` |
| xl | `2.5rem` |
| hero-top | `5.5rem` |
| section-gap | `1rem` |

---

### Border radius
| Name | Value | Usage |
|---|---|---|
| pill | `9999px` | Send button |
| prompt | `22px` | Prompt card |
| card | `20px` | Links card |

---

### Shadows / glow
```css
/* Prompt card */
box-shadow:
  inset 0 0 0 0.5px rgba(255,255,255,.04),
  0 8px 40px rgba(0,0,0,.45),
  0 2px 8px rgba(0,0,0,.3);

/* Links card */
box-shadow: 0 4px 24px rgba(0,0,0,.35);

/* backdrop-filter: blur(20px) on prompt card */
```

---

## Element mapping

| Snip element | Design role |
|---|---|
| `<header class="hero">` | Hero — centered headline + muted subline, sits above glow |
| `<h1>` | One bold statement, large clamped size, white |
| `<p class="sub">` | Muted subline below `h1` |
| `.glow.g1/g2/g3` | Lovable's ambient gradient orbs, `filter: blur(90px)`, position absolute |
| `.prompt-card` | Lovable's chat input card — frosted glass, 22 px radius, input + circular send button |
| `.prompt-input` | Transparent, caret `#e879a0`, placeholder `#3f3f46` |
| `.prompt-btn` | 40 × 40 px circle, coral→pink gradient, SVG arrow icon |
| `.notice-error` | Inline below form, `#f87171` |
| `.notice-success` | Inline below form, `#86efac` with violet link |
| `.links-card` | Subtle dark card, 20 px radius |
| `.card-eyebrow` | Uppercase micro-label above table |
| `.code-link` | Violet monospace, links to shortUrl |
| `.url-cell` | Truncated, muted gray |
| `.hits-cell` | Tabular-nums, very muted, right-aligned |
