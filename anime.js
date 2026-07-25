// plugins/random/anime.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'anime',
  alias: ['animerandom', 'animegif'],
  category: 'random',
  description: 'Dapatkan gambar/gif anime acak',
  usage: '.anime',
  example: '.anime',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function nekosLife() {
    const res = await axios.get('https://nekos.life/api/v2/img/waifu')
    return res.data.url
  },
 
  async function waifuPics() {
    const res = await axios.get('https://api.waifu.pics/sfw/waifu')
    return res.data.url
  },
  async function animeApi() {
    const res = await axios.get('https://api.anime-api.xyz/api/random')
    return res.data.image || res.data.url
  },
  async function randomAnime() {
    const res = await axios.get('https://api.jikan.moe/v4/random/anime')
    const anime = res.data.data
    return anime.images?.jpg?.image_url || anime.images?.webp?.image_url
  }
]

async function fetchAnime() {
  const errors = []
  for (const fn of APIS) {
    try {
      const url = await fn()
      if (url && url.startsWith('http')) return url
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Semua API gagal:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const imageUrl = await fetchAnime()

    await new AIRich(sock)
      .setTitle('🌸 Random Anime')
      .addImage(imageUrl)
      .addText('Kawaii~')
      .addSuggest(['anime', 'cat', 'dog'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil gambar: ${err.message}`)
  }
}