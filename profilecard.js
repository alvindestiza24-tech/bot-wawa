import { getDatabase } from '../../src/database.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'profilecard',
  alias: ['profil', 'myprofile'],
  category: 'user',
  description: 'Tampilkan profil pengguna (XP, level, koin)',
  usage: '.profile',
  example: '.profile',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const userId = m.sender
  const user = db.getUser(userId)

  if (!user) {
    db.setUser(userId)
    return m.reply('✅ Profil berhasil dibuat! Ketik .profile lagi.')
  }

  const text = `## 👤 Profil User\n**Nama:** ${user.name || m.pushName || 'Unknown'}\n**ID:** ${m.senderNumber}\n**Level:** ${user.level || 1}\n**XP:** ${user.exp || 0}\n**Koin:** ${user.koin || 0}\n**Bergabung:** ${user.registeredAt ? new Date(user.registeredAt).toLocaleDateString('id-ID') : '-'}`

  await new AIRich(sock)
    .setTitle('👤 Profile Card')
    .addText(text)
    .addSuggest(['profile', 'top', 'daily'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}