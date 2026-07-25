import config from '../../config.js'
import { fmtPrice } from './store-formatter.js'

const DIVIDER = `  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ׂ  ۪  ִֶָ ׁ  ּ`

const SANS = {
  a:'𝖺',b:'𝖻',c:'𝖼',d:'𝖽',e:'𝖾',f:'𝖿',g:'𝗀',h:'𝗁',i:'𝗂',j:'𝗃',k:'𝗄',l:'𝗅',m:'𝗆',
  n:'𝗇',o:'𝗈',p:'𝗉',q:'𝗊',r:'𝗋',s:'𝗌',t:'𝗍',u:'𝗎',v:'𝗏',w:'𝗐',x:'𝗑',y:'𝗒',z:'𝗓',
  A:'𝖠',B:'𝖡',C:'𝖢',D:'𝖣',E:'𝖤',F:'𝖥',G:'𝖦',H:'𝖧',I:'𝖨',J:'𝖩',K:'𝖪',L:'𝖫',M:'𝖬',
  N:'𝖭',O:'𝖮',P:'𝖯',Q:'𝖰',R:'𝖱',S:'𝖲',T:'𝖳',U:'𝖴',V:'𝖵',W:'𝖶',X:'𝖷',Y:'𝖸',Z:'𝖹',
}
const sf = t => String(t).split('').map(c => SANS[c] ?? c).join('')

function nowStr() {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
}

function getStoreJid() {
  const id = config.saluran?.store
  return id && id.includes('@newsletter') ? id : null
}

function getMainJid() {
  const id = config.saluran?.id
  return id && id.includes('@newsletter') ? id : null
}

function resolveJid(preferStore = true) {
  return preferStore
    ? getStoreJid() || getMainJid()
    : getMainJid() || getStoreJid()
}

async function send(sock, jid, content) {
  if (!jid) return { success: false, reason: 'channel_not_configured' }
  try {
    await sock.sendMessage(jid, content)
    return { success: true, jid }
  } catch (err) {
    console.error(`[CHANNEL] Gagal kirim ke ${jid}: ${err.message}`)
    return { success: false, reason: err.message }
  }
}

export async function postOrderComplete(sock, order, strukBuffer = null) {
  const jid = resolveJid(true)
  if (!jid) return { success: false, reason: 'channel_not_configured' }

  const caption = [
    `✅ *${sf('ORDER SELESAI')}*`,
    DIVIDER,
    `─ 𐴲᭡ ${sf('produk')}  ፡ ${order.categoryName} — ${order.itemName}`,
    `─ 𐴲᭡ ${sf('pembeli')} ፡ ${order.pushName}`,
    `─ 𐴲᭡ ${sf('total')}   ፡ *${fmtPrice(order.total)}*`,
    `─ 𐴲᭡ ${sf('waktu')}   ፡ ${nowStr()}`,
    DIVIDER,
    `${sf('Terima kasih sudah berbelanja!')} 🎀`,
    `${sf('Mau order? Ketik')} *list* ${sf('di bot kami.')}`,
  ].join('\n')

  if (strukBuffer) {
    return send(sock, jid, {
      image:    strukBuffer,
      caption,
      mimetype: 'image/png',
    })
  }

  return send(sock, jid, { text: caption })
}

export async function postNewProduct(sock, catName, catEmoji, itemName, price, stock, description = '') {
  const jid = resolveJid(true)
  if (!jid) return { success: false, reason: 'channel_not_configured' }

  const text = [
    `🆕 *${sf('PRODUK BARU')}* ${catEmoji}`,
    DIVIDER,
    `─ 𐴲᭡ ${sf('kategori')} ፡ ${catName}`,
    `─ 𐴲᭡ ${sf('produk')}  ፡ ${itemName}`,
    description ? `─ 𐴲᭡ ${sf('deskripsi')} ፡ ${description}` : null,
    `─ 𐴲᭡ ${sf('harga')}   ፡ *${fmtPrice(price)}*`,
    `─ 𐴲᭡ ${sf('stok')}    ፡ ${stock}`,
    DIVIDER,
    `${sf('Ketik')} *${catName.toLowerCase()}* ${sf('untuk melihat detail.')}`,
  ].filter(Boolean).join('\n')

  return send(sock, jid, { text })
}

export async function postStockUpdate(sock, catName, itemName, oldStock, newStock) {
  const jid = resolveJid(true)
  if (!jid) return { success: false, reason: 'channel_not_configured' }

  if (newStock > 0 && oldStock === 0) {
    const text = [
      `🔄 *${sf('RESTOCK')}*`,
      DIVIDER,
      `─ 𐴲᭡ ${sf('produk')} ፡ ${catName} — ${itemName}`,
      `─ 𐴲᭡ ${sf('stok')}   ፡ *${newStock}* unit tersedia`,
      DIVIDER,
      `${sf('Buruan order sebelum habis!')} ⚡`,
    ].join('\n')
    return send(sock, jid, { text })
  }

  return { success: false, reason: 'no_restock_event' }
}

export async function postAnnouncement(sock, text, toStore = true) {
  const jid = resolveJid(toStore)
  if (!jid) return { success: false, reason: 'channel_not_configured' }
  return send(sock, jid, { text })
}

export async function postMedia(sock, buffer, mimetype, caption, toStore = true) {
  const jid = resolveJid(toStore)
  if (!jid) return { success: false, reason: 'channel_not_configured' }

  const type = mimetype.startsWith('video') ? 'video'
    : mimetype.startsWith('image') ? 'image'
    : 'document'

  return send(sock, jid, { [type]: buffer, mimetype, caption })
}

export function isStoreChannelSet() {
  return !!getStoreJid()
}

export function isAnyChannelSet() {
  return !!(getStoreJid() || getMainJid())
}
