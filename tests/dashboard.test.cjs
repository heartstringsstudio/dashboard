const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { JSDOM } = require("jsdom");
const root = resolve(__dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const js = readFileSync(resolve(root, "studio.js"), "utf8");
const qrBrand = readFileSync(resolve(root, "qr-brand.js"), "utf8");
const savedKey = "heartstrings_dashboard_saved_links";
const settingsKey = "heartstrings_dashboard_console_settings";
const main = "https://tinyurl.com/heartstringswv";
const jukebox = "https://tinyurl.com/hsjukebox";
const partner = "https://tinyurl.com/heartstringsfh";
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
function setup(t, options = {}) {
  const dom = new JSDOM(options.html || html, {
    url: options.url || "https://heartstringsstudio.github.io/dashboard/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  t.after(() => dom.window.close());
  const w = dom.window,
    d = w.document;
  const errors = [];
  w.addEventListener("error", (e) => errors.push(e.error));
  t.after(() => assert.deepEqual(errors, [], "No application errors"));
  w.matchMedia = (query) => ({
    matches: query.includes("reduced-motion") && !!options.reduced,
    addEventListener() {},
  });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.getClientRects = function () {
    return [1];
  };
  let animations = 0;
  w.Element.prototype.getAnimations = () => [];
  w.Element.prototype.animate = () => {
    animations++;
    return { cancel() {} };
  };
  // jsdom has no dialog renderer: model only lifecycle, history and focus.
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    w.setTimeout(() => this.dispatchEvent(new w.Event("close")), 0);
  };
  const qrCalls = [];
  const qrLevels = [];
  w.QRCode = function (element, data) {
    qrCalls.push(data.text);
    qrLevels.push(data.correctLevel);
    element.append(d.createElement("canvas"));
  };
  w.QRCode.CorrectLevel = { M: 0, H: 2 };
  let copied;
  Object.defineProperty(w.navigator, "clipboard", {
    value: {
      writeText: async (text) => {
        copied = text;
      },
    },
  });
  if (options.share) w.navigator.share = options.share;
  for (const [key, value] of Object.entries(options.storage || {}))
    w.localStorage.setItem(key, value);
  if (options.storageBlocked)
    Object.defineProperty(w, "localStorage", {
      get() {
        throw Error("Blocked");
      },
    });
  // Separate <script> tags share one global scope; one eval models that.
  w.eval(`${qrBrand}\n${js}`);
  return {
    w,
    d,
    qrCalls,
    qrLevels,
    copied: () => copied,
    animations: () => animations,
    click: (selector) => {
      const el = d.querySelector(selector);
      assert.ok(el, selector);
      el.click();
    },
    visible: () =>
      [...d.querySelectorAll(".card[data-url]")].filter((c) => !c.hidden),
  };
}
test("retains 13 working destinations and valid local assets, labels and unique IDs", (t) => {
  const { d, visible } = setup(t);
  assert.equal(visible().length, 13);
  const ids = [...d.querySelectorAll("[id]")].map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const el of d.querySelectorAll("[aria-labelledby],[aria-describedby]")) {
    for (const key of ["aria-labelledby", "aria-describedby"])
      for (const id of (el.getAttribute(key) || "").split(" ").filter(Boolean))
        assert.ok(d.getElementById(id), id);
  }
  for (const el of d.querySelectorAll("script[src],img[src],link[href]")) {
    const src = el.getAttribute("src") || el.getAttribute("href");
    if (!/^https?:/.test(src))
      assert.ok(existsSync(resolve(root, src.split("?")[0])), src);
  }
  for (const a of d.querySelectorAll(".card-main")) {
    assert.ok(a.href.startsWith("https://"));
    assert.equal(a.rel, "noopener");
  }
  assert.equal(d.querySelectorAll(".card .share-btn").length, 13);
  assert.equal(d.querySelector("#favoritesSection").hidden, true);
});
test("desktop and dock filters synchronize, including empty saved state and reset", (t) => {
  const app = setup(t);
  for (const [filter, count] of [
    ["listen", 8],
    ["studio", 2],
    ["extras", 3],
    ["saved", 0],
    ["all", 13],
  ]) {
    app.click(`.remote-dock [data-filter="${filter}"]`);
    assert.equal(app.visible().length, count);
    assert.equal(
      app.d
        .querySelector(`.directory-filters [data-filter="${filter}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      app.d.querySelector("#resultCount").textContent,
      `${count} links`,
    );
  }
  app.click('[data-filter="saved"]');
  assert.equal(app.d.querySelector("#emptyState").hidden, false);
  app.click("#resetFilters");
  assert.equal(app.visible().length, 13);
});
test("favorites migrate old addresses, reorder, persist and synchronize between tabs", (t) => {
  const app = setup(t, {
    storage: {
      [savedKey]: JSON.stringify([
        "https://heartstringsstudio.github.io/heartstringsstudio/",
        jukebox,
        "https://invalid.test",
      ]),
    },
  });
  const order = () =>
    [...app.d.querySelectorAll("#favoriteCards .quick-card")].map(
      (n) => n.dataset.url,
    );
  assert.deepEqual(order(), [main, jukebox]);
  app.click("#orderFavorites");
  app.click("#favoritesOrder li:first-child button:last-child");
  assert.deepEqual(order(), [jukebox, main]);
  assert.deepEqual(JSON.parse(app.w.localStorage.getItem(savedKey)), [
    jukebox,
    main,
  ]);
  assert.equal(
    app.d.activeElement.getAttribute("aria-label"),
    "Move Main Studio Site up",
  );
  assert.match(
    app.d.querySelector("#favoritesDialog .dialog-status").textContent,
    /moved down/,
  );
  app.w.localStorage.setItem(savedKey, JSON.stringify([partner]));
  app.w.dispatchEvent(new app.w.StorageEvent("storage", { key: savedKey }));
  assert.deepEqual(order(), [partner]);
  assert.equal(app.d.querySelector("#dockSavedCount").textContent, "1");
});
test("share fallback copies correct URL and keeps feedback inside the modal", async (t) => {
  const app = setup(t);
  app.click(".card .share-btn");
  assert.equal(app.d.querySelector("#shareDialog").open, true);
  assert.equal(app.d.querySelector("#shareUrl").value, main);
  app.click("#shareCopy");
  await tick();
  assert.equal(app.copied(), main);
  assert.equal(
    app.d.querySelector("#shareDialog .dialog-status").textContent,
    "Link copied",
  );
  assert.equal(app.d.querySelector("#recentCards a").href, main);
  assert.ok(app.d.querySelector("#recentCards button"));
});
test("share → QR → share uses one history entry, closes on Back and restores focus", async (t) => {
  const app = setup(t);
  const trigger = app.d.querySelector(".card .share-btn");
  trigger.focus();
  trigger.click();
  const length = app.w.history.length;
  app.click("#shareQR");
  await tick();
  assert.equal(app.d.querySelectorAll("dialog[open]").length, 1);
  assert.equal(app.d.querySelector("#qrDialog").open, true);
  assert.equal(app.qrCalls.at(-1), main);
  assert.equal(app.w.history.length, length);
  app.click("#qrShare");
  await tick();
  assert.equal(app.d.querySelector("#shareDialog").open, true);
  app.click('[data-close="shareDialog"]');
  await tick();
  await tick();
  assert.equal(app.d.querySelectorAll("dialog[open]").length, 0);
  assert.equal(app.d.activeElement, trigger);
  assert.equal(app.d.body.style.overflow, "");
});
test("recent share retains its focus-return target when recency changes", async (t) => {
  const app = setup(t, {
    storage: {
      heartstrings_dashboard_recent_links: JSON.stringify([main, jukebox]),
    },
  });
  const trigger = app.d.querySelectorAll("#recentCards button")[1];
  trigger.focus();
  trigger.click();
  assert.equal(
    app.d.querySelector("#recentCards .quick-card").dataset.url,
    jukebox,
  );
  app.click('[data-close="shareDialog"]');
  await tick();
  await tick();
  assert.equal(app.d.activeElement, trigger);
});
test("native share receives canonical business-card URL; cancellation is quiet", async (t) => {
  const calls = [];
  const app = setup(t, {
    share: async (data) => {
      calls.push(data);
      throw Object.assign(Error("cancel"), { name: "AbortError" });
    },
  });
  app.click("#cardShare");
  await tick();
  assert.equal(
    calls[0].url,
    "https://heartstringsstudio.github.io/dashboard/card.html",
  );
  assert.match(calls[0].text, /Save my card/);
  assert.equal(app.d.querySelectorAll("dialog[open]").length, 0);
});
test("native share failure opens fallback rather than silently copying", async (t) => {
  const app = setup(t, {
    share: async () => {
      throw Error("Unavailable");
    },
  });
  app.click("#cardShare");
  await tick();
  assert.equal(app.d.querySelector("#shareDialog").open, true);
  assert.equal(app.copied(), undefined);
});
test("blocked storage and corrupt preferences preserve usable links", (t) => {
  const app = setup(t, { storageBlocked: true });
  app.click(".save-btn");
  assert.equal(app.d.querySelector("#favoritesSection").hidden, false);
  assert.match(app.d.querySelector("#toast").textContent, /this visit/);
  assert.equal(app.visible().length, 13);
  const corrupt = setup(t, {
    storage: { [savedKey]: "bad-json", [settingsKey]: "null" },
  });
  assert.equal(corrupt.visible().length, 13);
});
test("reduced motion disables filter animation and appearance setting persists", (t) => {
  const app = setup(t, { reduced: true });
  app.click('[data-filter="listen"]');
  assert.equal(app.animations(), 0);
  assert.ok(app.d.body.classList.contains("motion-off"));
  app.click("#appearanceButton");
  app.click("#compactToggle");
  assert.equal(
    JSON.parse(app.w.localStorage.getItem(settingsKey)).compact,
    false,
  );
  assert.equal(app.d.querySelector("#appearanceDialog").open, true);
});
test("cache manifest includes versioned assets and retained business card files", () => {
  const sw = readFileSync(resolve(root, "sw.js"), "utf8");
  for (const asset of [
    "studio.css?v=15",
    "studio.js?v=15",
    "qr-brand.js?v=1",
    "card.html",
    "card.css?v=4",
    "card.js?v=4",
  ])
    assert.ok(sw.includes(asset), asset);
});

test("business card dials on iOS: no nested auto-link, no icon stealing the tap", () => {
  const cardHtml = readFileSync(resolve(root, "card.html"), "utf8");
  const cardCss = readFileSync(resolve(root, "card.css"), "utf8");
  // iOS auto-links a bare number into an <a href="tel:"> nested inside the
  // row's own link, and the nested link eats the tap.
  assert.match(
    cardHtml,
    /<meta name="format-detection" content="telephone=no"/,
    "card opts out of iOS telephone detection",
  );
  assert.match(cardHtml, /href="tel:\+13046771113"/, "phone row dials E.164");
  // Decorative icons must not absorb the touch instead of the link.
  assert.match(cardCss, /a svg,\s*button svg \{\s*pointer-events: none;/);
  // Rows had a hover state only: a tap looked like nothing happened.
  assert.match(cardCss, /\.contact-list a:active \{/);
  // The stylesheet fix only reaches iPhones if the cached copy is superseded.
  assert.match(cardHtml, /card\.css\?v=4/);
});

test("shares carry a category message, and the fallback copies it with the link", async (t) => {
  const calls = [];
  const native = setup(t, {
    share: async (data) => {
      calls.push(data);
    },
  });
  native.click('[data-url="https://tinyurl.com/hsjukebox"] .share-btn');
  await tick();
  assert.equal(calls[0].url, jukebox);
  assert.match(calls[0].text, /Take a listen/);

  const app = setup(t);
  app.click(".card .share-btn");
  app.click("#shareMessage");
  await tick();
  assert.match(app.copied(), /your story, turned into a song/);
  assert.ok(app.copied().endsWith(` ${main}`));
  assert.equal(
    app.d.querySelector("#shareDialog .dialog-status").textContent,
    "Message copied",
  );
});
test("QR codes use high error correction so the logo badge still scans", (t) => {
  const app = setup(t);
  app.click(".card .qr-btn");
  assert.equal(app.qrCalls.at(-1), main);
  assert.equal(app.qrLevels.at(-1), app.w.QRCode.CorrectLevel.H);
  assert.ok(app.d.querySelector("#qrCode").classList.contains("qr-branded"));
});
test("?filter= opens a category for home-screen shortcuts; unknown values are ignored", (t) => {
  const app = setup(t, {
    url: "https://heartstringsstudio.github.io/dashboard/?filter=listen",
  });
  assert.equal(app.visible().length, 8);
  assert.equal(
    app.d
      .querySelector('.directory-filters [data-filter="listen"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  const junk = setup(t, {
    url: "https://heartstringsstudio.github.io/dashboard/?filter=%22%5D",
  });
  assert.equal(junk.visible().length, 13);
  const manifest = JSON.parse(
    readFileSync(resolve(root, "manifest.json"), "utf8"),
  );
  for (const shortcut of manifest.shortcuts)
    assert.ok(shortcut.url.startsWith(manifest.scope), shortcut.url);
});

function withSpotlight(week, note = "For Mom, from all of us", kind = "") {
  return html.replace(
    /data-url="[^"]*"\s+data-song="[^"]*"\s+data-note="[^"]*"\s+data-week="[^"]*"(\s+data-kind="[^"]*")?/,
    `data-url="https://youtu.be/example" data-song="Porch Light" data-note="${note}" data-week="${week}" data-kind="${kind}"`,
  );
}
function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
test("song of the week stays hidden until a song is set", (t) => {
  const app = setup(t, {
    html: html.replace(
      /(id="spotlight"[\s\S]*?)data-url="[^"]*"/,
      '$1data-url=""',
    ),
  });
  assert.equal(app.d.querySelector("#spotlight").hidden, true);
});
test("the published song of the week is complete and dated", (t) => {
  const app = setup(t);
  const { url, song, week } = app.d.querySelector("#spotlight").dataset;
  assert.match(url, /^https:\/\//);
  assert.ok(song.trim());
  assert.match(week, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(app.d.querySelector("#spotlightSong").textContent, song);
});
test("song of the week shows, shares with a message and makes a QR", async (t) => {
  const calls = [];
  const app = setup(t, {
    html: withSpotlight(isoDaysAgo(1)),
    share: async (data) => {
      calls.push(data);
    },
  });
  const d = app.d;
  assert.equal(d.querySelector("#spotlight").hidden, false);
  assert.equal(d.querySelector("#spotlightSong").textContent, "Porch Light");
  assert.match(
    d.querySelector("#spotlightLabel").textContent,
    /^SONG OF THE WEEK · /,
  );
  assert.equal(
    d.querySelector("#spotlightListen").href,
    "https://youtu.be/example",
  );
  app.click("#spotlightShare");
  await tick();
  assert.equal(calls[0].url, "https://youtu.be/example");
  assert.match(calls[0].text, /New this week.*Porch Light/);
  app.click("#spotlightQR");
  assert.equal(app.qrCalls.at(-1), "https://youtu.be/example");
  assert.equal(app.visible().length, 13, "directory is unchanged");
});
test("an ad spotlight says Watch and shares as an ad", async (t) => {
  const calls = [];
  const app = setup(t, {
    html: withSpotlight(isoDaysAgo(1), "", "ad"),
    share: async (data) => {
      calls.push(data);
    },
  });
  const d = app.d;
  assert.match(d.querySelector("#spotlightLabel").textContent, /^NEW STUDIO AD · /);
  assert.equal(d.querySelector("#spotlightAction").textContent, "Watch");
  assert.equal(d.querySelector("#spotlightIcon").getAttribute("href"), "#i-play");
  app.click("#spotlightShare");
  await tick();
  assert.equal(calls[0].url, "https://youtu.be/example");
  assert.match(calls[0].text, /Give it a watch/);
});
test("a stale ad spotlight becomes a featured ad", (t) => {
  const app = setup(t, { html: withSpotlight(isoDaysAgo(30), "", "ad") });
  assert.equal(
    app.d.querySelector("#spotlightLabel").textContent,
    "FEATURED AD",
  );
});
test("a stale spotlight stops claiming this week", (t) => {
  const app = setup(t, { html: withSpotlight(isoDaysAgo(30), "") });
  assert.equal(
    app.d.querySelector("#spotlightLabel").textContent,
    "FEATURED SONG",
  );
  assert.equal(app.d.querySelector("#spotlightNote").hidden, true);
});
