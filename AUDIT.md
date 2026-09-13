# Heartstrings Studio dashboard

Updated September 13, 2026 — copper studio remote.

## Experience

Warm charcoal, brushed copper gradients, champagne highlights, and raised metallic controls replace the teal theme. The introduction combines a copper-treated studio photograph, a clear song-intake action, and a working destination selector. Section banners are replaced with compact headings so the directory is easier to scan.

The studio remote browses all 13 existing destinations, beginning with the jukebox or the most recently used link. Previous/next buttons wrap around; left/right arrow keys work while focus is inside the remote. The center control opens the named destination in a new tab. This is a link remote, not an audio player. The brief signal-bar animation is decorative.

A fixed five-button dock filters All, Listen, Studio, Extras, and Saved, stays synchronized with the directory filters, and returns the viewer to the results. Search and filters work together. Compact view reduces card height while keeping sharing and saving controls visible.

Screen glow (including fully off), motion, and compact view persist on this device. Operating-system reduced-motion preferences take priority. Animations include an initial reveal, short meter movement, destination transitions, save feedback, and tactile button presses. There is no continuous animation loop.

## Preserved functionality

- All 13 original destinations, URLs, titles, and categories remain ordinary links.
- Per-link Share, Copy, QR, and Save controls; QR image downloads retain a white quiet zone.
- Device-local favorites and the last three recent destinations; unavailable storage reports the limitation without breaking controls.
- Pricing modal, memorial rush policy, QR modal, Escape/backdrop/Back behavior, and keyboard search shortcut.
- Native app-install support. The v9 service-worker shell retains the dashboard-only cache prefix. Versioned CSS/JS URLs prevent an older worker from mixing teal assets with the new markup.
- Existing logo, social previews, and local fonts. Existing studio artwork receives a CSS sepia treatment; no new image downloads are required.

## Validation

JavaScript syntax and git whitespace checks pass. An isolated jsdom interaction harness verifies all destinations and metadata against the previous main branch, remote wraparound and keyboard navigation, synchronized dock/category buttons, search/filter intersection and reset, saved-link empty states, copy/recent tracking, QR/pricing opening, preference restoration, system reduced motion, malformed storage, and storage-denied behavior. IDs, SVG references, local assets, and offline-shell entries are checked.

The local preview was inaccessible to the connected browser. Live browser verification is performed after publication and recorded separately; the DOM harness is not a substitute for visual or device testing.

## Maintenance

Source files: index.html, studio.css, studio.js. No build step or runtime package dependency. Add destinations as .card elements with data-url, data-title, data-category, .card-main, .card-title, .card-sub, and a .card-icon SVG. The remote derives its destinations from these cards. Category must match the containing data-section.

Preference key: heartstrings_dashboard_console_settings. Favorites and recent-link storage keys are unchanged. Increment the service-worker cache and matching CSS/JS version queries together after shell changes. Preserve the /dashboard/ manifest scope; never delete another app's caches.

The existing generated studio artwork illustrates an atmosphere, not Tim's physical studio.
