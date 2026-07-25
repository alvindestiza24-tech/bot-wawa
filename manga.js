// plugins/search/manga.js
import { searchManga } from '../../src/scrape/shinigami-search.js'
import { getMangaDetail } from '../../src/scrape/shinigami-detail.js'
import { getChapterPages } from '../../src/scrape/shinigami-read.js'
import { AIRich } from '../../src/lib/_build-m.js'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000

export const config_ = {
  name: 'manga',
  alias: ['komik', 'manhwa', 'manhua'],
  category: 'search',
  description: 'Cari & baca manga dari Shinigami',
  usage: '.manga <query> | .manga <nomor> | .manga read <chapterId>',
  example: '.manga boruto\n.manga 1\n.manga read abc123',
  isOwner: false, isPremium: false, isGroup: false,
  isPrivate: false, cooldown: 8, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''
  if (!text) {
    return m.reply('❌ Masukkan query pencarian.\nContoh: .manga one piece')
  }

  // Mode: baca chapter dengan UUID
  if (/^read\s+/i.test(text)) {
    const uuid = text.replace(/^read\s+/i, '').trim()
    return handleReadChapter(m, sock, uuid)
  }

  // Mode: pilih manga dengan nomor
  if (/^\d+$/.test(text)) {
    return handleSelectManga(m, sock, parseInt(text))
  }

  // Mode: pencarian
  return handleSearch(m, sock, text)
}

async function handleSearch(m, sock, query) {
  await m.react('🔍')

  try {
    console.log('[MANGA] Search query:', query)
    const results = await searchManga(query, 1, 5)

    if (!results || !results.length) {
      await m.react('😔')
      return m.reply(`❌ Tidak ada manga ditemukan untuk *${query}*.\nCoba gunakan kata kunci lain atau cek koneksi.`)
    }

    sessions.set(m.senderNumber, {
      results,
      expires: Date.now() + SESSION_TTL,
    })

    const products = results.map((manga, i) => ({
      title: `${i + 1}. ${manga.title}`,
      brand: manga.genre?.join(', ') || 'Unknown',
      price: `⭐ ${manga.rating || '-'}`,
      sale_price: `📖 Ch. ${manga.latestChapter || '-'}`,
      image_url: manga.cover || manga.coverPortrait || '',
      product_url: manga.url || `https://g.shinigami.asia/series/${manga.mangaId}`,
    }))

    await new AIRich(sock)
      .setTitle(`🔍 Manga: "${query}"`)
      .addText(`Ditemukan ${results.length} manga. Balas dengan *.manga <nomor>* (1-${results.length}) untuk melihat detail.`)
      .addProduct(products)
      .addSuggest(results.slice(0, 5).map((_, i) => `manga ${i + 1}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[MANGA] Search error:', err)
    await m.react('❌')
    await m.reply(`❌ Gagal mencari manga: ${err.message}`)
  }
}

async function handleSelectManga(m, sock, number) {
  const session = sessions.get(m.senderNumber)
  if (!session || Date.now() > session.expires) {
    sessions.delete(m.senderNumber)
    return m.reply('⌛ Sesi pencarian habis. Cari lagi dengan .manga <query>')
  }
  if (number < 1 || number > session.results.length) {
    return m.reply('❌ Nomor tidak valid.')
  }

  const manga = session.results[number - 1]
  await m.react('⏳')

  try {
    const detail = await getMangaDetail(manga.mangaId, 1, 15)
    if (!detail) return m.reply('❌ Gagal memuat detail manga.')

    // Simpan detail untuk sesi baca chapter
    session.detail = detail
    sessions.set(m.senderNumber, session)

    const chapters = detail.chapters || []
    const products = chapters.map(ch => ({
      title: `Ch. ${ch.number} - ${ch.title}`,
      brand: detail.title,
      price: ch.releaseDate || '',
      sale_price: '',
      image_url: detail.cover || manga.cover || '',
      product_url: `https://g.shinigami.asia/chapter/${ch.chapterId}`,
    }))

    const desc = detail.description?.length > 300
      ? detail.description.slice(0, 297) + '...'
      : detail.description || ''

    const body = `📖 *${detail.title}*\n👤 ${detail.author?.join(', ') || '-'}\n📌 ${detail.status || '-'}\n📚 ${detail.totalChapters} chapters\n\n${desc}\n\nBalas dengan *.manga read <chapterId>* untuk membaca.`

    await new AIRich(sock)
      .setTitle(`📖 ${detail.title}`)
      .addText(body)
      .addProduct(products)
      .addSuggest(chapters.slice(0, 5).map(ch => `manga read ${ch.chapterId}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[MANGA] Detail error:', err)
    await m.react('❌')
    await m.reply(`❌ Gagal memuat detail: ${err.message}`)
  }
}

async function handleReadChapter(m, sock, chapterId) {
  await m.react('⏳')
  try {
    const pages = await getChapterPages(chapterId)

    if (!pages || !pages.length) {
      await m.react('😔')
      return m.reply('❌ Chapter tidak ditemukan atau kosong.')
    }

    // Kirim maksimal 15 halaman
    const toSend = pages.slice(0, 15)
    for (const url of toSend) {
      await sock.sendMessage(m.chat, { image: { url } })
      await new Promise(r => setTimeout(r, 800))
    }

    if (pages.length > 15) {
      await m.reply(`📖 Total ${pages.length} halaman. Baca selengkapnya di:\nhttps://g.shinigami.asia/chapter/${chapterId}`)
    }

    await m.react('✅')
  } catch (err) {
    console.error('[MANGA] Read error:', err)
    await m.react('❌')
    await m.reply(`❌ Gagal membaca chapter: ${err.message}`)
  }
}