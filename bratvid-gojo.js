// src/canvas/bratgojovid.js
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';
import ffmpeg from 'fluent-ffmpeg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ASSETS_DIR = join(__dirname, 'assets', 'bratgojo');
const BG_LOCAL = join(ASSETS_DIR, 'Gojo.jpeg');
const FONT_LOCAL = join(ASSETS_DIR, 'Poppins.ttf');

const BG_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Gojo.jpeg';
const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Poppins.ttf';

const CANVAS_SIZE = { width: 1254, height: 1254 };
const SAFE_ZONE = { a: 660, b: 1180, c: 270, d: 990 };

const TEXT_STYLE = {
  fontFamily: 'Poppins',
  maxFontSize: 90,
  minFontSize: 22,
  lineHeight: 1.18,
  color: '#111111',
  align: 'center'
};

const VIDEO_CONFIG = {
  fps: 24,
  width: 512,
  height: 512,
  lyric: {
    maxWordPerLayer: 5,
    frameDuration: 0.7,
    lastFrameDuration: 1.5
  }
};

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ensureAssets() {
  await mkdir(ASSETS_DIR, { recursive: true });
  if (!existsSync(BG_LOCAL)) {
    await writeFile(BG_LOCAL, await downloadBuffer(BG_URL));
  }
  if (!existsSync(FONT_LOCAL)) {
    await writeFile(FONT_LOCAL, await downloadBuffer(FONT_URL));
  }
  GlobalFonts.registerFromPath(FONT_LOCAL, TEXT_STYLE.fontFamily);
}

function normalizeText(text) {
  return String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function tokenize(text) {
  return normalizeText(text).replace(/[,，]/g, ' ').split(/\s+/).map(v => v.trim()).filter(Boolean);
}

function splitIntoLayers(tokens, maxWordPerLayer) {
  if (!Number.isFinite(maxWordPerLayer) || maxWordPerLayer <= 0) return [tokens];
  const layers = [];
  for (let i = 0; i < tokens.length; i += maxWordPerLayer) {
    layers.push(tokens.slice(i, i + maxWordPerLayer));
  }
  return layers;
}

function resolveDurations(frames, lyric) {
  return frames.map(frame => {
    return frame.isLastInLayer ? Math.max(0.05, lyric.lastFrameDuration) : Math.max(0.05, lyric.frameDuration);
  });
}

function buildRevealFrames(text, config) {
  const tokens = tokenize(text);
  const layers = splitIntoLayers(tokens, config.lyric.maxWordPerLayer);
  const frames = [];
  for (const layer of layers) {
    let current = '';
    for (let i = 0; i < layer.length; i++) {
      current += (current ? ' ' : '') + layer[i];
      frames.push({ text: current, isLastInLayer: i === layer.length - 1 });
    }
  }
  const durations = resolveDurations(frames, config.lyric);
  return frames.map((frame, index) => ({ ...frame, duration: durations[index] }));
}

function getSafeRect(zone) {
  return {
    x: zone.c, y: zone.a,
    w: zone.d - zone.c, h: zone.b - zone.a,
    centerX: (zone.c + zone.d) / 2, centerY: (zone.a + zone.b) / 2
  };
}

function setFont(ctx, size) { ctx.font = `${size}px ${TEXT_STYLE.fontFamily}`; }

function splitLongWord(ctx, word, maxWidth) {
  const chars = [...word];
  const parts = [];
  let current = '';
  for (const char of chars) {
    const test = current + char;
    if (ctx.measureText(test).width <= maxWidth || !current) current = test;
    else { parts.push(current); current = char; }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapParagraph(ctx, paragraph, maxWidth) {
  const words = paragraph.split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) { current = test; continue; }
    if (current) { lines.push(current); current = ''; }
    if (ctx.measureText(word).width <= maxWidth) current = word;
    else {
      const parts = splitLongWord(ctx, word, maxWidth);
      lines.push(...parts.slice(0, -1));
      current = parts.at(-1) || '';
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapText(ctx, text, maxWidth) {
  return text.split('\n').flatMap(paragraph => {
    const clean = paragraph.trim();
    if (!clean) return [''];
    return wrapParagraph(ctx, clean, maxWidth);
  });
}

function fitText(ctx, text, rect) {
  for (let size = TEXT_STYLE.maxFontSize; size >= TEXT_STYLE.minFontSize; size--) {
    setFont(ctx, size);
    const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight);
    const lines = wrapText(ctx, text, rect.w);
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= rect.h) return { size, lines, lineHeight, totalHeight };
  }
  const size = TEXT_STYLE.minFontSize;
  setFont(ctx, size);
  const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight);
  const lines = wrapText(ctx, text, rect.w);
  const maxLines = Math.max(1, Math.floor(rect.h / lineHeight));
  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines && clipped.length) {
    let last = clipped[clipped.length - 1];
    while (last.length > 0 && ctx.measureText(`${last}...`).width > rect.w) last = last.slice(0, -1);
    clipped[clipped.length - 1] = `${last}...`;
  }
  return { size, lines: clipped, lineHeight, totalHeight: clipped.length * lineHeight };
}

function drawCenteredText(ctx, text, zone) {
  const rect = getSafeRect(zone);
  const fitted = fitText(ctx, text, rect);
  const startY = rect.y + (rect.h - fitted.totalHeight) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  setFont(ctx, fitted.size);
  ctx.fillStyle = TEXT_STYLE.color;
  ctx.textAlign = TEXT_STYLE.align;
  ctx.textBaseline = 'top';
  fitted.lines.forEach((line, index) => {
    ctx.fillText(line, rect.centerX, startY + index * fitted.lineHeight);
  });
  ctx.restore();
}

async function createFrame(bgImage, text, filePath) {
  const canvas = createCanvas(CANVAS_SIZE.width, CANVAS_SIZE.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bgImage, 0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
  drawCenteredText(ctx, text, SAFE_ZONE);
  await writeFile(filePath, await canvas.encode('png'));
}

function buildConcatFile(frames, framePaths) {
  let content = '';
  for (let i = 0; i < frames.length; i++) {
    content += `file '${framePaths[i].replace(/'/g, "'\\''")}'\n`;
    content += `duration ${frames[i].duration}\n`;
  }
  content += `file '${framePaths[framePaths.length - 1].replace(/'/g, "'\\''")}'\n`;
  return content;
}

async function convertVideoToWebp(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0'
      ])
      .toFormat('webp')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

export async function generateBratGojoVideo(text) {
  await ensureAssets();
  const inputText = normalizeText(text);
  const frames = buildRevealFrames(inputText, VIDEO_CONFIG);
  if (!frames.length) throw new Error('Teks kosong');

  const tmpDir = join(tmpdir(), `bratgojovid-${crypto.randomBytes(6).toString('hex')}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    const bgImage = await loadImage(BG_LOCAL);
    const framePaths = frames.map((_, i) => join(tmpDir, `frame-${String(i+1).padStart(4,'0')}.png`));

    const batchSize = 5;
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      await Promise.all(batch.map((frame, j) => createFrame(bgImage, frame.text, framePaths[i + j])));
    }

    const concatPath = join(tmpDir, 'concat.txt');
    await writeFile(concatPath, buildConcatFile(frames, framePaths));

    const videoPath = join(tmpDir, 'output.mp4');
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-vf', `fps=${VIDEO_CONFIG.fps},scale=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}:flags=lanczos`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '18',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .save(videoPath)
        .on('end', resolve)
        .on('error', reject);
    });

    const webpPath = join(tmpDir, 'output.webp');
    await convertVideoToWebp(videoPath, webpPath);

    return await readFile(webpPath);
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}