# Heartstrings Studio Dashboard Audit

Updated September 9, 2026

## Current status

The dashboard is a focused, mobile-first sharing tool with a responsive two-column desktop layout. The July 2026 improvement pass addressed the main visual, accessibility, sharing, and PWA concerns found during review.

## Design system (September 2026)

The dashboard was on the retired rose/charcoal palette (`--accent:#c0455a`,
Playfair Display) until September 2026. It now carries the same warm
walnut/amber system as `style.css` on the main site, the jukebox and the Story
Room. The dashboard sits on the **dark ground**, so amber is the accent — the
cream-ground half of that system (walnut `#774826` as the accent, walnut focus
rings) belongs to the keepsake pages, not here.

| Role | Value | Was |
|---|---|---|
| Page ground | `#271c16` | `#1a1416` |
| Ink / muted / dim | `#fff1dc`, `#d6bfa6`, `#bfa78d` | `#faf6f2` and white at 74% / 52% |
| Accent (amber) | `#f0b86f` | `#c0455a` |
| Gold (prices) | `#f2c98e` | `#b8956a` |
| Walnut / deep walnut | `#774826`, `#5a3419` | `#8b2a3a`, `#5d1d29` |
| Hairline | `rgba(227,183,134,0.20)` | `rgba(250,246,242,0.08)` |
| Amber slab button | `#edb268` on `#956536`, ink `#291c14` | rose gradient, cream ink |
| Focus ring | `rgba(240,184,111,0.85)` | `rgba(224,125,144,0.7)` |

Three things that are easy to get wrong:

- **Libre Caslon Display ships one weight (400) and no italic.** It is the
  display face for `h1` only. Anything italic — the "Studio Concierge" line —
  uses Georgia (`--font-serif`), exactly as the main site does for its `em`
  rule. Setting weight 500/600 on Libre Caslon renders a faux-bold smear.
- **The site is square-cornered.** `--r-sm/-md/-lg` are 3/4/6px, not the old
  10/14/20px. `--r-pill` survives for the toast and the QR Close button.
- **The primary CTA is the site's amber slab**, not a gradient: a flat
  `--slab` face over a hard `0 6px 0 --slab-shadow` and a soft ambient shadow,
  pressing down on `:active` rather than scaling. Keep the clearance under it.

Section tints stay in one warm family so they still label a section without
fighting the page: amber for Hear the Songs, terracotta `#d98f5e` for Studio,
sage-teal `#9db9b0` for Extras, parchment `#d6bfa6` for Recently Used. All four
clear WCAG AA on the walnut ground, as does every text token above.

The app icons were re-cut from the current studio mark (the copper heart with
the mountain line, `assets/logo.png` on the main site); the old rose heartbeat
mark is gone. `icon-maskable-512.png` and `apple-touch-icon.png` sit on the
walnut ground, `logo.png` and `icon-192.png` stay transparent, and each keeps
the framing of the file it replaced.

## Improvements completed

- Added the Heartstrings logo to the header and tightened excess vertical space.
- Added restrained category colors for songs, studio resources, extras, and recent links.
- Standardized card descriptions around the destination's purpose instead of mixing raw URLs and descriptions.
- Increased the smallest interface text to at least 11px.
- Added Share and QR actions to every destination, including compact playlist cards.
- Added destination-specific accessible labels to all Share and QR buttons.
- Reworked the QR dialog with a visible Close button, Escape and Back support, backdrop-only closing, and focus restoration.
- Added a Recently Used section that remembers the last three opened, shared, or displayed links on the device.
- Improved install guidance with a dismiss control and one-tap installation when the browser supports it.
- Removed the portrait-only installation restriction.
- Self-hosted the brand fonts for faster, more consistent, offline-friendly loading.
- Brought the palette, display face, corner radii, CTA and app icons in line with the September 2026 site rebuild (see above).
- Balanced the two-column desktop layout: Studio and Extras stack in the left column while Hear the Songs spans both of their rows, instead of Extras sitting under Hear and leaving the left column empty for most of the page.
- Added accessible section headings and relationships.
- Isolated the dashboard service-worker cache so it cannot delete caches belonging to other Heartstrings apps on the same domain.

## Validation checklist

- All dashboard destination cards remain real links and open in a new tab.
- All interactive controls meet the 44px minimum touch-target size.
- The dashboard remains usable without animation when reduced motion is enabled.
- Core files, icons, QR code library, and fonts are included in the offline shell.
- Cache cleanup is restricted to names beginning with `heartstrings-dashboard-`.
- The page has no runtime dependency on Google Fonts.
- Colours, fonts and the CTA treatment match `style.css` on the main site.

## Future maintenance

- When adding a new card, include `data-url`, `data-title`, a `.card-main` link, `.card-title`, and `.card-sub`; Share and QR controls will be added automatically.
- Increment the dashboard cache version in `sw.js` whenever a deployed shell asset changes.
- Keep the palette in step with `style.css` on the main site; the tokens at the top of `index.html` are the only place colours are defined.
- The desktop grid balances by hand, not by content: if a section gains or loses cards, re-check that the two columns still end at roughly the same height, and adjust which column each section takes rather than adding row numbers (Recently Used is hidden until the device has history, so row numbers shift).
- Periodically confirm destination links and YouTube playlists are still current.
