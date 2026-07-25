import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'stalktwitter',
  alias: ['twitterstalk', 'xstalk'],
  category: 'stalk',
  description: 'Cek profil pengguna Twitter/X',
  usage: '.stalktwitter <username>',
  example: '.stalktwitter elonmusk',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const username = m.text?.trim()
  if (!username) return m.reply('❌ Masukkan username Twitter. Contoh: .stalktwitter elonmusk')

  await m.react('⏳')
  try {
    const res = await axios.get(`https://api.terhambar.com/api/twitter/stalk?username=${encodeURIComponent(username)}`, { timeout: 10000 })
    const data = res.data
    if (!data.success) throw new Error(data.message || 'User tidak ditemukan')

    const user = data.data
    const text = `## 🐦 Profil Twitter\n**Username:** @${user.username}\n**Name:** ${user.name}\n**Bio:** ${user.description || '-'}\n**Followers:** ${user.followers}\n**Following:** ${user.following}\n**Tweets:** ${user.tweets}\n**Joined:** ${user.joined}`

    const builder = new AIRich(sock).setTitle('🐦 Twitter Stalk')
    if (user.avatar) builder.addImage(user.avatar)
    builder.addText(text)
    builder.addSuggest(['stalktwitter', 'stalkig', 'stalkgithub'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}