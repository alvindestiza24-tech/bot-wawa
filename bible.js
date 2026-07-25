import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'bible',
  alias: ['alkitab', 'ayat', 'verse'],
  category: 'christian',
  description: 'Dapatkan ayat Alkitab acak atau berdasarkan kitab:pasal:ayat',
  usage: '.bible [kitab:pasal:ayat]',
  example: '.bible Yohanes:3:16',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const FALLBACK_VERSES = [
  { book: 'Yohanes', chapter: 3, verse: 16, text: 'Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.' },
  { book: 'Mazmur', chapter: 23, verse: 1, text: 'Tuhan adalah gembalaku, aku tidak kekurangan apa pun.' },
  { book: 'Roma', chapter: 8, verse: 28, text: 'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu bagi mereka yang terpanggil sesuai dengan rencana Allah.' },
  { book: 'Filipi', chapter: 4, verse: 13, text: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.' },
  { book: 'Yeremia', chapter: 29, verse: 11, text: 'Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman Tuhan, yaitu rancangan damai sejahtera dan bukan rancangan kecelakaan, untuk memberikan kepadamu hari depan yang penuh harapan.' },
  { book: 'Matius', chapter: 11, verse: 28, text: 'Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu.' },
  { book: 'Yesaya', chapter: 40, verse: 31, text: 'Tetapi orang-orang yang menanti-nantikan Tuhan mendapat kekuatan baru: mereka seumpama rajawali yang naik terbang dengan kekuatan sayapnya; mereka berlari dan tidak menjadi lesu, mereka berjalan dan tidak menjadi lelah.' },
  { book: 'Amsal', chapter: 3, verse: 5, text: 'Percayalah kepada Tuhan dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri.' }
]

async function fetchVerse(book, chapter, verse) {
  try {
    const res = await axios.get(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}:${verse}`, { timeout: 10000 })
    if (res.data?.text) {
      return { book: res.data.reference || book, chapter, verse, text: res.data.text }
    }
  } catch {}
  const key = `${book}:${chapter}:${verse}`
  for (const v of FALLBACK_VERSES) {
    if (v.book === book && v.chapter === chapter && v.verse === verse) return v
  }
  return null
}

async function fetchRandomVerse() {
  try {
    const res = await axios.get('https://bible-api.com/?random=verse', { timeout: 10000 })
    if (res.data?.text) {
      return { book: res.data.reference || 'Alkitab', chapter: 0, verse: 0, text: res.data.text }
    }
  } catch {}
  const rand = Math.floor(Math.random() * FALLBACK_VERSES.length)
  return FALLBACK_VERSES[rand]
}

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  await m.react('⏳')
  try {
    let result = null
    if (/^[a-zA-Z]+\s*\d+:\d+$/.test(input)) {
      const parts = input.match(/^([a-zA-Z]+)\s*(\d+):(\d+)$/)
      if (parts) {
        const [, book, chapter, verse] = parts
        result = await fetchVerse(book, parseInt(chapter), parseInt(verse))
      }
    }
    if (!result) result = await fetchRandomVerse()

    if (!result) return m.reply('❌ Ayat tidak ditemukan.')

    const text = `## 📖 ${result.book} ${result.chapter || ''}:${result.verse || ''}\n\n${result.text}`

    await new AIRich(sock)
      .setTitle('📖 Firman Tuhan')
      .addText(text)
      .addSuggest(['bible', 'bible Yohanes 3:16', 'renungan'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}