# Heartstrings Studio Dashboard

Updated September 22, 2026.

## Purpose and design

Tim's personal link-sharing utility. All 12 destination URLs are retained, including the current Main Studio Site short link. There is no search, pricing, intake CTA, or Story Room destination.

The dashboard uses charcoal surfaces, warm ivory text and restrained copper accents. A compact digital business-card strip provides Open, Share and QR actions. The existing control-room photograph remains immediately below Share Links in a shallower crop. A single category navigation is visible at a time: a sticky toolbar above 680px, or bottom navigation with safe-area spacing at 680px and below.

Link cards have one primary Share action, quieter QR and favorite controls, and readable descriptions. Compact mode keeps a one-line description. Appearance controls live in a header-accessible dialog. Filter transitions, dialog entry and button feedback respect system reduced motion and the saved motion preference.

## Favorites, recent links and sharing

Saved links appear in an ordered shortlist above the directory. The shortlist is hidden until at least one link is saved. Reorder opens accessible up/down controls; changes persist on this device using the existing saved-links array. Legacy saved addresses migrate through the MOVED map. Storage events update favorites in other tabs. Storage failure retains changes for the visit and reports the limitation.

Recent links appear below the directory and have direct Share controls. A reserved empty state avoids introducing a new section above working links on first use. Recent link nodes are reused so focus can return to the share trigger after a dialog closes.

Share uses the native share sheet when supported. Unsupported or failed native sharing opens a fallback panel containing the destination URL, Copy link and Show QR. Cancellation is quiet. Copy/download status is placed inside an open dialog rather than underneath the modal backdrop. Transitions between share and QR replace one dialog/history entry; Back closes the panel and focus returns to the original control.

## Branded QR, share messages and shortcuts

- **QR codes** (dashboard and card) now go through `qr-brand.js`. They use error-correction level H, and a CSS badge puts the heart logo in the middle. **Save QR poster** downloads a 1080×1350 PNG with a charcoal and copper frame, the link title, the short URL and the studio tagline, ready to print or post. In headless Chromium, both the Jukebox and card posters decoded to the correct URL with jsQR.
- **Share messages:** native share now sends a one-line message with the link (`SHARE_TEXT` by category; override per link with `data-share-text`). The fallback dialog adds **Copy message**. The card's own Share sends a "Save my card" line.
- **Home-screen shortcuts:** `manifest.json` shortcuts open the card, `?filter=saved` or `?filter=listen`. Any valid `?filter=` value selects that category when the page loads. Unknown values are ignored.
- **Link previews:** the dashboard's `og:image` and Twitter card now use the studio banner at large size instead of the small logo.

## Song of the Week

A spotlight card sits between the business-card strip and Share Links. It has Listen, Share (with a "New this week…" message) and QR buttons, plus a small copper equalizer that stops when motion is off. **Weekly update:** in `index.html`, edit the `#spotlight` element's `data-url`, `data-song`, `data-note` (optional) and `data-week` (`YYYY-MM-DD`, the day it goes live). No version bump is needed because pages are fetched network-first. If `data-url` is empty or not `https://`, the card stays hidden. For the first 13 days after `data-week`, the label reads "SONG OF THE WEEK · SEP 21". After that it switches to "FEATURED SONG", so a missed week never shows an outdated "this week" claim.

## Digital business card

The standalone card remains at `card.html`, with its existing banner, contact details, vCard download, QR and sharing behavior. Dashboard sharing uses the canonical URL from `og:url`, so previews still share the production card address.

The phone row did not dial on iPhones. Three causes, all fixed in markup and CSS; `card.js` is unchanged:

- The card did not opt out of iOS telephone detection, so Safari auto-linked the displayed `304-677-1113` into its own `<a href="tel:">` nested inside the row's link. A nested anchor is invalid, and the injected one absorbed the tap instead of dialing. `<meta name="format-detection" content="telephone=no" />` stops the detection; the row's own `tel:+13046771113` link is untouched and still dials.
- Inline SVG icons inside links could take the touch on iOS rather than activating the link. Every icon on the card is decoration, so `a svg` and `button svg` are now `pointer-events: none`.
- Contact rows had a hover state only, and the tap highlight is disabled, so a tap on a touch device produced no visible response. `.contact-list a:active` gives the press feedback that hover gives a pointer.

The version bump (now `?v=4`, cache v19) ensures phones pick up the fix.

## Validation for this change

Run `npm ci && npm test` with a current Node.js version supported by jsdom. Dependencies are development-only; deployment remains plain HTML, CSS and JavaScript with no build step.

18 tests cover retained destinations/assets, valid IDs and ARIA references, filtering and navigation synchronization, favorites migration/order/persistence, cross-tab updates, copying and modal feedback, share/QR history and focus, recent-link focus retention, native-share cancellation and errors, blocked/corrupt storage, reduced motion, appearance persistence, service-worker asset versions, category share messages and Copy message, high-error-correction QR, `?filter=` shortcuts, and the Song of the Week (hidden when empty, share/QR, stale label). The last of these reads `card.html` and `card.css` directly and fails if the telephone-detection opt-out, the `tel:` href, the icon `pointer-events` rule, the row press state, or the stylesheet version bump is missing.

JavaScript syntax and `git diff --check` also pass. Responsive CSS was reviewed for one navigation per breakpoint, a single-column mobile grid, 44px controls, safe-area dock clearance, and mobile sheet sizing.

**Visual validation remains pending:** the available cloud browser denied access to localhost and shared local files. No rendered preview, physical-phone verification, real native-share/QR scan, or offline browser test is claimed for this revision. The iPhone dialing fix in particular is unverified on a device: iOS telephone detection is WebKit-only behavior that neither jsdom nor the available Chromium reproduces, so the fix rests on the cause analysis above and should be confirmed by tapping the row on an iPhone. jsdom models dialogs and browser APIs; it does not validate layout or native browser rendering.

## Maintenance

Source: `index.html`, `studio.css`, `studio.js`, `qr-brand.js`, `sw.js`. New links are `.card` elements with `data-url`, `data-title`, `data-category`, `.card-main`, `.card-title`, `.card-sub`, and a `.card-icon` SVG. Category must match the containing `data-section`.

Existing storage keys remain unchanged. Favorites order is insertion order in the existing saved-links array. Unknown destinations are ignored. Add moved addresses to MOVED to preserve favorites/history.

The service-worker cache is v19; dashboard CSS and JS use query version 15, card CSS and JS use version 4, and `qr-brand.js` uses version 1. Update cache and asset references together. Preserve the `heartstrings-dashboard-` cache prefix, `/dashboard/` manifest scope, and separate navigation cache keys for the dashboard and business card.

Business-card contacts live in `card.js`'s CONTACT object and `card.html`'s contact rows. Its JPEG and WebP banner assets should stay in sync when changed.
