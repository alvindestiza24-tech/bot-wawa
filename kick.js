import {
  resolveAnyLidToJid,
  findParticipantByNumber,
  getParticipantJid,
  cacheParticipantLids,
} from '../../src/lib/lid.js'

export const config_ = {
  name:        'kick',
  alias:       ['remove', 'tendang'],
  category:    'group',
  description: 'Kick member dari grup',
  usage:       '.kick @user atau reply',
  example:     '.kick @user',
  isOwner:     false,
  isPremium:   false,
  isGroup:     true,
  isPrivate:   false,
  isAdmin:     true,
  isBotAdmin:  true,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m, { sock, groupMeta }) {
  const participants = groupMeta?.participants || []
  cacheParticipantLids(participants)

  let rawTarget = null
  if (m.quoted) {
    rawTarget = m.quoted.sender
  } else if (m.mentionedJid?.length) {
    rawTarget = m.mentionedJid[0]
  }

  if (!rawTarget) {
    return m.reply(
      `❌ *TARGET TIDAK DITEMUKAN*\n\n` +
      `> Reply pesan user atau mention!\n` +
      `> Contoh: \`${m.prefix}kick @user\``
    )
  }

  const targetJid = resolveAnyLidToJid(rawTarget, participants)
  const botJid    = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
  const botNum    = botJid.replace(/@.*$/, '')
  const targetNum = targetJid.replace(/@.*$/, '')

  if (targetNum === botNum) {
    return m.reply(`❌ *GAGAL*\n\n> Tidak bisa kick bot sendiri!`)
  }

  if (resolveAnyLidToJid(m.sender, participants).replace(/@.*$/, '') === targetNum) {
    return m.reply(`❌ *GAGAL*\n\n> Tidak bisa kick diri sendiri!`)
  }

  const targetParticipant = findParticipantByNumber(participants, targetJid)
    || participants.find(p => getParticipantJid(p).replace(/@.*$/, '') === targetNum)

  if (!targetParticipant) {
    return m.reply(`❌ *GAGAL*\n\n> User tidak ditemukan dalam grup!`)
  }

  if (targetParticipant.admin) {
    return m.reply(`❌ *GAGAL*\n\n> Tidak bisa kick admin grup!`)
  }

  const kickJid = targetParticipant.id || targetJid

  try {
    await sock.groupParticipantsUpdate(m.chat, [kickJid], 'remove')
    await m.reply(
      `✅ @${targetNum} berhasil dikeluarkan dari grup.`,
      { mentions: [targetJid] }
    )
  } catch (err) {
    await m.reply(`❌ *GAGAL KICK*\n\n> ${err.message}`)
  }
}