"use strict";
// Branded QR codes shared by the dashboard and the business card. Codes use
// high error correction so the heart logo can sit in the middle and still
// scan; saved images are 1080×1350 posters ready to print or post.
const QRBrand = (() => {
  const SIZE = 464;
  const POSTER = { width: 1080, height: 1350 };
  const INK = "#21170f";
  let logo;

  function loadLogo() {
    logo ||= new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = "logo.png";
    });
    return logo;
  }

  function render(element, text) {
    element.replaceChildren();
    element.classList.add("qr-branded");
    new QRCode(element, {
      text,
      width: SIZE,
      height: SIZE,
      colorDark: INK,
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    return element.querySelector("canvas");
  }

  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function fitLines(context, text, maxWidth, maxLines) {
    const lines = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] += "…";
    }
    return lines;
  }

  async function poster(qrCanvas, { title, url }) {
    const [image] = await Promise.all([
      loadLogo(),
      Promise.all([
        document.fonts?.load('64px "Libre Caslon"'),
        document.fonts?.load('600 30px "DM Sans"'),
      ]).catch(() => undefined),
    ]);
    const { width, height } = POSTER;
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const context = output.getContext("2d");

    const glow = context.createRadialGradient(540, 420, 60, 540, 520, 900);
    glow.addColorStop(0, "#2b221c");
    glow.addColorStop(1, "#141110");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    const copper = context.createLinearGradient(0, 0, width, 0);
    copper.addColorStop(0, "#c18c66");
    copper.addColorStop(0.48, "#e8bf9a");
    copper.addColorStop(1, "#cf9b75");
    context.strokeStyle = copper;
    context.lineWidth = 3;
    roundRect(context, 36, 36, width - 72, height - 72, 36);
    context.stroke();

    context.textAlign = "center";
    context.fillStyle = "#ddb08c";
    context.font = '600 30px "DM Sans", system-ui, sans-serif';
    context.letterSpacing = "6px";
    context.fillText("HEARTSTRINGS STUDIO", width / 2, 132);
    context.letterSpacing = "0px";

    // White panel keeps the quiet zone scanners need.
    const panel = 720;
    const panelX = (width - panel) / 2;
    const panelY = 180;
    context.fillStyle = "#ffffff";
    roundRect(context, panelX, panelY, panel, panel, 32);
    context.fill();
    const code = panel - 96;
    context.imageSmoothingEnabled = false;
    context.drawImage(qrCanvas, panelX + 48, panelY + 48, code, code);
    context.imageSmoothingEnabled = true;
    if (image) {
      const badge = Math.round(code * 0.22);
      const badgeX = width / 2 - badge / 2;
      const badgeY = panelY + panel / 2 - badge / 2;
      context.fillStyle = "#ffffff";
      roundRect(context, badgeX, badgeY, badge, badge, badge * 0.18);
      context.fill();
      const inset = badge * 0.06;
      context.drawImage(
        image,
        badgeX - inset,
        badgeY - inset,
        badge + inset * 2,
        badge + inset * 2,
      );
    }

    context.fillStyle = "#f4eee7";
    context.font = '400 64px "Libre Caslon", Georgia, serif';
    const lines = fitLines(context, title, width - 200, 2);
    lines.forEach((line, index) =>
      context.fillText(line, width / 2, 1000 + index * 74),
    );
    const after = 1000 + (lines.length - 1) * 74;
    context.fillStyle = "#b5aaa0";
    context.font = '400 32px "DM Sans", system-ui, sans-serif';
    context.fillText("Scan with your phone camera", width / 2, after + 72);
    context.fillStyle = "#ddb08c";
    context.font = '500 28px "DM Sans", system-ui, sans-serif';
    const shortURL = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    context.fillText(
      fitLines(context, shortURL, width - 200, 1)[0],
      width / 2,
      after + 124,
    );
    context.fillStyle = "#f4eee7";
    context.font = 'italic 400 34px "Libre Caslon", Georgia, serif';
    context.globalAlpha = 0.8;
    context.fillText(
      "Your story, turned into a song you’ll never forget.",
      width / 2,
      height - 110,
    );
    context.globalAlpha = 1;
    return output;
  }

  async function download(qrCanvas, details, filename) {
    const output = await poster(qrCanvas, details);
    const link = document.createElement("a");
    link.href = output.toDataURL("image/png");
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  }

  return { render, download };
})();
