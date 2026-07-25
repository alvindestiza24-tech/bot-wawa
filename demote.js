import {
  resolveAnyLidToJid,
  findParticipantByNumber,
  getParticipantJid,
  cacheParticipantLids,
} from '../../src/lib/lid.js'

export const config_ = {
  name:        'demote',
  alias:       ['unadmin', 'turunkan'],
  category:    'group',
  description: 'Turunkan admin menjadi member biasa',
  usage:       '.demote @user atau reply',
  example:     '.demote @user',
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
      `> Contoh: \`${m.prefix}demote @user\``
    )
  }

  const targetJid = resolveAnyLidToJid(rawTarget, participants)
  const targetNum = targetJid.replace(/@.*$/, '')

  const targetParticipant = findParticipantByNumber(participants, targetJid)
    || participants.find(p => getParticipantJid(p).replace(/@.*$/, '') === targetNum)

  if (!targetParticipant) {
    return m.reply(`❌ *GAGAL*\n\n> User tidak ditemukan di grup!`)
  }

  if (!targetParticipant.admin) {
    return m.reply(`❌ *GAGAL*\n\n> User bukan admin!`)
  }

  if (targetParticipant.admin === 'superadmin') {
    return m.reply(`❌ *GAGAL*\n\n> Tidak bisa demote owner grup!`)
  }

  const demoteJid = targetParticipant.id || targetJid

  try {
    await sock.groupParticipantsUpdate(m.chat, [demoteJid], 'demote')
    await m.reply(
      `@${targetNum} sekarang bukan admin lagi.`,
      { mentions: [targetJid] }
    )
  } catch (err) {
    await m.reply(`❌ *GAGAL DEMOTE*\n\n> ${err.message}`)
  }
}