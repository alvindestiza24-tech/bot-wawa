import { addReview }    from '../../src/lib/review-store.js'
import { getOrderById } from '../../src/lib/store-db.js'

export const config_ = {
  name:      'review',
  alias:     ['rate', 'rating'],
  category:  'store',
  description: 'Beri rating & review setelah order selesai',
  usage:     '.review <orderId> <rating 1-5> [komentar]',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m) {
  const gid     = m.isGroup ? m.chat : null
  const args    = m.args || []
  const orderId = (args[0] || '').toUpperCase()
  const rating  = parseInt(args[1])
  const comment = args.slice(2).join(' ')

  if (!orderId || isNaN(rating) || rating < 1 || rating > 5) {
    return m.reply('Format: _.review <orderId> <rating 1-5> [komentar]_')
  }

  const order = getOrderById(orderId, gid)
  if (!order) return m.reply('❌ Order tidak ditemukan.')
  if (order.senderNum !== m.senderNumber) return m.reply('❌ Bukan pesananmu.')
  if (order.status !== 'completed') return m.reply('❌ Order belum selesai.')

  if (order.items) {
    if (order.items.length !== 1) return m.reply('❌ Review untuk order multi item belum didukung.')
    const item = order.items[0]
    const result = addReview({
      sender:      m.senderNumber,
      pushName:    m.pushName,
      categoryKey: item.categoryKey,
      itemId:      item.itemId,
      orderId:     order.orderId,
      rating,
      comment,
    })
    return m.reply(result.success ? '✅ Review tersimpan, terima kasih!' : `❌ ${result.message}`)
  }

  return m.reply('❌ Order format lama, review tidak tersedia.')
}