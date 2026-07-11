# Heartstrings Studio Dashboard — Full Product & Design Audit

**Audited:** `index.html`, `manifest.json`, `logo.png`, `qrcode.min.js` at commit `288ee4a`
**Method:** source review + headless-Chromium rendering and interaction testing at 375 px, 768 px, and 1440 px
**Constraint honored throughout:** everything below is static-hostable — plain HTML/CSS/JS on GitHub Pages, no build step, no servers.

**Brand guardrail check (all pass today):** no "AI-powered" anywhere ✓ · no guitar imagery ✓ · no phone number ✓ · fully static ✓. Every recommendation below preserves all four.

---

## Executive summary

The dashboard is in better shape than most solo-operator tools: the dark rose-and-cream direction is already warm and distinctive, the QR/share flow works, and the most-used item (Song Jukebox) is correctly promoted. The three biggest problems, in order:

1. **It is not actually a PWA.** There is no service worker, so the installed app is a blank error screen with no signal — a real risk for a business run from Lumberport, WV.
2. **The interactive layer is built on `<div>`s and 34 px buttons.** No keyboard access, no long-press share, mis-tap-prone targets on the two buttons used most.
3. **Emoji iconography is the single thing that says "assembled by a developer."** Thirteen full-color emoji that render differently on every OS, fighting an otherwise monochrome rose palette.

---

## PASS 1 — Functionality

| # | Finding | Rating |
|---|---------|--------|
| 1.1 | **No service worker → zero offline capability.** The app is installable but renders nothing without a network connection. For a daily driver used in funeral homes, venues, and rural WV, this is the most important gap in the product. Fix is ~40 lines (code in §Change 1). | **Critical** |
| 1.2 | **Manifest icon metadata is wrong.** `logo.png` is 500×500, but the manifest declares it as both `192x192` and `512x512`. `purpose: "any maskable"` on a single non-padded icon means Android's maskable crop can clip the logo edges. Also `background_color`/`theme_color` (`#1a1214`) don't match the page `theme-color` (`#110d0f`), causing a color "jump" at launch. | High |
| 1.3 | **Cards are `<div>`s, not links.** Consequences: no keyboard operability at all (verified: no `tabindex`, no `role`), no iOS long-press share sheet, no desktop right-click/middle-click, and no link semantics for assistive tech. Converting to real `<a>` elements costs nothing and adds all four (code in §Change 3). | High |
| 1.4 | **Share and QR buttons are 34×34 px** (verified by measurement) — below the 44 px minimum for reliable thumb taps. These are the two most-used controls on the page; a mis-tap in front of a client opens the wrong thing and costs the moment. | High |
| 1.5 | **QR overlay: Escape does not close it (verified), and on Android the hardware back button exits the app instead of closing the overlay.** Tap-to-close works, but back-button is the reflex on Android. ~8 lines fix both (code in §Change 3). | High |
| 1.6 | **`og:image` / `twitter:image` are relative (`logo.png`)** — link scrapers (Messages, Facebook, Slack) need an absolute URL, so shared links show no image today. One-line fix. | High |
| 1.7 | **No install affordance on Android.** The static hint card is good, but Chrome fires `beforeinstallprompt`, which can power a one-tap "Install app" button instead of three-step instructions. | Nice-to-have |
| 1.8 | **Toast is invisible to screen readers.** Add `role="status" aria-live="polite"` to `#toast` so "Link copied" is announced. | Nice-to-have |
| 1.9 | **QR density for YouTube playlist URLs.** The four playlist links encode ~75-char URLs → dense codes that scan slower on worn phone cameras. The jukebox and main site already use tinyurl; give the playlists short aliases too and the QR modules get ~40% bigger. | Nice-to-have |
| 1.10 | **`navigator.share` errors are swallowed silently.** Cancel (AbortError) should stay silent, but a genuine failure should fall back to clipboard-copy rather than doing nothing. | Nice-to-have |

**What works (verified):** pricing accordion opens/closes cleanly · QR generates correctly and closes on tap · share falls back to clipboard + toast when `navigator.share` is absent · all external links `target="_blank" rel="noopener"` · no horizontal overflow at 375 px · no JS errors (the only console error is Google Fonts, blocked by the test sandbox) · standalone-mode detection correctly hides the install hint.

**Tap-count review:** QR to client = 1 tap (excellent). Share = 1 tap. Pricing reveal = 1 tap. This is already efficient — the fixes above are about tap *reliability* (target size) and *recoverability* (back button), not tap count.

---

## PASS 2 — Layout & Information Architecture

**5-second scan test at 375 px:** the first viewport shows CTA → Pricing → Song Jukebox. That's the right top three for this business — **pass**. The problems start below the fold.

| # | Finding | Rating |
|---|---------|--------|
| 2.1 | **The four YouTube playlists get the same visual weight as the jukebox.** "Hear the Songs" is 7 full-height cards (~740 px of scroll); Memorial/Wedding/Birthday/Demos are situational picks, yet they push the Studio tools (intake form — the money path) far below the fold. **Before:** 7 stacked full cards. **After:** keep Jukebox (hero style, as now), WBOY, and Full Channel as full cards; render the 4 playlists as a **2×2 compact grid** of icon-plus-title tiles. Cuts total page height ~25% and restores hierarchy: featured → proof → situational. (CSS in §Change 5.) | High |
| 2.2 | **Desktop/tablet is a 430 px column in a void.** At 1440 px (verified screenshot), ~70% of the screen is empty. **Before:** one narrow column, everything requires scrolling even on a laptop. **After:** at ≥900 px widen the wrapper and let sections flow into two columns — the entire dashboard visible without scrolling. ~10 lines of CSS (§Change 5). Mobile stays untouched. | High (if she ever uses a tablet/laptop) · Nice-to-have (if phone-only) |
| 2.3 | **Header spends ~150 px on ceremony.** `padding: 56px 0 32px` plus eyebrow + title + subtitle before any tool appears. For a daily driver, tighten to `36px 0 20px` and drop the "Quick Share Dashboard" subtitle (she knows what it is) — buys back ~50 px of first-viewport space without losing the brand moment. | Nice-to-have |
| 2.4 | **Card subtitles mix two content types** — some are URLs (`tinyurl.com/hsjukebox`), some are descriptions ("Our interactive app"). URLs are genuinely useful (they confirm what the QR will encode), so standardize: subtitle = short URL where one exists, description otherwise, but never both styles inside one section. | Nice-to-have |
| 2.5 | **Grouping is otherwise correct.** CTA/Pricing (sell) → Hear the Songs (prove) → Studio (operate) → Extras (delight) is a sound narrative order, and the section-rule headers separate groups clearly. Keep it. | — |

---

## PASS 3 — Aesthetic Elevation

The foundation is genuinely good — Playfair Display + DM Sans on a warm near-black with a rose accent is already 70% of a designed look. The remaining 30% is consistency: icons, type scale discipline, spacing rhythm, and desktop states.

### 3.1 Typography — **High**

Keep both existing typefaces (they're right for the brand, and already loaded):

- **Playfair Display** — display serif, the brand voice
- **DM Sans** — UI workhorse

Change the loaded weights from `Playfair 400/700/400i + DM Sans 300/400/500` to **`Playfair 700 + DM Sans 400/500/600`** (drop the 300 — see contrast note below):

```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap
```

**Type scale** (replaces today's ad-hoc 9 / 10 / 10.5 / 11 / 11.5 / 12 / 13 / 14 / 15 / 17 px sprawl):

| Token | Face / weight | Size / line-height | Used for |
|---|---|---|---|
| `--type-display` | Playfair 700 | 34px / 1.1, ls −0.01em | H1 |
| `--type-title` | DM Sans 500 | 15px / 1.3 | Card titles, QR title |
| `--type-body` | DM Sans 400 | 13px / 1.5 | Price labels, hint copy |
| `--type-caption` | DM Sans 400 | 12px / 1.4 | Card subtitles, price notes |
| `--type-label` | DM Sans 600 | 10px / 1, ls 0.22em, uppercase | Section heads, eyebrow, QR hint |
| `--type-button` | DM Sans 600 | 14px / 1, ls 0.1em, uppercase | CTA |
| `--type-price` | Playfair 700 | 18px / 1 | Price amounts |

**Contrast fix (part of this item):** `--cream-faint` is `rgba(250,246,242,0.28)` — measured contrast **≈2.4:1** against the background, well below the 4.5:1 WCAG AA floor, at font-weight 300 and 10–11 px. Section labels (rose at 0.65 opacity) sit at ≈2.9:1. Floor all secondary text at **0.52 alpha / weight 400** and labels at 0.8 opacity. This alone makes the page feel sharper, not just more accessible.

### 3.2 Color — **High**

The rose/cream direction is correct — don't replace it, formalize it. Refined palette (warm plum-black, rose, and a champagne second accent; no blue, no default grays anywhere):

| Role | Hex | Notes |
|---|---|---|
| Background | `#141011` | Warm plum-black (near current, slightly lifted) |
| Surface | `rgba(255,255,255,0.045)` | Glass cards over the orbs — keep the technique |
| Surface raised | `rgba(255,255,255,0.08)` | Pressed/hover card state |
| Border | `rgba(250,246,242,0.08)` | |
| Border accent | `rgba(198,86,107,0.35)` | |
| Text high | `#faf6f2` | Cream — unchanged |
| Text mid | `rgba(250,246,242,0.74)` | |
| Text low | `rgba(250,246,242,0.52)` | Contrast floor ≈4.6:1 |
| Accent (rose) | `#c6566b` | Primary brand accent |
| Accent bright | `#e07d90` | Links, highlights — 6.9:1 on bg |
| Accent deep | `#7c2f40` → `#58202c` | CTA gradient |
| Champagne | `#cfa678` | Price amounts, small moments of warmth — 8.6:1 on bg |
| Success | `#8fa98b` | Muted sage (confirmations, "copied" toast) |
| Warning | `#d9a05b` | Soft amber |
| Focus ring | `rgba(224,125,144,0.7)` | |

The champagne is the one genuinely new note: prices set in Playfair champagne instead of rose reads "letterpress wedding invitation" rather than "sale tag" — quietly elegant, never rustic.

### 3.3 Spacing — **High**

4 px base grid. Today's values (1, 2, 6, 8, 10, 12, 13, 14, 16, 17, 18, 20, 28 px…) collapse onto: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56**. Tokens in the `:root` block below. The visible wins: card padding 13→16 px, card gap 8→12 px, section margin 28→32 px top / 12 px bottom — the page gains a steady vertical rhythm instead of near-misses.

### 3.4 Depth & polish — **High**

- **Hover states are entirely missing** — only `:active` exists, so a laptop/tablet user gets zero feedback until they click. Add `@media (hover:hover)` lift states (§Change 4).
- **Focus rings are missing** — add `:focus-visible` in the focus-ring color.
- Two shadow tokens: `--shadow-card: 0 2px 12px rgba(0,0,0,0.25)` resting, `--shadow-lift: 0 8px 28px rgba(0,0,0,0.4)` hover/modal, plus the existing rose glow kept for CTA and QR panel only (a glow everywhere is a glow nowhere).
- Radii tokens: 10 (icons/buttons) / 14 (cards) / 20 (QR panel) / pill.
- All transitions stay CSS-only, 120–350 ms, and get a `prefers-reduced-motion` guard (currently absent).

### 3.5 Iconography — **Critical for the design goal**

Replace all 13 emoji with a **single inline SVG sprite** (one `<svg>` of `<symbol>`s at the top of `<body>`, referenced via `<use>` — zero network requests, perfect for GitHub Pages). Style: 24×24 viewBox, `stroke="currentColor"`, `stroke-width="1.75"`, round caps, `fill="none"` — so every icon automatically takes the rose/cream palette. Full sprite in §Change 2, including a feather for Memorial (elegant, no religious weight), interlocking rings for Wedding, and a zap for Wired Differently. No guitar anywhere.

This is the highest-impact visual change on the page: it's the difference between "13 stickers from 3 operating systems" and one designed system.

### The 5 highest-impact visual changes, ranked

1. **SVG icon system replacing emoji** (§Change 2) — removes the single loudest "developer-assembled" signal.
2. **Contrast + weight floor on secondary text** (§3.1, tokens in §Change 5) — the page instantly reads crisper.
3. **Champagne accent for prices + disciplined type scale** (§3.1–3.2) — adds the second warm note that makes the palette feel composed rather than monochrome.
4. **Hover/focus states + shadow system** (§Change 4) — the page starts responding like an app on every input type.
5. **Playlist compaction + desktop layout** (§Change 5 media queries) — the layout looks intentional at every width instead of "a phone page on a monitor."

---

## Prioritized implementation plan (impact ÷ effort)

| Order | Item | Rating | Effort |
|---|---|---|---|
| 1 | Service worker + register + manifest fixes (§Change 1) | Critical | ~30 min |
| 2 | 44 px tap targets, Escape/back-button close, toast `aria-live`, absolute `og:image` (§Change 3 + one-liners) | High | ~30 min |
| 3 | SVG icon sprite (§Change 2) | High | ~1½ h |
| 4 | Design tokens + type/contrast/spacing pass (§Change 5 / `:root`) | High | ~1½ h |
| 5 | Cards → real `<a>` links (§Change 3) | High | ~1 h |
| 6 | Hover/focus/motion polish (§Change 4) | High | ~30 min |
| 7 | Playlist 2×2 grid + ≥900 px two-column layout (§Change 5 media queries) | High | ~1 h |
| 8 | `beforeinstallprompt` one-tap install button | Nice-to-have | ~30 min |
| 9 | tinyurl aliases for the 4 playlist QRs | Nice-to-have | ~15 min |
| 10 | Header tightening, subtitle standardization | Nice-to-have | ~20 min |

---

## Copy-paste-ready code — top 5 changes

### Change 1 — Service worker + corrected manifest (Critical)

**New file `sw.js`** (repo root, next to `index.html`):

```js
const CACHE = 'heartstrings-v1';
const SHELL = ['./', './index.html', './manifest.json', './logo.png', './qrcode.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin) {
    // App shell: cache-first, then network (and cache what we fetch)
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then((hit) =>
        hit || fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
      )
    );
  } else if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    // Fonts: stale-while-revalidate so offline keeps the brand typefaces
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
```

**Register it** — add before `</body>` in `index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
  }
</script>
```

Bump `heartstrings-v1` → `-v2` etc. whenever you ship changes, or returning devices keep the old version.

**Replace `manifest.json`:**

```json
{
  "name": "Heartstrings Studio",
  "short_name": "Heartstrings",
  "id": "/dashboard/",
  "description": "Quick access to all Heartstrings Studio links",
  "start_url": "/dashboard/",
  "scope": "/dashboard/",
  "display": "standalone",
  "background_color": "#141011",
  "theme_color": "#141011",
  "orientation": "portrait",
  "icons": [
    { "src": "logo.png", "sizes": "500x500", "type": "image/png", "purpose": "any" }
  ]
}
```

Also change the page `<meta name="theme-color" content="#141011" />` to match. When convenient, export a true 512×512 `icon-512.png` and a 512×512 `icon-maskable.png` with the logo inside the central 80% safe zone, and add them as separate entries — that ends Android's crop guessing.

### Change 2 — Inline SVG icon sprite (replaces all emoji)

Paste once at the top of `<body>`:

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <defs>
    <symbol id="i-headphones" viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></symbol>
    <symbol id="i-tv" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><polyline points="17 2 12 7 7 2"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></symbol>
    <symbol id="i-feather" viewBox="0 0 24 24"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></symbol>
    <symbol id="i-rings" viewBox="0 0 24 24"><circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/></symbol>
    <symbol id="i-cake" viewBox="0 0 24 24"><path d="M4 21h16"/><path d="M5 21v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M12 14v-3"/><path d="M12 8.5A1.5 1.5 0 0 0 13.5 7c0-1-1.5-2.5-1.5-2.5S10.5 6 10.5 7A1.5 1.5 0 0 0 12 8.5z"/></symbol>
    <symbol id="i-sliders" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></symbol>
    <symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></symbol>
    <symbol id="i-pen" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></symbol>
    <symbol id="i-columns" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M4 21V10M20 21V10M8 21v-8M12 21v-8M16 21v-8"/><path d="M2 10l10-6 10 6"/></symbol>
    <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></symbol>
    <symbol id="i-zap" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></symbol>
    <symbol id="i-dollar" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></symbol>
    <symbol id="i-share" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></symbol>
    <symbol id="i-qr" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3z"/><path d="M21 14v4h-1"/><path d="M14 21h4"/><path d="M21 21h.01"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>
  </defs>
</svg>
```

CSS (replaces `.card-emoji` / `.price-emoji` rules):

```css
.card-icon, .price-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-sm);
  color: var(--accent-bright);
}
.card-icon svg, .price-icon svg,
.action-btn svg, .cta-btn svg {
  width: 20px; height: 20px; fill: none;
  stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round;
}
.card.channel .card-icon { background: var(--accent-glow); border-color: var(--border-accent); }
```

Markup swap, per card — e.g. the jukebox:

```html
<div class="card-icon"><svg aria-hidden="true"><use href="#i-headphones"/></svg></div>
```

Mapping: Jukebox `#i-headphones` · WBOY `#i-tv` · Full Channel `#i-play` · Memorial `#i-feather` · Wedding `#i-rings` · Birthday `#i-cake` · Demos `#i-sliders` · Main Site `#i-music` · Intake `#i-pen` · Funeral Home Partners `#i-columns` · Song Quiz `#i-target` · Wired Differently `#i-zap` · Pricing `#i-dollar` · CTA note `#i-music` · chevron `#i-chevron`. In the JS, replace the injected `⬆` with `<svg aria-hidden="true"><use href="#i-share"/></svg>` and the `QR_ICON` constant with `<svg aria-hidden="true"><use href="#i-qr"/></svg>` (the old fill-based constant can be deleted).

### Change 3 — Real links, 44 px targets, Escape/back-button close

New card markup pattern (repeat for all 12 cards — keep `data-url`/`data-title` on the outer div for the share/QR JS):

```html
<div class="card" data-url="https://tinyurl.com/hsjukebox" data-title="Heartstrings Studio — Hear the Songs">
  <a class="card-main" href="https://tinyurl.com/hsjukebox" target="_blank" rel="noopener">
    <span class="card-icon"><svg aria-hidden="true"><use href="#i-headphones"/></svg></span>
    <span class="card-text">
      <span class="card-title">Song Jukebox</span>
      <span class="card-sub">tinyurl.com/hsjukebox</span>
    </span>
  </a>
  <!-- .card-actions still injected by JS -->
</div>
```

CSS adjustments:

```css
.card { padding: var(--space-2); gap: var(--space-2); }
.card-main {
  display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 0;
  padding: var(--space-2); margin: calc(var(--space-2) * -1); /* full-bleed tap area */
  text-decoration: none; color: inherit; border-radius: var(--r-md);
}
.card-text { display: block; }
.card-title, .card-sub { display: block; }
.action-btn { width: 44px; height: 44px; border-radius: var(--r-sm); }
```

JS — delete `card.addEventListener('click', () => openLink(url))` and the `openLink` helper (the anchor handles it), keep the button wiring, and add:

```js
// Escape + Android back button close the QR overlay
function showQR(url, title) {
  /* ...existing body... */
  qrOverlay.classList.add('show');
  history.pushState({ qr: 1 }, '');
}
function closeQR() {
  if (history.state && history.state.qr) history.back();
  else qrOverlay.classList.remove('show');
}
window.addEventListener('popstate', () => qrOverlay.classList.remove('show'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQR(); });
qrOverlay.addEventListener('click', closeQR);   // replaces the old click handler
```

One-liners from Pass 1 while in here:

```html
<div id="toast" role="status" aria-live="polite">Link copied</div>
<meta property="og:image" content="https://heartstringsstudio.github.io/dashboard/logo.png" />
<meta name="twitter:image" content="https://heartstringsstudio.github.io/dashboard/logo.png" />
```

### Change 4 — Hover, focus, and motion polish

```css
/* Desktop/tablet pointer feedback — missing entirely today */
@media (hover: hover) {
  .card:hover { border-color: var(--border-accent); background: var(--surface-2);
                transform: translateY(-1px); box-shadow: var(--shadow-lift); }
  .action-btn:hover { color: var(--accent-bright); border-color: var(--border-accent);
                      background: var(--accent-glow); }
  .cta-btn:hover { transform: translateY(-1px);
                   box-shadow: 0 6px 32px rgba(198,86,107,0.30), inset 0 1px 0 rgba(255,255,255,0.06); }
  .price-toggle:hover .price-chevron { border-color: var(--border-accent); color: var(--accent-bright); }
}

/* Keyboard focus — also missing today */
.card-main:focus-visible, .action-btn:focus-visible,
.cta-btn:focus-visible, .price-toggle:focus-visible {
  outline: 2px solid var(--focus); outline-offset: 2px;
}

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### Change 5 — Design tokens + layout restructuring

Layout CSS (playlist compaction + desktop columns):

```css
/* Compact 2×2 grid for the four playlists: wrap them in <div class="cards cards-compact"> */
.cards-compact { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.cards-compact .card { padding: var(--space-3); }
.cards-compact .card-sub, .cards-compact .card-actions { display: none; } /* QR/share via the full jukebox card or long-press */
.cards-compact .card-icon { width: 32px; height: 32px; }
.cards-compact .card-icon svg { width: 16px; height: 16px; }
.cards-compact .card-title { font-size: 13px; }

/* Tablet/desktop: two-column dashboard instead of a phone column in a void */
@media (min-width: 900px) {
  .wrapper { max-width: 920px; display: grid; grid-template-columns: 1fr 1fr;
             column-gap: var(--space-8); align-items: start; }
  header, .cta-wrap, .price-wrap, #pwa-hint { grid-column: 1 / -1; }
}
```

(If long-press sharing of individual playlists matters more than compactness, keep `.card-actions` visible and drop only `.card-sub` — the grid still halves the scroll.)

---

## Consolidated design system — `:root` block

Drop-in replacement for the current `:root`. Old variable names are aliased at the bottom so existing rules keep working until they're migrated; future pages inherit the whole system by copying this one block.

```css
:root {
  /* ── Color: base ─────────────────────────────── */
  --bg:             #141011;                    /* warm plum-black */
  --surface:        rgba(255,255,255,0.045);    /* glass card */
  --surface-2:      rgba(255,255,255,0.08);     /* raised / hover */
  --border:         rgba(250,246,242,0.08);
  --border-accent:  rgba(198,86,107,0.35);

  /* ── Color: text ─────────────────────────────── */
  --text-hi:        #faf6f2;                    /* cream */
  --text-mid:       rgba(250,246,242,0.74);
  --text-low:       rgba(250,246,242,0.52);     /* contrast floor — never go below */

  /* ── Color: accent ───────────────────────────── */
  --accent:         #c6566b;                    /* rose */
  --accent-bright:  #e07d90;                    /* links, icons, highlights */
  --accent-deep:    #7c2f40;                    /* CTA gradient start */
  --accent-wine:    #58202c;                    /* CTA gradient end */
  --accent-glow:    rgba(198,86,107,0.12);
  --champagne:      #cfa678;                    /* prices, warm moments */

  /* ── Color: semantic ─────────────────────────── */
  --success:        #8fa98b;                    /* muted sage */
  --warning:        #d9a05b;                    /* soft amber */
  --focus:          rgba(224,125,144,0.7);

  /* ── Type ────────────────────────────────────── */
  --font-display:   'Playfair Display', Georgia, serif;
  --font-ui:        'DM Sans', system-ui, sans-serif;
  --type-display:   700 34px/1.1  var(--font-display);
  --type-price:     700 18px/1    var(--font-display);
  --type-title:     500 15px/1.3  var(--font-ui);
  --type-body:      400 13px/1.5  var(--font-ui);
  --type-caption:   400 12px/1.4  var(--font-ui);
  --type-label:     600 10px/1    var(--font-ui);   /* + letter-spacing: 0.22em; uppercase */
  --type-button:    600 14px/1    var(--font-ui);   /* + letter-spacing: 0.1em;  uppercase */

  /* ── Space (4px grid) ────────────────────────── */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-14: 56px;

  /* ── Radius ──────────────────────────────────── */
  --r-sm: 10px; --r-md: 14px; --r-lg: 20px; --r-pill: 999px;

  /* ── Elevation ───────────────────────────────── */
  --shadow-card: 0 2px 12px rgba(0,0,0,0.25);
  --shadow-lift: 0 8px 28px rgba(0,0,0,0.40);
  --shadow-glow: 0 4px 24px rgba(198,86,107,0.18);   /* CTA + QR panel only */

  /* ── Motion ──────────────────────────────────── */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-fast: 0.15s; --t-med: 0.25s; --t-slow: 0.35s;

  /* ── Legacy aliases (delete after migration) ─── */
  --rose: var(--accent); --rose-light: var(--accent-bright);
  --rose-dim: var(--accent-deep); --rose-glow: var(--accent-glow);
  --cream: var(--text-hi); --cream-dim: var(--text-mid); --cream-faint: var(--text-low);
  --border-hot: var(--border-accent);
}
```

---

*Verified by rendering at 375/768/1440 px and exercising the pricing toggle, QR overlay (open, tap-close, Escape, generated code contents), share fallback, and tap-target measurement in headless Chromium.*
