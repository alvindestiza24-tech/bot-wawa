import { addToWishlist, removeFromWishlist, getWishlist, clearWishlist } from '../../src/lib/wishlist-store.js'
import { getCategory } from '../../src/lib/store-db.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { sf, fmtPrice } from '../../src/lib/store-formatter.js'
import { _mCtx, createFakeQuoted } from '../../src/lib/ctx.js'

export const config_ = {
  name:      'wl',
  alias:     ['wishlist', 'favorit', 'addwl', 'delwl', 'clearwl'],
  category:  'store',
  description: 'Wishlist produk favorit',
  usage:     '.addwl <produk>/<id>\n.wl\n.delwl <index>',
  example:   '.addwl netflix/1',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 3, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid = m.isGroup ? m.chat : null
  const cmd = m.command?.toLowerCase() || 'wl'
  const text = m.text?.trim() || ''

  if (cmd === 'addwl') {
    const match = text.match(/^([a-z0-9\-]+)\/(\d+)$/i)
    if (!match) return m.reply('Format: _.addwl <produk>/<id>_')
    const [, catKey, itemIdStr] = match
    const itemId = parseInt(itemIdStr)

    const cat  = getCategory(catKey, gid)
    if (!cat) return m.reply('❌ Produk tidak ditemukan.')
    const item = cat.items?.find(i => i.id === itemId)
    if (!item) return m.reply('❌ Item tidak ditemukan.')

    const result = addToWishlist(m.senderNumber, { categoryKey: catKey, itemId })
    return m.reply(result.success ? `✅ ${item.name} ditambahkan ke wishlist.` : `❌ ${result.message}`)
  }

  if (cmd === 'delwl') {
    const index = parseInt(m.args?.[0])
    if (isNaN(index)) return m.reply('Format: _.delwl <index>_')
    const wl = getWishlist(m.senderNumber)
    if (index < 0 || index >= wl.length) return m.reply('Indeks tidak valid.')
    const { categoryKey, itemId } = wl[index]
    const result = removeFromWishlist(m.senderNumber, categoryKey, itemId)
    return m.reply(result.success ? `✅ Dihapus dari wishlist.` : `❌ ${result.message}`)
  }

  if (cmd === 'clearwl') {
    clearWishlist(m.senderNumber)
    return m.reply('🧹 Wishlist dikosongkan.')
  }

  const wishlist = getWishlist(m.senderNumber)
  if (!wishlist.length) {
    return m.reply(`🌟 Wishlist kosong.\nGunakan _.list_ lalu _.addwl <produk>/<id>_`)
  }

  const catCache = {}
  const lines    = []
  for (const [i, w] of wishlist.entries()) {
    if (!catCache[w.categoryKey]) catCache[w.categoryKey] = getCategory(w.categoryKey, gid)
    const cat  = catCache[w.categoryKey]
    const item = cat?.items?.find(it => it.id === w.itemId)
    if (!item) {
      lines.push(`[${i}] ⚠️ Item tidak tersedia (${w.categoryKey}/${w.itemId})`)
      continue
    }
    lines.push(`[${i}] ${cat.emoji || '🛒'} *${item.name}* — ${fmtPrice(item.price)}`)
  }

  const body = `🌟 *Wishlist* (@${m.pushName})\n\n` + lines.join('\n') + `\n\nHapus: _.delwl <indeks>_`

  try {
    await new AIRich(sock)
      .setTitle('🌟 Wishlist')
      .addText(body)
      .addSuggest(['list', 'addwl', 'cart'])
      .send(m.chat, { quoted: m.raw })
  } catch {
    await sock.sendMessage(m.chat, { text: body, contextInfo: _mCtx(m.sender), mentions: [m.sender] }, { quoted: createFakeQuoted() })
  }
}