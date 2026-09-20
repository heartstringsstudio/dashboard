# Heartstrings personal link-sharing dashboard

Updated September 20, 2026.

## Purpose

This app is Tim's personal utility for sharing existing links. It is not a sales page. The public GitHub Pages hosting and access settings are unchanged; "personal" describes the intended use, not authentication or private hosting.

The interface opens directly to search and category filters. Removed the promotional hero, destination-selector panel, pricing dialog, sales copy, song-intake CTAs, and Story Room destination. The remaining 12 destinations retain their metadata. Main Studio Site now points at tinyurl.com/heartstringswv, matching the business card and its banner; the other 11 URLs are unchanged.

Copy is the first and most prominent action on every card, followed by Share, QR, and Save. Ordinary card links still open the destination in a new tab.

## Digital business card

`card.html` is a standalone, shareable business card for the studio at `/dashboard/card.html`. The studio's brand banner (`assets/studio-card-banner.webp`) runs full-bleed across the top, cancelling the card padding with negative margins and holding its 1672x941 ratio. Below it sit the studio name, the tagline "Your story, turned into a song you'll never forget.", "Rooted in Lumberport, West Virginia", five contact rows (phone, email, main site via tinyurl.com/heartstringswv to match the banner, jukebox, YouTube), an always-visible QR code of the card's own address, and buttons for Save contact (a vCard 3.0 `.vcf` built in the browser), Share card, Copy link, and Save QR image. It has its own `card.css` and `card.js` so the page loads without the dashboard's stylesheet or directory script.

The phone row is first and links to `tel:+13046771113` while displaying 304-677-1113. The banner's baked-in text is repeated as real text below it, so nothing on the card depends on reading the image.

The card carries no funeral home partner row; that destination remains in the dashboard directory, which still holds 12 links.

Link previews use `assets/studio-card-banner.jpg`, a JPEG copy of the banner, with `twitter:card` set to `summary_large_image`. The JPEG exists because WebP previews are unreliable across social platforms; both copies must be updated together if the banner changes.

A `.card-band` section sits first inside `<main>`, above the directory, with a copper metal edge and a warmer surface so it reads as separate from the link cards. Its Copy, Share, and QR actions reuse the dashboard's existing `copyLink`, `shareLink`, and `showQR` helpers; `showQR` now takes a URL and label instead of a card element. The band is not a `.card[data-url]`, so it is never filtered, counted, saved, or added to recents, and the directory still holds exactly 12 links.

Shared addresses come from each page's `og:url` meta rather than `location`, so a local preview still copies and encodes the published URL. Recently used links, favorites, QR downloads, native sharing/copy fallback, install support, and the synchronized floating category dock remain available.

Copper surfaces and tactile feedback remain. Appearance controls are inside a collapsed native details panel. Control glow affects the navigation dock and focused cards. Compact view is the default for new settings; explicit existing preferences are respected. Motion respects the device's reduced-motion preference. Removed all obsolete hero/remote/pricing JavaScript and styles. Studio artwork is no longer loaded or precached.

## Validation

JavaScript syntax and whitespace checks pass. An isolated jsdom harness verifies 12 retained URLs, absence of promotional and Story Room UI, copy-first controls, search/filter intersections, dock synchronization, saving/unsaving, clipboard and recent-link tracking, QR opening, appearance controls, removal of obsolete Story Room favorites/history, unavailable storage, reduced motion, unique IDs, SVG references, and local assets.

The business card was verified in headless Chromium against a local server: 37 checks covering band placement above the directory, distinct band styling, the unchanged 12-link count, clipboard contents, QR dialog contents for both the band and an ordinary card, band visibility under every filter, contact rows and `rel=noopener`, vCard structure and CRLF line endings, both downloads, and the absence of console errors or horizontal overflow at 390px. A separate service-worker run confirms that `card.html` and `index.html` each serve their own page offline.

A further 31 checks cover the banner: that it decodes at full resolution, bleeds to the card's padding box, sits above the contact rows, and carries alt text; that the tagline and Lumberport line match the brand reference; that the phone row is first and dials the right number; that no funeral home URL, wording, or icon remains on the page or in the vCard; that the vCard carries `TEL` and the Lumberport address; and that the JPEG preview image is served. Contact values were checked for mid-word wrapping at 390px, 360px, and 320px.

No real-device verification is claimed.

## Maintenance

Source: index.html, studio.css, studio.js, card.html, card.css, card.js. No build step or runtime package dependency. Add .card elements with data-url, data-title, data-category, .card-main, .card-title, .card-sub, and a .card-icon SVG. Category must match the containing data-section.

Storage keys remain unchanged. Unknown/removed destinations are ignored when reading favorites and recents. When a destination changes address, add the old URL to the `MOVED` map in studio.js so existing favorites and recents carry over instead of being silently dropped; `knownURLs` rewrites through that map before filtering, and the next save writes the new URL back to storage. The v16 service-worker cache and CSS/JS query versions move together. Preserve the heartstrings-dashboard- cache prefix and /dashboard/ manifest scope; do not clear other apps' caches. Navigations are cached under their own request URL; caching every navigation under index.html would let the card page overwrite the dashboard's offline shell.

Business-card contact details live in one place per file: the `CONTACT` object in card.js for the vCard, and the `.contact-list` rows in card.html for the visible card. Changing the phone number means editing both, and the number appears in `tel:` link form as well as display form.
