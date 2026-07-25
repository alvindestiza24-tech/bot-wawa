import { searchTokopedia } from '../../src/scrape/tokopedia.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'tokopedia',
  alias: ['toped', 'searchshop', 'caritoko'],
  category: 'search',
  description: 'Cari 5 produk teratas di Tokopedia',
  usage: '.tokopedia <keyword>',
  example: '.tokopedia sepatu olahraga',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const keyword = m.text?.trim()
  if (!keyword) {
    return m.reply('❌ Masukkan kata kunci pencarian.\nContoh: *.tokopedia sepatu olahraga*')
  }

  await m.react('🔍')

  try {
    // Ambil 5 produk teratas
    const result = await searchTokopedia(keyword, { limit: 5 })

    if (!result.items.length) {
      await m.react('😔')
      return m.reply(`❌ Produk *${keyword}* tidak ditemukan.`)
    }

    // Format untuk addProduct
    const products = result.items.map(item => ({
      title: item.name,
      brand: item.shopName || 'Tokopedia',
      price: item.price || '?',
      sale_price: item.originalPrice || '',
      url: item.url,
      image: item.image,
      // Informasi tambahan tidak bisa dimasukkan langsung ke addProduct,
      // tapi bisa kita tampilkan di teks pendukung
    }))

    const footer = `Menampilkan ${products.length} dari ${result.total} produk untuk "${keyword}"`

    // Buat pesan interaktif
    await new AIRich(sock)
      .setTitle(`🛍️ Cari: ${keyword}`)
      .addProduct(products)
      .setFooter(footer)
      .addSuggest(['tokopedia', 'list', 'cart'])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    console.error('[TOKOPEDIA]', err)
    await m.reply(`❌ Gagal mencari: ${err.message}`)
  }
}