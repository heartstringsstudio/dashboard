# Heartstrings Studio Dashboard

Updated September 9, 2026 — luxe dashboard redesign.

## Visual system

The dashboard intentionally departs from the main site's flat walnut treatment at Tim's request. A midnight ground (#101116), champagne metallic primary action, dimensional jewel-tone controls, and rounded panels give the sharing dashboard its own polished identity. Existing logo assets and self-hosted fonts remain in use.

- Libre Caslon Display uses its actual 400 weight for display headings and prices.
- DM Sans handles readable interface labels and descriptions.
- Studio uses champagne; listening uses amethyst; extras use teal. Individual playlists have complementary accents.
- Desktop uses two columns; screens up to 760px use a single flowing column. Tiles and actions wrap with content rather than truncating descriptions.
- Buttons have raised edges, pressed states, and visible keyboard focus. Primary action has a finite sheen animation. Reduced-motion preferences disable transitions and animation.
- Pricing expands to its content height, including enlarged text.

## Preserved behavior

All existing destinations, native share/clipboard fallback, QR generation and dialog keyboard handling, recent-link storage, and install guidance remain intact. No new runtime dependencies or external font requests were added. Memorial rush pricing now explicitly states the free 24-hour policy.

## Validation

Static checks verify that all original outbound link destinations and card metadata are preserved, every local asset and SVG symbol reference resolves, IDs are unique, scripts parse, and the manifest remains valid. The application script is unchanged. Browser visual and interaction testing was not performed.

## Maintenance

- New cards require data-url, data-title, .card-main, .card-title, and .card-sub. Share/QR controls are generated automatically.
- Increment the service-worker shell cache when changing deployed shell assets; this redesign uses v7.
- Keep cache cleanup restricted to the heartstrings-dashboard- prefix.
- Preserve the existing /dashboard/ PWA scope and GitHub Pages paths.
