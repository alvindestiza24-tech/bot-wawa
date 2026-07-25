import axios from 'axios'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'githubstalk',
  alias: ['ghstalk', 'github'],
  category: 'stalk',
  description: 'Stalk profil GitHub dengan tampilan AI Rich',
  usage: '.githubstalk <username>',
  example: '.githubstalk torvalds',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

async function githubstalk(user) {
  try {
    const { data } = await axios.get(`https://api.github.com/users/${user}`)
    return {
      username: data.login,
      nickname: data.name,
      bio: data.bio,
      id: data.id,
      nodeId: data.node_id,
      profile_pic: data.avatar_url,
      url: data.html_url,
      type: data.type,
      admin: data.site_admin,
      company: data.company,
      blog: data.blog,
      location: data.location,
      email: data.email,
      public_repo: data.public_repos,
      public_gists: data.public_gists,
      followers: data.followers,
      following: data.following,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (err) {
    throw new Error('User tidak ditemukan atau API error: ' + err.message)
  }
}

export async function handler(m, { sock }) {
  const username = m.args[0]?.trim()
  if (!username) {
    return m.reply(beautifulMessage('❌ Masukkan username GitHub. Contoh: .githubstalk torvalds', { pushName: m.pushName }))
  }

  await m.react('⏳')

  try {
    const data = await githubstalk(username)

    const profileText = `## 👤 ${data.nickname || data.username}\n` +
      `**Username:** [${data.username}](${data.url})\n` +
      (data.bio ? `**Bio:** ${data.bio}\n` : '') +
      (data.company ? `**Company:** ${data.company}\n` : '') +
      (data.location ? `**Location:** ${data.location}\n` : '') +
      (data.blog ? `**Blog:** ${data.blog}\n` : '') +
      (data.email ? `**Email:** ${data.email}\n` : '')

    const statsTable = [
      ['Metric', 'Value'],
      ['Public Repos', String(data.public_repo)],
      ['Public Gists', String(data.public_gists)],
      ['Followers', String(data.followers)],
      ['Following', String(data.following)],
      ['Account Type', data.type],
      ['Created', new Date(data.created_at).toLocaleDateString()],
      ['Updated', new Date(data.updated_at).toLocaleDateString()],
    ]

    await new AIRich(sock)
      .setTitle('🐙 GitHub Profile')
      .addText(profileText)
      .addTable(statsTable)
      .addImage(data.profile_pic)
      .addSuggest([
        'Lihat Profil GitHub',
        'Cek Repository',
      ])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[GITHUBSTALK]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal mengambil data: ${err.message}`, { pushName: m.pushName }))
  }
}