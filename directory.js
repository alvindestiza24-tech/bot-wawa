import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'dictionary',
  alias: ['kamus', 'define', 'arti'],
  category: 'search',
  description: 'Cari arti kata dalam bahasa Inggris',
  usage: '.dictionary <kata>',
  example: '.dictionary hello',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const word = m.text?.trim()
  if (!word) return m.reply('❌ Masukkan kata. Contoh: .dictionary hello')

  await m.react('⏳')
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 8000 })
    const data = res.data[0]
    const meanings = data.meanings.slice(0, 3)
    let text = `## 📖 ${data.word}\n`
    for (const m of meanings) {
      text += `\n*${m.partOfSpeech}*\n`
      text += m.definitions.slice(0, 2).map(d => `- ${d.definition}`).join('\n')
    }
    if (data.phonetics?.length) {
      text += `\n\n🔊 ${data.phonetics.find(p => p.audio)?.text || ''}`
    }

    await new AIRich(sock)
      .setTitle('📚 Dictionary')
      .addText(text)
      .addSuggest(['dictionary', 'translate', 'define'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Kata "${word}" tidak ditemukan.`)
  }
}