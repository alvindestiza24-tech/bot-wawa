// plugins/random/cat.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'cat',
  alias: ['kucing', 'meow'],
  category: 'random',
  description: 'Dapatkan gambar kucing acak',
  usage: '.cat',
  example: '.cat',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const res = await axios.get('https://api.thecatapi.com/v1/images/search')
    const imageUrl = res.data[0].url
    await new AIRich(sock)
      .setTitle('🐱 Random Cat')
      .addImage(imageUrl)
      .addText('Meow~')
      .addSuggest(['cat', 'dog', 'anime'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil gambar: ${err.message}`)
  }
}