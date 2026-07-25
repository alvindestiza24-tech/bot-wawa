// src/lib/file-pdf.js
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { createCanvas } from '@napi-rs/canvas'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const OUTPUT_DIR = path.join(process.cwd(), 'storage', 'pdf')

const C = {
  navy: '#1B2A4A', navyMid: '#2D4A7A', white: '#FFFFFF', offWhite: '#FAFBFC',
  altRow: '#F1F5F9', border: '#E2E8F0', text: '#1E293B', muted: '#64748B',
  green: '#059669', greenBg: '#ECFDF5', red: '#DC2626', redBg: '#FEF2F2',
  amber: '#D97706', amberBg: '#FFF7ED', blue: '#2563EB', blueBg: '#EFF6FF',
  purple: '#7C3AED', purpleBg: '#FAF5FF', orange: '#EA580C', orangeBg: '#FFF7ED',
  catBg: '#EEF2FF', catFg: '#3730A3', subBg: '#F8FAFC',
  grandBg: '#FEF9C3', grandBdr: '#CA8A04', kpiYellow: '#FEF3C7',
}

function fmtP(n) { return Number(n).toLocaleString('id-ID') }
function fmtD(iso) { return iso ? new Date(iso).toLocaleString('id-ID') : '-' }

function renderChart(config, w = 500, h = 300) {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  new Chart(ctx, config)
  return canvas.toBuffer('image/png')
}

function pageHeader(doc, title, subtitle) {
  doc.fontSize(18).fillColor(C.navy).text(title, { align: 'left' })
  doc.moveDown(0.3)
  doc.fontSize(9).fillColor(C.muted).text(subtitle, { align: 'left' })
  doc.moveDown(0.8)
  doc.save().strokeColor(C.border).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke().restore()
  doc.moveDown(0.8)
}

function drawTable(doc, headers, rows, colWidths, opts = {}) {
  const startX = 50
  const pad = 4
  const fs0 = opts.fontSize || 8
  const hfs = opts.headerFontSize || 8
  const rh = opts.rowHeight || 14
  const hh = opts.headerHeight || 16
  let y = doc.y
  const bottom = doc.page.height - 60

  function draw(cells, yp, h, isH = false) {
    let x = startX
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]
      const w = colWidths[i]
      if (c.bg) doc.save().rect(x, yp, w, h).fill(c.bg).restore()
      doc.save().rect(x, yp, w, h).strokeColor(c.borderColor || C.border).lineWidth(0.5).stroke().restore()
      if (c.text != null) {
        doc.save()
           .fontSize(c.fontSize || (isH ? hfs : fs0))
           .fillColor(c.color || (isH ? C.white : C.text))
           .font(c.bold || isH ? 'Helvetica-Bold' : 'Helvetica')
           .text(String(c.text), x + pad, yp + (h - (c.fontSize || (isH ? hfs : fs0))) / 2, { width: w - pad * 2, align: c.align || (isH ? 'center' : 'left'), lineBreak: false })
           .restore()
      }
      x += w
    }
  }

  if (y + hh > bottom) { doc.addPage(); y = 60; }
  draw(headers, y, hh, true); y += hh

  for (const r of rows) {
    const h = r.height || rh
    if (y + h > bottom) { doc.addPage(); y = 60; draw(headers, y, hh, true); y += hh; }
    draw(r.cells || r, y, h); y += h
  }
  doc.y = y
}

function pageKatalog(doc, cats) {
  doc.addPage()
  pageHeader(doc, 'KATALOG PRODUK', `Dicetak: ${new Date().toLocaleString('id-ID')}`)
  if (Object.keys(cats).length === 0) {
    doc.fontSize(10).fillColor(C.muted).text('Tidak ada data katalog.', 50, doc.y)
    return
  }

  const colW = [20, 55, 45, 75, 80, 50, 30, 35, 55, 50]
  const headers = ['No', 'Kategori', 'ID Produk', 'Nama Produk', 'Deskripsi', 'Harga', 'Stok', 'Terjual', 'Nilai Stok', 'Pendapatan'].map(t => ({ text: t }))
  const rows = []
  let idx = 0

  for (const [catId, cat] of Object.entries(cats)) {
    const items = cat.items || []
    const catRow = Array(10).fill(null).map(() => ({ bg: C.catBg, text: '' }))
    catRow[1].text = cat.name; catRow[1].bold = true; catRow[1].color = C.catFg
    rows.push({ cells: catRow, height: 16 })

    if (!items.length) {
      const emptyRow = Array(10).fill(null).map(() => ({ bg: C.catBg, text: '' }))
      emptyRow[3].text = '(belum ada item)'; emptyRow[3].color = C.muted
      rows.push({ cells: emptyRow })
      continue
    }

    let cStok = 0, cVal = 0, cRev = 0
    items.forEach((it, ii) => {
      idx++
      const sv = it.price * it.stock; const rv = it.price * (it.sold || 0)
      cStok += it.stock; cVal += sv; cRev += rv
      const alt = ii % 2 === 1 ? C.altRow : C.offWhite
      const stokBg = it.stock === 0 ? C.redBg : alt
      const stokColor = it.stock === 0 ? C.red : (it.stock <= 3 ? C.amber : C.text)
      const stokBold = it.stock === 0 || it.stock <= 3

      rows.push({
        cells: [
          { text: String(idx), align: 'center', bg: alt },
          { text: ii === 0 ? cat.name : '', bg: alt, color: C.catFg, bold: ii === 0 },
          { text: it.id, align: 'center', bg: alt },
          { text: it.name, bg: alt },
          { text: it.description || '', bg: alt, fontSize: 7 },
          { text: fmtP(it.price), align: 'right', bg: alt },
          { text: String(it.stock), align: 'center', bg: stokBg, color: stokColor, bold: stokBold },
          { text: String(it.sold || 0), align: 'center', bg: alt },
          { text: fmtP(sv), align: 'right', bg: alt },
          { text: fmtP(rv), align: 'right', bg: alt }
        ]
      })
    })

    const subRow = Array(10).fill(null).map(() => ({ bg: C.subBg, text: '', borderColor: C.navy }))
    subRow[1].text = `Subtotal ${cat.name}`; subRow[1].bold = true
    subRow[6].text = String(cStok); subRow[6].align = 'center'; subRow[6].bold = true
    subRow[7].text = String(items.reduce((s, i) => s + (i.sold || 0), 0)); subRow[7].align = 'center'; subRow[7].bold = true
    subRow[8].text = fmtP(cVal); subRow[8].align = 'right'; subRow[8].bold = true
    subRow[9].text = fmtP(cRev); subRow[9].align = 'right'; subRow[9].bold = true
    rows.push({ cells: subRow, height: 16 })
  }

  drawTable(doc, headers, rows, colW)
}

function pagePesanan(doc, ord) {
  doc.addPage()
  pageHeader(doc, 'DAFTAR PESANAN', `Dicetak: ${new Date().toLocaleString('id-ID')}`)
  const orders = (ord.orders || []).slice().reverse()
  if (!orders.length) {
    doc.fontSize(10).fillColor(C.muted).text('Tidak ada data pesanan.', 50, doc.y)
    return
  }

  const statusMap = {
    completed: { t: '[Selesai]', bg: C.greenBg, fg: C.green },
    cancelled: { t: '[Batal]', bg: C.redBg, fg: C.red },
    pending: { t: '[Pending]', bg: C.amberBg, fg: C.amber },
    confirmed: { t: '[Konfirmasi]', bg: C.blueBg, fg: C.blue },
    processing: { t: '[Proses]', bg: C.orangeBg, fg: C.orange },
  }

  const colW = [20, 55, 45, 50, 45, 35, 50, 18, 40, 40, 48, 49]
  const headers = ['No', 'Order ID', 'Status', 'Pembeli', 'No. HP', 'Kategori', 'Produk', 'Qty', 'Harga', 'Total', 'Dibuat', 'Selesai'].map(t => ({ text: t }))
  const rows = []

  orders.forEach((o, i) => {
    const alt = i % 2 === 1 ? C.altRow : C.offWhite
    const s = statusMap[o.status] || { t: o.status, bg: alt, fg: C.muted }
    rows.push({
      cells: [
        { text: String(i + 1), align: 'center', bg: alt, fontSize: 7 },
        { text: o.orderId, bg: alt, fontSize: 7 },
        { text: s.t, bg: s.bg, color: s.fg, bold: true, align: 'center', fontSize: 7 },
        { text: o.pushName, bg: alt, fontSize: 7 },
        { text: o.senderNum, bg: alt, fontSize: 7 },
        { text: o.categoryName, bg: alt, fontSize: 7 },
        { text: o.itemName, bg: alt, fontSize: 7 },
        { text: String(o.qty), align: 'center', bg: alt, fontSize: 7 },
        { text: fmtP(o.price), align: 'right', bg: alt, fontSize: 7 },
        { text: fmtP(o.total), align: 'right', bg: alt, fontSize: 7 },
        { text: fmtD(o.createdAt), bg: alt, fontSize: 6 },
        { text: fmtD(o.completedAt), bg: alt, fontSize: 6 }
      ]
    })
  })

  drawTable(doc, headers, rows, colW, { fontSize: 7, headerFontSize: 7, rowHeight: 12, headerHeight: 14 })
}

async function pageStatistik(doc, cats, ord, stat) {
  doc.addPage()
  pageHeader(doc, 'RINGKASAN & STATISTIK TOKO', `Dicetak: ${new Date().toLocaleString('id-ID')}`)
  
  const kpis = [
    { lbl: 'Kategori', val: String(stat.totalCategories), bg: C.blueBg, fg: C.blue },
    { lbl: 'Produk', val: String(stat.totalItems), bg: C.purpleBg, fg: C.purple },
    { lbl: 'Stok', val: String(stat.totalStock), bg: C.greenBg, fg: C.green },
    { lbl: 'Order', val: String(stat.totalOrders), bg: C.orangeBg, fg: C.orange }
  ]
  
  let x = 50, y = doc.y, w = 120, h = 40
  kpis.forEach((k, i) => {
    if (i === 2) { x = 50; y += 30 }
    doc.save().roundedRect(x, y, w, h, 4).fill(k.bg).restore()
    doc.fontSize(18).fillColor(k.fg).text(k.val, x, y + 5, { width: w, align: 'center' })
    doc.fontSize(8).fillColor(k.fg).text(k.lbl, x, y + 25, { width: w, align: 'center' })
    x += 130
  })
  
  y += 50
  doc.save().rect(50, y, 495, 25).fill(C.navy).restore()
  doc.fontSize(12).fillColor(C.white).text('TOTAL PENDAPATAN', 60, y + 5)
  doc.fontSize(16).fillColor(C.kpiYellow).text(`Rp ${fmtP(stat.totalRevenue)}`, 300, y + 3, { width: 240, align: 'right' })
  
  y += 30
  doc.save().rect(50, y, 495, 22).fill(C.navyMid).restore()
  doc.fontSize(10).fillColor(C.white).text('NILAI TOTAL STOK', 60, y + 5)
  doc.fontSize(14).fillColor(C.white).text(`Rp ${fmtP(stat.totalStockValue)}`, 300, y + 3, { width: 240, align: 'right' })
  y += 35

  const statusCfg = {
    completed: { lbl: '[Selesai]', bg: C.greenBg, fg: C.green },
    pending: { lbl: '[Pending]', bg: C.amberBg, fg: C.amber },
    cancelled: { lbl: '[Batal]', bg: C.redBg, fg: C.red },
    confirmed: { lbl: '[Konfirmasi]', bg: C.blueBg, fg: C.blue },
    processing: { lbl: '[Proses]', bg: C.orangeBg, fg: C.orange }
  }
  const orderCounts = {}
  for (const o of (ord.orders || [])) orderCounts[o.status] = (orderCounts[o.status] || 0) + 1
  const totalOrd = stat.totalOrders || 1

  doc.save().rect(50, y, 495, 18).fill(C.navy).restore()
  doc.fontSize(10).fillColor(C.white).text('DISTRIBUSI STATUS PESANAN', 60, y + 3)
  y += 25

  const pieLabels = [], pieVals = [], pieColors = []
  let si = 0
  for (const [st, cnt] of Object.entries(orderCounts).sort((a, b) => b[1] - a[1])) {
    const sc = statusCfg[st] || { lbl: st, bg: C.altRow, fg: C.muted }
    const alt = si % 2 === 1 ? C.altRow : C.offWhite
    doc.save().rect(50, y, 495, 16).fill(alt).restore()
    doc.fontSize(9).fillColor(sc.fg).text(sc.lbl, 60, y + 3)
    doc.fontSize(9).fillColor(C.text).text(String(cnt), 250, y + 3, { width: 50, align: 'center' })
    doc.fontSize(9).fillColor(C.text).text(`${((cnt / totalOrd) * 100).toFixed(1)}%`, 300, y + 3, { width: 50, align: 'center' })
    pieLabels.push(sc.lbl); pieVals.push(cnt); pieColors.push(sc.fg)
    y += 16; si++
  }

  if (pieLabels.length > 0) {
    const pieBuf = renderChart({ type: 'pie', data: { labels: pieLabels, datasets: [{ data: pieVals, backgroundColor: pieColors }] }, options: { plugins: { legend: { position: 'right' } } } }, 400, 200)
    doc.image(pieBuf, 120, y + 10, { width: 350, height: 175 })
    y += 200
  } else { y += 10 }

  doc.addPage()
  y = 60
  pageHeader(doc, 'RINGKASAN & STATISTIK TOKO (Lanjutan)', `Dicetak: ${new Date().toLocaleString('id-ID')}`)

  const allItems = []
  for (const cat of Object.values(cats)) for (const it of (cat.items || [])) allItems.push({ ...it, catName: cat.name })
  allItems.sort((a, b) => (b.sold || 0) - (a.sold || 0))
  const top5 = allItems.slice(0, 5)
  const medals = ['1st', '2nd', '3rd', '4th', '5th']

  doc.save().rect(50, y, 495, 18).fill(C.navy).restore()
  doc.fontSize(10).fillColor(C.white).text('TOP 5 PRODUK TERLARIS', 60, y + 3)
  y += 25

  const barLabels = [], barValues = []
  top5.forEach((it, i) => {
    const alt = i % 2 === 1 ? C.altRow : C.offWhite
    doc.save().rect(50, y, 495, 16).fill(alt).restore()
    doc.fontSize(10).fillColor(C.amber).text(medals[i], 60, y + 2, { width: 30, align: 'center' })
    doc.fontSize(9).fillColor(C.text).text(`${it.catName} - ${it.name}`, 95, y + 3)
    doc.fontSize(10).fillColor(C.navy).text(String(it.sold || 0), 450, y + 2, { width: 80, align: 'right' })
    barLabels.push(it.name); barValues.push(it.sold || 0)
    y += 16
  })

  if (barLabels.length > 0) {
    const colBuf = renderChart({ type: 'bar', data: { labels: barLabels, datasets: [{ label: 'Terjual', data: barValues, backgroundColor: C.blue }] }, options: { indexAxis: 'x', plugins: { legend: { display: false } } } }, 400, 200)
    doc.image(colBuf, 120, y + 10, { width: 350, height: 175 })
    y += 200
  }

  const catRevs = []
  for (const [cid, cat] of Object.entries(cats)) {
    let rev = 0; for (const it of (cat.items || [])) rev += it.price * (it.sold || 0)
    catRevs.push({ name: cat.name, items: (cat.items || []).length, rev })
  }
  catRevs.sort((a, b) => b.rev - a.rev)

  doc.save().rect(50, y, 495, 18).fill(C.navy).restore()
  doc.fontSize(10).fillColor(C.white).text('PENDAPATAN PER KATEGORI', 60, y + 3)
  y += 25

  const hBarLabels = [], hBarValues = []
  catRevs.forEach((cr, i) => {
    const alt = i % 2 === 1 ? C.altRow : C.offWhite
    doc.save().rect(50, y, 495, 16).fill(alt).restore()
    doc.fontSize(9).fillColor(C.text).text(cr.name, 60, y + 3)
    doc.fontSize(9).fillColor(C.text).text(String(cr.items), 300, y + 3, { width: 50, align: 'center' })
    doc.fontSize(9).fillColor(C.green).text(`Rp ${fmtP(cr.rev)}`, 400, y + 3, { width: 130, align: 'right' })
    hBarLabels.push(cr.name); hBarValues.push(cr.rev)
    y += 16
  })

  if (hBarLabels.length > 0) {
    const hBarBuf = renderChart({ type: 'bar', data: { labels: hBarLabels, datasets: [{ label: 'Revenue', data: hBarValues, backgroundColor: C.green }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } } } }, 400, Math.max(150, catRevs.length * 40))
    doc.image(hBarBuf, 120, y + 10, { width: 350, height: Math.min(200, catRevs.length * 35) })
    y += Math.min(220, catRevs.length * 40)
  }

  const revByDate = {}
  for (const o of (ord.orders || [])) {
    if (o.status === 'completed' && o.createdAt) {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      revByDate[key] = (revByDate[key] || 0) + (o.total || 0)
    }
  }
  const sortedDates = Object.keys(revByDate).sort()

  if (sortedDates.length >= 2) {
    doc.addPage()
    y = 60
    pageHeader(doc, 'TREN REVENUE HARIAN', `Dicetak: ${new Date().toLocaleString('id-ID')}`)
    
    doc.save().rect(50, y, 495, 18).fill(C.navy).restore()
    doc.fontSize(10).fillColor(C.white).text('DATA TREN REVENUE', 60, y + 3)
    y += 25

    const lineLabels = [], lineValues = [], cumValues = []; let cum = 0
    sortedDates.forEach((dt, i) => {
      const v = revByDate[dt]; cum += v
      const alt = i % 2 === 1 ? C.altRow : C.offWhite
      doc.save().rect(50, y, 495, 16).fill(alt).restore()
      doc.fontSize(9).fillColor(C.text).text(dt, 60, y + 3, { width: 100 })
      doc.fontSize(9).fillColor(C.text).text(`Rp ${fmtP(v)}`, 200, y + 3, { width: 120, align: 'right' })
      doc.fontSize(9).fillColor(C.navy).text(`Rp ${fmtP(cum)}`, 380, y + 3, { width: 150, align: 'right' })
      lineLabels.push(dt); lineValues.push(v); cumValues.push(cum)
      y += 16
    })

    y += 10
    const lineBuf = renderChart({ type: 'line', data: { labels: lineLabels, datasets: [{ label: 'Harian', data: lineValues, borderColor: C.blue }, { label: 'Kumulatif', data: cumValues, borderColor: C.green }] }, options: { plugins: { legend: { position: 'top' } } } }, 500, 250)
    doc.image(lineBuf, 50, y, { width: 495, height: 250 })
  }
}

export async function generateRekapPdf(cats, ord, stat) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true })
  
  const chunks = []
  doc.on('data', chunk => chunks.push(chunk))
  
  pageKatalog(doc, cats)
  pagePesanan(doc, ord)
  await pageStatistik(doc, cats, ord, stat)
  
  doc.end()
  await new Promise(resolve => doc.on('finish', resolve))
  
  const buffer = Buffer.concat(chunks)
  const filename = `rekap-store-${Date.now()}.pdf`
  const filePath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(filePath, buffer)
  return { filePath, filename, buffer }
}