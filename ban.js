import config from '../../config.js'
import { addBanned, getBannedList, norm } from '../../src/lib/role-db.js'

export const config_ = {
  name:        'ban',
  alias:       ['addban', 'listban'],
  category:    'owner',
  description: 'Blokir user dari menggunakan bot',
  usage:       '.ban <nomor/@tag>\n.listban',
  example:     '.ban 6281234567890',
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
  if (m.quoted)               raw = m.quoted.sender || ''
  else if (m.mentionedJid?.length) raw = m.mentionedJid[0] || ''
  else if (m.args[0])         raw = m.args[0]
  return norm(raw || '')
}

export async function handler(m) {
  const cmd    = m.command.toLowerCase()
  const isList = cmd === 'listban'

  if (isList) {
    const list = getBannedList()
    if (!list.length) return m.reply('🚫 Belum ada user yang dibanned.')
    let txt = `🚫 *DAFTAR BANNED* (${list.length} user)\n\n`
    list.forEach((b, i) => {
      const num    = typeof b === 'string' ? b : b.number
      const reason = typeof b === 'object' ? b.reason || '-' : '-'
      txt += `${i + 1}. \`${num}\` — ${reason}\n`
    })
    return m.reply(txt)
  }

  const num = resolveTarget(m)

  if (!num || num.length < 10 || num.length > 15) {
    return m.reply(
      `🚫 *ʙᴀɴ ᴜsᴇʀ*\n\n` +
      `> Masukkan nomor atau tag user\n\n` +
      `\`Contoh: ${m.prefix}ban 6281234567890\``
    )
  }

  if (config.isOwner(num)) {
    return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat ban owner.')
  }

  try {
    const reason = m.text || '-'
    const result = addBanned(num, reason)

    if (!result.success) {
      return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.message}`)
    }

    const total = getBannedList().length

    await m.react('🚫')
    await m.reply(
      `🚫 *ᴜsᴇʀ ᴅɪʙᴀɴɴᴇᴅ*\n\n` +
      `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
      `┃ 📱 ɴᴏᴍᴏʀ: \`${num}\`\n` +
      `┃ 📝 ᴀʟᴀsᴀɴ: ${reason}\n` +
      `┃ 🚫 sᴛᴀᴛᴜs: \`Banned\`\n` +
      `┃ 📊 ᴛᴏᴛᴀʟ ʙᴀɴ: \`${total}\` ᴜsᴇʀ\n` +
      `╰┈┈⬡`
    )
  } catch (err) {
    console.error('[BAN]', err)
    return m.reply('❌ Gagal memproses ban. Periksa console log.')
  }
}