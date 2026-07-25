import { getDatabase } from '../../src/database.js'

export const config_ = {
  name: 'clearwarn',
  alias: ['resetwarn', 'delwarn', 'listwarn'],
  category: 'group',
  description: 'Hapus atau lihat warning member',
  usage: '.clearwarn @user\n.listwarn',
  example: '.clearwarn @user',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const cmd = m.command.toLowerCase()
  const groupData = db.getGroup(m.chat) || {}
  const warnings = groupData.warnings || {}

  if (cmd === 'listwarn') {
    const entries = Object.entries(warnings).filter(([, w]) => w?.length)
    if (!entries.length) return m.reply(`📋 Tidak ada member yang memiliki warning.`)

    const mentions = entries.map(([jid]) => jid)
    let txt = `📋 *DAFTAR WARNING GRUP*\n\n`
    entries.forEach(([jid, warns], i) => {
      txt += `${i + 1}. @${jid.split('@')[0]} — *${warns.length}x*\n`
    })
    return m.reply(txt, { mentions })
  }

  let targetUser = null
  if (m.quoted) targetUser = m.quoted.sender
  else if (m.mentionedJid?.length) targetUser = m.mentionedJid[0]

  if (!targetUser) {
    return m.reply(`❌ Tag atau reply pesan user yang ingin dihapus warnnya.`)
  }

  if (!warnings[targetUser]?.length) {
    return m.reply(`❌ @${targetUser.split('@')[0]} tidak memiliki warning.`, {
      mentions: [targetUser],
    })
  }

  const count = warnings[targetUser].length
  delete warnings[targetUser]
  groupData.warnings = warnings
  db.setGroup(m.chat, groupData)

  await m.react('✅')
  await m.reply(
    `✅ Warning @${targetUser.split('@')[0]} (*${count}x*) berhasil dihapus.`,
    { mentions: [targetUser] }
  )
}
