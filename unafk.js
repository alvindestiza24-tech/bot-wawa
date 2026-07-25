import { getAfk, deleteAfk } from '../../src/lib/afk-store.js'
import { fmtDuration } from '../../src/lib/function.js'

export const config_ = {
  name:        'unafk',
  alias:       ['back', 'kembali'],
  category:    'group',
  description: 'Nonaktifkan status AFK secara manual',
  usage:       '.unafk',
  example:     '.unafk',
  isOwner:     false,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    3,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m) {
  const data = getAfk(m.sender)

  if (!data) return m.reply('❌ Kamu tidak sedang AFK.')

  deleteAfk(m.sender)

  await m.reply(
    `👋 *ᴀꜰᴋ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
    `\`\`\`@${m.senderNumber} sudah kembali!\`\`\`\n` +
    `🍀 \`Durasi AFK:\` *${fmtDuration(Date.now() - data.time)}*`,
    { mentions: [m.sender] }
  )
}
