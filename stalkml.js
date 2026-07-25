// plugins/stalk/stalkml.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'stalkml',
  alias: ['mlstalk', 'mobilelegends'],
  category: 'stalk',
  description: 'Cek profil pemain Mobile Legends (ID)',
  usage: '.stalkml <userID>',
  example: '.stalkml 123456789',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function duniagames(userId) {
    const res = await axios.get(`https://api.duniagames.co.id/api/ml/player?userid=${encodeURIComponent(userId)}`)
    const data = res.data
    if (!data?.data) throw new Error('Data tidak ditemukan')
    const player = data.data
    return {
      username: player.username || player.nickname || 'Unknown',
      userId: player.userid || player.userId || userId,
      level: player.level || 0,
      rank: player.rank || 'Unranked',
      avatar: player.avatar || player.avatar_url || null,
      region: player.region || 'Global',
      stats: player.stats || {},
      favorite: player.favorite_hero || player.fav_hero || 'Unknown'
    }
  },
  async function rifqyApi(userId) {
    const res = await axios.get(`https://api.rifqy.my.id/ml/player?userid=${encodeURIComponent(userId)}`)
    const data = res.data
    if (!data?.result) throw new Error('Data tidak ditemukan')
    const player = data.result
    return {
      username: player.nickname || 'Unknown',
      userId: player.userid || userId,
      level: player.level || 0,
      rank: player.rank || 'Unranked',
      avatar: player.avatar || null,
      region: player.region || 'Global',
      stats: player.stats || {},
      favorite: player.favorite_hero || 'Unknown'
    }
  }
]

async function fetchML(userId) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(userId)
      if (result?.username) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil data ML:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const userId = m.text?.trim()
  if (!userId) return m.reply('❌ Masukkan ID Mobile Legends. Contoh: .stalkml 123456789')

  await m.react('⏳')
  try {
    const data = await fetchML(userId)

    const text = `## ⚔️ Profil Mobile Legends\n` +
      `**Username:** ${data.username}\n` +
      `**User ID:** ${data.userId}\n` +
      `**Level:** ${data.level}\n` +
      `**Rank:** ${data.rank}\n` +
      `**Region:** ${data.region}\n` +
      (data.favorite ? `**Hero Favorit:** ${data.favorite}\n` : '') +
      (data.stats?.win_rate ? `**Win Rate:** ${data.stats.win_rate}%\n` : '') +
      (data.stats?.matches ? `**Total Match:** ${data.stats.matches}\n` : '')

    const builder = new AIRich(sock).setTitle('🎮 Mobile Legends Stalker')
    if (data.avatar) {
      builder.addImage(data.avatar)
    }
    builder.addText(text)
    builder.addSuggest(['stalkml', 'stalkff', 'stalkroblox'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}