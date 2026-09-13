# Heartstrings personal link-sharing dashboard

Updated September 13, 2026.

## Purpose

This app is Tim's personal utility for sharing existing links. It is not a sales page. The public GitHub Pages hosting and access settings are unchanged; "personal" describes the intended use, not authentication or private hosting.

The interface opens directly to search and category filters. Removed the promotional hero, destination-selector panel, pricing dialog, sales copy, song-intake CTAs, and Story Room destination. The remaining 12 destinations retain their original URLs and metadata.

Copy is the first and most prominent action on every card, followed by Share, QR, and Save. Ordinary card links still open the destination in a new tab. Recently used links, favorites, QR downloads, native sharing/copy fallback, install support, and the synchronized floating category dock remain available.

Copper surfaces and tactile feedback remain. Appearance controls are inside a collapsed native details panel. Control glow affects the navigation dock and focused cards. Compact view is the default for new settings; explicit existing preferences are respected. Motion respects the device's reduced-motion preference. Removed all obsolete hero/remote/pricing JavaScript and styles. Studio artwork is no longer loaded or precached.

## Validation

JavaScript syntax and whitespace checks pass. An isolated jsdom harness verifies 12 retained URLs, absence of promotional and Story Room UI, copy-first controls, search/filter intersections, dock synchronization, saving/unsaving, clipboard and recent-link tracking, QR opening, appearance controls, removal of obsolete Story Room favorites/history, unavailable storage, reduced motion, unique IDs, SVG references, and local assets.

Local preview remains inaccessible to the connected browser. Live visual verification follows publication; no real-device verification is claimed.

## Maintenance

Source: index.html, studio.css, studio.js. No build step or runtime package dependency. Add .card elements with data-url, data-title, data-category, .card-main, .card-title, .card-sub, and a .card-icon SVG. Category must match the containing data-section.

Storage keys remain unchanged. Unknown/removed destinations are ignored when reading favorites and recents. The v10 service-worker cache and CSS/JS query versions move together. Preserve the heartstrings-dashboard- cache prefix and /dashboard/ manifest scope; do not clear other apps' caches.
