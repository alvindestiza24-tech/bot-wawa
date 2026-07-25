import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'translate',
  alias: ['tr', 'terjemah'],
  category: 'search',
  description: 'Terjemahkan teks ke bahasa lain',
  usage: '.translate <kode> <teks>',
  example: '.translate id hello world',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 2) return m.reply('❌ Format: .translate <kode> <teks>\nContoh: .translate id hello')

  const lang = args[0]
  const text = args.slice(1).join(' ')

  await m.react('⏳')
  try {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`, { timeout: 8000 })
    const result = res.data[0]?.map(v => v[0]).join('') || res.data

    await new AIRich(sock)
      .setTitle('🌐 Translate')
      .addText(`## ${text}\n\n${result}`)
      .addSuggest(['translate id', 'translate en', 'translate jp'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Error: ${err.message}`)
  }
}