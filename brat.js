import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_PATH  = join(__dirname, 'fonts', 'ArialNarrow.ttf');
const FONT_URL   = 'https://github.com/gbif/analytics/raw/master/fonts/Arial%20Narrow.ttf';
const FONT_ALIAS = 'BratNarrow';

const EMOJI_RE = /(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*|[\u{1F1E0}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3/gu;


const DEFAULT_CFG = {
  W: 1024, H: 1024,
  BOX_W: 1024, BOX_H: 1024,
  BOX_PAD: 48,         
  LINE_H: 1.08,      
  BASELINE_ADJ: 0.75,  
  FS_MIN: 8,
  FS_MAX: 360,         
  BLUR: 2,             
  C_BG:   '#ffffff',
  C_BOX:  '#ffffff',
  C_TEXT: '#000000',
};

//
const THEMES = {
  brat:       { C_BG: '#ffffff', C_BOX: '#ffffff', C_TEXT: '#000000' },
  white:      { C_BG: '#ffffff', C_BOX: '#ffffff', C_TEXT: '#000000' },
  black:      { C_BG: '#000000', C_BOX: '#000000', C_TEXT: '#ffffff' },
  charcoal:   { C_BG: '#36454f', C_BOX: '#36454f', C_TEXT: '#ffffff' },
  neon:       { C_BG: '#39ff14', C_BOX: '#39ff14', C_TEXT: '#000000' },
  pink:       { C_BG: '#ff69b4', C_BOX: '#ff69b4', C_TEXT: '#ffffff' },
  purple:     { C_BG: '#6a0dad', C_BOX: '#6a0dad', C_TEXT: '#ffffff' },
  navy:       { C_BG: '#001f3f', C_BOX: '#001f3f', C_TEXT: '#ffffff' },
  crimson:    { C_BG: '#dc143c', C_BOX: '#dc143c', C_TEXT: '#ffffff' },
  gold:       { C_BG: '#ffd700', C_BOX: '#ffd700', C_TEXT: '#000000' },
  midnight:   { C_BG: '#191970', C_BOX: '#191970', C_TEXT: '#ffffff' },
  coral:      { C_BG: '#ff6b6b', C_BOX: '#ff6b6b', C_TEXT: '#ffffff' },
  teal:       { C_BG: '#008080', C_BOX: '#008080', C_TEXT: '#ffffff' },
  orange:     { C_BG: '#ff6600', C_BOX: '#ff6600', C_TEXT: '#ffffff' },
  lavender:   { C_BG: '#e6e6fa', C_BOX: '#e6e6fa', C_TEXT: '#000000' },
};

let fontLoaded = false;

async function ensureFont() {
  if (fontLoaded) return;
  await mkdir(join(__dirname, 'fonts'), { recursive: true });
  if (!existsSync(FONT_PATH)) {
    const res = await axios.get(FONT_URL, { responseType: 'arraybuffer', timeout: 25000 });
    await writeFile(FONT_PATH, Buffer.from(res.data));
  }
  GlobalFonts.registerFromPath(FONT_PATH, FONT_ALIAS);
  fontLoaded = true;
}


function fontStr(size) {
  const family = GlobalFonts.has(FONT_ALIAS)
    ? `"${FONT_ALIAS}", Arial Narrow, Arial, sans-serif`
    : 'Arial Narrow, Arial, sans-serif';
  return `400 ${size}px ${family}`;
}


function emojiCodepoint(emoji) {
  const pts = [];
  let i = 0;
  while (i < emoji.length) {
    const cp = emoji.codePointAt(i);
    if (cp !== undefined && cp !== 0xFE0F && cp !== 0x200D)
      pts.push(cp.toString(16).toLowerCase());
    i += (cp !== undefined && cp > 0xFFFF) ? 2 : 1;
  }
  return pts.join('-');
}

const imgCache = new Map();

async function fetchEmoji(emoji) {
  const key = emojiCodepoint(emoji);
  if (imgCache.has(key)) return imgCache.get(key);

  const urls = [
    `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-160/${key}.png`,
    `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/${key}.png`,
    `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=apple`,
    `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${key}.png`,
  ];

  for (const url of urls) {
    try {
      const img = await loadImage(url);
      if (img && img.width > 0) { imgCache.set(key, img); return img; }
    } catch {}
  }
  imgCache.set(key, null);
  return null;
}

function getSegments(text) {
  const segs = [];
  const re   = new RegExp(EMOJI_RE.source, 'gu');
  let last   = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    // karakter teks sebelum emoji → satu-per-satu (seperti image.js)
    for (const ch of text.slice(last, m.index)) segs.push({ type: 'text', value: ch });
    segs.push({ type: 'emoji', value: m[0] });
    last = m.index + m[0].length;
  }
  for (const ch of text.slice(last)) segs.push({ type: 'text', value: ch });
  return segs;
}

async function preloadEmojis(segs) {
  const uniq = [...new Set(segs.filter(s => s.type === 'emoji').map(s => s.value))];
  await Promise.all(uniq.map(e => fetchEmoji(e)));
}

function splitWords(segs) {
  const words = [];
  let cur = [];
  for (const seg of segs) {
    if (seg.type === 'text' && seg.value === ' ') {
      if (cur.length) { words.push([...cur]); cur.length = 0; }
    } else {
      cur.push(seg);
    }
  }
  if (cur.length) words.push(cur);
  return words;
}

function measureWord(ctx, wordSegs, emojiSz) {
  let w = 0, run = '';
  for (const seg of wordSegs) {
    if (seg.type === 'emoji') {
      if (run) { w += ctx.measureText(run).width; run = ''; }
      w += emojiSz;
    } else {
      run += seg.value;
    }
  }
  if (run) w += ctx.measureText(run).width;
  return w;
}

function wrapLines(ctx, segs, maxW, fs, emojiSz) {
  ctx.font      = fontStr(fs);
  const spaceW  = ctx.measureText(' ').width;
  const words   = splitWords(segs);
  const lines   = [];
  let curLine   = [], curWidth = 0;

  for (const word of words) {
    const ww = measureWord(ctx, word, emojiSz);
    if (curLine.length === 0) {
      curLine.push(word); curWidth = ww;
    } else if (curWidth + spaceW + ww <= maxW) {
      curLine.push(word); curWidth += spaceW + ww;
    } else {
      lines.push(curLine); curLine = [word]; curWidth = ww;
    }
  }
  if (curLine.length) lines.push(curLine);
  return lines;
}


function fitFontSize(ctx, segs, maxW, maxH, cfg) {
  let lo = cfg.FS_MIN, hi = cfg.FS_MAX, best = lo;

  while (lo <= hi) {
    const mid    = (lo + hi) >> 1;
    const eSz    = mid * 1.2;                  
    ctx.font     = fontStr(mid);
    const spaceW = ctx.measureText(' ').width;
    const lines  = wrapLines(ctx, segs, maxW, mid, eSz);
    const totalH = lines.length * mid * cfg.LINE_H;
    let maxLW    = 0;

    for (const line of lines) {
      const lw = line.reduce((s, w, i) =>
        s + measureWord(ctx, w, eSz) + (i ? spaceW : 0), 0);
      if (lw > maxLW) maxLW = lw;
    }

    if (maxLW <= maxW && totalH <= maxH) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

function drawJustifiedLine(ctx, lineWords, x, lineWidth, y, fs, emojiSz) {
  if (!lineWords.length) return;
  ctx.font = fontStr(fs);

  const wordWidths = lineWords.map(w => measureWord(ctx, w, emojiSz));
  const totalW     = wordWidths.reduce((a, b) => a + b, 0);
  // Justifikasi: distribute sisa ruang antar kata (kecuali 1 kata = gap 0)
  const gap        = lineWords.length > 1
    ? (lineWidth - totalW) / (lineWords.length - 1)
    : 0;

  let curX = x;
  for (let i = 0; i < lineWords.length; i++) {
    let run = '', startX = curX;
    for (const seg of lineWords[i]) {
      if (seg.type === 'emoji') {
        if (run) { ctx.fillText(run, startX, y); startX += ctx.measureText(run).width; run = ''; }
        const img = imgCache.get(emojiCodepoint(seg.value));
        if (img) {
          ctx.drawImage(img, startX, y - fs + fs * 0.1, emojiSz, emojiSz);
        } else {
          ctx.fillText(seg.value, startX, y);
        }
        startX += emojiSz;
      } else {
        run += seg.value;
      }
    }
    if (run) ctx.fillText(run, startX, y);
    curX += wordWidths[i] + gap;
  }
}

export async function generateBrat(teks, options = {}) {
  await ensureFont();

  const input = String(teks || '').trim().replace(/\s+/g, ' ');
  if (!input) throw new Error('Teks kosong');
  const themeColors = options.theme
    ? (THEMES[options.theme] ?? (() => { throw new Error(`Unknown theme: ${options.theme}. Available: ${Object.keys(THEMES).join(', ')}`); })())
    : {};
  const cfg = { ...DEFAULT_CFG, ...themeColors, ...options };

  const { W, H, BOX_W, BOX_H, BOX_PAD, LINE_H, BASELINE_ADJ, BLUR, C_BG, C_BOX, C_TEXT } = cfg;


  const bx  = (W - BOX_W) / 2;
  const by  = (H - BOX_H) / 2;
  const txW = BOX_W - BOX_PAD * 2;  // lebar area teks
  const txH = BOX_H - BOX_PAD * 2;  // tinggi area teks

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C_BOX;
  ctx.fillRect(bx, by, BOX_W, BOX_H);

  
  const segs = getSegments(input);
  await preloadEmojis(segs);

  if (!segs.length) return canvas.toBuffer('image/png');


  const fontSize = fitFontSize(ctx, segs, txW, txH, cfg);
  const emojiSz  = fontSize * 1.2;                  
  const lineH    = fontSize * LINE_H;               
  const lines    = wrapLines(ctx, segs, txW, fontSize, emojiSz);

  const startY = by  + BOX_PAD + fontSize * BASELINE_ADJ;
  const lineX  = bx  + BOX_PAD;

  
  ctx.save();
  ctx.filter       = `blur(${BLUR}px)`;
  ctx.fillStyle    = C_TEXT;
  ctx.textBaseline = 'alphabetic';  
  ctx.font         = fontStr(fontSize);

  for (let i = 0; i < lines.length; i++) {
    drawJustifiedLine(
      ctx, lines[i], lineX, txW,
      startY + i * lineH,
      fontSize, emojiSz
    );
  }
  ctx.restore();

  return canvas.toBuffer('image/png');
}