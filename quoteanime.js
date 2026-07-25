// src/canvas/quoteanime.js
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS_DIR = join(process.cwd(), 'storage', 'assets', 'quoteanime');
const FONTS_DIR = join(ASSETS_DIR, 'fonts');
const OUTPUT_DIR = join(process.cwd(), 'storage', '.tmp');

const BACKGROUNDS = {
  1: {
    name: 'l',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/L.png',
    textZone: { x: 775, y: 56, w: 456, h: 1102 },
    usernameZone: { x: 890, y: 1167, w: 228, h: 50 },
    usernameFontSize: 28
  },
  2: {
    name: 'gojo',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/gok.png',
    textZone: { x: 755, y: 68, w: 466, h: 1027 },
    usernameZone: { x: 863, y: 1108, w: 249, h: 50 },
    usernameFontSize: 28
  },
  3: {
    name: 'yuji',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/cc.png',
    textZone: { x: 35, y: 68, w: 466, h: 1027 },
    usernameZone: { x: 133, y: 1108, w: 249, h: 50 },
    usernameFontSize: 28
  },
  4: {
    name: 'denji',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/denji.png',
    textZone: { x: 655, y: 68, w: 512, h: 1083 },
    usernameZone: { x: 795, y: 1152, w: 249, h: 50 },
    usernameFontSize: 28
  },
  5: {
    name: 'thorfin',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/thorfin.png',
    textZone: { x: 65, y: 54, w: 489, h: 992 },
    usernameZone: { x: 162, y: 1042, w: 249, h: 50 },
    usernameFontSize: 28
  },
  6: {
    name: 'naruto',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/Naruto.png',
    textZone: { x: 40, y: 56, w: 481, h: 1065 },
    usernameZone: { x: 170, y: 1126, w: 228, h: 50 },
    usernameFontSize: 28
  },
  7: {
    name: 'light',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/LIghtyagami.png',
    textZone: { x: 38, y: 56, w: 493, h: 941 },
    usernameZone: { x: 170, y: 1025, w: 228, h: 50 },
    usernameFontSize: 28
  },
  8: {
    name: 'higuruma',
    url: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/qca/higuruma.png',
    textZone: { x: 755, y: 68, w: 424, h: 920 },
    usernameZone: { x: 840, y: 993, w: 249, h: 50 },
    usernameFontSize: 28
  }
};

const TEXT_STYLE = {
  fontWeight: 400,
  fontFamily: 'arialn, sans-serif',
  color: '#111111',
  align: 'justify',
  initialSize: 75,
  minFontSize: 24
};

const USERNAME_STYLE = {
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  color: '#121212',
  align: 'left',
  gap: 40
};

const CANVAS_SIZE = { width: 1254, height: 1254 };

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) throw new Error(`Gagal download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function wrapText(ctx, text, maxWidth) {
  const out = [];
  text.split('\n').forEach(p => {
    let cur = '';
    p.split(' ').forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxWidth && cur) { out.push(cur); cur = w; }
      else cur = t;
    });
    out.push(cur);
  });
  return out;
}

function fitTextInZone(ctx, text, zone, opts) {
  const { fontWeight, fontFamily, initialSize, minSize = 10, step = 2 } = opts;
  let fontSize = initialSize;
  let lines, lh;

  while (fontSize >= minSize) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    lines = wrapText(ctx, text, zone.w);
    lh = fontSize * 1.2;
    if (lines.length * lh <= zone.h) break;
    fontSize -= step;
  }
  if (fontSize < minSize) {
    fontSize = minSize;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    lines = wrapText(ctx, text, zone.w);
    lh = fontSize * 1.2;
  }
  return { fontSize, lines, lh };
}

function drawJustifiedLine(ctx, line, x, y, targetWidth) {
  const words = line.split(' ');
  if (words.length === 1) {
    ctx.textAlign = 'center';
    ctx.fillText(line, x + targetWidth / 2, y);
    return;
  }
  const wordWidths = words.map(w => ctx.measureText(w).width);
  const totalWordsWidth = wordWidths.reduce((a, b) => a + b, 0);
  const spaceWidth = (targetWidth - totalWordsWidth) / (words.length - 1);

  ctx.textAlign = 'left';
  let cx = x;
  words.forEach((w, i) => {
    ctx.fillText(w, cx, y);
    cx += wordWidths[i] + spaceWidth;
  });
}

function drawQuoteText(ctx, text, zone, opts) {
  const { fontSize, lines, lh } = fitTextInZone(ctx, text, zone, opts);
  ctx.font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;

  ctx.save();
  ctx.beginPath();
  ctx.rect(zone.x, zone.y, zone.w, zone.h);
  ctx.clip();
  const startY = zone.y + zone.h / 2 - (lines.length * lh) / 2 + lh / 2;

  if (opts.align === 'justify') {
    lines.forEach((l, i) => {
      const y = startY + i * lh;
      const isLastLine = i === lines.length - 1;
      if (isLastLine) {
        ctx.textAlign = 'center';
        ctx.fillText(l, zone.x + zone.w / 2, y);
      } else {
        drawJustifiedLine(ctx, l, zone.x, y, zone.w);
      }
    });
  } else {
    const drawX = opts.align === 'center' ? zone.x + zone.w / 2 : opts.align === 'right' ? zone.x + zone.w : zone.x;
    ctx.textAlign = opts.align;
    lines.forEach((l, i) => ctx.fillText(l, drawX, startY + i * lh));
  }
  ctx.restore();

  return startY + (lines.length - 1) * lh + lh / 2;
}

function drawUsernameText(ctx, text, x, y, opts, fontSize, maxWidth) {
  ctx.font = `${opts.fontWeight} ${fontSize}px ${opts.fontFamily}`;
  ctx.textAlign = 'center';
  const lh = fontSize * 1.2;
  const lines = wrapText(ctx, text, maxWidth);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
}

export async function generateQuoteAnime(text, username, bgId = null) {
  const bgKeys = Object.keys(BACKGROUNDS);
  const selectedKey = bgId && BACKGROUNDS[bgId] ? bgId : bgKeys[Math.floor(Math.random() * bgKeys.length)];
  const bg = BACKGROUNDS[selectedKey];
  if (!bg) throw new Error('Background tidak ditemukan');

  const fontQuoteLocal = join(FONTS_DIR, 'ARIALN.ttf');
  if (!existsSync(fontQuoteLocal)) {
    await mkdir(FONTS_DIR, { recursive: true });
    await writeFile(fontQuoteLocal, await download('https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Font/ARIALN.ttf'));
  }
  GlobalFonts.registerFromPath(fontQuoteLocal, 'arialn');

  const fontUsernameLocal = join(FONTS_DIR, 'Inter-Medium.woff2');
  if (!existsSync(fontUsernameLocal)) {
    await writeFile(fontUsernameLocal, await download('https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Medium.woff2'));
  }
  GlobalFonts.registerFromPath(fontUsernameLocal, 'Inter');

  const bgLocal = join(ASSETS_DIR, `${bg.name}.png`);
  if (!existsSync(bgLocal)) {
    await mkdir(ASSETS_DIR, { recursive: true });
    await writeFile(bgLocal, await download(bg.url));
  }

  const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
  const ctx = canvas.getContext('2d');

  const bgImg = await loadImage(bgLocal);
  ctx.drawImage(bgImg, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);

  ctx.save();
  ctx.fillStyle = TEXT_STYLE.color;
  ctx.textBaseline = 'middle';
  const quoteEndY = drawQuoteText(ctx, text, bg.textZone, TEXT_STYLE);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = USERNAME_STYLE.color;
  ctx.textBaseline = 'middle';
  const usernameX = bg.textZone.x + bg.textZone.w / 2;
  const usernameY = quoteEndY + USERNAME_STYLE.gap;
  drawUsernameText(ctx, username || '-', usernameX, usernameY, USERNAME_STYLE, bg.usernameFontSize, bg.textZone.w);
  ctx.restore();

  const pngData = await canvas.encode('png');
  await mkdir(OUTPUT_DIR, { recursive: true });
  return pngData;
}