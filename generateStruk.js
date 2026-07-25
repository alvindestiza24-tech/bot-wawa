import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

function rupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function angka(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function waktuSekarang() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  };
  const parts = new Intl.DateTimeFormat('id-ID', options).formatToParts(now);
  const get = (type) => parts.find(part => part.type === type)?.value;
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return {
    hari: days[now.getDay()],
    tanggal: `${get('day')}/${get('month')}/${get('year')}`,
    jam: `${get('hour')}:${get('minute')}:${get('second')}`,
    fileTanggal: `${get('year')}${get('month')}${get('day')}`,
    fileJam: `${get('hour')}${get('minute')}${get('second')}`
  };
}

function hitungQty(items) {
  return items.reduce((t, i) => t + Number(i.qtyTotal ?? i.qty ?? 0), 0);
}

function hitungTotal(items) {
  return items.reduce((t, i) => t + Number(i.qty || 0) * Number(i.harga || 0), 0);
}

function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function setSh(ctx, b, c, ox, oy) {
  ctx.shadowBlur = b;
  ctx.shadowColor = c;
  ctx.shadowOffsetX = ox || 0;
  ctx.shadowOffsetY = oy || 4;
}

function clrSh(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function glass(ctx, x, y, w, h, r, gh) {
  ctx.save();
  rrect(ctx, x, y, w, h, r);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + gh);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, gh);
  ctx.restore();
}

function drawPersonIcon(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y - s * 0.3, s * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + s * 0.6, s * 0.5, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
}

function drawBoxIcon(ctx, x, y, s) {
  ctx.strokeRect(x - s * 0.4, y - s * 0.35, s * 0.8, s * 0.65);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.4, y - s * 0.1);
  ctx.lineTo(x - s * 0.55, y - s * 0.35);
  ctx.lineTo(x, y - s * 0.6);
  ctx.lineTo(x + s * 0.55, y - s * 0.35);
  ctx.lineTo(x + s * 0.4, y - s * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.6);
  ctx.lineTo(x, y - s * 0.1);
  ctx.stroke();
}

function drawCardIcon(ctx, x, y, s) {
  rrect(ctx, x - s * 0.5, y - s * 0.3, s, s * 0.6, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y - s * 0.05);
  ctx.lineTo(x + s * 0.5, y - s * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.35, y + s * 0.12);
  ctx.lineTo(x - s * 0.05, y + s * 0.12);
  ctx.stroke();
}

function drawCalIcon(ctx, x, y, s) {
  rrect(ctx, x - s * 0.4, y - s * 0.2, s * 0.8, s * 0.6, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.2, y - s * 0.2);
  ctx.lineTo(x - s * 0.2, y - s * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.2, y - s * 0.2);
  ctx.lineTo(x + s * 0.2, y - s * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.4, y - s * 0.05);
  ctx.lineTo(x + s * 0.4, y - s * 0.05);
  ctx.stroke();
}

function drawCheckIcon(ctx, x, y, s) {
  rrect(ctx, x - s * 0.4, y - s * 0.35, s * 0.8, s * 0.7, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.18, y + s * 0.02);
  ctx.lineTo(x - s * 0.03, y + s * 0.18);
  ctx.lineTo(x + s * 0.22, y - s * 0.12);
  ctx.stroke();
}

function drawBagIcon(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y - s * 0.3);
  ctx.lineTo(x - s * 0.6, y + s * 0.5);
  ctx.lineTo(x + s * 0.6, y + s * 0.5);
  ctx.lineTo(x + s * 0.5, y - s * 0.3);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s * 0.1, s * 0.25, Math.PI, 0, false);
  ctx.stroke();
}

function drawSignature(ctx, cx, cy, sc) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = sc / 200;
  ctx.scale(s, s);
  ctx.strokeStyle = '#232323';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(-60, 20);
  ctx.bezierCurveTo(-50, -40, -20, -60, 0, -30);
  ctx.bezierCurveTo(10, -10, 20, -50, 40, -40);
  ctx.bezierCurveTo(55, -32, 60, -10, 50, 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-10, -25);
  ctx.bezierCurveTo(-15, 10, -20, 40, -30, 55);
  ctx.bezierCurveTo(-40, 65, -50, 60, -45, 45);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, -15);
  ctx.bezierCurveTo(5, 20, 0, 50, 15, 60);
  ctx.bezierCurveTo(25, 65, 35, 50, 30, 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-40, 70);
  ctx.bezierCurveTo(-10, 65, 30, 70, 60, 60);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-55, 10);
  ctx.bezierCurveTo(-70, 15, -80, 25, -75, 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-65, -5);
  ctx.bezierCurveTo(-80, 0, -85, 10, -78, 18);
  ctx.stroke();

  ctx.restore();
}

export async function generateStruk(data = {}) {
  const toko = data.toko || {};
  const kasir = data.kasir || '-';
  const pelanggan = data.pelanggan || '-';
  const alamatPelanggan = data.alamatPelanggan || '-';
  const nomorStruk = data.nomorStruk || null;
  const items = Array.isArray(data.items) ? data.items : [];
  const bayar = data.bayar || 0;
  const diskon = data.diskon || 0;
  const pajak = data.pajak || 0;
  const metodeBayar = data.metodeBayar || 'Cash';
  const catatan = data.catatan || '';
  const outputDir = data.outputDir || './output';

  const now = waktuSekarang();
  const W = 1600;
  const H = 900;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const LEFT_W = Math.floor(W * 0.72);
  const RIGHT_W = W - LEFT_W;
  const SEP_X = LEFT_W;
  const R = 28;
  const storeName = toko.nama || 'Toko Kami';

  const subTotal = hitungTotal(items);
  const totalQty = hitungQty(items);
  const totalItems = items.length;
  const total = subTotal - diskon + pajak;
  const kembali = bayar - total;
  const finalNomorStruk = nomorStruk || `INV-${now.fileTanggal}-${Date.now().toString().slice(-6)}`;

  // ==================== BACKGROUND ====================
  const bgG = ctx.createLinearGradient(0, 0, W, H);
  bgG.addColorStop(0, '#FFF8F2');
  bgG.addColorStop(0.4, '#FFFDFB');
  bgG.addColorStop(0.7, '#FEFAF6');
  bgG.addColorStop(1, '#FAF7F4');
  ctx.fillStyle = bgG;
  ctx.fillRect(0, 0, W, H);

  // Subtle dot grid
  ctx.fillStyle = 'rgba(251,207,232,0.08)';
  for (let gx = 0; gx < W; gx += 40) {
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Glow spots
  const g1 = ctx.createRadialGradient(60, 60, 0, 60, 60, 350);
  g1.addColorStop(0, 'rgba(255,141,186,0.18)');
  g1.addColorStop(0.5, 'rgba(255,168,207,0.06)');
  g1.addColorStop(1, 'rgba(255,141,186,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 600, 600);

  const g2 = ctx.createRadialGradient(W - 80, H - 60, 0, W - 80, H - 60, 400);
  g2.addColorStop(0, 'rgba(140,203,255,0.16)');
  g2.addColorStop(0.5, 'rgba(183,222,255,0.05)');
  g2.addColorStop(1, 'rgba(140,203,255,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(W - 500, H - 500, 500, 500);

  const g3 = ctx.createRadialGradient(W * 0.45, -50, 0, W * 0.45, -50, 450);
  g3.addColorStop(0, 'rgba(215,196,255,0.12)');
  g3.addColorStop(1, 'rgba(215,196,255,0)');
  ctx.fillStyle = g3;
  ctx.fillRect(W * 0.2, 0, W * 0.5, 500);

  const g4 = ctx.createRadialGradient(LEFT_W, H * 0.6, 0, LEFT_W, H * 0.6, 250);
  g4.addColorStop(0, 'rgba(255,200,225,0.08)');
  g4.addColorStop(1, 'rgba(255,200,225,0)');
  ctx.fillStyle = g4;
  ctx.fillRect(LEFT_W - 250, H * 0.3, 500, 500);

  // Floating particles
  for (let i = 0; i < 35; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,141,186,${0.03 + Math.random() * 0.07})`;
    ctx.fill();
  }
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(140,203,255,${0.02 + Math.random() * 0.05})`;
    ctx.fill();
  }
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 1.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(215,196,255,${0.03 + Math.random() * 0.05})`;
    ctx.fill();
  }

  // Decorative large soft circles
  ctx.fillStyle = 'rgba(255,199,225,0.06)';
  ctx.beginPath();
  ctx.arc(200, 750, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(183,222,255,0.06)';
  ctx.beginPath();
  ctx.arc(W - 200, 200, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(231,223,255,0.05)';
  ctx.beginPath();
  ctx.arc(LEFT_W * 0.5, H * 0.5, 180, 0, Math.PI * 2);
  ctx.fill();

  // ==================== SEPARATOR ====================
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(215,196,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SEP_X, 30);
  ctx.lineTo(SEP_X, H - 30);
  ctx.stroke();
  ctx.restore();

  // ==================== LEFT SECTION ====================

  // --- Premium Badge ---
  const bdX = 30, bdY = 22, bdW = 120, bdH = 56;
  const bdG = ctx.createLinearGradient(bdX, bdY, bdX + bdW, bdY + bdH);
  bdG.addColorStop(0, '#FF8DBA');
  bdG.addColorStop(1, '#D7C4FF');
  setSh(ctx, 12, 'rgba(255,141,186,0.3)', 0, 4);
  ctx.fillStyle = bdG;
  rrect(ctx, bdX, bdY, bdW, bdH, 14);
  ctx.fill();
  clrSh(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  rrect(ctx, bdX, bdY, bdW, bdH, 14);
  ctx.stroke();
  glass(ctx, bdX, bdY, bdW, bdH, 14, bdH * 0.5);

  // Cart icon in badge
  const bcx = bdX + bdW / 2, bcy = bdY + bdH / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(bcx - 10, bcy - 10);
  ctx.lineTo(bcx - 10, bcy + 4);
  ctx.quadraticCurveTo(bcx - 10, bcy + 10, bcx, bcy + 10);
  ctx.quadraticCurveTo(bcx + 14, bcy + 10, bcx + 14, bcy);
  ctx.lineTo(bcx + 14, bcy - 8);
  ctx.lineTo(bcx + 6, bcy - 2);
  ctx.lineTo(bcx + 2, bcy - 8);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bcx + 2, bcy - 12, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // --- Large Title ---
  ctx.font = '800 72px Georgia, serif';
  ctx.fillStyle = '#232323';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  setSh(ctx, 4, 'rgba(0,0,0,0.06)', 0, 2);
  ctx.fillText('STRUK PEMBELIAN', 30, 92);
  clrSh(ctx);

  ctx.font = '500 16px Verdana, sans-serif';
  ctx.fillStyle = '#777777';
  ctx.fillText('TERIMA KASIH TELAH BERBELANJA DI TOKO KAMI', 32, 174);

  // --- Info Rows ---
  let infoY = 218;
  const infoGap = 33;
  const infoIconX = 50;

  const drawInfoRow = (iconFn, label, value) => {
    ctx.save();
    ctx.strokeStyle = '#FF8DBA';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    iconFn(ctx, infoIconX, infoY, 24);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.restore();

    ctx.font = '600 16px Verdana, sans-serif';
    ctx.fillStyle = '#777777';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, infoIconX + 38, infoY);

    const lw = ctx.measureText(label).width;
    ctx.font = '600 16px Verdana, sans-serif';
    ctx.fillStyle = '#232323';
    ctx.fillText(':  ' + value, infoIconX + 38 + lw, infoY);

    infoY += infoGap;
  };

  const firstItemName = items.length > 0 ? items[0].nama : '-';
  const dateTimeStr = `${now.tanggal} ${now.jam}`;

  drawInfoRow(drawPersonIcon, 'Id Pembeli', String(pelanggan));
  drawInfoRow(drawBoxIcon, 'Produk', firstItemName);
  drawInfoRow(drawCardIcon, 'Metode Bayar', (metodeBayar || '-').toUpperCase());
  drawInfoRow(drawCalIcon, 'Tanggal', dateTimeStr);
  drawInfoRow(drawCheckIcon, 'Status', 'PAID');

  // --- Product Table ---
  const tX = 30;
  const tW = LEFT_W - 65;
  const hH = 48;
  const maxTableH = H - (infoY + 10) - 150;
  const rH = totalItems > 0 ? Math.min(42, Math.floor((maxTableH - hH - 4) / totalItems)) : 42;
  const tY = infoY + 10;
  const tH = hH + rH * totalItems + 4;
  const cW = [0.08, 0.32, 0.2, 0.2, 0.2];

  // Table shadow & bg
  setSh(ctx, 18, 'rgba(255,141,186,0.08)', 0, 4);
  ctx.fillStyle = '#ffffff';
  rrect(ctx, tX, tY, tW, tH, R);
  ctx.fill();
  clrSh(ctx);

  ctx.strokeStyle = 'rgba(215,196,255,0.25)';
  ctx.lineWidth = 1.5;
  rrect(ctx, tX, tY, tW, tH, R);
  ctx.stroke();

  // Table header
  ctx.save();
  rrect(ctx, tX, tY, tW, hH, R);
  ctx.clip();
  const thG = ctx.createLinearGradient(tX, tY, tX + tW, tY);
  thG.addColorStop(0, '#3D2244');
  thG.addColorStop(0.4, '#4A2856');
  thG.addColorStop(0.6, '#4A2856');
  thG.addColorStop(1, '#3D2244');
  ctx.fillStyle = thG;
  ctx.fillRect(tX, tY, tW, hH);
  glass(ctx, tX, tY, tW, hH, 0, 16);
  ctx.restore();

  // Header text
  const headers = ['NO', 'DETAIL', 'HARGA SATUAN', 'JUMLAH/QTY', 'SUBTOTAL'];
  let cx = tX;
  ctx.font = '600 18px Verdana, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    const cw = tW * cW[i];
    ctx.textAlign = i <= 1 ? 'left' : 'right';
    ctx.fillText(headers[i], cx + (i <= 1 ? 18 : -18), tY + hH / 2);
    cx += cw;
  }

  // Table rows
  for (let r = 0; r < totalItems; r++) {
    const ry = tY + hH + r * rH;
    ctx.fillStyle = r % 2 === 0 ? 'rgba(255,248,242,0.6)' : 'rgba(255,253,251,0.6)';
    ctx.fillRect(tX + 1, ry, tW - 2, rH);

    if (r < totalItems - 1) {
      ctx.strokeStyle = 'rgba(215,196,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tX + 18, ry + rH);
      ctx.lineTo(tX + tW - 18, ry + rH);
      ctx.stroke();
    }

    const item = items[r];
    const row = [
      String(r + 1),
      item.nama || '-',
      rupiah(item.harga),
      `${item.qty} ${item.satuan || ''}`,
      rupiah(item.qty * item.harga)
    ];

    cx = tX;
    ctx.textBaseline = 'middle';
    for (let c = 0; c < 5; c++) {
      const cw = tW * cW[c];
      let txt = row[c];
      const maxW = cw - 36;

      ctx.font = c === 4 ? '600 16px Verdana, sans-serif' : '500 16px Verdana, sans-serif';
      ctx.fillStyle = c === 4 ? '#db2777' : '#232323';

      if (ctx.measureText(txt).width > maxW) {
        while (txt.length > 0 && ctx.measureText(txt + '...').width > maxW) txt = txt.slice(0, -1);
        txt += '...';
      }

      ctx.textAlign = c <= 1 ? 'left' : 'right';
      ctx.fillText(txt, cx + (c <= 1 ? 18 : -18), ry + rH / 2);
      cx += cw;
    }
  }

  // --- Bottom Left: Summary ---
  const sumY = tY + tH + 22;
  const sumRows = 2 + (diskon > 0 ? 1 : 0) + (pajak > 0 ? 1 : 0);
  const sumCardH = 38 * sumRows + 24;
  const sumCardX = 290;
  const sumCardW = LEFT_W - 330;

  ctx.font = '700 24px Georgia, serif';
  ctx.fillStyle = '#232323';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('RINCIAN BIAYA :', 32, sumY + (sumCardH / 2) - 12);

  // Summary card
  setSh(ctx, 16, 'rgba(255,141,186,0.1)', 0, 4);
  const scG = ctx.createLinearGradient(sumCardX, sumY, sumCardX, sumY + sumCardH);
  scG.addColorStop(0, '#ffffff');
  scG.addColorStop(1, '#FFF8F2');
  ctx.fillStyle = scG;
  rrect(ctx, sumCardX, sumY, sumCardW, sumCardH, R);
  ctx.fill();
  clrSh(ctx);

  ctx.strokeStyle = 'rgba(255,141,186,0.22)';
  ctx.lineWidth = 1.2;
  rrect(ctx, sumCardX, sumY, sumCardW, sumCardH, R);
  ctx.stroke();
  glass(ctx, sumCardX, sumY, sumCardW, sumCardH, R, 35);

  let sy = sumY + 30;
  const drawSumRow = (label, value, vColor, vBold) => {
    ctx.font = '500 15px Verdana, sans-serif';
    ctx.fillStyle = '#777777';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, sumCardX + 26, sy);

    ctx.font = `${vBold ? '700' : '600'} 15px Verdana, sans-serif`;
    ctx.fillStyle = vColor;
    ctx.textAlign = 'right';
    ctx.fillText(value, sumCardX + sumCardW - 26, sy);
    sy += 38;
  };

  drawSumRow('SUBTOTAL', rupiah(subTotal), '#232323', false);
  if (diskon > 0) drawSumRow('DISKON', `- ${rupiah(diskon)}`, '#db2777', false);
  if (pajak > 0) drawSumRow('PAJAK', rupiah(pajak), '#232323', false);

  // Separator line before total
  ctx.strokeStyle = 'rgba(215,196,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sumCardX + 22, sy - 19);
  ctx.lineTo(sumCardX + sumCardW - 22, sy - 19);
  ctx.stroke();

  drawSumRow('TOTAL', rupiah(total), '#db2777', true);

  // ==================== RIGHT SECTION ====================
  const rpX = SEP_X + 20;
  const rpW = RIGHT_W - 40;
  const rpCX = SEP_X + RIGHT_W / 2;

  // --- Store Logo ---
  const logoY = 55;
  ctx.strokeStyle = '#FF8DBA';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawBagIcon(ctx, rpCX, logoY, 30);
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // Store name
  const words = storeName.split(' ');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let snY = logoY + 42;

  if (words.length >= 3) {
    ctx.font = '700 18px Georgia, serif';
    ctx.fillStyle = '#232323';
    ctx.fillText(words[0], rpCX, snY);
    snY += 26;
    ctx.font = '800 28px Georgia, serif';
    ctx.fillStyle = '#FF8DBA';
    ctx.fillText(words[1], rpCX, snY);
    snY += 34;
    ctx.font = '600 15px Verdana, sans-serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(words.slice(2).join(' '), rpCX, snY);
  } else if (words.length === 2) {
    ctx.font = '800 26px Georgia, serif';
    ctx.fillStyle = '#FF8DBA';
    ctx.fillText(words[0], rpCX, snY);
    snY += 32;
    ctx.font = '600 15px Verdana, sans-serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(words[1], rpCX, snY);
  } else {
    ctx.font = '800 28px Georgia, serif';
    ctx.fillStyle = '#FF8DBA';
    ctx.fillText(storeName, rpCX, snY);
  }

  // --- Signature Card ---
  const sigY = 210;
  const sigH = H - sigY - 140;

  setSh(ctx, 20, 'rgba(140,203,255,0.1)', 0, 6);
  const sigG = ctx.createLinearGradient(rpX, sigY, rpX, sigY + sigH);
  sigG.addColorStop(0, '#ffffff');
  sigG.addColorStop(1, '#FFFDFB');
  ctx.fillStyle = sigG;
  rrect(ctx, rpX, sigY, rpW, sigH, R);
  ctx.fill();
  clrSh(ctx);

  ctx.strokeStyle = 'rgba(140,203,255,0.25)';
  ctx.lineWidth = 1.2;
  rrect(ctx, rpX, sigY, rpW, sigH, R);
  ctx.stroke();
  glass(ctx, rpX, sigY, rpW, sigH, R, 50);

  // Ribbon
  const ribW = rpW * 0.6;
  const ribH = 40;
  const ribX = rpX + (rpW - ribW) / 2;
  const ribG = ctx.createLinearGradient(ribX, sigY, ribX + ribW, sigY);
  ribG.addColorStop(0, '#FF8DBA');
  ribG.addColorStop(1, '#D7C4FF');
  ctx.fillStyle = ribG;
  rrect(ctx, ribX, sigY, ribW, ribH, 20);
  ctx.fill();
  glass(ctx, ribX, sigY, ribW, ribH, 20, ribH * 0.5);

  ctx.font = '700 15px Verdana, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TANDA TANGAN', rpCX, sigY + ribH / 2);

  // Signature
  const sigCenterY = sigY + 50 + (sigH - 50 - 70) / 2;
  drawSignature(ctx, rpCX, sigCenterY, rpW * 0.65);

  // Signature line
  ctx.strokeStyle = 'rgba(85,85,85,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rpX + 30, sigY + sigH - 55);
  ctx.lineTo(rpX + rpW - 30, sigY + sigH - 55);
  ctx.stroke();

  ctx.font = '600 14px Verdana, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(storeName, rpCX, sigY + sigH - 45);

  // --- Thank You Badge ---
  const tyY = sigY + sigH + 18;
  const tyH = 88;

  const tyG = ctx.createLinearGradient(rpX, tyY, rpX + rpW, tyY + tyH);
  tyG.addColorStop(0, '#FF8DBA');
  tyG.addColorStop(0.5, '#D7C4FF');
  tyG.addColorStop(1, '#8CCBFF');
  setSh(ctx, 20, 'rgba(255,141,186,0.3)', 0, 4);
  ctx.fillStyle = tyG;
  rrect(ctx, rpX, tyY, rpW, tyH, 20);
  ctx.fill();
  clrSh(ctx);

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  rrect(ctx, rpX, tyY, rpW, tyH, 20);
  ctx.stroke();
  glass(ctx, rpX, tyY, rpW, tyH, 20, tyH * 0.4);

  ctx.font = '800 24px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('THANK YOU', rpCX, tyY + 32);

  ctx.font = '500 12px Verdana, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('ATAS KEPERCAYAAN ANDA', rpCX, tyY + 60);

  // ==================== FOOTER ====================
  const pillW = 340;
  const pillH = 34;
  const pillX = (W - pillW) / 2;
  const pillY = H - 48;

  ctx.fillStyle = 'rgba(215,196,255,0.12)';
  rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(215,196,255,0.25)';
  ctx.lineWidth = 1;
  rrect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();

  ctx.font = '500 13px Verdana, sans-serif';
  ctx.fillStyle = '#777777';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Credits : ${storeName}`, W / 2, pillY + pillH / 2);

  // ==================== SAVE ====================
  const outDir = outputDir || path.join(process.cwd(), 'storage', '.tmp');
  fs.mkdirSync(outDir, { recursive: true });

  const fileName = `struk-${now.fileTanggal}-${now.fileJam}.png`;
  const outputPath = path.join(outDir, fileName);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  return {
    Status: true,
    Code: 200,
    Output: path.resolve(outputPath),
    File_name: fileName,
    Date: now.tanggal,
    Time: now.jam,
    Nomor_struk: finalNomorStruk,
    Total_items: totalItems,
    Total_qty: totalQty,
    Sub_total: subTotal,
    Diskon: diskon,
    Pajak: pajak,
    Total: total,
    Bayar: Number(bayar || 0),
    Kembali: kembali,
    Metode_bayar: metodeBayar
  };
}