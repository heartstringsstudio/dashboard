"use strict";
const $ = (id) => document.getElementById(id);
// The shared address comes from the canonical URL so a local preview still
// produces a QR code and a copied link that point at the published card.
const CARD_URL =
  document.querySelector('meta[property="og:url"]')?.content ||
  location.href.split(/[?#]/)[0];
const CARD_TITLE = "Heartstrings Studio";
const CONTACT = {
  name: "Heartstrings Studio",
  role: "Custom Songwriting & Recording",
  phone: "304-677-1113",
  // Phones dial the international form reliably; the card shows the local one.
  phoneDial: "+13046771113",
  email: "heartstringsstudiowv@gmail.com",
  site: "https://tinyurl.com/heartstringswv",
  city: "Lumberport",
  region: "WV",
  note: "Your story, turned into a song you'll never forget. Custom songs for memorials, weddings, birthdays, and milestones.",
};

let toastTimer;
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}

async function copyLink(url) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Unavailable");
    await navigator.clipboard.writeText(url);
    showToast("Card link copied");
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    field.readOnly = true;
    field.style.cssText = "position:fixed;opacity:0;left:0;top:0";
    const focused = document.activeElement;
    document.body.append(field);
    field.select();
    let success = false;
    try {
      success = document.execCommand("copy");
    } catch {}
    field.remove();
    focused?.focus();
    showToast(
      success ? "Card link copied" : "Could not copy. Use the address bar.",
    );
    return success;
  }
}

$("shareCard").addEventListener("click", async () => {
  if (!navigator.share) {
    await copyLink(CARD_URL);
    return;
  }
  try {
    await navigator.share({
      title: CARD_TITLE,
      text: "Save my card: Heartstrings Studio, custom songs from Lumberport, WV.",
      url: CARD_URL,
    });
  } catch (error) {
    if (error.name !== "AbortError") await copyLink(CARD_URL);
  }
});

$("copyCard").addEventListener("click", () => copyLink(CARD_URL));

// vCard 3.0 uses CRLF line breaks; commas and semicolons inside a value
// have to be escaped or phones split the field.
function vcardEscape(value) {
  return String(value).replace(/([\\,;])/g, "\\$1");
}
function buildVCard() {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:;${vcardEscape(CONTACT.name)};;;`,
    `FN:${vcardEscape(CONTACT.name)}`,
    `ORG:${vcardEscape(CONTACT.name)}`,
    `TITLE:${vcardEscape(CONTACT.role)}`,
    `TEL;TYPE=WORK,VOICE:${vcardEscape(CONTACT.phoneDial)}`,
    `EMAIL;TYPE=INTERNET,WORK:${vcardEscape(CONTACT.email)}`,
    `URL:${vcardEscape(CONTACT.site)}`,
    `ADR;TYPE=WORK:;;;${vcardEscape(CONTACT.city)};${vcardEscape(CONTACT.region)};;USA`,
    `NOTE:${vcardEscape(CONTACT.note)}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}
function downloadFile(href, filename, revoke) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 10000);
}
$("saveContact").addEventListener("click", () => {
  try {
    const blob = new Blob([buildVCard()], {
      type: "text/vcard;charset=utf-8",
    });
    downloadFile(URL.createObjectURL(blob), "heartstrings-studio.vcf", true);
    showToast("Contact file downloaded. Open it to add the studio.");
  } catch {
    showToast("Could not build the contact file. Use the email link instead.");
  }
});

// QR code for the card address itself.
if (typeof QRCode === "undefined") {
  $("qrCode").hidden = true;
  $("downloadQR").hidden = true;
} else {
  try {
    QRBrand.render($("qrCode"), CARD_URL);
  } catch {
    $("qrCode").hidden = true;
    $("downloadQR").hidden = true;
  }
}
$("downloadQR").addEventListener("click", async () => {
  const canvas = $("qrCode").querySelector("canvas");
  if (!canvas) {
    showToast("QR image is unavailable. Use Share card instead.");
    return;
  }
  try {
    await QRBrand.download(
      canvas,
      { title: "Digital Business Card", url: CARD_URL },
      "heartstrings-studio-card-qr.png",
    );
    showToast("QR poster download started");
  } catch {
    showToast("Could not save the QR image. Use Share card instead.");
  }
});

if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* The card is plain HTML; it still works without offline caching. */
    });
  });
