/**
 * Generates TestGen logo PNG assets using pngjs
 * Run: node scripts/generateIcons.js
 */
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

// #2360E8
const PRIMARY = [35, 96, 232];

/* ── Geometry helpers ─────────────────────────────────────────── */

function inDoc(x, y, docX, docY, docW, docH, r, fold) {
  if (x < docX || x > docX + docW || y < docY || y > docY + docH) return false;
  // top-left corner
  if (x < docX + r && y < docY + r) {
    const dx = x - (docX + r), dy = y - (docY + r);
    if (dx * dx + dy * dy > r * r) return false;
  }
  // bottom-left corner
  if (x < docX + r && y > docY + docH - r) {
    const dx = x - (docX + r), dy = y - (docY + docH - r);
    if (dx * dx + dy * dy > r * r) return false;
  }
  // bottom-right corner
  if (x > docX + docW - r && y > docY + docH - r) {
    const dx = x - (docX + docW - r), dy = y - (docY + docH - r);
    if (dx * dx + dy * dy > r * r) return false;
  }
  // top-right fold: exclude above the fold diagonal (relX > relY)
  if (x > docX + docW - fold && y < docY + fold) {
    const relX = x - (docX + docW - fold);
    const relY = y - docY;
    if (relX > relY) return false;
  }
  return true;
}

function inFold(x, y, docX, docY, docW, fold) {
  if (x < docX + docW - fold || x > docX + docW || y < docY || y > docY + fold) return false;
  const relX = x - (docX + docW - fold);
  const relY = y - docY;
  return relY >= relX; // lower-left triangle = fold overlay area
}

function inRoundedRect(x, y, rx, ry, rw, rh, rr) {
  if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
  if (x < rx + rr && y < ry + rr) {
    const dx = x - (rx + rr), dy = y - (ry + rr);
    if (dx * dx + dy * dy > rr * rr) return false;
  }
  if (x > rx + rw - rr && y < ry + rr) {
    const dx = x - (rx + rw - rr), dy = y - (ry + rr);
    if (dx * dx + dy * dy > rr * rr) return false;
  }
  if (x < rx + rr && y > ry + rh - rr) {
    const dx = x - (rx + rr), dy = y - (ry + rh - rr);
    if (dx * dx + dy * dy > rr * rr) return false;
  }
  if (x > rx + rw - rr && y > ry + rh - rr) {
    const dx = x - (rx + rw - rr), dy = y - (ry + rh - rr);
    if (dx * dx + dy * dy > rr * rr) return false;
  }
  return true;
}

/* ── Compositing ─────────────────────────────────────────────── */

function over(src, dst) {
  // src/dst: [r, g, b, a] in [0,1]
  const a = src[3] + dst[3] * (1 - src[3]);
  if (a < 1e-6) return [0, 0, 0, 0];
  return [
    (src[0] * src[3] + dst[0] * dst[3] * (1 - src[3])) / a,
    (src[1] * src[3] + dst[1] * dst[3] * (1 - src[3])) / a,
    (src[2] * src[3] + dst[2] * dst[3] * (1 - src[3])) / a,
    a,
  ];
}

/* ── Logo generator ──────────────────────────────────────────── */

function createLogoPNG(size, bgHex = null, mono = false) {
  const SS = 3; // 3×3 supersampling
  const png = new PNG({ width: size, height: size, filterType: -1 });

  const pad = size * 0.1;
  const docX = pad;
  const docY = pad * 0.9;
  const docW = size - pad * 2;
  const docH = size - pad * 1.8;
  const r = size * 0.1;
  const fold = size * 0.22;
  const lh = size * 0.085;
  const lr = lh / 2;
  const lx = docX + docW * 0.18;
  const ly1 = docY + docH * 0.5;
  const lw1 = docW * 0.63;
  const ly2 = docY + docH * 0.66;
  const lw2 = docW * 0.43;

  // Background
  let bg = [0, 0, 0, 0];
  if (bgHex) {
    bg = [
      parseInt(bgHex.slice(1, 3), 16) / 255,
      parseInt(bgHex.slice(3, 5), 16) / 255,
      parseInt(bgHex.slice(5, 7), 16) / 255,
      1,
    ];
  }

  const docColor = mono
    ? [1, 1, 1]
    : [PRIMARY[0] / 255, PRIMARY[1] / 255, PRIMARY[2] / 255];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let docC = 0, foldC = 0, line1C = 0, line2C = 0;
      const total = SS * SS;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          if (inDoc(x, y, docX, docY, docW, docH, r, fold)) docC++;
          if (!mono && inFold(x, y, docX, docY, docW, fold)) foldC++;
          if (inRoundedRect(x, y, lx, ly1, lw1, lh, lr)) line1C++;
          if (inRoundedRect(x, y, lx, ly2, lw2, lh, lr)) line2C++;
        }
      }

      // Composite layers
      let pixel = [...bg];
      if (docC > 0) {
        pixel = over([docColor[0], docColor[1], docColor[2], docC / total], pixel);
      }
      if (foldC > 0) {
        pixel = over([1, 1, 1, (foldC / total) * 0.28], pixel);
      }
      if (line1C > 0) {
        const lineColor = mono ? [0, 0, 0] : [1, 1, 1];
        const lineAlpha = mono ? (line1C / total) * 0.3 : line1C / total;
        pixel = over([lineColor[0], lineColor[1], lineColor[2], lineAlpha], pixel);
      }
      if (line2C > 0) {
        const lineColor = mono ? [0, 0, 0] : [1, 1, 1];
        const lineAlpha = mono ? (line2C / total) * 0.3 : line2C / total;
        pixel = over([lineColor[0], lineColor[1], lineColor[2], lineAlpha], pixel);
      }

      const idx = (py * size + px) * 4;
      png.data[idx]     = Math.round(pixel[0] * 255);
      png.data[idx + 1] = Math.round(pixel[1] * 255);
      png.data[idx + 2] = Math.round(pixel[2] * 255);
      png.data[idx + 3] = Math.round(pixel[3] * 255);
    }
  }

  return png;
}

function solidPNG(size, hex) {
  const png = new PNG({ width: size, height: size, filterType: -1 });
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < size * size * 4; i += 4) {
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
  }
  return png;
}

/* ── Generate all assets ─────────────────────────────────────── */

function save(png, name) {
  const out = path.join(ASSETS, name);
  fs.writeFileSync(out, PNG.sync.write(png));
  console.log(`✓ ${name}`);
}

console.log('Generating TestGen icon assets...\n');

save(createLogoPNG(1024),               'icon.png');
save(createLogoPNG(512, '#FAF8F5'),     'splash-icon.png');
save(createLogoPNG(64),                 'favicon.png');
save(createLogoPNG(1024),              'android-icon-foreground.png');
save(solidPNG(1024, '#2360E8'),         'android-icon-background.png');
save(createLogoPNG(1024, null, true),   'android-icon-monochrome.png');

console.log('\nDone.');
