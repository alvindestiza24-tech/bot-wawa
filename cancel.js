import { getOrderById, cancelOrder } from '../../src/lib/store-db.js'
import { renderInvoice }             from '../../src/lib/store-formatter.js'

export const config_ = {
  name:      'cancel',
  alias:     ['batal'],
  category:  'store',
  description: 'Batalkan order',
  usage:     '.cancel <orderId> [alasan]',
  example:   '.cancel INV-20260623-0001',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 3, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { isOwner }) {
  const gid    = m.isGroup ? m.chat : null
  const [orderId, ...reasonParts] = (m.args || [])
  const reason = reasonParts.join(' ') || 'Dibatalkan oleh pengguna'

  if (!orderId) {
    return m.reply(`Format: *.cancel <orderId> [alasan]*\nContoh: *.cancel INV-20260623-0001*`)
  }

  const order = getOrderById(orderId.toUpperCase(), gid)
  if (!order) return m.reply(`❌ Order *${orderId.toUpperCase()}* tidak ditemukan.`)

  if (!isOwner && order.senderNum !== m.senderNumber) {
    return m.reply(`❌ Order ini bukan milikmu.`)
  }

  const result = cancelOrder(orderId.toUpperCase(), reason, gid)
  if (!result.success) return m.reply(`❌ ${result.message}`)

  await m.reply(renderInvoice(result.order, 'cancelled'))
}