import { getDatabase } from '../../src/database.js'
import { clearHistory } from '../../src/ai/cs-ai/cs-session.js'

export const config_ = {
  name:      'setcs',
  alias:     ['csgrub', 'togglecs'],
  category:  'group',
  description: 'Toggle CS AI di grup ini',
  usage:     '.setcs on/off',
  isOwner:   false,
  isAdmin:   true,
  isGroup:   true,
  cooldown:  3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m) {
  const db     = getDatabase()
  const arg    = (m.args?.[0] || '').toLowerCase()
  const group  = db.getGroup(m.chat) || {}
  const status = group.cs_ai === true

  if (!arg) {
    return m.reply(
      `꒰ setcs ꒱\n\n` +
      `Status CS AI di grup ini: *${status ? '✅ Aktif' : '❌ Nonaktif'}*\n\n` +
      `\`.setcs on\` — aktifkan\n` +
      `\`.setcs off\` — matikan`
    )
  }

  if (arg === 'on') {
    db.setGroup(m.chat, { ...group, cs_ai: true })
    return m.reply(
      `✅ *CS AI Aktif di Grup Ini*\n\n` +
      `Tag @bot atau reply pesan bot untuk mulai chat dengan CS.\n` +
      `Bot akan otomatis menjawab pertanyaan seputar produk & order.`
    )
  }

  if (arg === 'off') {
    db.setGroup(m.chat, { ...group, cs_ai: false })
    return m.reply(`❌ *CS AI Nonaktif* di grup ini.`)
  }

  return m.reply(`Pilihan tidak valid. Gunakan: \`on\` atau \`off\``)
}