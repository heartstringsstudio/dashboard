"use strict";
const $ = (id) => document.getElementById(id);
const cards = [...document.querySelectorAll(".card[data-url]")];
const catalog = new Map(cards.map((card) => [card.dataset.url, card]));
// Destinations that changed address, so saved links and recents survive the move.
const MOVED = new Map([
  [
    "https://heartstringsstudio.github.io/heartstringsstudio/",
    "https://tinyurl.com/heartstringswv",
  ],
]);
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
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
function labelFor(card) {
  return card.querySelector(".card-title").textContent.trim();
}
function renderRecent() {
  $("recentCards").replaceChildren();
  recent.forEach((url) => {
    const card = catalog.get(url);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = icon("clock");
    link.append(document.createTextNode(labelFor(card)));
    link.addEventListener("click", () => remember(url));
    $("recentCards").append(link);
  });
  $("recentSection").hidden =
    !recent.length || activeFilter !== "all";
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
    section.querySelector(".section-count").textContent = String(
      visible,
    ).padStart(2, "0");
  });
  $("resultCount").textContent = `${count} ${count === 1 ? "link" : "links"}`;
  $("savedCount").textContent = saved.size;
  $("emptyState").hidden = count > 0;
  const noSaved = activeFilter === "saved" && saved.size === 0;
  $("emptyTitle").textContent = noSaved
    ? "Your favorites belong here."
    : "No links found";
  $("emptyCopy").textContent = noSaved
    ? "Tap the star on any link to save it on this device."
    : "Choose another category or show all links.";
  $("recentSection").hidden =
    !recent.length || activeFilter !== "all";
}
function syncSaved() {
  cards.forEach((card) => {
    const isSaved = saved.has(card.dataset.url);
    const button = card.querySelector(".save-btn");
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute(
      "aria-label",
      `${isSaved ? "Unsave" : "Save"} ${labelFor(card)}`,
    );
    button.title = isSaved ? "Remove from saved" : "Save on this device";
  });
  applyFilters();
}
async function copyLink(url) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
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
      success
        ? "Link copied"
        : "Could not copy. Open the link to copy its address.",
    );
    return success;
  }
}
async function shareLink(url, title) {
  if (!navigator.share) {
    await copyLink(url);
    return;
  }
  try {
    await navigator.share({ title, url });
  } catch (error) {
    if (error.name !== "AbortError") await copyLink(url);
  }
}
let qrURL = "";
let qrLabel = "";
let dialogTrigger = null;
function openDialog(dialog, trigger) {
  dialogTrigger = trigger || document.activeElement;
  dialog.showModal();
  document.body.style.overflow = "hidden";
  history.pushState({ studioDialog: dialog.id }, "");
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
  $("qrCode").replaceChildren();
  try {
    new QRCode($("qrCode"), {
      text: qrURL,
      width: 464,
      height: 464,
      colorDark: "#21170f",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
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
          document.querySelector('[data-filter="saved"]').focus();
        showToast(
          persisted
            ? wasSaved
              ? "Removed from saved"
              : "Saved on this device"
            : "Updated for this visit. Device storage is unavailable.",
        );
      } else {
        remember(url);
        if (action === "share") shareLink(url, card.dataset.title);
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
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const selected = item.dataset.filter === activeFilter;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    applyFilters();
    if (button.closest(".remote-dock"))
      $("directory").scrollIntoView({
        behavior: motionAllowed() ? "smooth" : "instant",
        block: "start",
      });
  }),
);
$("resetFilters").addEventListener("click", () => {
  const allFilter = document.querySelector('[data-filter="all"]');
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
    document.body.style.overflow = "";
    if (dialogTrigger?.isConnected) dialogTrigger.focus();
    dialogTrigger = null;
  });
});
window.addEventListener("popstate", () =>
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()),
);
$("qrShare").addEventListener("click", () => shareLink(qrURL, qrLabel));
$("qrDownload").addEventListener("click", () => {
  const canvas = $("qrCode").querySelector("canvas");
  if (!canvas) {
    showToast("QR image is unavailable. Use Share link instead.");
    return;
  }
  // Include a white quiet zone in the downloaded PNG for reliable scanning.
  const output = document.createElement("canvas");
  output.width = output.height = 528;
  const context = output.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 528, 528);
  context.drawImage(canvas, 32, 32);
  const link = document.createElement("a");
  link.href = output.toDataURL("image/png");
  link.download = `heartstrings-${qrLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`;
  document.body.append(link);
  link.click();
  link.remove();
  showToast("QR image download started");
});
// The digital business card shares like any other link, but it sits above
// the directory and is never filtered away.
const SITE_BASE =
  document.querySelector('meta[property="og:url"]')?.content || location.href;
const CARD_PAGE = new URL("card.html", SITE_BASE).href;
const CARD_TITLE = "Heartstrings Studio \u2014 Digital Business Card";
$("cardCopy").addEventListener("click", () => copyLink(CARD_PAGE));
$("cardShare").addEventListener("click", () => shareLink(CARD_PAGE, CARD_TITLE));
$("cardQR").addEventListener("click", (event) =>
  showQR(CARD_PAGE, "Digital Business Card", event.currentTarget),
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
  if (event.key === SAVED_KEY) {
    saved = new Set(knownURLs(readStore(SAVED_KEY, [])));
    syncSaved();
  }
});
// Local preferences enhance the ordinary links without requiring an account.
const SETTINGS_KEY = "heartstrings_dashboard_console_settings";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function validSettings(value) {
  const settings = value && typeof value === "object" ? value : {};
  return {
    glow:
      typeof settings.glow === "number" && Number.isFinite(settings.glow)
        ? Math.max(0, Math.min(100, settings.glow))
        : 35,
    motion: typeof settings.motion === "boolean" ? settings.motion : true,
    compact: typeof settings.compact === "boolean" ? settings.compact : true,
  };
}
let settings = validSettings(readStore(SETTINGS_KEY, {}));
function motionAllowed() {
  return settings.motion && !reducedMotion.matches;
}
function applySettings() {
  document.documentElement.style.setProperty(
    "--glow",
    String(settings.glow / 100),
  );
  document.documentElement.classList.toggle("motion-off", !motionAllowed());
  document.body.classList.toggle("motion-off", !motionAllowed());
  document.body.classList.toggle("compact", settings.compact);
  $("glowRange").value = settings.glow;
  $("glowValue").textContent = `${settings.glow}%`;
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
$("glowRange").addEventListener("input", () => {
  settings.glow = Number($("glowRange").value);
  applySettings();
});
$("glowRange").addEventListener("change", saveSettings);
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
  .querySelectorAll(".appearance-settings, .console-settings, .remote-dock")
  .forEach((element) => {
    element.hidden = false;
  });
renderRecent();
syncSaved();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* Links and tools still work without offline installation. */
    });
  });

