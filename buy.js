import { generateWAMessageFromContent } from '@kyyinfinite/baileys'
import { getCategory, createOrder }     from '../../src/lib/store-db.js'
import { renderInvoice }                from '../../src/lib/store-formatter.js'
import { createFakeQuoted, _mCtx }      from '../../src/lib/ctx.js'
import { toAestheticFont }              from '../../src/lib/text-formater.js'
import config from '../../config.js'

export const config_ = {
  name:      'buy',
  alias:     ['beli', 'order'],
  category:  'store',
  description: 'Beli produk & buat invoice',
  usage:     '.buy <produk>/<nomor>',
  example:   '.buy netflix/1',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid = m.isGroup ? m.chat : null
  const raw = m.args?.join(' ') || m.text?.trim() || ''

  const match = raw.match(/^([a-z0-9\-]+)[\/\s](\d+)$/i)
  if (!match) {
    return m.reply(
      `꒰ buy ꒱\n\n` +
      `Format: *.buy <produk>/<nomor>*\n` +
      `Contoh: *.buy netflix/1*\n\n` +
      `Ketik *list* untuk melihat semua produk.`
    )
  }

  const [, catKey, itemIdStr] = match
  const itemId = parseInt(itemIdStr)

  const cat = getCategory(catKey, gid)
  if (!cat) {
    return m.reply(`❌ Produk *${catKey}* tidak ditemukan.\nKetik *list* untuk melihat produk tersedia.`)
  }

  const item = cat.items?.find(i => i.id === itemId)
  if (!item) {
    return m.reply(`❌ Item #${itemId} tidak ditemukan di *${cat.name}*.\nKetik *${catKey}* untuk melihat daftar item.`)
  }

  if (item.stock < 1) {
    return m.reply(`❌ Maaf, stok *${cat.name} — ${item.name}* sedang habis.`)
  }

  const result = createOrder({
    senderNum:   m.senderNumber,
    pushName:    m.pushName || m.senderNumber,
    categoryKey: catKey,
    itemId,
    qty: 1,
    gid,
  })

  if (!result.success) return m.reply(`❌ Gagal membuat order: ${result.message}`)

  const { order } = result

  const invoiceText = [
    renderInvoice(order, 'created'),
    ``,
    `꒰ ${toAestheticFont('konfirmasi')} ꒱`,
    `Ketik *.confirm ${order.orderId}* untuk melanjutkan`,
    `atau *.cancel ${order.orderId}* untuk membatalkan`,
    ``,
    `⏰ Invoice akan expired dalam 10 menit`,
  ].join('\n')

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      interactiveMessage: {
        header: { title: '', subtitle: '', hasMediaAttachment: false },
        body:   { text: invoiceText },
        footer: { text: config.bot?.name || 'Store' },
        contextInfo: { ..._mCtx(m.sender) },
        nativeFlowMessage: {
          buttons: [
            {
              name:             'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '⎙ Copy ID Invoice',
                copy_code:    order.orderId,
              }),
            },
            {
              name:             'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: 'ᥫ᭡.ִֶָ Konfirmasi Bayar',
                id:           `.confirm ${order.orderId}`,
              }),
            },
            {
              name:             'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '✖ Batalkan',
                id:           `.cancel ${order.orderId}`,
              }),
            },
          ],
        },
      },
    },
    { quoted: createFakeQuoted() }
  )

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}