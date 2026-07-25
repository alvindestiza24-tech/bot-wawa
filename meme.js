// plugins/random/meme.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'meme',
  alias: ['memerandom', 'dankmeme'],
  category: 'random',
  description: 'Dapatkan meme acak dari Reddit',
  usage: '.meme',
  example: '.meme',
  isOwner: false,
  cooldown: 7,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'IndianDankMemes']
    const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)]
    const res = await axios.get(`https://meme-api.com/gimme/${randomSub}`)
    const data = res.data
    const meme = data.posts?.[0] || data
    await new AIRich(sock)
      .setTitle(`🖼️ Random Meme from r/${randomSub}`)
      .addImage(meme.url)
      .addText(`## ${meme.title}\n👍 ${meme.ups} upvotes`)
      .addSuggest(['meme', 'cat', 'dog'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil meme: ${err.message}`)
  }
}