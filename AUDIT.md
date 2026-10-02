# Heartstrings Studio Dashboard

Updated October 2, 2026.

## Purpose and design

Tim's personal link-sharing utility. All 13 destination cards are retained, including the current Main Studio Site short link. There is no search, pricing, intake CTA, or Story Room destination.

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

## Spotlight and studio ads

A spotlight card sits between the business-card strip and Share Links. It has Listen or Watch, Share and QR buttons, plus a small copper equalizer that stops when motion is off.

**Adding a studio ad is one edit.** In `index.html`, copy the last row of the Studio Ads card (`.card[data-ads]`), paste it below, and change its link, the share button's `data-url`, the "Ad N" numbers and `data-week` (the day it goes live, `YYYY-MM-DD`). The rows are oldest first. Everything else follows the last row: the card's own link, Share, QR and star; the "Newest" tag; and the spotlight, while its `data-url` is `newest`. A favorite saved under an older ad moves to the newest one. The card's static `href` (the YouTube channel's Shorts page) is only the no-JavaScript fallback. Ad tabs sit in even columns that wrap, so a sixth ad starts a second row instead of hiding off-screen.

**Song of the Week instead:** set the `#spotlight` element's `data-url` to the song link, `data-song` (the headline), `data-note` (optional) and `data-week`, and remove `data-kind="ad"`. If `data-url` is empty, or isn't `https://` or `newest`, the card stays hidden. For the first 13 days after `data-week`, the label reads "SONG OF THE WEEK · SEP 21" (or "NEW STUDIO AD · SEP 28"). After that it switches to "FEATURED SONG" or "FEATURED AD", so a missed week never shows an outdated "this week" claim. The ad spotlight's headline, QR title and poster title use the ad's own name ("Studio Ad 5"), never "newest", so saved posters don't go stale.

## Digital business card

The standalone card remains at `card.html`, with its existing banner, contact details, vCard download, QR and sharing behavior. Dashboard sharing uses the canonical URL from `og:url`, so previews still share the production card address.

The phone row did not dial on iPhones. Three causes, all fixed in markup and CSS; `card.js` is unchanged:

- The card did not opt out of iOS telephone detection, so Safari auto-linked the displayed `304-677-1113` into its own `<a href="tel:">` nested inside the row's link. A nested anchor is invalid, and the injected one absorbed the tap instead of dialing. `<meta name="format-detection" content="telephone=no" />` stops the detection; the row's own `tel:+13046771113` link is untouched and still dials.
- Inline SVG icons inside links could take the touch on iOS rather than activating the link. Every icon on the card is decoration, so `a svg` and `button svg` are now `pointer-events: none`.
- Contact rows had a hover state only, and the tap highlight is disabled, so a tap on a touch device produced no visible response. `.contact-list a:active` gives the press feedback that hover gives a pointer.

The card asset version bump to `?v=4` ensures phones pick up the fix.

## Validation for this change

Run `npm ci && npm test` with a current Node.js version supported by jsdom. Dependencies are development-only; deployment remains plain HTML, CSS and JavaScript with no build step.

26 tests cover retained destinations/assets, valid IDs and ARIA references, filtering and navigation synchronization, favorites migration/order/persistence, cross-tab updates, copying and modal feedback, share/QR history and focus, recent-link focus retention, native-share cancellation and errors, blocked/corrupt storage, reduced motion, appearance persistence, service-worker asset versions, category share messages and Copy message, high-error-correction QR, `?filter=` shortcuts, and the spotlight (hidden when empty, share/QR, stale label, ad mode), the Studio Ads tabs, and the one-row ad workflow (a new last row moves the card, Newest tag, spotlight and favorites). The last of these reads `card.html` and `card.css` directly and fails if the telephone-detection opt-out, the `tel:` href, the icon `pointer-events` rule, the row press state, or the stylesheet version bump is missing.

JavaScript syntax and `git diff --check` also pass. Responsive CSS was reviewed for one navigation per breakpoint, a single-column mobile grid, 44px controls, safe-area dock clearance, and mobile sheet sizing.

**Visual validation remains pending:** the available cloud browser denied access to localhost and shared local files. No rendered preview, physical-phone verification, real native-share/QR scan, or offline browser test is claimed for this revision. The iPhone dialing fix in particular is unverified on a device: iOS telephone detection is WebKit-only behavior that neither jsdom nor the available Chromium reproduces, so the fix rests on the cause analysis above and should be confirmed by tapping the row on an iPhone. jsdom models dialogs and browser APIs; it does not validate layout or native browser rendering.

## Images, fonts and type

On-page logos (header, spotlight, studio strip, QR badge and QR poster) use `logo-160.png` (14KB). The 512px `logo.png` (87KB) stays for the favicon and the manifest icon. `assets/control-room.webp` is 1400px wide (67KB, was 120KB). Two unreferenced photos, `console-detail.webp` and `vocal-booth.webp`, were removed. Both pages preload the Libre Caslon headline font so headings don't visibly swap. The smallest UI text (eyebrow labels, dock labels) is 12px.

Save buttons keep one accessible name ("Save Song Jukebox"); `aria-pressed` tells screen readers whether it's saved.

## Maintenance

Source: `index.html`, `studio.css`, `studio.js`, `qr-brand.js`, `sw.js`. New links are `.card` elements with `data-url`, `data-title`, `data-category`, `.card-main`, `.card-title`, `.card-sub`, and a `.card-icon` SVG. Category must match the containing `data-section`.

Existing storage keys remain unchanged. Favorites order is insertion order in the existing saved-links array. Unknown destinations are ignored. Add moved addresses to MOVED to preserve favorites/history.

The service-worker cache is v27; dashboard CSS and JS use query version 19, card CSS and JS use version 5, and `qr-brand.js` uses version 2. Update cache and asset references together. Preserve the `heartstrings-dashboard-` cache prefix, `/dashboard/` manifest scope, and separate navigation cache keys for the dashboard and business card.

Business-card contacts live in `card.js`'s CONTACT object and `card.html`'s contact rows. Its JPEG and WebP banner assets should stay in sync when changed.
