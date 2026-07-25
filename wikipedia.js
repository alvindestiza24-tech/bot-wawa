// plugins/search/wikipedia.js
import { searchWikipedia, getFullArticle } from '../../src/scrape/wikipedia.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'wikipedia',
  alias: ['wiki', 'wikisearch', 'caridefinisi'],
  category: 'search',
  description: 'Cari artikel di Wikipedia',
  usage: '.wiki <kata kunci>',
  example: '.wiki Indonesia',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim()
  if (!input) {
    return m.reply('❌ Masukkan kata kunci.\nContoh: *.wiki Albert Einstein*')
  }

  await m.react('🔍')

  try {
    const search = await searchWikipedia(input)

    if (!search.results.length) {
      await m.react('😔')
      return m.reply(`❌ Artikel *${input}* tidak ditemukan di Wikipedia.`)
    }

    const first = search.results[0]
    const detail = await getFullArticle(first.title)

    const article = detail.article
    const builder = new AIRich(sock).setTitle(`📚 ${article.title}`)

    if (article.images.length > 0) {
      builder.addImage(article.images[0].url, { resolveUrl: false })
    }

    if (article.extract) {
      
      const maxChars = 800
      const extractText = article.extract.length > maxChars
        ? article.extract.slice(0, maxChars) + '…'
        : article.extract
      builder.addText(extractText)
    }


    if (Object.keys(article.infobox).length > 0) {
      const rows = [['Info', 'Detail']]
      for (const [key, value] of Object.entries(article.infobox).slice(0, 8)) {
        rows.push([key, value])
      }
      builder.addTable(rows)
    }


    if (article.sections.length > 0) {
      const sectionList = article.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')
      builder.addText(`📑 *Daftar Isi:*\n${sectionList}`)
    }

    
    builder.setFooter(`Wikipedia • ${article.url}`)

    
    const suggestList = ['wikipedia']
    if (article.sections.length > 0) {
     
      article.sections.slice(0, 4).forEach(s => {
        suggestList.push(`wiki ${s.title}`)
      })
    }
    builder.addSuggest(suggestList.slice(0, 6))

    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    console.error('[WIKIPEDIA]', err)
    await m.reply(`❌ Gagal mengambil data: ${err.message}`)
  }
}