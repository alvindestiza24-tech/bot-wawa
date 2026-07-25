// plugins/random/dog.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'dog',
  alias: ['anjing', 'woof'],
  category: 'random',
  description: 'Dapatkan gambar anjing acak',
  usage: '.dog',
  example: '.dog',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const res = await axios.get('https://api.thedogapi.com/v1/images/search')
    const imageUrl = res.data[0].url
    await new AIRich(sock)
      .setTitle('🐶 Random Dog')
      .addImage(imageUrl)
      .addText('Woof!')
      .addSuggest(['dog', 'cat', 'anime'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil gambar: ${err.message}`)
  }
}