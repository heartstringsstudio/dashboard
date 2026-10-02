"use strict";
const $ = (id) => document.getElementById(id);
// Destinations that changed address, so saved links and recents survive the move.
const MOVED = new Map([
  [
    "https://heartstringsstudio.github.io/heartstringsstudio/",
    "https://tinyurl.com/heartstringswv",
  ],
]);
// Five studio ads are live at a time. The card lists every ad oldest first,
// so a new ad is one new row: the newest is featured in the spotlight (when
// its data-url is "newest"), the next four stay on the card to share, and
// older rows retire. The card's own link follows its newest remaining ad, and
// a favorite saved under any other ad moves to it.
const ADS_LIVE = 5;
let newestAd = null;
document.querySelectorAll(".card[data-ads]").forEach((card) => {
  const rows = [...card.querySelectorAll(".card-variants li")];
  const newest = rows.at(-1);
  if (!newest) return;
  const featured = document.getElementById("spotlight")?.dataset.url === "newest";
  newestAd ||= {
    url: newest.querySelector("a").getAttribute("href"),
    name: newest
      .querySelector(".variant-share")
      .dataset.title.replace(/^Heartstrings Studio — /, ""),
    week: newest.dataset.week || "",
  };
  const shown = rows.slice(-ADS_LIVE, featured ? -1 : undefined);
  if (!shown.length) {
    card.remove();
    return;
  }
  rows.filter((row) => !shown.includes(row)).forEach((row) => row.remove());
  const url = shown.at(-1).querySelector("a").getAttribute("href");
  [card.dataset.url, ...rows.map((row) => row.querySelector("a").href)]
    .filter((old) => old !== url)
    .forEach((old) => MOVED.set(old, url));
  card.dataset.url = url;
  card.querySelector(".card-main").href = url;
});
document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  const note = document.createElement("span");
  note.className = "sr-only";
  note.textContent = " (opens in a new tab)";
  link.append(note);
});
const cards = [...document.querySelectorAll(".card[data-url]")];
const catalog = new Map(cards.map((card) => [card.dataset.url, card]));
const RECENT_KEY = "heartstrings_dashboard_recent_links";
const SAVED_KEY = "heartstrings_dashboard_saved_links";
const INSTALL_KEY = "heartstrings_dashboard_install_dismissed";
function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function knownURLs(value) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((url) => typeof url === "string")
            .map((url) => MOVED.get(url) ?? url)
            .filter((url) => catalog.has(url)),
        ),
      ]
    : [];
}
let saved = new Set(knownURLs(readStore(SAVED_KEY, [])));
let recent = readStore(RECENT_KEY, []);
recent = Array.isArray(recent)
  ? knownURLs(
      recent.map((item) => (typeof item === "string" ? item : item?.url)),
    ).slice(0, 3)
  : [];
let activeFilter = "all";
let toastTimer;
function showToast(message) {
  const dialogStatus = document.querySelector("dialog[open] .dialog-status");
  if (dialogStatus) {
    dialogStatus.textContent = message;
    return;
  }
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
function labelFor(card) {
  return card.querySelector(".card-title").textContent.trim();
}
function quickLink(url, kind) {
  const card = catalog.get(url);
  const item = document.createElement("div");
  item.className = "quick-card";
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.innerHTML = icon(kind);
  const label = document.createElement("span");
  label.textContent = labelFor(card);
  const note = document.createElement("span");
  note.className = "sr-only";
  note.textContent = " (opens in a new tab)";
  link.append(label, note);
  link.addEventListener("click", () => remember(url));
  const share = document.createElement("button");
  share.type = "button";
  share.className = "quiet-button";
  share.innerHTML = icon("share") + "Share";
  share.setAttribute(
    "aria-label",
    `Share ${labelFor(card)} from ${kind === "star" ? "favorites" : "recent links"}`,
  );
  share.addEventListener("click", () => {
    shareLink(url, card.dataset.title, share);
    remember(url);
  });
  item.append(link, share);
  return item;
}
function renderRecent() {
  // Keep nodes stable while the share sheet is open, so focus can return.
  const existing = [...$("recentCards").children];
  recent.forEach((url) => {
    const item =
      existing.find((node) => node.dataset.url === url) ||
      quickLink(url, "clock");
    item.dataset.url = url;
    $("recentCards").append(item);
  });
  existing
    .filter((node) => !recent.includes(node.dataset.url))
    .forEach((node) => node.remove());
  if (!recent.length) {
    const note = document.createElement("p");
    note.className = "recent-placeholder";
    note.textContent = "The links you open and share will appear here.";
    $("recentCards").replaceChildren(note);
  }
  $("recentSection").hidden = activeFilter !== "all";
}
function renderFavorites() {
  const existing = [...$("favoriteCards").children];
  [...saved].forEach((url) => {
    const item =
      existing.find((node) => node.dataset.url === url) ||
      quickLink(url, "star");
    item.dataset.url = url;
    $("favoriteCards").append(item);
  });
  existing
    .filter((node) => !saved.has(node.dataset.url))
    .forEach((node) => node.remove());
  $("favoritesHint").hidden = saved.size > 0;
  $("orderFavorites").hidden = saved.size < 2;
  $("favoritesSection").hidden = activeFilter !== "all" || saved.size === 0;
}
function renderFavoriteOrder(focusURL, direction) {
  $("favoritesOrder").replaceChildren();
  const urls = [...saved];
  urls.forEach((url, index) => {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = labelFor(catalog.get(url));
    row.append(name);
    [-1, 1].forEach((offset) => {
      const button = document.createElement("button");
      button.className = "icon-button";
      button.type = "button";
      button.textContent = offset < 0 ? "↑" : "↓";
      button.dataset.url = url;
      button.dataset.direction = offset;
      button.setAttribute(
        "aria-label",
        `Move ${name.textContent} ${offset < 0 ? "up" : "down"}`,
      );
      button.disabled = index + offset < 0 || index + offset >= urls.length;
      button.addEventListener("click", () => {
        const next = [...saved];
        [next[index], next[index + offset]] = [
          next[index + offset],
          next[index],
        ];
        saved = new Set(next);
        const persisted = writeStore(SAVED_KEY, next);
        renderFavorites();
        renderFavoriteOrder(url, offset);
        showToast(
          persisted
            ? `${name.textContent} moved ${offset < 0 ? "up" : "down"}.`
            : "Order changed for this visit. Device storage is unavailable.",
        );
      });
      row.append(button);
    });
    $("favoritesOrder").append(row);
  });
  if (focusURL) {
    const candidates = [
      ...$("favoritesOrder").querySelectorAll("button"),
    ].filter((button) => button.dataset.url === focusURL && !button.disabled);
    (
      candidates.find(
        (button) => button.dataset.direction === String(direction),
      ) || candidates[0]
    )?.focus();
  }
}
function remember(url) {
  recent = [url, ...recent.filter((item) => item !== url)].slice(0, 3);
  writeStore(
    RECENT_KEY,
    recent.map((item) => ({
      url: item,
      title: catalog.get(item).dataset.title,
      label: labelFor(catalog.get(item)),
    })),
  );
  renderRecent();
}
function matchesCard(card, filter) {
  return (
    filter === "all" ||
    (filter === "saved"
      ? saved.has(card.dataset.url)
      : card.dataset.category === filter)
  );
}
function applyFilters() {
  let count = 0;
  cards.forEach((card) => {
    card.hidden = !matchesCard(card, activeFilter);
    if (!card.hidden) count++;
  });
  document.querySelectorAll("[data-section]").forEach((section) => {
    const visible = [...section.querySelectorAll(".card")].filter(
      (card) => !card.hidden,
    ).length;
    section.hidden = visible === 0;
    section.querySelector(".section-count").textContent = String(visible);
  });
  $("resultCount").textContent = `${count} ${count === 1 ? "link" : "links"}`;
  $("savedCount").textContent = saved.size;
  $("dockSavedCount").textContent = saved.size || "";
  $("favoritesSection").hidden = activeFilter !== "all" || saved.size === 0;
  $("emptyState").hidden = count > 0;
  const noSaved = activeFilter === "saved" && saved.size === 0;
  $("emptyTitle").textContent = noSaved
    ? "Your favorites belong here."
    : "No links found";
  $("emptyCopy").textContent = noSaved
    ? "Tap the star on any link to save it on this device."
    : "Choose another category or show all links.";
  $("recentSection").hidden = activeFilter !== "all";
}
function syncSaved() {
  cards.forEach((card) => {
    const isSaved = saved.has(card.dataset.url);
    const button = card.querySelector(".save-btn");
    button.setAttribute("aria-pressed", String(isSaved));
    button.title = isSaved ? "Remove from saved" : "Save on this device";
  });
  renderFavorites();
  applyFilters();
}
async function copyLink(url, done = "Link copied") {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
    await navigator.clipboard.writeText(url);
    showToast(done);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    field.readOnly = true;
    field.style.cssText = "position:fixed;opacity:0;left:0;top:0";
    const focused = document.activeElement;
    (document.querySelector("dialog[open]") || document.body).append(field);
    field.select();
    let success = false;
    try {
      success = document.execCommand("copy");
    } catch {}
    field.remove();
    focused?.focus();
    showToast(
      success ? done : "Could not copy. Open the link to copy its address.",
    );
    return success;
  }
}
// A warm line travels with every share so the link never arrives bare.
const SHARE_TEXT = {
  listen: "Take a listen. Heartstrings Studio turns real stories into songs.",
  studio:
    "Heartstrings Studio: your story, turned into a song you'll never forget.",
  extras: "Something good from Heartstrings Studio in Lumberport, WV.",
  card: "Save my card: Heartstrings Studio, custom songs from Lumberport, WV.",
};
function shareTextFor(url) {
  if (spotlight && url === spotlight.url) return spotlight.text;
  const card =
    catalog.get(url) ||
    [...document.querySelectorAll(".variant-share")]
      .find((button) => button.dataset.url === url)
      ?.closest(".card");
  return (
    card?.dataset.shareText ||
    SHARE_TEXT[card?.dataset.category] ||
    SHARE_TEXT.card
  );
}
let shareURL = "";
let shareTitle = "";
function showShareOptions(url, title, trigger) {
  shareURL = url;
  shareTitle = title;
  $("shareTitle").textContent = title.replace(/^Heartstrings Studio — /, "");
  $("shareUrl").value = url;
  openDialog($("shareDialog"), trigger);
}
async function shareLink(url, title, trigger) {
  const origin = trigger || document.activeElement;
  if (!navigator.share) {
    showShareOptions(url, title, origin);
    return;
  }
  try {
    await navigator.share({ title, text: shareTextFor(url), url });
  } catch (error) {
    if (error.name !== "AbortError") showShareOptions(url, title, origin);
  }
}
let qrURL = "";
let qrLabel = "";
let dialogTrigger = null;
function openDialog(dialog, trigger) {
  const current = document.querySelector("dialog[open]");
  const rootTrigger = dialogTrigger || trigger || document.activeElement;
  if (current && current !== dialog) {
    // A replacement shares one history entry and one focus-return target.
    current._replacing = true;
    current.close();
  }
  dialogTrigger = rootTrigger;
  dialog.querySelector(".dialog-status")?.replaceChildren();
  dialog.showModal();
  document.body.style.overflow = "hidden";
  if (history.state?.studioDialog)
    history.replaceState({ studioDialog: dialog.id }, "");
  else history.pushState({ studioDialog: dialog.id }, "");
  dialog.querySelector("[data-close]")?.focus();
}
function closeDialog(dialog) {
  if (!dialog.open) return;
  if (history.state?.studioDialog === dialog.id) history.back();
  else dialog.close();
}
function showQR(url, label, trigger) {
  if (typeof QRCode === "undefined") {
    showToast("QR tool unavailable. Use Share to send this link.");
    return;
  }
  qrURL = url;
  qrLabel = label;
  try {
    QRBrand.render($("qrCode"), qrURL);
  } catch {
    showToast("Could not create QR code. Use Share to send this link.");
    return;
  }
  $("qrTitle").textContent = qrLabel;
  $("qrUrl").textContent = qrURL.replace(/^https?:\/\//, "");
  openDialog($("qrDialog"), trigger);
}
cards.forEach((card) => {
  const actions = document.createElement("div");
  actions.className = "card-actions";
  const actionsSpec = [
    ["share", "Share", "share"],
    ["qr", "QR", "qr"],
    ["star", "", "save"],
  ];
  actionsSpec.forEach(([symbol, text, action]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-btn ${action}-btn`;
    button.innerHTML = icon(symbol) + (text ? `<span>${text}</span>` : "");
    button.setAttribute(
      "aria-label",
      `${action === "qr" ? "Show QR code for" : action === "save" ? "Save" : "Share"} ${labelFor(card)}`,
    );
    button.addEventListener("click", () => {
      const url = card.dataset.url;
      if (action === "save") {
        const wasSaved = saved.has(url);
        wasSaved ? saved.delete(url) : saved.add(url);
        const persisted = writeStore(SAVED_KEY, [...saved]);
        syncSaved();
        card.classList.remove("saving");
        requestAnimationFrame(() => card.classList.add("saving"));
        if (card.hidden)
          [...document.querySelectorAll('[data-filter="saved"]')]
            .find((button) => button.getClientRects().length)
            ?.focus();
        showToast(
          persisted
            ? wasSaved
              ? "Removed from saved"
              : "Saved on this device"
            : "Updated for this visit. Device storage is unavailable.",
        );
      } else {
        remember(url);
        if (action === "share") shareLink(url, card.dataset.title, button);
        if (action === "qr") showQR(url, labelFor(card), button);
      }
    });
    actions.append(button);
  });
  card.append(actions);
  card
    .querySelector(".card-main")
    .addEventListener("click", () => remember(card.dataset.url));
});
// Cards with several versions (the studio ads) play or share each one;
// recents and favorites still track the card by its own link.
document.querySelectorAll(".card-variants li").forEach((row) => {
  const card = row.closest(".card");
  const share = row.querySelector(".variant-share");
  row
    .querySelector("a")
    .addEventListener("click", () => remember(card.dataset.url));
  share.addEventListener("click", () => {
    remember(card.dataset.url);
    shareLink(share.dataset.url, share.dataset.title, share);
  });
});
// A card with several versions shows one at a time: a tab per version,
// newest selected, so the list never grows the card as ads are added.
document.querySelectorAll(".card-variants").forEach((list, n) => {
  const rows = [...list.children];
  if (rows.length < 2) return;
  const tabs = document.createElement("div");
  tabs.className = "variant-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", list.getAttribute("aria-label") || "Versions");
  const buttons = rows.map((row, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = `variant-tab-${n}-${i}`;
    button.setAttribute("role", "tab");
    button.textContent = row.querySelector("a span").textContent;
    row.id = `variant-panel-${n}-${i}`;
    row.setAttribute("role", "tabpanel");
    row.setAttribute("aria-labelledby", button.id);
    button.setAttribute("aria-controls", row.id);
    button.addEventListener("click", () => select(i));
    button.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      const to =
        event.key === "Home" ? 0
        : event.key === "End" ? rows.length - 1
        : step ? (i + step + rows.length) % rows.length
        : -1;
      if (to < 0) return;
      event.preventDefault();
      select(to);
      buttons[to].focus();
    });
    return button;
  });
  function select(active) {
    buttons.forEach((button, i) => {
      const on = i === active;
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = on ? 0 : -1;
      rows[i].hidden = !on;
    });
  }
  tabs.append(...buttons);
  list.setAttribute("role", "presentation");
  list.removeAttribute("aria-label");
  list.before(tabs);
  select(rows.length - 1);
});
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const selected = item.dataset.filter === activeFilter;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document
      .querySelectorAll(".directory-grid .card")
      .forEach((card) =>
        (card.getAnimations?.() || []).forEach((animation) =>
          animation.cancel(),
        ),
      );
    applyFilters();
    if (motionAllowed() && Element.prototype.animate) {
      cards
        .filter((card) => !card.hidden)
        .forEach((card, index) =>
          card.animate(
            [
              { opacity: 0, transform: "translateY(6px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 180,
              delay: Math.min(index * 15, 75),
              easing: "ease-out",
            },
          ),
        );
    }
    if (button.closest(".remote-dock"))
      $("filterBar").scrollIntoView({
        behavior: motionAllowed() ? "smooth" : "instant",
        block: "start",
      });
  }),
);
$("resetFilters").addEventListener("click", () => {
  const allFilter =
    [...document.querySelectorAll('[data-filter="all"]')].find(
      (button) => button.getClientRects().length,
    ) || document.querySelector('[data-filter="all"]');
  allFilter.click();
  allFilter.focus();
});
document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      closeDialog($(button.dataset.close)),
    ),
  );
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeDialog(dialog);
  });
  dialog.addEventListener("close", () => {
    if (dialog._replacing) {
      dialog._replacing = false;
      return;
    }
    document.body.style.overflow = "";
    if (dialogTrigger?.isConnected) dialogTrigger.focus();
    dialogTrigger = null;
  });
});
window.addEventListener("popstate", () =>
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()),
);
$("qrShare").addEventListener("click", () => shareLink(qrURL, qrLabel));
$("qrDownload").addEventListener("click", async () => {
  const canvas = $("qrCode").querySelector("canvas");
  if (!canvas) {
    showToast("QR image is unavailable. Use Share link instead.");
    return;
  }
  try {
    await QRBrand.download(
      canvas,
      { title: qrLabel, url: qrURL },
      `heartstrings-${qrLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`,
    );
    showToast("QR poster download started");
  } catch {
    showToast("Could not save the QR image. Use Share link instead.");
  }
});
// The digital business card shares like any other link, but it sits above
// the directory and is never filtered away.
const SITE_BASE =
  document.querySelector('meta[property="og:url"]')?.content || location.href;
const CARD_PAGE = new URL("card.html", SITE_BASE).href;
const CARD_TITLE = "Heartstrings Studio \u2014 Digital Business Card";
$("cardShare").addEventListener("click", (event) =>
  shareLink(CARD_PAGE, CARD_TITLE, event.currentTarget),
);
$("cardQR").addEventListener("click", (event) =>
  showQR(CARD_PAGE, "Digital Business Card", event.currentTarget),
);
// Song of the Week lives in the #spotlight element's data attributes so a
// weekly update is one edit. After two weeks it stops claiming "this week".
// data-kind="ad" turns it into a studio-ad spotlight: Watch instead of Listen.
const SPOTLIGHT_FRESH_DAYS = 13;
let spotlight = null;
function setupSpotlight(now = new Date()) {
  const section = $("spotlight");
  // data-url="newest" features the newest studio ad, named and dated by its row.
  if (section.dataset.url === "newest") {
    if (!newestAd) return;
    Object.assign(section.dataset, {
      url: newestAd.url,
      song: section.dataset.song || newestAd.name,
      week: section.dataset.week || newestAd.week,
      kind: "ad",
    });
  }
  const { url, song, note, week, kind } = section.dataset;
  if (!url || !song || !/^https:\/\//.test(url)) return;
  const ad = kind === "ad";
  const [year, month, day] = (week || "").split("-").map(Number);
  const start = year ? new Date(year, month - 1, day) : null;
  const age = start ? (now - start) / 86400000 : Infinity;
  const fresh = age >= 0 && age <= SPOTLIGHT_FRESH_DAYS;
  const verb = ad ? "Watch" : "Listen";
  spotlight = {
    url,
    title: `${song} \u2014 Heartstrings Studio`,
    text: ad
      ? `${fresh ? "New from" : "From"} Heartstrings Studio: real stories, turned into songs. Give it a watch.`
      : fresh
        ? `New this week from Heartstrings Studio: ${song}. Take a listen.`
        : `${song}, from Heartstrings Studio. Take a listen.`,
  };
  const date = start
    ?.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  $("spotlightLabel").textContent = ad
    ? fresh
      ? `NEW STUDIO AD \u00b7 ${date}`
      : "FEATURED AD"
    : fresh
      ? `SONG OF THE WEEK \u00b7 ${date}`
      : "FEATURED SONG";
  $("spotlightSong").textContent = song;
  $("spotlightNote").textContent = note || "";
  $("spotlightNote").hidden = !note;
  $("spotlightListen").href = url;
  $("spotlightAction").textContent = verb;
  $("spotlightIcon").setAttribute("href", ad ? "#i-play" : "#i-headphones");
  $("spotlightListen").setAttribute(
    "aria-label",
    `${verb} ${song} (opens in a new tab)`,
  );
  $("spotlightShare").setAttribute("aria-label", `Share ${song}`);
  $("spotlightQR").setAttribute("aria-label", `Show QR code for ${song}`);
  section.hidden = false;
}
setupSpotlight();
$("spotlightShare").addEventListener("click", (event) =>
  shareLink(spotlight.url, spotlight.title, event.currentTarget),
);
$("spotlightQR").addEventListener("click", (event) =>
  showQR(spotlight.url, $("spotlightSong").textContent, event.currentTarget),
);
let installPrompt;
const standalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone;
const installDismissed = readStore(INSTALL_KEY, false);
$("pwa-hint").hidden = standalone || Boolean(installDismissed);
if (/iPad|iPhone|iPod/.test(navigator.userAgent))
  $("pwaCopy").textContent = "Tap Share in Safari, then Add to Home Screen.";
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("installBtn").hidden = false;
  $("pwaCopy").textContent =
    "Install for quick access. The link list stays available offline. Destinations require internet.";
});
$("installBtn").addEventListener("click", async () => {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") $("pwa-hint").hidden = true;
  } catch {
    showToast("Use your browser menu to add the app to your home screen.");
  } finally {
    installPrompt = null;
    $("installBtn").hidden = true;
  }
});
$("pwaDismiss").addEventListener("click", () => {
  $("pwa-hint").hidden = true;
  writeStore(INSTALL_KEY, true);
});
window.addEventListener("appinstalled", () => {
  $("pwa-hint").hidden = true;
  writeStore(INSTALL_KEY, true);
});
window.addEventListener("storage", (event) => {
  if (event.key === SAVED_KEY || event.key === null) {
    saved = new Set(knownURLs(readStore(SAVED_KEY, [])));
    syncSaved();
    if ($("favoritesDialog").open) renderFavoriteOrder();
  }
});
// Local preferences enhance the ordinary links without requiring an account.
const SETTINGS_KEY = "heartstrings_dashboard_console_settings";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function validSettings(value) {
  const settings = value && typeof value === "object" ? value : {};
  return {
    motion: typeof settings.motion === "boolean" ? settings.motion : true,
    compact: typeof settings.compact === "boolean" ? settings.compact : true,
  };
}
let settings = validSettings(readStore(SETTINGS_KEY, {}));
function motionAllowed() {
  return settings.motion && !reducedMotion.matches;
}
function applySettings() {
  document.documentElement.classList.toggle("motion-off", !motionAllowed());
  document.body.classList.toggle("motion-off", !motionAllowed());
  document.body.classList.toggle("compact", settings.compact);
  $("motionToggle").setAttribute("aria-pressed", String(motionAllowed()));
  $("motionToggle").setAttribute(
    "aria-disabled",
    String(reducedMotion.matches),
  );
  $("motionToggle").title = reducedMotion.matches
    ? "Motion is off to match your device accessibility setting"
    : "Toggle dashboard animations";
  $("compactToggle").setAttribute("aria-pressed", String(settings.compact));
}
function saveSettings() {
  if (!writeStore(SETTINGS_KEY, settings))
    showToast("Adjusted for this visit. Device storage is unavailable.");
}
$("motionToggle").addEventListener("click", () => {
  if (reducedMotion.matches) {
    showToast("Motion is off to match your device accessibility setting.");
    return;
  }
  settings.motion = !settings.motion;
  applySettings();
  saveSettings();
});
$("compactToggle").addEventListener("click", () => {
  settings.compact = !settings.compact;
  applySettings();
  saveSettings();
});
reducedMotion.addEventListener("change", applySettings);
window.addEventListener("storage", (event) => {
  if (event.key === SETTINGS_KEY || event.key === null) {
    settings = validSettings(readStore(SETTINGS_KEY, {}));
    applySettings();
  }
});
applySettings();
document
  .querySelectorAll("#appearanceButton, .console-settings, .remote-dock")
  .forEach((element) => {
    element.hidden = false;
  });
$("appearanceButton").addEventListener("click", (event) =>
  openDialog($("appearanceDialog"), event.currentTarget),
);
$("orderFavorites").addEventListener("click", (event) => {
  renderFavoriteOrder();
  openDialog($("favoritesDialog"), event.currentTarget);
});
$("shareCopy").addEventListener("click", () => copyLink(shareURL));
$("shareMessage").addEventListener("click", () =>
  copyLink(`${shareTextFor(shareURL)} ${shareURL}`, "Message copied"),
);
$("shareQR").addEventListener("click", () => showQR(shareURL, shareTitle));
$("shareUrl").addEventListener("click", (event) =>
  event.currentTarget.select(),
);
renderRecent();
syncSaved();
// Home-screen shortcuts open straight to a category, e.g. ?filter=saved.
const startFilter = new URLSearchParams(location.search).get("filter");
if (startFilter && startFilter !== "all")
  document
    .querySelector(
      `.directory-filters [data-filter="${CSS.escape(startFilter)}"]`,
    )
    ?.click();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* Links and tools still work without offline installation. */
    });
  });
