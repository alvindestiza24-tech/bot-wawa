import { join } from 'node:path'
import { readFile, mkdir, unlink } from 'node:fs/promises'
import {
  getOrders, getOrderById, completeOrder, cancelOrder, getPendingOrders,
} from '../../src/lib/store-db.js'
import { renderInvoice, fmtPrice } from '../../src/lib/store-formatter.js'
import { postOrderComplete }       from '../../src/lib/channel-notify.js'
import { generateStruk }           from '../../src/canvas/generateStruk.js'
import config from '../../config.js'

export const config_ = {
  name:      'orders',
  alias:     ['done', 'cekorder', 'listorder'],
  category:  'store',
  description: 'Kelola pesanan masuk (owner)',
  usage:     '.orders | .done <id> | .cekorder <id>',
  example:   '.orders\n.done INV-20260623-0001',
  isOwner:   true, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 2, isEnabled: true,
}
export { config_ as config }

const DIVIDER = `  ۪   ִֶָ ׁ  ּ  ֗  ִ ۫  ִֶָ ִ    ۪ ᳀  ִֶָ ִ  ۫`

function statusIcon(s) {
  return { pending_user: '⏳', pending_owner: '🔔', completed: '✅', cancelled: '❌' }[s] || '❓'
}

export async function handler(m, { sock }) {
  const gid     = m.isGroup ? m.chat : null
  const cmd     = m.command.toLowerCase()
  const argText = m.text?.trim() || ''

  if (cmd === 'orders' || cmd === 'listorder') {
    const showAll = argText === 'all'
    const list    = showAll
      ? getOrders(gid).orders.slice(-20).reverse()
      : getPendingOrders(gid)

    if (!list.length) {
      return m.reply(showAll
        ? '꒰ orders ꒱\n\nBelum ada pesanan.'
        : '꒰ orders ꒱\n\nTidak ada pesanan pending. ✅\nGunakan *.orders all* untuk lihat semua.')
    }

    let out = `꒰ orders ꒱ *${showAll ? 'SEMUA PESANAN' : 'PENDING'}* (${list.length})\n${DIVIDER}\n\n`
    list.forEach((o, i) => {
      out += `${i + 1}. ${statusIcon(o.status)} \`${o.orderId}\`\n`
      out += `   ${o.categoryName} — ${o.itemName}\n`
      out += `   Total: *${fmtPrice(o.total)}*  |  ${o.pushName} (+${o.senderNum})\n`
      out += `   Waktu: ${new Date(o.createdAt).toLocaleString('id-ID')}\n\n`
    })
    out += `${DIVIDER}\n`
    if (!showAll) out += `Gunakan *.done <id>* atau *.cancel <id>* untuk proses`
    return m.reply(out.trimEnd())
  }

  if (cmd === 'done') {
    const [orderId, ...noteParts] = argText.split(/\s+/)
    if (!orderId) return m.reply('Format: *.done <orderId> [catatan]*')

    const order = getOrderById(orderId.toUpperCase(), gid)
    if (!order) return m.reply(`❌ Order *${orderId.toUpperCase()}* tidak ditemukan.`)

    if (!['pending_owner', 'pending_user'].includes(order.status)) {
      return m.reply(`❌ Order sudah berstatus: *${order.status}*`)
    }

    const result = completeOrder(orderId.toUpperCase(), noteParts.join(' '), gid)
    if (!result.success) return m.reply(`❌ ${result.message}`)

    await m.reply(
      `✅ Order *${orderId.toUpperCase()}* diselesaikan.\n` +
      `${DIVIDER}\n` +
      renderInvoice(result.order, 'completed')
    )

    const tmpDir = join(process.cwd(), 'storage', '.tmp')
    await mkdir(tmpDir, { recursive: true })

    let strukBuffer = null

    try {
      const strukResult = await generateStruk({
        toko: {
          nama:   config.owner?.name || 'Bot Store',
          alamat: '', kota: '', telp: '',
        },
        kasir:           config.owner?.name || 'Admin',
        pelanggan:       result.order.pushName || result.order.senderNum || '-',
        alamatPelanggan: '-',
        nomorStruk:      result.order.orderId,
        items: [{
          nama:   result.order.itemName,
          qty:    result.order.qty,
          satuan: 'pcs',
          harga:  result.order.price,
        }],
        bayar:       result.order.total,
        diskon:      0,
        pajak:       0,
        metodeBayar: 'Transfer',
        catatan:     result.order.note || 'Terima kasih sudah berbelanja!',
        outputDir:   tmpDir,
      })

      strukBuffer = await readFile(strukResult.Output)

      await sock.sendMessage(m.chat, {
        image:    strukBuffer,
        caption:  `📄 Struk Arsip — ${result.order.orderId}`,
        mimetype: 'image/png',
      }, { quoted: m.raw })

      await unlink(strukResult.Output).catch(() => {})
    } catch (err) {
      console.error('[DONE] Gagal generate struk:', err.message)
      await m.reply(`⚠️ Gagal membuat struk: ${err.message}`)
    }

    try {
      await postOrderComplete(sock, result.order, strukBuffer)
    } catch (err) {
      console.error('[DONE] Gagal post ke channel:', err.message)
    }

    return
  }

  if (cmd === 'cekorder') {
    const orderId = argText.toUpperCase()
    if (!orderId) return m.reply('Format: *.cekorder <orderId>*')
    const order = getOrderById(orderId, gid)
    if (!order) return m.reply(`❌ Order *${orderId}* tidak ditemukan.`)
    const step = order.status === 'completed' ? 'completed'
      : order.status === 'cancelled' ? 'cancelled'
      : 'confirmed'
    return m.reply(renderInvoice(order, step))
  }

  return m.reply(`꒰ orders ꒱\n\nCommand tidak dikenali: *${cmd}*`)
}