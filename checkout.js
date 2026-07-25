import { getCart, clearCart }          from '../../src/lib/cart-store.js'
import { getCategory, createOrderMulti } from '../../src/lib/store-db.js'
import { renderInvoiceMulti }          from '../../src/lib/store-formatter.js'
import { getCoupon, useCoupon }        from '../../src/lib/coupon-store.js'
import { AIRich }                      from '../../src/lib/_build-m.js'

export const config_ = {
  name:      'checkout',
  alias:     ['co'],
  category:  'store',
  description: 'Checkout keranjang belanja',
  usage:     '.checkout [kode kupon]',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 10, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid       = m.isGroup ? m.chat : null
  const cartItems = getCart(m.senderNumber)
  if (!cartItems.length) return m.reply('🛒 Keranjang kosong.')

  const couponCode = (m.args?.[0] || '').toUpperCase()
  let couponResult = { success: true, discount: 0 }

  if (couponCode) {
    let subtotal = 0
    for (const ci of cartItems) {
      const cat  = getCategory(ci.categoryKey, gid)
      const item = cat?.items?.find(i => i.id === ci.itemId)
      if (!item) continue
      subtotal += item.price * ci.qty
    }
    couponResult = useCoupon(couponCode, subtotal)
    if (!couponResult.success) return m.reply(`❌ Kupon: ${couponResult.message}`)
  }

  const result = createOrderMulti({
    senderNum: m.senderNumber,
    pushName:  m.pushName,
    items:     cartItems,
    coupon:    couponResult.success ? couponResult.coupon : null,
    gid,
  })

  if (!result.success) return m.reply(`❌ Gagal: ${result.message}`)

  clearCart(m.senderNumber)
  const invoiceText = renderInvoiceMulti(result.order, 'created')

  const msg = new AIRich(sock)
    .setTitle('🧾 Invoice Checkout')
    .addText(invoiceText)
    .addSuggest(['confirm ' + result.order.orderId, 'list', 'myorder'])
    .build(m.chat)

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}