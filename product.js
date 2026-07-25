import { getCategory } from '../../src/lib/store-db.js'
import { renderProduct } from '../../src/lib/store-formatter.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import config from '../../config.js'
import fs from 'fs'
import path from 'path'

export const config_ = {
  name:      'product',
  alias:     ['cek', 'harga'],
  category:  'store',
  description: 'Tampilkan detail harga satu kategori produk',
  usage:     '.product <nama>  atau langsung ketik nama produk',
  example:   '.product netflix',
  isOwner:   false, isPremium: false, isGroup: false,
  isPrivate: false, prefix: false, cooldown: 4, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }, categoryKey) {
  const gid = m.isGroup ? m.chat : null
  const key = categoryKey || m.args?.[0] || m.text?.trim()

  if (!key) {
    return m.reply(
      `꒰ produk ꒱\n\n` +
      `Masukkan nama produk\n` +
      `Contoh: \`.product netflix\` atau ketik \`netflix\` langsung`
    )
  }

  const cat = getCategory(key, gid)

  if (!cat) {
    return m.reply(
      `꒰ produk ꒱\n\n` +
      `Produk *${key}* tidak ditemukan.\n` +
      `Ketik *list* untuk melihat semua produk tersedia.`
    )
  }

  if (!cat.items?.length) {
    return m.reply(`꒰ ${cat.name} ꒱\n\nBelum ada item dalam kategori ini.`)
  }

  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0] : '.'

  const text = renderProduct({
    pushName: m.pushName || m.senderNumber,
    catId:    cat.id,
    catName:  cat.name,
    catEmoji: cat.emoji || '🛒',
    items:    cat.items,
    note: [
      `ketik *${prefix}buy ${cat.id}/<nomor>* untuk beli`,
      `stok bisa habis sewaktu-waktu`,
      `semua transaksi only admin`,
    ],
  })

  const imagePath = cat.image ? path.join(process.cwd(), cat.image) : null
  const hasImage = imagePath && fs.existsSync(imagePath)

  if (hasImage) {
    try {
      const imageBuffer = fs.readFileSync(imagePath)
      await sock.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: text,
          contextInfo: _mCtx(m.sender),
          mentions: [m.sender],
        },
        { quoted: m.raw }
      )
    } catch (err) {
      console.error('[PRODUCT] Gagal kirim gambar thumbnail:', err)
      await sock.sendMessage(
        m.chat,
        { text, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
        { quoted: createFakeQuoted() }
      )
    }
  } else {
    await sock.sendMessage(
      m.chat,
      { text, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
      { quoted: createFakeQuoted() }
    )
  }
}