// plugins/stalk/stalkff.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'stalkff',
  alias: ['ffstalk', 'freefire'],
  category: 'stalk',
  description: 'Cek profil pemain Free Fire (ID)',
  usage: '.stalkff <userID>',
  example: '.stalkff 123456789',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function duniagames(userId) {
    const res = await axios.get(`https://api.duniagames.co.id/api/ff/player?userid=${encodeURIComponent(userId)}`)
    const data = res.data
    if (!data?.data) throw new Error('Data tidak ditemukan')
    const player = data.data
    return {
      username: player.username || player.nickname || 'Unknown',
      userId: player.userid || player.userId || userId,
      level: player.level || 0,
      exp: player.exp || 0,
      avatar: player.avatar || player.avatar_url || null,
      region: player.region || 'Global',
      battle: player.battle || {},
      stats: player.stats || {}
    }
  },
  async function rifqyApi(userId) {
    const res = await axios.get(`https://api.rifqy.my.id/ff/player?userid=${encodeURIComponent(userId)}`)
    const data = res.data
    if (!data?.result) throw new Error('Data tidak ditemukan')
    const player = data.result
    return {
      username: player.nickname || 'Unknown',
      userId: player.userid || userId,
      level: player.level || 0,
      exp: player.exp || 0,
      avatar: player.avatar || null,
      region: player.region || 'Global',
      battle: player.battle || {},
      stats: player.stats || {}
    }
  },
  async function scrapeFF(userId) {
    const res = await axios.get(`https://ff.garena.com/id/profile/${userId}`)
    const html = res.data
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const levelMatch = html.match(/Level\s*(\d+)/)
    const avatarMatch = html.match(/<img[^>]*src="([^"]*avatar[^"]*)"[^>]*>/)
    if (!nameMatch) throw new Error('User tidak ditemukan')
    return {
      username: nameMatch[1]?.trim() || 'Unknown',
      userId,
      level: parseInt(levelMatch?.[1] || '0'),
      exp: 0,
      avatar: avatarMatch?.[1] || null,
      region: 'Global',
      battle: {},
      stats: {}
    }
  }
]

async function fetchFF(userId) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(userId)
      if (result?.username) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil data FF:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const userId = m.text?.trim()
  if (!userId) return m.reply('❌ Masukkan ID Free Fire. Contoh: .stalkff 123456789')

  await m.react('⏳')
  try {
    const data = await fetchFF(userId)

    const text = `## 🔥 Profil Free Fire\n` +
      `**Username:** ${data.username}\n` +
      `**User ID:** ${data.userId}\n` +
      `**Level:** ${data.level}\n` +
      `**XP:** ${data.exp}\n` +
      `**Region:** ${data.region}\n` +
      (data.battle?.total ? `**Total Battle:** ${data.battle.total}\n` : '') +
      (data.battle?.win ? `**Win:** ${data.battle.win}\n` : '') +
      (data.battle?.killed ? `**Killed:** ${data.battle.killed}\n` : '')

    const builder = new AIRich(sock).setTitle('🎯 Free Fire Stalker')
    if (data.avatar) {
      builder.addImage(data.avatar)
    }
    builder.addText(text)
    builder.addSuggest(['stalkff', 'stalkml', 'stalkroblox'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}