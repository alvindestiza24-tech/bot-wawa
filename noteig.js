import { createCanvas, Image } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';


const BG = 'https://raw.githubusercontent.com/kyyinfinite/kyyinfinite/main/uploads/1782724409764-6283815201912.jpg';
const AVA_DEFAULT = 'https://files.catbox.moe/jkrjpt';

async function fetchAndLoadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`Buffer terlalu kecil (${buf.length}b)`);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Decode gagal: ${e}`));
    img.src = buf;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (current) { lines.push(current); current = ''; }
      let chunk = '';
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width > maxWidth) {
          lines.push(chunk); chunk = ch;
        } else { chunk += ch; }
      }
      if (chunk) current = chunk;
      continue;
    }
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); current = word;
    } else { current = test; }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCapsule(ctx, x, y, w, h) {
  const r = Math.min(h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,      y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,      y,     x + r, y,         r);
  ctx.closePath();
}

export async function generateIgNote(opts = {}) {
  const {
    bgUrl     = BG,
    pfpUrl    = AVA_DEFAULT,
    text      = 'Note text here',
    username  = 'username',
    timestamp = '1m',
    outputDir = '../storage/shared/_canvas',
  } = opts;

  if (!bgUrl) throw new Error('bgUrl wajib diisi');

  const bgImg = await fetchAndLoadImage(bgUrl);
  const W = bgImg.width;
  const H = bgImg.height;
  console.log(`[BG]  ${W}×${H}px`);

  let pfpImg = null;
  if (pfpUrl) {
    try {
      pfpImg = await fetchAndLoadImage(pfpUrl);
      console.log(`[PFP] ${pfpImg.width}×${pfpImg.height}px — OK`);
    } catch (e) {
      console.error(`[PFP] GAGAL: ${e.message}`);
    }
  }

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const fontFam = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  ctx.drawImage(bgImg, 0, 0, W, H);

  const CARD_TOP     = H * 0.316;
  const BAR_CENTER_Y = Math.round(H * 0.506);

  const userFontSz  = Math.round(W * 0.038);
  const timeFontSz  = Math.round(W * 0.030);
  const noteMaxSz   = Math.round(W * 0.048);
  const noteMinSz   = 12;
  const noteMaxLines = 5;
  const avR  = Math.round(W * 0.060);
  const avCX = Math.round(W * 0.115);
  const bubblePadX = Math.round(W * 0.040);
  const bubblePadY = Math.round(H * 0.018);
  const bubbleX    = avCX + avR + Math.round(W * 0.024);
  const bubbleMaxW = W - bubbleX - Math.round(W * 0.040);
  const topRowY = Math.round(CARD_TOP + H * 0.012);
  const bubbleTopY = Math.round(topRowY + userFontSz + H * 0.016);
  let noteFontSz = noteMaxSz;
  ctx.font = `400 ${noteFontSz}px ${fontFam}`;
  let noteLines = wrapText(ctx, text, bubbleMaxW - bubblePadX * 2);
  while (noteLines.length > noteMaxLines && noteFontSz > noteMinSz) {
    noteFontSz -= 1;
    ctx.font = `400 ${noteFontSz}px ${fontFam}`;
    noteLines = wrapText(ctx, text, bubbleMaxW - bubblePadX * 2);
  }
  const lhMult    = noteLines.length <= 1 ? 1.28
                  : noteLines.length <= 3 ? 1.35
                  : 1.26;
  const noteLineH  = Math.round(noteFontSz * lhMult);
  const textBlockH = noteLines.length * noteLineH;
  ctx.font = `400 ${noteFontSz}px ${fontFam}`;
  let maxLineW = 0;
  for (const l of noteLines) {
    const lw = ctx.measureText(l).width;
    if (lw > maxLineW) maxLineW = lw;
  }
  const bubbleW = Math.min(bubbleMaxW, Math.max(maxLineW + bubblePadX * 2, Math.round(W * 0.22)));
  const bubbleH = textBlockH + bubblePadY * 2;

  const avCY = Math.round(bubbleTopY + bubbleH / 2);

 
  ctx.textBaseline  = 'top';
  ctx.textAlign     = 'left';
  ctx.shadowColor   = 'rgba(0,0,0,0.50)';
  ctx.shadowBlur    = 4;
  ctx.shadowOffsetY = 1;

  ctx.font = `600 ${userFontSz}px ${fontFam}`;
  const unameW = ctx.measureText(username).width;
  const dot    = ' · ';
  ctx.font     = `400 ${timeFontSz}px ${fontFam}`;
  const dotW   = ctx.measureText(dot).width;
  const tsW    = ctx.measureText(timestamp).width;
  const rowStartX = Math.round((W - (unameW + dotW + tsW)) / 2);
  const tsOffY    = Math.round((userFontSz - timeFontSz) / 2);

  ctx.font      = `600 ${userFontSz}px ${fontFam}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, rowStartX, topRowY);

  ctx.font      = `400 ${timeFontSz}px ${fontFam}`;
  ctx.fillStyle = 'rgba(255,255,255,0.50)';
  ctx.fillText(dot, rowStartX + unameW, topRowY + tsOffY);
  ctx.fillText(timestamp, rowStartX + unameW + dotW, topRowY + tsOffY);

  ctx.shadowColor   = 'transparent';
  ctx.shadowBlur    = 0;
  ctx.shadowOffsetY = 0;


  ctx.fillStyle = 'rgba(58,58,58,0.97)';
  drawCapsule(ctx, bubbleX, bubbleTopY, bubbleW, bubbleH);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1.5;
  drawCapsule(ctx, bubbleX, bubbleTopY, bubbleW, bubbleH);
  ctx.stroke();
  ctx.font         = `400 ${noteFontSz}px ${fontFam}`;
  ctx.fillStyle    = '#ffffff';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  noteLines.forEach((line, i) => {
    ctx.fillText(line, bubbleX + bubblePadX, bubbleTopY + bubblePadY + i * noteLineH);
  });
  ctx.save();
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
  ctx.clip();

  if (pfpImg) {
    const scale = Math.max((avR * 2) / pfpImg.width, (avR * 2) / pfpImg.height);
    const pw    = pfpImg.width  * scale;
    const ph    = pfpImg.height * scale;
    ctx.drawImage(pfpImg, avCX - pw / 2, avCY - ph / 2, pw, ph);
  } else {
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(avCX - avR, avCY - avR, avR * 2, avR * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(avCX, avCY - avR * 0.15, avR * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(avCX, avCY + avR * 0.52, avR * 0.60, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const cursorX = Math.round(W * 0.058);
  const cursorH = Math.round(H * 0.030);
  const cursorY = Math.round(BAR_CENTER_Y - cursorH / 2);
  ctx.fillStyle = '#4A9EF5';
  ctx.fillRect(cursorX, cursorY, 2, cursorH);
  const msgFontSz = Math.round(W * 0.036);
  const msgX      = cursorX + 6;
  const msgMaxW   = W * 0.55;

  ctx.font         = `400 ${msgFontSz}px ${fontFam}`;
  ctx.fillStyle    = 'rgba(255,255,255,0.33)';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';

  let msgText = `Message ${username}`;
  while (ctx.measureText(msgText).width > msgMaxW && msgText.length > 12) {
    msgText = msgText.slice(0, -4) + '...';
  }
  ctx.fillText(msgText, msgX, BAR_CENTER_Y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  fs.mkdirSync(outputDir, { recursive: true });
  const fileName   = `ig-note-${Date.now()}.png`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
  console.log(`[OUT] ${outputPath}`);

  return {
    Status:    true,
    Code:      200,
    Output:    path.resolve(outputPath),
    File_name: fileName,
    Width:     W,
    Height:    H,
  };
}

async function main() {
  try {
    const result = await generateIgNote({
      bgUrl: 'https://raw.githubusercontent.com/kyyinfinite/kyyinfinite/main/uploads/1782724409764-6283815201912.jpg',
      pfpUrl:    'https://files.catbox.moe/jkrjpt',
      text:      'kanjut aku badag',
      username:  'kyyinfinite',
      timestamp: '2m',
      outputDir: '../storage/shared/_canvas',
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

 main();