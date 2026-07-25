import axios from 'axios'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'igstalk',
  alias: ['instagramstalk', 'ig', 'stalking'],
  category: 'stalk',
  description: 'Stalk profil Instagram dengan tampilan AI Rich Post + Tabel',
  usage: '.igstalk <username>',
  example: '.igstalk kersenify666',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'M'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'jt'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'rb'
  return String(n)
}

export async function handler(m, { sock }) {
  const username = (m.args[0] || m.text || '').replace('@', '').trim()
  if (!username) {
    return m.reply(beautifulMessage('❌ Masukkan username Instagram. Contoh: .igstalk kersenify666', { pushName: m.pushName }))
  }

  await m.react('⏳')

  try {
    const { data } = await axios.get(
      'https://api-nanzz.my.id/docs/api/stalker/ig-stalk.php',
      { params: { username }, timeout: 30000 }
    )

    if (!data?.status || !data?.result) {
      return m.reply(beautifulMessage(`❌ Akun *@${username}* tidak ditemukan`, { pushName: m.pushName }))
    }

    const r = data.result
    const s = r.stats

    // Bangun teks profil
    const profileText = `## 👤 ${r.full_name || r.username}\n` +
      `**Username:** [@${r.username}](https://instagram.com/${r.username})\n` +
      `**Verified:** ${r.is_verified ? '✅' : '❌'}\n` +
      `**Private:** ${r.is_private ? '🔒 Ya' : '🌍 Tidak'}\n` +
      (r.bio ? `**Bio:** ${r.bio}\n` : '') +
      (r.external_url ? `**Website:** ${r.external_url}\n` : '')

    // Tabel statistik
    const statsTable = [
      ['Metric', 'Value'],
      ['Followers', formatNumber(s.followers)],
      ['Following', formatNumber(s.following)],
      ['Posts', formatNumber(s.posts)],
      ['Account Type', r.is_business ? 'Business' : 'Personal'],
    ]

    // Kirim sebagai AI Rich dengan Post + Tabel
    const builder = new AIRich(sock)
      .setTitle('📸 Instagram Profile')
      .addText(profileText)
      builder.addPost([
      {
        profile_url: r.profile_pic,
        username: r.username,
        title: r.full_name || r.username,
        subtitle: r.is_verified ? 'Verified Account' : 'Instagram',
        caption: r.bio || '-',
        verified: r.is_verified || false,
        url: `https://instagram.com/${r.username}`,
        thumbnail: r.profile_pic,
        source: 'INSTAGRAM',
        footer: `${formatNumber(s.followers)} followers · ${formatNumber(s.following)} following`,
        deeplink: `https://instagram.com/${r.username}`,
        icon: r.profile_pic,
        orientation: 'LANDSCAPE',
        post_type: 'PHOTO',
        like: s.followers || 0,
        comment: s.posts || 0,
        share: 0
      }
    ])
      .addTable(statsTable)
    builder.addSuggest([
      'Buka Profil Instagram',
      'Download Foto Profil',
    ])

    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')

  } catch (err) {
    console.error('[IGSTALK]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal mengambil data: ${err.message.slice(0, 100)}`, { pushName: m.pushName }))
  }
}