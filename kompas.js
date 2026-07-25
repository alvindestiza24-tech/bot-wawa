// plugins/search/kompas.js
import { scrapeKompas, searchKompas } from '../../src/scrape/kompas.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'kompas',
  alias: ['berita', 'news', 'kompascom'],
  category: 'search',
  description: 'Cari berita terkini dari Kompas.com',
  usage: '.kompas [query]',
  example: '.kompas\n.kompas politik',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const query = m.text?.trim() || null

  await m.react('⏳')

  try {
    const result = query ? await searchKompas(query, 5) : await scrapeKompas(null, 5)

    if (!result.success || result.articles.length === 0) {
      await m.react('😔')
      return m.reply(
        beautifulMessage(
          query
            ? `❌ Berita dengan kata *"${query}"* tidak ditemukan.`
            : '❌ Tidak ada berita terkini yang ditemukan.',
          { pushName: m.pushName }
        )
      )
    }

    const title = query ? `🔍 Hasil Pencarian: "${query}"` : '📰 Berita Terkini'

    const builder = new AIRich(sock)
      .setTitle('📰 Kompas.com')
      .addText(`## ${title}\nDitemukan ${result.total} berita`)

    // Tambahkan produk (kartu dengan gambar + judul + link)
    const products = result.articles.map((article) => ({
      title: article.title,
      brand: article.author || 'Kompas.com',
      price: article.time || 'Baru',
      image_url: article.thumbnail || '',
      product_url: article.url,
      sale_price: article.source || 'Kompas',
    }))
    builder.addProduct(products)

    // Tambahkan daftar berita dengan hyperlink (hanya title yang di-link)
    const listText = result.articles
      .map(
        (a, i) =>
          `${i + 1}. [${a.title}](${a.url})\n` +
          `   📅 ${a.time || 'Baru'} ${a.author ? `• ${a.author}` : ''}`
      )
      .join('\n\n')

    builder.addText(`## 📋 Daftar Berita\n${listText}`)

    // Saran pencarian
    const suggests = query
      ? ['kompas', 'kompas politik', 'kompas ekonomi']
      : ['kompas', 'kompas politik', 'kompas hari ini']

    builder.addSuggest(suggests)

    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[KOMPAS]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal mengambil berita: ${err.message}`, { pushName: m.pushName }))
  }
}