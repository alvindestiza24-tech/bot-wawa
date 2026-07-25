import { removeBanned, getBannedList, norm } from '../../src/lib/role-db.js'

export const config_ = {
  name:        'unban',
  alias:       ['delban'],
  category:    'owner',
  description: 'Hapus ban user',
  usage:       '.unban <nomor/@tag>',
  example:     '.unban 6281234567890',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    3,
  isEnabled:   true,
}
export { config_ as config }

function resolveTarget(m) {
  let raw = ''
  if (m.quoted)                raw = m.quoted.sender || ''
  else if (m.mentionedJid?.length) raw = m.mentionedJid[0] || ''
  else if (m.args[0])          raw = m.args[0]
  return norm(raw || '')
}

export async function handler(m) {
  const num = resolveTarget(m)

  if (!num || num.length < 10) {
    return m.reply(
      `Masukkan nomor atau tag user\n\`Contoh: ${m.prefix}unban 6281234567890\``
    )
  }

  try {
    const result = removeBanned(num)
    if (!result.success) return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.message}`)

    const sisa = getBannedList().length

    await m.react('✅')
    await m.reply(
      `✅ *ᴜsᴇʀ ᴅɪᴜɴʙᴀɴ*\n\n` +
      `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
      `┃ 📱 ɴᴏᴍᴏʀ: \`${num}\`\n` +
      `┃ ✅ sᴛᴀᴛᴜs: \`Unbanned\`\n` +
      `┃ 📊 sɪsᴀ ʙᴀɴ: \`${sisa}\` ᴜsᴇʀ\n` +
      `╰┈┈⬡`
    )
  } catch (err) {
    console.error('[UNBAN]', err)
    return m.reply('❌ Gagal memproses unban. Periksa console log.')
  }
}