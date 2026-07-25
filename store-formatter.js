import { fmtPrice, fmtPct, fmtNum, percentOf, compareGrowth } from './math.js'
import { getAverageRating } from './review-store.js'

const SANS = {
  A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',
  N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹',
  a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',
  n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',
}

export function sf(t) { return String(t).split('').map(c => SANS[c] ?? c).join('') }

export function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone:'Asia/Jakarta' })
}
export function nowDate() {
  return new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta' })
}

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const DIV  = `  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ۪ ᳀  ִֶָ ִ  ۫   ᮫    ׂ  ۪  ִֶָ ׁ  ּ`
const DIV2 = `  ۪  ִֶָ ׁ ּ ֗ ִ ۫ ִֶָ ִ ۪ ᳀ ִֶָ ִ ۫`

function statusIcon(s) {
  return { pending_user: '⏳', pending_owner: '🔔', completed: '✅', cancelled: '❌' }[s] || '❓'
}

function renderCatalogBox(items, emoji) {
  const lines = [`╭┅ ${emoji} 𝅄 ꞌꞋ𝓒𝗮𝘁𝗮𝗹𝗼𝗴𝘂𝗲'𝗌 ꘓꘓ ˒˓`]
  items.forEach(item => lines.push(`┃ ප  ${item}`))
  lines.push(`╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`)
  return lines.join('\n')
}

// ❌ HAPUS renderProductBox yang lama, karena sudah tidak digunakan
// function renderProductBox(catName, items) { ... }  ← HAPUS INI

function template1({ pushName, content, note, catEmoji = '🩰' }) {
  return [
    ` ⁠ ⁠   ֪ ⁠  ⡞⠉⠓⢦⣀⣀⣀⡴⠊⠉⢦ `,
    `  ⁠   ⁠  ⡇  ⁠ ⁠  ⢈⣽⣿⠉⣿⣏  ⁠   ⣸ ֪ `,
    ` ⁠  ⁠     ⠹⠤⢴⠞⢹⠿⡍⠳⡦⠴⠏ ⁺ִ 𝖼⃘𐑋‎ ${sf('see the')} *${sf('list')}* ${sf('bubby')}`,
    ` ⁠  ⁠   ⁠   ⁠  ⁠  ֪ ⣃⡀⡏ ⁠   ⢷⢀⣹ ⁠  ֪  ⁠  *내 사정 내 사랑* 🎀 ₊˚⊹ `,
    ` ⁠  ⁠  ⁠    ⁠ ⁠    ⁠  ⁠ ⠛⠁  ⁠  ⠘⠋`,
    `˒˓ 𝝑᭪݁ ${sf('hayiie welcome')}─${sf('cuttie')}'${sf('s')} ៸៸ 𓄼.🌷`,
    `━┽ ꤥ‌ ⸼ ${sf('adorable\'s beautiful')} *${sf('list')}* ׂ 𓈒 ⸙ `,
    ``,
    ` ⁠  ⁠ 𐔌 ࣪˖⁩ ⸙ ${sf('user')} ⦂ @${pushName}`,
    ` ⁠  ⁠ 𐔌 ࣪˖⁩ ⸙ ${sf('time')} ⦂ ${nowTime()}`,
    ` ⁠  ⁠ 𐔌 ࣪˖⁩ ⸙ ${sf('date')} ⦂ ${nowDate()}`,
    ``,
    content,
    ``,
    ` ⁠  ⋮ ៸៸ 𓄼🪷 *${sf('cuttie\'s note')}* !! 𖥻 ᳀ ִֶָ`,
    ...note.map(n => ` ⁠  ִֶָ 𐀔 ${n}`),
  ].join('\n')
}

function template2({ pushName, content, note }) {
  return [
    `· 𖹠‌‎ׄ ֵ ⤾ ${sf('hey!')} ─ ${sf('ey sweetie')}`,
    `𝅄 ۫۫ ${sf('beautiful ocean shines')} ⸦ ᳘🌊`,
    ` ⡴⢤⠒⡤⢦ `,
    ` ⢠⠃⣠⠋ ⠘⡄${sf('beati¡full place')} `,
    ` ⠸⡄⡇ ⢀⠇ ₍ ${sf('hall')}𖦹 ${sf('kawai¡')} ֹ₎ `,
    `. ⢀⣀⣙⠺⠶⠖⣋⣀⡀┄𝆬─۪┈ ┄𝆬─۪┈ 𝅘𝅥𝅯`,
    ` ⠈⠉⠛⢽ ⡯⠛⠉⠁ ε⃘з ${sf('see the list')}`,
    ` ⠈⠤⠁`,
    ``,
    ` ${sf('user')} ⦂ @${pushName}  ·  ${sf('time')} ⦂ ${nowTime()}  ·  ${sf('date')} ⦂ ${nowDate()}`,
    ``,
    content,
    ``,
    `· 𖹠‌‎ׄ ֵ ⤾ ${sf('info')}`,
    ` ┄ 𝆬─۪┈ ┄ 𝆬─۪┈`,
    ...note.map(n => ` ˓ ✦ ${n}`),
    ` ┄ 𝆬─۪┈ ┄ 𝆬─۪┈`,
  ].join('\n')
}

function template3({ pushName, content, note, catName = 'pricelist' }) {
  return [
    `　‌‌  ‌, ´´; __ , ´´;`,
    `　‌ ;　𓂂 · ˔ · 𓂂 ‌ ‌ ;　‌꒰ ‌ ${sf('PriceList')}`,
    `　‌ ´　っ♡ c ‌ ‌ ‌\`            ${sf(catName)}       ꒱`,
    `·  ────── ♡♡♡ ────── · `,
    ``,
    ` ᓚ🪼ᓓ ꣖ ${sf('user')} ⦂ @${pushName} ꣓`,
    ` ᓚ🕰️ᓓ ꣖ ${sf('time')} ⦂ ${nowTime()} · ${nowDate()} ꣓`,
    ``,
    content,
    ``,
    `·  ────── ♡♡♡ ────── · `,
    `⤿ ${sf('noted')} ✿⃘  ${sf('for buyer')} 🔮`,
    ...note.map((n, i) => ` ˓ ${String(i + 1).padStart(2, '0')}. ${n}`),
  ].join('\n')
}

const TEMPLATES = [template1, template2, template3]
let _counter = 0

export function renderCatalog({ pushName, items, note = [], catEmoji = '🩰', catName = 'list' }) {
  const tpl     = TEMPLATES[_counter % TEMPLATES.length]
  _counter++
  const content = renderCatalogBox(items, catEmoji)
  return tpl({ pushName, content, note, catEmoji, catName })
}

// ✅ HANYA SATU renderProduct - versi dengan rating
export function renderProduct({ pushName, catId, catName, catEmoji = '🛒', items, note = [] }) {
  const tpl     = TEMPLATES[_counter % TEMPLATES.length]
  _counter++
  const lines = [`╭┅ ${catEmoji} 𝅄 ꞌꞋ${sf(catName)}ꞌꞋ ˒˓`]
  items.forEach((item, i) => {
    const stock = item.stock > 0 ? `✦ stok: ${item.stock}` : `✦ stok: habis`
    const disc  = item.discountPct > 0
      ? `  ~~${fmtPrice(item.originalPrice || item.price)}~~ ➜ *${fmtPrice(item.price)}* 🏷️ -${fmtPct(item.discountPct)}`
      : `*${fmtPrice(item.price)}*`
    const rating = getAverageRating(catId, item.id) // ✅ pakai catId dari parameter
    const stars = rating ? ' ⭐'.repeat(Math.round(rating)) + ` (${rating})` : ''
    lines.push(`┃ `)
    lines.push(`┃ [${i + 1}] ${sf(item.name)}${stars}`)
    if (item.description) lines.push(`┃    ↳ ${item.description}`)
    lines.push(`┃    ${sf('harga')} ⦂ ${disc}  ${stock}`)
    if (item.sku) lines.push(`┃    ${sf('sku')} ⦂ ${item.sku}`)
  })
  lines.push(`┃ `)
  lines.push(`╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`)
  const content = lines.join('\n')
  return tpl({ pushName, content, note, catEmoji, catName })
}

export function renderInvoice(order, step = 'created') {
  const status =
    step === 'created'   ? `⏳ ${sf('menunggu konfirmasi kamu')}`
    : step === 'confirmed' ? `✅ ${sf('dikonfirmasi')} — ${sf('menunggu owner')}`
    : step === 'completed' ? `🎉 ${sf('selesai')}`
    : `❌ ${sf('dibatalkan')}`

  const disc = Number(order.discountAmount || 0)
  const tax  = Number(order.taxAmount || 0)

  const lines = [
    `*❋  ׅ  ݊  ─ ${sf('INVOICE')} ʚଓ ּ ֶָ֢.*`,
    DIV,
    `─ 𐴲᭡ ${sf('order id')} ፡ \`${order.orderId}\``,
    `─ 𐴲᭡ ${sf('produk')} ፡ ${order.categoryName} — ${order.itemName}`,
    `─ 𐴲᭡ ${sf('deskripsi')} ፡ ${order.description || '-'}`,
    order.sku ? `─ 𐴲᭡ ${sf('sku')} ፡ ${order.sku}` : null,
    `─ 𐴲᭡ ${sf('qty')} ፡ ${order.qty}x`,
    `─ 𐴲᭡ ${sf('harga satuan')} ፡ ${fmtPrice(order.price)}`,
    disc > 0 ? `─ 𐴲᭡ ${sf('diskon')} ፡ -${fmtPrice(disc)} (${fmtPct(order.discountPct)})` : null,
    tax  > 0 ? `─ 𐴲᭡ ${sf('pajak')} ፡ +${fmtPrice(tax)} (${fmtPct(order.taxPct)})` : null,
    `─ 𐴲᭡ *${sf('total')}* ፡ *${fmtPrice(order.total)}*`,
    DIV,
    `─ 𐴲᭡ ${sf('pembeli')} ፡ ${order.pushName} (+${order.senderNum})`,
    `─ 𐴲᭡ ${sf('tanggal')} ፡ ${fmtDate(order.createdAt)}`,
    order.confirmedAt ? `─ 𐴲᭡ ${sf('konfirmasi')} ፡ ${fmtDate(order.confirmedAt)}` : null,
    order.completedAt ? `─ 𐴲᭡ ${sf('selesai')} ፡ ${fmtDate(order.completedAt)}` : null,
    `─ 𐴲᭡ ${sf('status')} ፡ ${status}`,
    order.note ? `─ 𐴲᭡ ${sf('catatan')} ፡ ${order.note}` : null,
    DIV,
  ].filter(Boolean)

  return lines.join('\n')
}

export function renderOrderNotif(order) {
  const disc = Number(order.discountAmount || 0)
  return [
    `🔔 *${sf('ORDER MASUK')}*`,
    DIV2,
    `─ 𐴲᭡ ${sf('id')} ፡ \`${order.orderId}\``,
    `─ 𐴲᭡ ${sf('produk')} ፡ ${order.categoryName} — ${order.itemName}`,
    disc > 0 ? `─ 𐴲᭡ ${sf('diskon')} ፡ -${fmtPrice(disc)}` : null,
    `─ 𐴲᭡ *${sf('total')}* ፡ *${fmtPrice(order.total)}*`,
    `─ 𐴲᭡ ${sf('pembeli')} ፡ ${order.pushName} (+${order.senderNum})`,
    `─ 𐴲᭡ ${sf('waktu')} ፡ ${fmtDate(order.confirmedAt || order.createdAt)}`,
    DIV2,
    `${sf('Balas dengan')}:`,
    `✅ \`.done ${order.orderId}\` — ${sf('selesaikan')}`,
    `❌ \`.cancel ${order.orderId} <alasan>\` — ${sf('batalkan')}`,
  ].filter(Boolean).join('\n')
}

export function renderMyOrders(orders, pushName) {
  const tpl  = TEMPLATES[_counter % TEMPLATES.length]
  _counter++

  if (!orders.length) {
    const content = [
      `╭┅ 📋 𝅄 ꞌꞋ${sf('My Orders')}ꞌꞋ ˒˓`,
      `┃ `,
      `┃  ${sf('belum ada order')} ✧`,
      `┃  ${sf('yuk mulai belanja!')} 🛍️`,
      `┃ `,
      `╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`,
    ].join('\n')
    return tpl({ pushName, content, note: ['ketik list untuk lihat produk', 'ketik .buy <produk>/<nomor> untuk beli'] })
  }

  const lines = [`╭┅ 📋 𝅄 ꞌꞋ${sf('My Orders')}ꞌꞋ ˒˓`]
  orders.slice(0, 10).forEach((o, i) => {
    lines.push(`┃ `)
    lines.push(`┃ [${i + 1}] ${statusIcon(o.status)} \`${o.orderId}\``)
    lines.push(`┃    ↳ ${o.categoryName} — ${o.itemName}`)
    lines.push(`┃    ${sf('total')} ⦂ *${fmtPrice(o.total)}*`)
    lines.push(`┃    ${sf('tanggal')} ⦂ ${fmtDate(o.createdAt)}`)
  })
  lines.push(`┃ `)
  lines.push(`╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`)

  const content = lines.join('\n')
  const total   = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const done    = orders.filter(o => o.status === 'completed').length

  return tpl({
    pushName,
    content,
    note: [
      `total order: ${orders.length} | selesai: ${done}`,
      `total belanja: ${fmtPrice(total)}`,
      `ketik .cekorder <id> untuk detail`,
    ],
  })
}

export function renderTopCustomers(customers, stats) {
  const tpl = TEMPLATES[_counter % TEMPLATES.length]
  _counter++

  const MEDALS = ['🥇','🥈','🥉']
  const lines  = [`╭┅ 👑 𝅄 ꞌꞋ${sf('Top Customer')}ꞌꞋ ˒˓`]

  customers.forEach((c, i) => {
    const medal   = MEDALS[i] || `${i + 1}.`
    const pct     = percentOf(c.total, stats.revenue)
    lines.push(`┃ `)
    lines.push(`┃ ${medal} ${sf(c.pushName || c.senderNum)}`)
    lines.push(`┃    +${c.senderNum}`)
    lines.push(`┃    ${sf('total belanja')} ⦂ *${fmtPrice(c.total)}*`)
    lines.push(`┃    ${sf('order')} ⦂ ${c.count}x  ·  ${sf('kontribusi')} ⦂ ${fmtPct(pct)}`)
  })
  lines.push(`┃ `)
  lines.push(`╰╍ ··⊹ ·· ┄ · 🍄 · ┄ · ⊹┄ ·· 𑣿 ׁ⸼`)

  const content = lines.join('\n')
  return tpl({
    pushName: 'store',
    content,
    note: [
      `total revenue: ${fmtPrice(stats.revenue)}`,
      `total order selesai: ${stats.completed}`,
      `rata-rata order: ${fmtPrice(stats.avgOrderValue)}`,
    ],
  })
}

export function renderInvoiceMulti(order, step = 'created') {
  const status =
    step === 'created'   ? `⏳ ${sf('menunggu konfirmasi kamu')}`
    : step === 'confirmed' ? `✅ ${sf('dikonfirmasi')} — ${sf('menunggu owner')}`
    : step === 'completed' ? `🎉 ${sf('selesai')}`
    : `❌ ${sf('dibatalkan')}`

  const lines = [
    `*❋  ׅ  ݊  ─ ${sf('INVOICE')} ʚଓ ּ ֶָ֢.*`,
    DIV,
    `─ 𐴲᭡ ${sf('order id')} ፡ \`${order.orderId}\``,
  ]

  for (const item of order.items) {
    lines.push(`─ 𐴲᭡ ${sf('item')} ፡ ${item.itemName} (${item.categoryName})`)
    lines.push(`   ${item.qty}x ${fmtPrice(item.price)} = ${fmtPrice(item.subtotal)}`)
    if (item.discountPct) lines.push(`   ${sf('diskon item')}: -${fmtPrice(item.discountAmount)} (${fmtPct(item.discountPct)})`)
  }

  if (order.discount) lines.push(`─ 𐴲᭡ ${sf('kupon diskon')} ፡ -${fmtPrice(order.discount)}`)
  lines.push(`─ 𐴲᭡ *${sf('total')}* ፡ *${fmtPrice(order.total)}*`)
  lines.push(DIV)
  lines.push(`─ 𐴲᭡ ${sf('pembeli')} ፡ ${order.pushName} (+${order.senderNum})`)
  lines.push(`─ 𐴲᭡ ${sf('tanggal')} ፡ ${fmtDate(order.createdAt)}`)
  if (order.couponCode) lines.push(`─ 𐴲᭡ ${sf('kode kupon')} ፡ ${order.couponCode}`)
  lines.push(`─ 𐴲᭡ ${sf('status')} ፡ ${status}`)
  return lines.filter(Boolean).join('\n')
}

export function renderOrderNotifMulti(order) {
  const lines = [
    `🔔 *${sf('ORDER MASUK (MULTI)')}*`,
    DIV2,
    `─ 𐴲᭡ ${sf('id')} ፡ \`${order.orderId}\``,
    `─ 𐴲᭡ ${sf('pembeli')} ፡ ${order.pushName} (+${order.senderNum})`,
    `─ 𐴲᭡ ${sf('items')}:`
  ]
  for (const item of order.items) {
    lines.push(`   - ${item.itemName} x${item.qty} = ${fmtPrice(item.subtotal)}`)
  }
  if (order.discount) lines.push(`─ 𐴲᭡ ${sf('diskon')} ፡ -${fmtPrice(order.discount)}`)
  lines.push(`─ 𐴲᭡ *${sf('total')}* ፡ *${fmtPrice(order.total)}*`)
  lines.push(DIV2)
  return lines.join('\n')
}

export function renderStoreStats(stats, prevStats = null) {
  const g = prevStats ? compareGrowth(stats.revenue, prevStats.revenue) : null
  const lines = [
    `*❋  ׅ  ݊  ─ ${sf('STORE STATS')} ʚ 𝅄 .*`,
    DIV,
    `─ 𐴲᭡ ${sf('total order')} ፡ ${fmtNum(stats.total)}`,
    `─ 𐴲᭡ ${sf('selesai')} ፡ ${fmtNum(stats.completed)} (${fmtPct(stats.conversionRate)})`,
    `─ 𐴲᭡ ${sf('pending')} ፡ ${fmtNum(stats.pendingOwner)}`,
    `─ 𐴲᭡ ${sf('dibatalkan')} ፡ ${fmtNum(stats.cancelled)} (${fmtPct(stats.cancelRate)})`,
    DIV,
    `─ 𐴲᭡ *${sf('total revenue')}* ፡ *${fmtPrice(stats.revenue)}*`,
    `─ 𐴲᭡ ${sf('rata-rata order')} ፡ ${fmtPrice(stats.avgOrderValue)}`,
    g ? `─ 𐴲᭡ ${sf('growth')} ፡ ${g.arrow} ${fmtPct(Math.abs(g.pct))} (${fmtPrice(Math.abs(g.diff))})` : null,
    DIV,
  ].filter(Boolean)

  return lines.join('\n')
}

export { fmtPrice, sf as toSans }