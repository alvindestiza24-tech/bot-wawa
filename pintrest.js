// plugins/search/pinterest.js
import { searchPinterest } from '../../src/scrape/pinterest.js'
import { AIRich } from '../../src/lib/_build-m.js'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000 // 5 menit

export const config_ = {
  name: 'pinterest',
  alias: ['pin', 'pins', 'cari gambar'],
  category: 'search',
  description: 'Cari gambar dari Pinterest, pilih nomor untuk kirim',
  usage: '.pinterest <kata kunci> | .pinterest <nomor>',
  example: '.pinterest kucing lucu\n.pinterest 2',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''

  if (!input) {
    return m.reply(
      '❌ Masukkan kata kunci pencarian.\n' +
      'Contoh: `.pinterest kucing lucu`\n' +
      'Lalu pilih nomor: `.pinterest 2`'
    )
  }

  // ─── Jika input adalah angka: ambil dari sesi ──────────────────
  if (/^\d+$/.test(input)) {
    const index = parseInt(input) - 1
    const session = sessions.get(m.senderNumber)

    if (!session || Date.now() > session.expires) {
      sessions.delete(m.senderNumber)
      return m.reply('⌛ Sesi pencarian sudah habis. Silakan cari lagi dengan `.pinterest <kata kunci>`')
    }

    if (index < 0 || index >= session.results.length) {
      return m.reply(`❌ Nomor tidak valid. Pilih 1-${session.results.length}`)
    }

    const item = session.results[index]
    await m.react('⏳')

    try {
      // Kirim gambar
      await sock.sendMessage(m.chat, {
        image: { url: item.image },
        caption: `🖼️ *${item.caption || 'Gambar Pinterest'}*\n` +
                 `👤 Oleh: ${item.upload_by || 'Unknown'}\n` +
                 `🔗 Sumber: ${item.source || 'Pinterest'}`,
      }, { quoted: m.raw })
      await m.react('✅')
    } catch (err) {
      console.error('[PINTEREST DOWNLOAD]', err)
      await m.react('❌')
      await m.reply(`❌ Gagal mengirim gambar: ${err.message}`)
    }
    return
  }

  // ─── Pencarian baru ──────────────────────────────────────────────
  await m.react('🔍')

  try {
    const results = await searchPinterest(input, 5) // ambil 5 hasil

    if (!results || results.length === 0) {
      await m.react('😔')
      return m.reply(`❌ Tidak ada gambar ditemukan untuk "${input}"`)
    }

    // Simpan sesi
    sessions.set(m.senderNumber, {
      results,
      expires: Date.now() + SESSION_TTL,
    })

    // Format untuk AIRich addProduct
    const products = results.map((item, i) => ({
      title: `${i + 1}. ${item.caption || 'Gambar'}`,
      brand: item.upload_by || 'Pinterest',
      price: `❤️ ${item.followers || 0} pengikut`,
      image_url: item.image,
      product_url: item.source || item.image,
      sale_price: `🔗 Klik untuk lihat`,
    }))

    await new AIRich(sock)
      .setTitle(`📌 Pinterest: "${input}"`)
      .addText(`Balas dengan *.pinterest <nomor>* (1-${results.length}) untuk mengirim gambar.`)
      .addProduct(products)
      .addSuggest(results.map((_, i) => `pinterest ${i + 1}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[PINTEREST]', err)
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}