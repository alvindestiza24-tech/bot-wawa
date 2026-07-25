// plugins/random/fact.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'fact',
  alias: ['fakta', 'randomfact'],
  category: 'random',
  description: 'Dapatkan fakta menarik acak',
  usage: '.fact',
  example: '.fact',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
    const fact = res.data.text || res.data.fact || 'Tidak ada fakta.'
    await new AIRich(sock)
      .setTitle('🧠 Random Fact')
      .addText(`## ${fact}`)
      .addSuggest(['fact', 'joke', 'quote'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil fakta: ${err.message}`)
  }
}