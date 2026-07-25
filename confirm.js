import { generateWAMessageFromContent }    from '@kyyinfinite/baileys'
import { getOrderById, confirmOrder }      from '../../src/lib/store-db.js'
import { renderInvoice, renderOrderNotif } from '../../src/lib/store-formatter.js'
import { createFakeQuoted, _mCtx }         from '../../src/lib/ctx.js'
import config from '../../config.js'

export const config_ = {
  name:      'confirm',
  alias:     ['konfirmasi'],
  category:  'store',
  description: 'Konfirmasi order pembelian',
  usage:     '.confirm <orderId>',
  example:   '.confirm INV-20260623-0001',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 3, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const gid     = m.isGroup ? m.chat : null
  const orderId = (m.args?.[0] || '').trim().toUpperCase()

  if (!orderId) {
    return m.reply(
      `Format: *.confirm <orderId>*\n` +
      `Contoh: *.confirm INV-20260623-0001*\n\n` +
      `ID Invoice didapat setelah menjalankan *.buy*`
    )
  }

  const order = getOrderById(orderId, gid)
  if (!order) return m.reply(`❌ Order *${orderId}* tidak ditemukan.`)

  if (order.senderNum !== m.senderNumber) {
    return m.reply(`❌ Order ini bukan milikmu.`)
  }

  if (order.status !== 'pending_user') {
    const statusMsg = {
      pending_owner: 'sudah dikonfirmasi, menunggu diproses owner',
      completed:     'sudah selesai',
      cancelled:     'sudah dibatalkan',
    }
    return m.reply(`❌ Order *${orderId}* ${statusMsg[order.status] || 'sudah diproses'}.`)
  }

  const result = confirmOrder(orderId, gid)
  if (!result.success) return m.reply(`❌ ${result.message}`)

  const confirmed = result.order

  const ownerNum = String(config.owner?.number?.[0] || '').replace(/[^0-9]/g, '')
  const ownerJid = ownerNum ? ownerNum + '@s.whatsapp.net' : null

  const userText = [
    renderInvoice(confirmed, 'confirmed'),
    ``,
    `꒰ pembayaran ꒱`,
    `Kirim bukti transfer ke owner untuk diverifikasi 📸`,
    `Owner akan memproses pesananmu segera.`,
  ].join('\n')

  const userButtons = [
    {
      name:             'cta_copy',
      buttonParamsJson: JSON.stringify({
        display_text: '📋 Copy ID Invoice',
        copy_code:    confirmed.orderId,
      }),
    },
    ...(ownerNum ? [{
      name:             'cta_url',
      buttonParamsJson: JSON.stringify({
        display_text:        '📞 Hubungi Owner',
        url:                 `https://wa.me/${ownerNum}`,
        merchant_url:        `https://wa.me/${ownerNum}`,
        webview_interaction: 'open',
      }),
    }] : []),
  ]

  const userMsg = generateWAMessageFromContent(
    m.chat,
    {
      interactiveMessage: {
        header: { title: '', subtitle: '', hasMediaAttachment: false },
        body:   { text: userText },
        footer: { text: config.bot?.name || 'Store' },
        contextInfo: { ..._mCtx(m.sender) },
        nativeFlowMessage: { buttons: userButtons },
      },
    },
    { quoted: createFakeQuoted() }
  )

  await sock.relayMessage(m.chat, userMsg.message, { messageId: userMsg.key.id })

  if (!ownerJid) return

  try {
    const ownerButtons = [
      {
        name:             'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: '⎙ Copy ID Order',
          copy_code:    confirmed.orderId,
        }),
      },
      {
        name:             'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: 'ᥫ᭡.ִֶָ Selesaikan Order',
          id:           `.done ${confirmed.orderId}`,
        }),
      },
      {
        name:             'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: '✖ Tolak Order',
          id:           `.cancel ${confirmed.orderId}`,
        }),
      },
    ]

    const ownerMsg = generateWAMessageFromContent(
      ownerJid,
      {
        interactiveMessage: {
          header: { title: '🔔 Order Masuk', subtitle: '', hasMediaAttachment: false },
          body:   { text: renderOrderNotif(confirmed) },
          footer: { text: config.bot?.name || 'Store' },
          nativeFlowMessage: { buttons: ownerButtons },
        },
      },
      {}
    )

    await sock.relayMessage(ownerJid, ownerMsg.message, { messageId: ownerMsg.key.id })
  } catch (err) {
    console.error('[CONFIRM] Gagal kirim notif ke owner:', err.message)
  }
}