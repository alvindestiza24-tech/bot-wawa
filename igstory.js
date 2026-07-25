// src/canvas/igstory.js
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 720;
const H = 1280;

const PP_DEFAULT = join(process.cwd(), 'assets', 'profile.jpg');

const IG_GRADIENT = ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'];

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 12000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        req.destroy();
        return fetchRaw(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        req.destroy();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function loadImg(src) {
  if (!src) return null;
  try {
    if (Buffer.isBuffer(src)) return await loadImage(src);
    if (/^https?:\/\//.test(src)) return await loadImage(await fetchRaw(src));
    if (existsSync(src)) {
      const { readFileSync } = await import('node:fs');
      return await loadImage(readFileSync(src));
    }
  } catch {}
  return null;
}

async function getAvatar(avatarSrc) {
  const img = await loadImg(avatarSrc);
  if (img) return img;

  if (existsSync(PP_DEFAULT)) {
    const { readFileSync } = await import('node:fs');
    const fb = await loadImage(readFileSync(PP_DEFAULT)).catch(() => null);
    if (fb) return fb;
  }

  const fc = createCanvas(128, 128);
  const fx = fc.getContext('2d');
  const g = fx.createRadialGradient(64, 48, 8, 64, 64, 64);
  g.addColorStop(0, '#8B5CF6');
  g.addColorStop(1, '#4C1D95');
  fx.fillStyle = g;
  fx.beginPath();
  fx.arc(64, 64, 64, 0, Math.PI * 2);
  fx.fill();
  fx.fillStyle = 'rgba(255,255,255,0.85)';
  fx.beginPath();
  fx.arc(64, 40, 20, 0, Math.PI * 2);
  fx.fill();
  fx.beginPath();
  fx.ellipse(64, 88, 32, 26, 0, Math.PI, 0, true);
  fx.fill();
  return await loadImage(fc.toBuffer('image/png'));
}

function coverDraw(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw, dh, dx, dy;
  if (ir > cr) {
    dh = h;
    dw = dh * ir;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    dw = w;
    dh = dw / ir;
    dx = x;
    dy = y - (dh - h) / 2;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function circleClip(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function stackBlur(id, W, H, r) {
  if (r < 1) return;
  const px = id.data;
  const div = 2 * r + 1;
  const wm = W - 1;
  const hm = H - 1;
  const rp1 = r + 1;
  const mul = 1 / (rp1 * (rp1 + 1) / 2 * 2 + r + 1);
  const stk = Array.from({ length: div }, () => [0, 0, 0]);
  for (let y = 0; y < H; y++) {
    let ri = 0, gi = 0, bi = 0, ro = 0, go = 0, bo = 0, rs = 0, gs = 0, bs = 0, sI = r, sO = 0;
    for (let i = -r; i <= r; i++) {
      const si = (y * W + Math.min(wm, Math.max(0, i))) * 4;
      const s2 = i + r;
      stk[s2] = [px[si], px[si + 1], px[si + 2]];
      const rb = rp1 - Math.abs(i);
      rs += px[si] * rb; gs += px[si + 1] * rb; bs += px[si + 2] * rb;
      if (i > 0) { ri += px[si]; gi += px[si + 1]; bi += px[si + 2]; }
      else { ro += px[si]; go += px[si + 1]; bo += px[si + 2]; }
    }
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      px[idx] = Math.round(rs * mul); px[idx + 1] = Math.round(gs * mul); px[idx + 2] = Math.round(bs * mul);
      rs -= ro; gs -= go; bs -= bo;
      const os = stk[sO]; ro -= os[0]; go -= os[1]; bo -= os[2];
      const sx = Math.min(wm, x + r + 1), sid = (y * W + sx) * 4;
      os[0] = px[sid]; os[1] = px[sid + 1]; os[2] = px[sid + 2];
      ri += os[0]; gi += os[1]; bi += os[2]; rs += ri; gs += gi; bs += bi;
      sI = (sI + 1) % div; const is = stk[sI]; ro += is[0]; go += is[1]; bo += is[2]; ri -= is[0]; gi -= is[1]; bi -= is[2];
      sO = (sO + 1) % div;
    }
  }
  for (let x = 0; x < W; x++) {
    let ri = 0, gi = 0, bi = 0, ro = 0, go = 0, bo = 0, rs = 0, gs = 0, bs = 0, sI = r, sO = 0;
    for (let i = -r; i <= r; i++) {
      const sy = Math.min(hm, Math.max(0, i)), sid = (sy * W + x) * 4, s2 = i + r;
      stk[s2] = [px[sid], px[sid + 1], px[sid + 2]]; const rb = rp1 - Math.abs(i);
      rs += px[sid] * rb; gs += px[sid + 1] * rb; bs += px[sid + 2] * rb;
      if (i > 0) { ri += px[sid]; gi += px[sid + 1]; bi += px[sid + 2]; }
      else { ro += px[sid]; go += px[sid + 1]; bo += px[sid + 2]; }
    }
    for (let y = 0; y < H; y++) {
      const idx = (y * W + x) * 4;
      px[idx] = Math.round(rs * mul); px[idx + 1] = Math.round(gs * mul); px[idx + 2] = Math.round(bs * mul);
      rs -= ro; gs -= go; bs -= bo;
      const os = stk[sO]; ro -= os[0]; go -= os[1]; bo -= os[2];
      const sy = Math.min(hm, y + r + 1), sid = (sy * W + x) * 4;
      os[0] = px[sid]; os[1] = px[sid + 1]; os[2] = px[sid + 2];
      ri += os[0]; gi += os[1]; bi += os[2]; rs += ri; gs += gi; bs += bi;
      sI = (sI + 1) % div; const is = stk[sI]; ro += is[0]; go += is[1]; bo += is[2]; ri -= is[0]; gi -= is[1]; bi -= is[2];
      sO = (sO + 1) % div;
    }
  }
}

function blurBg(ctx, imgs) {
  const bc = createCanvas(W, H);
  const bx = bc.getContext('2d');
  if (imgs.length === 1) {
    coverDraw(bx, imgs[0], 0, 0, W, H);
  } else {
    coverDraw(bx, imgs[0], 0, 0, W, H / 2 + 2);
    coverDraw(bx, imgs[1], 0, H / 2, W, H / 2 + 2);
  }
  const id = bx.getImageData(0, 0, W, H);
  stackBlur(id, W, H, 28);
  bx.putImageData(id, 0, 0);
  ctx.drawImage(bc, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.fillRect(0, 0, W, H);
}

function drawStatusBar(ctx) {
  const BAR_H = 44;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeStr = hh + ':' + mm;
  ctx.save();
  ctx.font = 'bold 24px -apple-system, "SF Pro Display", Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(timeStr, 28, BAR_H / 2 + 2);
  const rightX = W - 28;
  const iconY = BAR_H / 2 + 2;
  drawBattery(ctx, rightX, iconY);
  drawWifi(ctx, rightX - 52, iconY);
  drawSignal(ctx, rightX - 100, iconY);
  ctx.restore();
}

function drawBattery(ctx, rx, cy) {
  const bw = 42, bh = 20, br = 4, cap = 3, capH = 8;
  const bx = rx - bw;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.90)';
  ctx.lineWidth = 1.5;
  rrect(ctx, bx, cy - bh / 2, bw, bh, br);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillRect(rx, cy - capH / 2, cap, capH);
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  rrect(ctx, bx + 2, cy - bh / 2 + 2, (bw - 4) * 0.78, bh - 4, br - 1);
  ctx.fill();
  ctx.restore();
}

function drawWifi(ctx, cx, cy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.90)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const arcs = [
    [6.5, -Math.PI * 0.65, -Math.PI * 0.35],
    [11, -Math.PI * 0.70, -Math.PI * 0.30],
    [15.5, -Math.PI * 0.75, -Math.PI * 0.25],
  ];
  for (const [r, s, e] of arcs) {
    ctx.beginPath();
    ctx.arc(cx, cy + 4, r, s, e);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.beginPath();
  ctx.arc(cx, cy + 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSignal(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  const bars = 4;
  const bw = 5, gap = 3;
  const totalW = bars * bw + (bars - 1) * gap;
  const startX = cx - totalW / 2;
  for (let i = 0; i < bars; i++) {
    const bh = 6 + i * 4;
    const bx = startX + i * (bw + gap);
    const by = cy + 8 - bh;
    rrect(ctx, bx, by, bw, bh, 1.5);
    ctx.globalAlpha = 1;
    ctx.fill();
  }
  ctx.restore();
}

function drawProgressBars(ctx, total, active, topY) {
  const barH = 3;
  const barY = topY;
  const padX = 10;
  const gap = 4;
  const totalW = W - padX * 2;
  const barW = (totalW - gap * (total - 1)) / total;
  for (let i = 0; i < total; i++) {
    const bx = padX + i * (barW + gap);
    rrect(ctx, bx, barY, barW, barH, barH / 2);
    ctx.fillStyle = i <= active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)';
    ctx.fill();
  }
}

function drawIgRing(ctx, cx, cy, r) {
  const ringR = r + 3.5;
  const g = ctx.createLinearGradient(cx - ringR, cy - ringR, cx + ringR, cy + ringR);
  IG_GRADIENT.forEach((c, i) => g.addColorStop(i / (IG_GRADIENT.length - 1), c));
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = g;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawMuteIcon(ctx, cx, cy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = 10;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.55);
  ctx.lineTo(cx - s * 0.28, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.28, cy - s);
  ctx.lineTo(cx + s * 0.28, cy + s);
  ctx.lineTo(cx - s * 0.28, cy + s * 0.55);
  ctx.lineTo(cx - s, cy + s * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.28, cy, s * 0.75, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.28, cy, s * 1.22, -Math.PI * 0.46, Math.PI * 0.46);
  ctx.stroke();
  ctx.restore();
}

function drawMoreDotsIcon(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const r = 3.5, gap = 10;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * gap, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeader(ctx, avatarImg, username, timeStr, progressY) {
  const topGrad = ctx.createLinearGradient(0, 0, 0, progressY + 200);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, progressY + 200);

  drawProgressBars(ctx, 1, 0, progressY);

  const avCX = 48, avCY = progressY + 46, avR = 26;
  drawIgRing(ctx, avCX, avCY, avR);
  circleClip(ctx, avatarImg, avCX, avCY, avR);

  ctx.save();
  ctx.font = 'bold 26px -apple-system, "SF Pro Display", Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 8;
  ctx.fillText(username.slice(0, 22), avCX + avR + 14, avCY - 9);
  ctx.restore();

  ctx.save();
  ctx.font = '22px -apple-system, "SF Pro Display", Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(timeStr, avCX + avR + 14, avCY + 14);
  ctx.restore();

  drawMuteIcon(ctx, W - 82, avCY);
  drawMoreDotsIcon(ctx, W - 30, avCY);
}

async function drawFooter(ctx) {
  const botGrad = ctx.createLinearGradient(0, H - 280, 0, H);
  botGrad.addColorStop(0, 'rgba(0,0,0,0)');
  botGrad.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H - 280, W, 280);

  const boxY = H - 108;
  const boxH = 56;
  const boxX = 18;
  const boxW = W - 18 - 18 - 56 - 56 - 10;

  rrect(ctx, boxX, boxY, boxW, boxH, boxH / 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.font = '23px -apple-system, "SF Pro Display", Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Kirim pesan...', boxX + 24, boxY + boxH / 2);
  ctx.restore();

  const iconCY = boxY + boxH / 2;
  const heartX = boxX + boxW + 18;
  const sendX = heartX + 56;
  const iconSz = 38;

  drawHeartFallback(ctx, heartX + iconSz / 2, iconCY, 14);
  drawSendFallback(ctx, sendX + iconSz / 2, iconCY, 14);

  drawHomeIndicator(ctx);
}

function drawHomeIndicator(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.50)';
  rrect(ctx, W / 2 - 67, H - 18, 134, 5, 3);
  ctx.fill();
  ctx.restore();
}

function drawHeartFallback(ctx, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.90)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  const top = cy - s * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx, top + s * 0.52);
  ctx.bezierCurveTo(cx, top + s * 0.20, cx - s * 0.55, top - s * 0.15, cx - s * 0.55, top + s * 0.10);
  ctx.bezierCurveTo(cx - s * 0.55, top - s * 0.35, cx, top - s * 0.38, cx, top);
  ctx.bezierCurveTo(cx, top - s * 0.38, cx + s * 0.55, top - s * 0.35, cx + s * 0.55, top + s * 0.10);
  ctx.bezierCurveTo(cx + s * 0.55, top - s * 0.15, cx, top + s * 0.20, cx, top + s * 0.52);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSendFallback(ctx, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.90)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.9, cy - s * 0.3);
  ctx.lineTo(cx - s, cy - s * 0.9);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + s * 0.4);
  ctx.lineTo(cx - s * 0.1, cy - s * 0.1);
  ctx.stroke();
  ctx.restore();
}

function drawTextOverlay(ctx, text, centerY, maxW) {
  if (!text || !text.trim()) return;
  ctx.save();
  ctx.font = 'bold 32px -apple-system, "SF Pro Display", Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.95)';
  ctx.shadowBlur = 14;
  const lines = wrapText(ctx, text, maxW);
  const lineH = 40;
  const totalH = lines.length * lineH;
  const startY = centerY - totalH / 2;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineH));
  ctx.restore();
}

export async function createFakeStory(opts) {
  const {
    username = 'instagram_user',
    timeStr = '2 jam',
    avatarSrc = null,
    imgTop = null,
    imgBot = null,
    text1 = '',
    text2 = '',
    mode = 2,
  } = opts;

  const STATUS_H = 44;
  const PROGRESS_Y = STATUS_H + 8;

  const avatarImg = await getAvatar(avatarSrc);
  const imgT = await loadImg(imgTop);
  const imgB = imgBot ? await loadImg(imgBot) : imgT;

  if (!imgT) throw new Error('Gambar tidak bisa dimuat');

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  if (mode === 2) {
    blurBg(ctx, [imgT]);
    coverDraw(ctx, imgT, 0, 0, W, H);
  } else {
    blurBg(ctx, imgB && imgB !== imgT ? [imgT, imgB] : [imgT]);
    const halfH = H / 2;
    coverDraw(ctx, imgT, 0, 0, W, halfH);
    coverDraw(ctx, imgB || imgT, 0, halfH, W, halfH);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, halfH - 1, W, 2);
  }

  if (mode === 3) {
    const halfH = H / 2;
    if (text1) drawTextOverlay(ctx, text1, halfH * 0.65, W - 80);
    if (text2) drawTextOverlay(ctx, text2, halfH + halfH * 0.55, W - 80);
  }

  drawStatusBar(ctx);
  drawHeader(ctx, avatarImg, username, timeStr, PROGRESS_Y);
  await drawFooter(ctx);

  return canvas.toBuffer('image/jpeg', { quality: 97 });
}