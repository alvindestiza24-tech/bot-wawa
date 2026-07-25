// src/canvas/ovorupiah.js
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ASSETS_DIR = join(__dirname, 'assets', 'ovo');
const TEMPLATE_PATH = join(ASSETS_DIR, 'template.jpeg');
const TEMPLATE_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/file_0000000078bc71fa87da5cf26dc6c008.jpeg';

const FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/ttqc/PlusJakartaSans-Bold.ttf';
const FONT_PATH = join(ASSETS_DIR, 'PlusJakartaSans-Bold.ttf');

const WIDTH = 841;
const HEIGHT = 1870;

const FIXED_RP = Object.freeze({
  text: 'Rp',
  x: 61,
  y: 368,
  size: 20,
  weight: 800,
});

const AMOUNT_STYLE = {
  x: 94,
  y: 371,
  size: 28,
  weight: 800,
  color: '#FFFFFF',
};

function formatAmount(input) {
  const digits = String(input).replace(/[^\d]/g, '') || '0';
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function ensureAssets() {
  await mkdir(ASSETS_DIR, { recursive: true });
  if (!existsSync(TEMPLATE_PATH)) {
    const buf = await downloadBuffer(TEMPLATE_URL);
    await writeFile(TEMPLATE_PATH, buf);
  }
  if (!existsSync(FONT_PATH)) {
    const buf = await downloadBuffer(FONT_URL);
    await writeFile(FONT_PATH, buf);
  }
  GlobalFonts.registerFromPath(FONT_PATH, 'Plus Jakarta Sans');
}

export async function generateOvo(amount) {
  await ensureAssets();
  const formatted = formatAmount(amount);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  const bg = await loadImage(TEMPLATE_PATH);
  ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = AMOUNT_STYLE.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `${FIXED_RP.weight} ${FIXED_RP.size}px "Plus Jakarta Sans"`;
  ctx.fillText(FIXED_RP.text, FIXED_RP.x, FIXED_RP.y);

  ctx.font = `${AMOUNT_STYLE.weight} ${AMOUNT_STYLE.size}px "Plus Jakarta Sans"`;
  ctx.fillText(formatted, AMOUNT_STYLE.x, AMOUNT_STYLE.y);

  return canvas.toBuffer('image/png');
}