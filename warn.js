import { getDatabase } from '../../src/database.js'

export const config_ = {
  name: 'warn',
  alias: ['warning', 'peringatan'],
  category: 'group',
  description: 'Memberi peringatan kepada member',
  usage: '.warn @user <alasan>',
  example: '.warn @user spam',
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

  let groupData = db.getGroup(m.chat) || {}
  let warnings = groupData.warnings || {}
  const maxWarns = groupData.maxWarnings || 3

  if (!m.args[0] && !m.quoted && !m.mentionedJid?.length) {
    return m.reply(
      `⚠️ *SISTEM WARNING GRUP*\n\n` +
        `Batas Warning: *${maxWarns} kali* (Otomatis Kick)\n\n` +
        `• *${m.prefix}warn @user <alasan>* — Memberi warning\n` +
        `• *${m.prefix}warn max <angka>* — Ubah batas maksimal\n` +
        `• *${m.prefix}clearwarn @user* — Hapus warning member\n` +
        `• *${m.prefix}listwarn* — Lihat daftar warning`
    )
  }

  if (m.args[0]?.toLowerCase() === 'max') {
    const newMax = parseInt(m.args[1])
    if (isNaN(newMax) || newMax < 1 || newMax > 20) {
      return m.reply(`❌ Batas warning harus angka 1-20\nContoh: *${m.prefix}warn max 5*`)
    }
    groupData.maxWarnings = newMax
    db.setGroup(m.chat, groupData)
    return m.reply(`✅ Batas warning diubah menjadi *${newMax} kali*`)
  }

  let targetUser = null
  if (m.quoted) {
    targetUser = m.quoted.sender
  } else if (m.mentionedJid?.length) {
    targetUser = m.mentionedJid[0]
  } else if (m.args[0]) {
    const num = m.args[0].replace(/[^0-9]/g, '')
    targetUser = num + '@s.whatsapp.net'
  }

  if (!targetUser) {
    return m.reply(`❌ Tidak dapat mendeteksi target. Tag user atau reply pesannya.`)
  }

  const reason = (m.mentionedJid?.length ? m.args.slice(1) : m.quoted ? m.args : m.args.slice(1)).join(' ') || 'Tidak ada alasan'

  if (!warnings[targetUser]) warnings[targetUser] = []
  warnings[targetUser].push({
    reason,
    by: m.sender,
    time: Date.now(),
  })

  const warnCount = warnings[targetUser].length
  groupData.warnings = warnings
  db.setGroup(m.chat, groupData)

  const targetNum = targetUser.split('@')[0]

  if (warnCount >= maxWarns) {
    await m.reply(
      `⚠️ *WARNING KE-${warnCount}*\n\n` +
        `@${targetNum} telah mencapai batas maximum warning!\n` +
        `*Alasan:* ${reason}\n\n` +
        `⚡ Mengeksekusi kick...`,
      { mentions: [targetUser] }
    )
    try {
      await sock.groupParticipantsUpdate(m.chat, [targetUser], 'remove')
      warnings[targetUser] = []
      db.setGroup(m.chat, groupData)
    } catch {
      await m.reply(`❌ Gagal kick. Pastikan bot adalah admin.`)
    }
    return
  }

  await m.reply(
    `⚠️ *WARNING ${warnCount}/${maxWarns}*\n\n` +
      `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
      `┃ 👤 ᴜsᴇʀ: @${targetNum}\n` +
      `┃ 📝 ᴀʟᴀsᴀɴ: ${reason}\n` +
      `┃ ⚠️ ᴡᴀʀɴ: ${warnCount}/${maxWarns}\n` +
      `╰┈┈⬡\n\n` +
      `_${maxWarns - warnCount} warning lagi sebelum kick!_`,
    { mentions: [targetUser] }
  )
}
