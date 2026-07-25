import { addNotification } from '../../src/lib/notifyme-store.js'
import { getCategory }     from '../../src/lib/store-db.js'

export const config_ = {
  name:      'notifyme',
  alias:     ['restock', 'stoknotif'],
  category:  'store',
  description: 'Dapatkan notifikasi saat stok item kembali',
  usage:     '.notifyme <produk>/<id>',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 3, isEnabled: true,
}
export { config_ as config }

export async function handler(m) {
  const gid   = m.isGroup ? m.chat : null
  const text  = m.text?.trim() || ''
  const match = text.match(/^([a-z0-9\-]+)\/(\d+)$/i)
  if (!match) return m.reply('Format: _.notifyme <produk>/<id>_')
  const [, catKey, itemIdStr] = match
  const itemId = parseInt(itemIdStr)

  const cat  = getCategory(catKey, gid)
  if (!cat) return m.reply('❌ Produk tidak ditemukan.')
  const item = cat.items?.find(i => i.id === itemId)
  if (!item) return m.reply('❌ Item tidak ditemukan.')

  if (item.stock > 0) return m.reply(`Stok *${item.name}* masih tersedia (${item.stock}). Langsung beli aja!`)

  const result = addNotification({ sender: m.senderNumber, categoryKey: catKey, itemId })
  return m.reply(result.success
    ? `✅ Kamu akan diberitahu saat stok *${item.name}* tersedia kembali.`
    : `❌ ${result.message}`)
}