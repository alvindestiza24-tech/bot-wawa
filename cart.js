import { getCart, addToCart, removeFromCart, clearCart } from '../../src/lib/cart-store.js'
import { getCategory } from '../../src/lib/store-db.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { _mCtx, createFakeQuoted } from '../../src/lib/ctx.js'
import { sf } from '../../src/lib/store-formatter.js'

export const config_ = {
  name:      'cart',
  alias:     ['keranjang', 'addcart', 'delcart', 'clearcart'],
  category:  'store',
  description: 'Keranjang belanja',
  usage:     '.addcart <produk>/<id> [qty]\n.cart\n.delcart <index>\n.clearcart',
  example:   '.addcart netflix/1',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 3, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid  = m.isGroup ? m.chat : null
  const cmd  = m.command?.toLowerCase() || 'cart'
  const text = m.text?.trim() || ''

  if (cmd === 'addcart') {
    const match = text.match(/^([a-z0-9\-]+)\/(\d+)(?:\s+(\d+))?$/i)
    if (!match) return m.reply('Format: _.addcart <produk>/<id> [qty]_')
    const [, catKey, itemIdStr, qtyStr] = match
    const itemId = parseInt(itemIdStr)
    const qty    = parseInt(qtyStr) || 1

    const cat  = getCategory(catKey, gid)
    if (!cat) return m.reply('❌ Produk tidak ditemukan.')
    const item = cat.items?.find(i => i.id === itemId)
    if (!item) return m.reply('❌ Item tidak ditemukan.')
    if (item.stock < qty) return m.reply(`❌ Stok tidak cukup. Tersedia: ${item.stock}`)

    addToCart(m.senderNumber, { categoryKey: catKey, itemId, qty })
    await m.react('🛒')
    return m.reply(`✅ *${item.name}* (${qty}x) ditambahkan ke keranjang.\nGunakan *.cart* untuk melihat keranjang.`)
  }

  if (cmd === 'delcart') {
    const index = parseInt(m.args?.[0])
    if (isNaN(index)) return m.reply('Format: _.delcart <index>_')
    removeFromCart(m.senderNumber, index)
    await m.react('🗑️')
    return m.reply(`✅ Item #${index} dihapus dari keranjang.`)
  }

  if (cmd === 'clearcart') {
    clearCart(m.senderNumber)
    await m.react('🧹')
    return m.reply('🧹 Keranjang dikosongkan.')
  }

  const cartItems = getCart(m.senderNumber)
  if (!cartItems.length) {
    return m.reply('🛒 Keranjangmu kosong.\nGunakan *.list* lalu *.addcart <produk>/<id>*')
  }

  const catCache = {}
  const lines    = []
  let total      = 0

  for (const [i, ci] of cartItems.entries()) {
    if (!catCache[ci.categoryKey]) catCache[ci.categoryKey] = getCategory(ci.categoryKey, gid)
    const cat  = catCache[ci.categoryKey]
    const item = cat?.items?.find(it => it.id === ci.itemId)
    if (!item) {
      lines.push(`[${i}] ⚠️ Item tidak tersedia (${ci.categoryKey}/${ci.itemId})`)
      continue
    }
    const subtotal = item.price * ci.qty
    total += subtotal
    lines.push(`[${i}] ${cat.emoji || '📦'} *${item.name}*`)
    lines.push(`    Rp ${item.price.toLocaleString()} x ${ci.qty} = *Rp ${subtotal.toLocaleString()}*`)
  }

  const body =
    `🛒 *Keranjang Belanja*\n\n` +
    `📋 *${cartItems.length} item*\n` +
    `💵 Total: *Rp ${total.toLocaleString()}*\n\n` +
    lines.join('\n') + `\n\n` +
    `✏️ _.delcart <indeks>_ | 🛍️ _.checkout_`

  try {
    await new AIRich(sock)
      .setTitle(`🛒 Keranjang @${m.pushName}`)
      .addText(body)
      .addSuggest(['checkout', 'list', 'addcart'])
      .send(m.chat, { quoted: m.raw })
  } catch {
    await sock.sendMessage(m.chat, { text: body, contextInfo: _mCtx(m.sender), mentions: [m.sender] }, { quoted: createFakeQuoted() })
  }
}