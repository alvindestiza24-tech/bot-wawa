// plugins/stalk/ttstalk.js
import axios from 'axios'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'tiktokstalk',
  alias: ['ttstalk', 'stalktt', 'tiktok'],
  category: 'stalk',
  description: 'Stalk profil TikTok dengan tampilan AI Rich Post',
  usage: '.tiktokstalk <username>',
  example: '.tiktokstalk mrbeast',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

function formatNumber(n) {
  n = parseInt(n || 0)
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

export async function handler(m, { sock }) {
  const username = (m.args[0] || m.text || '').replace('@', '').trim()
  if (!username) {
    return m.reply(beautifulMessage('❌ Masukkan username TikTok. Contoh: .tiktokstalk mrbeast', { pushName: m.pushName }))
  }

  const apiKey = 'OurinNextGen'

  await m.react('⏳')

  try {
    const { data } = await axios.get(
      'https://firefly.maiku.my.id/api/stalk-tiktok',
      {
        params: {
          apikey: apiKey,
          username: username
        },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
      }
    )

    if (!data?.status || !data?.data) {
      return m.reply(beautifulMessage(`❌ Username *@${username}* tidak ditemukan`, { pushName: m.pushName }))
    }

    const d = data.data
    const stats = d.stats || {}

    const result = {
      username: d.username,
      name: d.nickname,
      avatar: d.avatar,
      verified: d.verified || false,
      bio: d.signature || '-',
      stats: {
        followers: stats.followers || 0,
        likes: stats.hearts || 0,
        videos: stats.videos || 0
      },
      link: `https://tiktok.com/@${d.username}`
    }

    const builder = new AIRich(sock)
      .setTitle('🎵 TikTok Profile')

    builder.addPost([
      {
        profile_url: result.avatar,
        username: result.username,
        title: result.name || result.username,
        subtitle: result.verified ? 'Verified Account' : 'TikTok Creator',
        caption: result.bio || '-',
        verified: result.verified || false,
        url: result.link,
        thumbnail: result.avatar,
        source: 'TIKTOK',
        footer: `${formatNumber(result.stats.followers)} followers · ${formatNumber(result.stats.likes)} likes`,
        deeplink: result.link,
        icon: result.avatar,
        orientation: 'LANDSCAPE',
        post_type: 'PHOTO',
        like: result.stats.likes || 0,
        comment: result.stats.videos || 0,
        share: 0
      }
    ])

    builder.addSuggest([
      'Buka Profil TikTok',
      'Download Video',
    ])

    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')

  } catch (err) {
    console.error('[TIKTOKSTALK]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal mengambil data: ${err.message.slice(0, 100)}`, { pushName: m.pushName }))
  }
}