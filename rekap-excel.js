// src/lib/file.js
import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'

const OUTPUT_DIR = path.join(process.cwd(), 'storage', 'excel')

const P = {
  navy: 'FF1B2A4A', navyMid: 'FF2D4A7A', accent: 'FF3B82F6',
  white: 'FFFFFFFF', offWhite: 'FFFAFBFC', altRow: 'FFF1F5F9',
  border: 'FFE2E8F0', text: 'FF1E293B', muted: 'FF64748B', light: 'FF94A3B8',
  green: 'FF059669', greenBg: 'FFECFDF5', red: 'FFDC2626', redBg: 'FFFEF2F2',
  amber: 'FFD97706', amberBg: 'FFFFF7ED', blue: 'FF2563EB', blueBg: 'FFEFF6FF',
  purple: 'FF7C3AED', purpleBg: 'FFFAF5FF', orange: 'FFEA580C', orangeBg: 'FFFFF7ED',
  catBg: 'FFEEF2FF', catFg: 'FF3730A3', subBg: 'FFF8FAFC',
  grandBg: 'FFFEF9C3', grandBdr: 'FFCA8A04', kpiYellow: 'FFFEF3C7',
}

const bdr = (color = P.border, style = 'thin') => ({
  top: { style, color: { argb: color } }, left: { style, color: { argb: color } },
  bottom: { style, color: { argb: color } }, right: { style, color: { argb: color } },
})
const noBdr = {
  top: { style: 'none' }, left: { style: 'none' },
  bottom: { style: 'none' }, right: { style: 'none' },
}

const sTitle = (sz = 14) => ({
  font: { bold: true, size: sz, color: { argb: P.navy } },
  alignment: { horizontal: 'left', vertical: 'middle' }, border: noBdr,
})
const sSub = () => ({
  font: { size: 9, color: { argb: P.muted }, italic: true },
  alignment: { horizontal: 'left', vertical: 'middle' }, border: noBdr,
})
const sColHdr = () => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navy } },
  font: { bold: true, size: 10, color: { argb: P.white } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: bdr(),
})
const sSection = (bg = P.navy) => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
  font: { bold: true, size: 11, color: { argb: P.white } },
  alignment: { horizontal: 'left', vertical: 'middle' }, border: bdr(),
})
const sData = (alt = false) => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: alt ? P.altRow : P.offWhite } },
  font: { size: 10, color: { argb: P.text } },
  alignment: { vertical: 'middle', wrapText: true }, border: bdr(),
})
const sCatGrp = () => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.catBg } },
  font: { bold: true, size: 10, color: { argb: P.catFg } },
  alignment: { vertical: 'middle' }, border: bdr(),
})
const sSubtotal = () => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.subBg } },
  font: { bold: true, size: 10, color: { argb: P.text } },
  alignment: { vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: P.border } }, left: { style: 'thin', color: { argb: P.border } },
    bottom: { style: 'double', color: { argb: P.navy } }, right: { style: 'thin', color: { argb: P.border } },
  },
})
const sGrand = () => ({
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.grandBg } },
  font: { bold: true, size: 11, color: { argb: P.navy } },
  alignment: { vertical: 'middle' }, border: bdr(P.grandBdr, 'medium'),
})

function sStatus(status) {
  const m = {
    completed: { bg: P.greenBg, fg: P.green, t: '✓ Selesai' },
    cancelled: { bg: P.redBg, fg: P.red, t: '✗ Batal' },
    pending: { bg: P.amberBg, fg: P.amber, t: '◷ Pending' },
    confirmed: { bg: P.blueBg, fg: P.blue, t: '● Konfirmasi' },
    processing: { bg: P.orangeBg, fg: P.orange, t: '⟳ Proses' },
  }
  const s = m[status] || { bg: P.altRow, fg: P.muted, t: status }
  return {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: s.bg } },
    font: { bold: true, size: 9, color: { argb: s.fg } },
    alignment: { horizontal: 'center', vertical: 'middle' }, border: bdr(), _label: s.t,
  }
}

function ap(cell, style) {
  for (const [k, v] of Object.entries(style)) { if (k !== '_label') cell[k] = v }
}
function apRow(row, style, from = 1, to = 20) {
  for (let c = from; c <= to; c++) ap(row.getCell(c), style)
}
function hA(row, col, a) {
  const cell = row.getCell(col)
  cell.alignment = { ...cell.alignment, horizontal: a }
}
function mg(ws, range, val, style) {
  ws.mergeCells(range)
  const cell = ws.getCell(range.split(':')[0])
  cell.value = val
  ap(cell, style)
  return cell
}
function fmtP(n) { return Number(n).toLocaleString('id-ID') }
function fmtD(iso) { return iso ? new Date(iso).toLocaleString('id-ID') : '-' }
function safeChart(ws, chart) { try { ws.addChart(chart) } catch (_) {} }

function sheetKatalog(wb, cats) {
  const ws = wb.addWorksheet('Katalog Produk', {
    properties: { defaultRowHeight: 21 }, views: [{ state: 'frozen', ySplit: 3 }],
  })
  const cols = [
    { header: 'No', width: 5 }, { header: 'Kategori', width: 18 }, { header: 'Emoji', width: 6 },
    { header: 'ID Produk', width: 14 }, { header: 'Nama Produk', width: 26 }, { header: 'Deskripsi', width: 32 },
    { header: 'Harga (Rp)', width: 15 }, { header: 'Stok', width: 8 }, { header: 'Terjual', width: 9 },
    { header: 'Nilai Stok', width: 15 }, { header: 'Pendapatan', width: 17 },
  ]
  ws.columns = cols
  ws.spliceRows(1, 0, [])
  mg(ws, 'A1:K1', '📦  KATALOG PRODUK', { ...sTitle(14), fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.white } } })
  ws.getRow(1).height = 34
  mg(ws, 'A2:K2', `Dicetak: ${new Date().toLocaleString('id-ID')}`, sSub())
  ws.getRow(2).height = 17
  const hr = ws.getRow(3); hr.height = 28
  cols.forEach((c, i) => { const cell = hr.getCell(i + 1); cell.value = c.header; ap(cell, sColHdr()) })

  let r = 4, idx = 0, gStok = 0, gVal = 0, gRev = 0
  for (const [catId, cat] of Object.entries(cats)) {
    const items = cat.items || []
    mg(ws, `B${r}:K${r}`, `${cat.emoji || ''}  ${cat.name}`, sCatGrp())
    ap(ws.getRow(r).getCell(1), { ...sCatGrp(), fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.catBg } } })
    ws.getRow(r).getCell(1).value = ''; ws.getRow(r).height = 23; r++

    if (!items.length) {
      const er = ws.getRow(r); er.getCell(5).value = '(belum ada item)'; apRow(er, sData(), 1, 11); r++
      mg(ws, `B${r}:K${r}`, `Subtotal ${cat.name}`, sSubtotal())
      ap(ws.getRow(r).getCell(1), sSubtotal()); ws.getRow(r).getCell(1).value = ''; r += 2; continue
    }

    let cStok = 0, cVal = 0, cRev = 0
    items.forEach((it, ii) => {
      idx++; const sv = it.price * it.stock; const rv = it.price * (it.sold || 0)
      gStok += it.stock; gVal += sv; gRev += rv; cStok += it.stock; cVal += sv; cRev += rv
      const row = ws.getRow(r)
      row.getCell(1).value = idx; row.getCell(2).value = ''; row.getCell(3).value = it.emoji || ''
      row.getCell(4).value = it.id; row.getCell(5).value = it.name; row.getCell(6).value = it.description || ''
      row.getCell(7).value = it.price; row.getCell(8).value = it.stock; row.getCell(9).value = it.sold || 0
      row.getCell(10).value = sv; row.getCell(11).value = rv
      const alt = ii % 2 === 1; apRow(row, sData(alt), 1, 11)
      hA(row, 1, 'center'); hA(row, 3, 'center'); hA(row, 7, 'right')
      hA(row, 8, 'center'); hA(row, 9, 'center'); hA(row, 10, 'right'); hA(row, 11, 'right')
      row.getCell(7).numFmt = '#,##0'; row.getCell(10).numFmt = '#,##0'; row.getCell(11).numFmt = '#,##0'
      if (it.stock === 0) {
        ap(row.getCell(8), { ...sData(alt), font: { bold: true, size: 10, color: { argb: P.red } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.redBg } } })
      } else if (it.stock <= 3) {
        ap(row.getCell(8), { ...sData(alt), font: { bold: true, size: 10, color: { argb: P.amber } } })
      }
      r++
    })
    const sr = ws.getRow(r)
    mg(ws, `B${r}:G${r}`, `  Subtotal ${cat.name}`, sSubtotal())
    ap(ws.getRow(r).getCell(1), sSubtotal()); ws.getRow(r).getCell(1).value = ''
    sr.getCell(8).value = cStok; sr.getCell(9).value = items.reduce((s, i) => s + (i.sold || 0), 0)
    sr.getCell(10).value = cVal; sr.getCell(11).value = cRev
    hA(sr, 8, 'center'); hA(sr, 9, 'center'); hA(sr, 10, 'right'); hA(sr, 11, 'right')
    sr.getCell(10).numFmt = '#,##0'; sr.getCell(11).numFmt = '#,##0'; sr.height = 22; r += 2
  }
  r++; const gr = ws.getRow(r)
  mg(ws, `B${r}:G${r}`, '  GRAND TOTAL', sGrand())
  ap(ws.getRow(r).getCell(1), sGrand()); ws.getRow(r).getCell(1).value = ''
  gr.getCell(8).value = gStok; gr.getCell(10).value = gVal; gr.getCell(11).value = gRev
  hA(gr, 8, 'center'); hA(gr, 10, 'right'); hA(gr, 11, 'right')
  gr.getCell(10).numFmt = '#,##0'; gr.getCell(11).numFmt = '#,##0'; gr.height = 30
}

function sheetPesanan(wb, ord) {
  const ws = wb.addWorksheet('Pesanan', {
    properties: { defaultRowHeight: 21 }, views: [{ state: 'frozen', ySplit: 3 }],
  })
  const cols = [
    { header: 'No', width: 5 }, { header: 'Order ID', width: 22 }, { header: 'Status', width: 16 },
    { header: 'Pembeli', width: 18 }, { header: 'No. HP', width: 15 }, { header: 'Kategori', width: 16 },
    { header: 'Produk', width: 24 }, { header: 'Qty', width: 6 }, { header: 'Harga (Rp)', width: 14 },
    { header: 'Total (Rp)', width: 15 }, { header: 'Dibuat', width: 20 }, { header: 'Dikonfirmasi', width: 20 },
    { header: 'Selesai', width: 20 },
  ]
  ws.columns = cols
  mg(ws, 'A1:M1', '🧾  DAFTAR PESANAN', { ...sTitle(14), fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.white } } })
  ws.getRow(1).height = 34
  mg(ws, 'A2:M2', `Dicetak: ${new Date().toLocaleString('id-ID')}`, sSub())
  ws.getRow(2).height = 17
  const hr = ws.getRow(3); hr.height = 28
  cols.forEach((c, i) => { const cell = hr.getCell(i + 1); cell.value = c.header; ap(cell, sColHdr()) })
  const orders = (ord.orders || []).slice().reverse()
  let r = 4
  orders.forEach((o, i) => {
    const row = ws.getRow(r); const alt = i % 2 === 1
    row.getCell(1).value = i + 1; row.getCell(2).value = o.orderId; row.getCell(3).value = o.status
    row.getCell(4).value = o.pushName; row.getCell(5).value = o.senderNum; row.getCell(6).value = o.categoryName
    row.getCell(7).value = o.itemName; row.getCell(8).value = o.qty; row.getCell(9).value = o.price
    row.getCell(10).value = o.total; row.getCell(11).value = fmtD(o.createdAt)
    row.getCell(12).value = fmtD(o.confirmedAt); row.getCell(13).value = fmtD(o.completedAt)
    apRow(row, sData(alt), 1, 13)
    const st = sStatus(o.status); ap(row.getCell(3), st); row.getCell(3).value = st._label
    hA(row, 1, 'center'); hA(row, 8, 'center'); hA(row, 9, 'right'); hA(row, 10, 'right')
    row.getCell(9).numFmt = '#,##0'; row.getCell(10).numFmt = '#,##0'; r++
  })
  if (orders.length) ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + orders.length - 1, column: 13 } }
}

function sheetStatistik(wb, cats, ord, stat) {
  const ws = wb.addWorksheet('Ringkasan & Statistik', { properties: { defaultRowHeight: 21 } })
  ;[1, 4, 7, 10].forEach(c => ws.getColumn(c).width = 2)
  ws.getColumn(2).width = 14; ws.getColumn(3).width = 14
  ws.getColumn(5).width = 14; ws.getColumn(6).width = 14
  ws.getColumn(8).width = 14; ws.getColumn(9).width = 14
  let r = 1
  mg(ws, 'A1:I1', '📊  RINGKASAN & STATISTIK TOKO', { ...sTitle(16), fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.white } } })
  ws.getRow(1).height = 40
  mg(ws, 'A2:I2', `Dicetak: ${new Date().toLocaleString('id-ID')}`, sSub())
  ws.getRow(2).height = 17; r = 4

  const kpis = [
    { lbl: 'Kategori', val: String(stat.totalCategories), bg: P.blueBg, fg: P.blue },
    { lbl: 'Produk', val: String(stat.totalItems), bg: P.purpleBg, fg: P.purple },
    { lbl: 'Stok', val: String(stat.totalStock), bg: P.greenBg, fg: P.green },
    { lbl: 'Order', val: String(stat.totalOrders), bg: P.orangeBg, fg: P.orange },
  ]
  const kb = [['B', 'C'], ['D', 'E'], ['F', 'G'], ['H', 'I']]
  ws.getRow(r).height = 46
  kpis.forEach((k, i) => {
    const [c1, c2] = kb[i]
    mg(ws, `${c1}${r}:${c2}${r}`, k.val, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } },
      font: { bold: true, size: 22, color: { argb: k.fg } },
      alignment: { horizontal: 'center', vertical: 'middle' }, border: noBdr,
    })
  }); r++
  ws.getRow(r).height = 18
  kpis.forEach((k, i) => {
    const [c1, c2] = kb[i]
    mg(ws, `${c1}${r}:${c2}${r}`, k.lbl, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.white } },
      font: { size: 9, color: { argb: k.fg }, bold: true },
      alignment: { horizontal: 'center', vertical: 'middle' }, border: noBdr,
    })
  }); r += 2

  mg(ws, `B${r}:I${r}`, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navy } }, border: noBdr })
  ws.getRow(r).height = 3; r++
  mg(ws, `B${r}:E${r}`, '  💰  TOTAL PENDAPATAN', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navy } },
    font: { bold: true, size: 12, color: { argb: P.white } },
    alignment: { horizontal: 'left', vertical: 'middle' }, border: noBdr,
  })
  mg(ws, `F${r}:I${r}`, `Rp ${fmtP(stat.totalRevenue)}`, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navy } },
    font: { bold: true, size: 16, color: { argb: P.kpiYellow } },
    alignment: { horizontal: 'right', vertical: 'middle' }, border: noBdr,
  })
  ws.getRow(r).height = 36; r++
  mg(ws, `B${r}:I${r}`, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navy } }, border: noBdr })
  ws.getRow(r).height = 3; r += 2
  mg(ws, `B${r}:E${r}`, '  📦  NILAI TOTAL STOK', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navyMid } },
    font: { bold: true, size: 11, color: { argb: P.white } },
    alignment: { horizontal: 'left', vertical: 'middle' }, border: noBdr,
  })
  mg(ws, `F${r}:I${r}`, `Rp ${fmtP(stat.totalStockValue)}`, {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: P.navyMid } },
    font: { bold: true, size: 14, color: { argb: P.white } },
    alignment: { horizontal: 'right', vertical: 'middle' }, border: noBdr,
  })
  ws.getRow(r).height = 30; r += 3

  mg(ws, `B${r}:I${r}`, '  📋  DISTRIBUSI STATUS PESANAN', sSection()); ws.getRow(r).height = 26; r++
  mg(ws, `B${r}:C${r}`, 'Status', sColHdr()); mg(ws, `D${r}:E${r}`, 'Jumlah', sColHdr())
  mg(ws, `F${r}:G${r}`, 'Persentase', sColHdr()); ap(ws.getCell(`H${r}`), sColHdr()); ap(ws.getCell(`I${r}`), sColHdr())
  ws.getRow(r).height = 24; r++
  const statusCfg = {
    completed: { lbl: '✓ Selesai', bg: P.greenBg, fg: P.green },
    pending: { lbl: '◷ Pending', bg: P.amberBg, fg: P.amber },
    cancelled: { lbl: '✗ Batal', bg: P.redBg, fg: P.red },
    confirmed: { lbl: '● Konfirmasi', bg: P.blueBg, fg: P.blue },
    processing: { lbl: '⟳ Proses', bg: P.orangeBg, fg: P.orange },
  }
  const orderCounts = {}
  for (const o of (ord.orders || [])) orderCounts[o.status] = (orderCounts[o.status] || 0) + 1
  const totalOrd = stat.totalOrders || 1
  const chartLabels = [], chartValues = []; let si = 0
  for (const [st, cnt] of Object.entries(orderCounts).sort((a, b) => b[1] - a[1])) {
    const sc = statusCfg[st] || { lbl: st, bg: P.altRow, fg: P.muted }
    const pct = ((cnt / totalOrd) * 100).toFixed(1); const alt = si % 2 === 1
    mg(ws, `B${r}:C${r}`, `  ${sc.lbl}`, { ...sData(alt), font: { bold: true, size: 10, color: { argb: sc.fg } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } } })
    mg(ws, `D${r}:E${r}`, cnt, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'center' } })
    mg(ws, `F${r}:G${r}`, `${pct}%`, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'center' } })
    ap(ws.getCell(`H${r}`), sData(alt)); ap(ws.getCell(`I${r}`), sData(alt))
    chartLabels.push(sc.lbl); chartValues.push(cnt); r++; si++
  }
  if (chartLabels.length) { safeChart(ws, { type: 'pie', id: 'pieStatus', data: { labels: chartLabels, datasets: [{ label: 'Jumlah', data: chartValues }] }, options: { title: { text: 'Distribusi Status Pesanan' }, width: 14, height: 10 } }); r += 12 }
  r += 2

  mg(ws, `B${r}:I${r}`, '  🏆  TOP 5 PRODUK TERLARIS', sSection()); ws.getRow(r).height = 26; r++
  mg(ws, `B${r}:C${r}`, 'Peringkat', sColHdr()); mg(ws, `D${r}:G${r}`, 'Produk', sColHdr())
  mg(ws, `H${r}:I${r}`, 'Terjual', sColHdr()); ws.getRow(r).height = 24; r++
  const allItems = []
  for (const cat of Object.values(cats)) for (const it of (cat.items || [])) allItems.push({ ...it, catName: cat.name, catEmoji: cat.emoji || '' })
  allItems.sort((a, b) => (b.sold || 0) - (a.sold || 0)); const top5 = allItems.slice(0, 5)
  const medals = ['🥇', '🥈', '🥉']
  const rankFg = [P.amber, P.muted, P.orange, P.text, P.text]
  const rankBg = [P.kpiYellow, P.altRow, P.orangeBg, P.offWhite, P.altRow]
  const barLabels = [], barValues = []
  top5.forEach((it, i) => {
    const alt = i % 2 === 1; const medal = medals[i] || `${i + 1}.`
    const nm = it.name.length > 28 ? it.name.slice(0, 28) + '…' : it.name
    mg(ws, `B${r}:C${r}`, medal, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: rankBg[i] } }, font: { bold: true, size: 14, color: { argb: rankFg[i] } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: bdr() })
    mg(ws, `D${r}:G${r}`, `${it.catEmoji} ${it.catName} — ${it.name}`, sData(alt))
    mg(ws, `H${r}:I${r}`, it.sold || 0, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'center' }, font: { bold: true, size: 11, color: { argb: P.navy } } })
    barLabels.push(nm); barValues.push(it.sold || 0); r++
  })
  if (barLabels.length) { safeChart(ws, { type: 'col', id: 'barTop5', data: { labels: barLabels, datasets: [{ label: 'Terjual', data: barValues }] }, options: { title: { text: 'Top 5 Produk Terlaris' }, width: 14, height: 10 } }); r += 12 }
  r += 2

  mg(ws, `B${r}:I${r}`, '  💰  PENDAPATAN PER KATEGORI', sSection()); ws.getRow(r).height = 26; r++
  mg(ws, `B${r}:C${r}`, 'Kategori', sColHdr()); mg(ws, `D${r}:E${r}`, 'Item', sColHdr())
  mg(ws, `F${r}:G${r}`, 'Pendapatan', sColHdr()); ap(ws.getCell(`H${r}`), sColHdr()); ap(ws.getCell(`I${r}`), sColHdr())
  ws.getRow(r).height = 24; r++
  const catRevs = []
  for (const [cid, cat] of Object.entries(cats)) {
    let rev = 0; for (const it of (cat.items || [])) rev += it.price * (it.sold || 0)
    catRevs.push({ name: `${cat.emoji || ''} ${cat.name}`, items: (cat.items || []).length, rev })
  }
  catRevs.sort((a, b) => b.rev - a.rev)
  const hBarLabels = [], hBarValues = []
  catRevs.forEach((cr, i) => {
    const alt = i % 2 === 1
    mg(ws, `B${r}:C${r}`, `  ${cr.name}`, sData(alt))
    mg(ws, `D${r}:E${r}`, cr.items, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'center' } })
    mg(ws, `F${r}:G${r}`, `Rp ${fmtP(cr.rev)}`, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'right' }, font: { bold: true, color: { argb: P.green } } })
    ap(ws.getCell(`H${r}`), sData(alt)); ap(ws.getCell(`I${r}`), sData(alt))
    hBarLabels.push(cr.name.length > 18 ? cr.name.slice(0, 18) + '…' : cr.name); hBarValues.push(cr.rev); r++
  })
  if (hBarLabels.length) { safeChart(ws, { type: 'bar', id: 'hBarCatRev', data: { labels: hBarLabels, datasets: [{ label: 'Pendapatan (Rp)', data: hBarValues }] }, options: { title: { text: 'Pendapatan per Kategori' }, width: 14, height: Math.max(10, catRevs.length * 1.5) } }); r += Math.max(12, catRevs.length * 2) }
  r += 2

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
    mg(ws, `B${r}:I${r}`, '  📈  TREN REVENUE HARIAN', sSection()); ws.getRow(r).height = 26; r++
    mg(ws, `B${r}:C${r}`, 'Tanggal', sColHdr()); mg(ws, `D${r}:E${r}`, 'Revenue', sColHdr())
    mg(ws, `F${r}:G${r}`, 'Kumulatif', sColHdr()); ap(ws.getCell(`H${r}`), sColHdr()); ap(ws.getCell(`I${r}`), sColHdr())
    ws.getRow(r).height = 24; r++
    const lineLabels = [], lineValues = [], cumValues = []; let cum = 0
    sortedDates.forEach((dt, i) => {
      const v = revByDate[dt]; cum += v; const alt = i % 2 === 1
      mg(ws, `B${r}:C${r}`, dt, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'center' } })
      mg(ws, `D${r}:E${r}`, `Rp ${fmtP(v)}`, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'right' } })
      mg(ws, `F${r}:G${r}`, `Rp ${fmtP(cum)}`, { ...sData(alt), alignment: { ...sData(alt).alignment, horizontal: 'right' }, font: { bold: true, color: { argb: P.navy } } })
      ap(ws.getCell(`H${r}`), sData(alt)); ap(ws.getCell(`I${r}`), sData(alt))
      lineLabels.push(dt); lineValues.push(v); cumValues.push(cum); r++
    })
    safeChart(ws, { type: 'line', id: 'lineRevDaily', data: { labels: lineLabels, datasets: [{ label: 'Revenue Harian', data: lineValues }, { label: 'Kumulatif', data: cumValues }] }, options: { title: { text: 'Tren Revenue Harian' }, width: 16, height: 10 } })
    safeChart(ws, { type: 'area', id: 'areaRevCum', data: { labels: lineLabels, datasets: [{ label: 'Revenue Kumulatif', data: cumValues }] }, options: { title: { text: 'Revenue Kumulatif' }, width: 16, height: 10 } })
  }
}

export async function generateRekapExcel(cats, ord, stat) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Store Bot'; wb.created = new Date()
  sheetKatalog(wb, cats)
  sheetPesanan(wb, ord)
  sheetStatistik(wb, cats, ord, stat)
  const filename = `rekap-store-${Date.now()}.xlsx`
  const filePath = path.join(OUTPUT_DIR, filename)
  await wb.xlsx.writeFile(filePath)
  return { filePath, filename, buffer: fs.readFileSync(filePath) }
}