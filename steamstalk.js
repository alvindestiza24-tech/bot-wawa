// plugins/stalk/stalksteam.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'stalksteam',
  alias: ['steamstalk', 'steam'],
  category: 'stalk',
  description: 'Cek profil pengguna Steam (ID atau custom URL)',
  usage: '.stalksteam <steamID>',
  example: '.stalksteam 76561198000000000',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function steamOfficial(steamId) {
    // Gunakan API key publik (ganti dengan milikmu)
    const apiKey = 'A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3' // contoh, ganti
    const res = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`)
    const data = res.data
    if (!data.response?.players?.length) throw new Error('User tidak ditemukan')
    const player = data.response.players[0]
    return {
      steamId: player.steamid,
      username: player.personaname,
      avatar: player.avatarmedium || player.avatarfull,
      profileUrl: player.profileurl,
      realName: player.realname || '',
      country: player.loccountrycode || 'Unknown',
      created: player.timecreated ? new Date(player.timecreated * 1000).toLocaleDateString('id-ID') : 'Unknown',
      status: player.communityvisibilitystate === 3 ? 'Public' : 'Private'
    }
  },
  async function steamNoKey(steamId) {
    const res = await axios.get(`https://steamcommunity.com/profiles/${steamId}`)
    const html = res.data
    const nameMatch = html.match(/<span class="actual_persona_name">([^<]+)<\/span>/)
    const avatarMatch = html.match(/<img class="playerAvatarAutoSize" src="([^"]+)"\/>/)
    if (!nameMatch) throw new Error('User tidak ditemukan')
    return {
      steamId,
      username: nameMatch[1].trim(),
      avatar: avatarMatch?.[1] || null,
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
      realName: '',
      country: 'Unknown',
      created: 'Unknown',
      status: 'Public'
    }
  }
]

async function fetchSteam(steamId) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(steamId)
      if (result?.username) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil data Steam:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const steamId = m.text?.trim()
  if (!steamId) return m.reply('❌ Masukkan Steam ID. Contoh: .stalksteam 76561198000000000')

  await m.react('⏳')
  try {
    const data = await fetchSteam(steamId)

    const text = `## 🎮 Profil Steam\n` +
      `**Username:** ${data.username}\n` +
      `**Steam ID:** ${data.steamId}\n` +
      `**Real Name:** ${data.realName || '-'}\n` +
      `**Negara:** ${data.country}\n` +
      `**Bergabung:** ${data.created}\n` +
      `**Status:** ${data.status}\n` +
      `**Profile:** ${data.profileUrl}`

    const builder = new AIRich(sock).setTitle('🖥️ Steam Stalker')
    if (data.avatar) {
      builder.addImage(data.avatar)
    }
    builder.addText(text)
    builder.addSuggest(['stalksteam', 'stalkroblox', 'stalkyoutube'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}