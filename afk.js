import { setAfk, hasAfk } from '../../src/lib/afk-store.js'

export const config_ = {
  name:        'afk',
  alias:       ['away', 'brb'],
  category:    'group',
  description: 'Set status AFK dengan alasan',
  usage:       '.afk <alasan>',
  example:     '.afk lagi makan',
  isOwner:     false,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m) {
  const reason = m.text || 'Tidak ada alasan'

  setAfk(m.sender, reason)

  await m.reply(
    `💤 *ᴀꜰᴋ ᴀᴋᴛɪꜰ*\n\n` +
    `\`\`\`@${m.senderNumber} sekarang AFK\`\`\`\n` +
    `🍀 \`Alasan:\` *${reason}*\n\n` +
    `_Ketik apapun untuk menonaktifkan AFK._`,
    { mentions: [m.sender] }
  )
}
