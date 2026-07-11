# Heartstrings Studio Dashboard Audit

Updated July 11, 2026

## Current status

The dashboard is a focused, mobile-first sharing tool with a responsive two-column desktop layout. The July 2026 improvement pass addressed the main visual, accessibility, sharing, and PWA concerns found during review.

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
- Added accessible section headings and relationships.
- Isolated the dashboard service-worker cache so it cannot delete caches belonging to other Heartstrings apps on the same domain.

## Validation checklist

- All dashboard destination cards remain real links and open in a new tab.
- All interactive controls meet the 44px minimum touch-target size.
- The dashboard remains usable without animation when reduced motion is enabled.
- Core files, icons, QR code library, and fonts are included in the offline shell.
- Cache cleanup is restricted to names beginning with `heartstrings-dashboard-`.
- The page has no runtime dependency on Google Fonts.

## Future maintenance

- When adding a new card, include `data-url`, `data-title`, a `.card-main` link, `.card-title`, and `.card-sub`; Share and QR controls will be added automatically.
- Increment the dashboard cache version in `sw.js` whenever a deployed shell asset changes.
- Periodically confirm destination links and YouTube playlists are still current.
