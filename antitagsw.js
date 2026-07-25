import { getDatabase }       from '../../src/database.js'
import { getParticipantJid, cacheParticipantLids, resolveAnyLidToJid } from '../../src/lib/lid.js'

export const config_ = {
  name:        'antitagsw',
  alias:       ['antitag', 'antistatustag'],
  category:    'group',
  description: 'Anti tag status WhatsApp di grup',
  usage:       '.antitagsw on/off',
  example:     '.antitagsw on',
  isOwner:     false,
  isPremium:   false,
  isGroup:     true,
  isPrivate:   false,
  isAdmin:     true,
  isBotAdmin:  true,
  cooldown:    3,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db     = getDatabase()
  const action = m.args?.[0]?.toLowerCase()
  const group  = db.getGroup(m.chat) || {}
  const status = group.antitagsw || 'off'

  if (!action) {
    return m.reply(
      `📢 *ANTITAGSW SETTINGS*\n\n` +
      `> Status: *${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}*\n\n` +
      `> Fitur ini menghapus pesan tag status\n` +
      `> (groupStatusMentionMessage)\n\n` +
      `\`\`\`━━━ PILIHAN ━━━\`\`\`\n` +
      `> \`${m.prefix}antitagsw on\` → Aktifkan\n` +
      `> \`${m.prefix}antitagsw off\` → Nonaktifkan`
    )
  }

  if (action === 'on') {
    db.setGroup(m.chat, { ...group, antitagsw: 'on' })
    return m.reply(
      `✅ *ANTITAGSW AKTIF*\n\n` +
      `> Anti tag status berhasil diaktifkan!\n` +
      `> Pesan tag status akan dihapus otomatis.`
    )
  }

  if (action === 'off') {
    db.setGroup(m.chat, { ...group, antitagsw: 'off' })
    return m.reply(
      `❌ *ANTITAGSW NONAKTIF*\n\n` +
      `> Anti tag status berhasil dinonaktifkan.`
    )
  }

  return m.reply(`❌ Pilihan tidak valid.\n> Gunakan: \`on\` atau \`off\``)
}

export async function handleAntiTagSW(rawMsg, sock) {
  const key    = rawMsg.key
  if (!key?.remoteJid?.endsWith('@g.us')) return false

  const db    = getDatabase()
  const group = db.getGroup(key.remoteJid) || {}
  if (group.antitagsw !== 'on') return false

  const msg = rawMsg.message
  if (!msg) return false

  const isTagSW =
    !!msg.groupStatusMentionMessage ||
    !!msg.statusMentionMessage      ||
    !!msg.groupMentionedMessage     ||
    !!msg.groupStatusMessage        ||
    !!msg.groupStatusMessageV2

  if (!isTagSW) return false

  const sender    = key.participant || key.remoteJid
  const botJid    = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
  const botNum    = botJid.replace(/@.*$/, '')
  const senderNum = sender.replace(/@.*$/, '').replace(/[^0-9]/g, '')

  if (senderNum === botNum) return false

  try {
    const groupMeta  = await sock.groupMetadata(key.remoteJid)
    const parts      = groupMeta?.participants || []
    cacheParticipantLids(parts)

    const resolvedSender = resolveAnyLidToJid(sender, parts)
    const resolvedBot    = resolveAnyLidToJid(botJid, parts)

    const senderIsAdmin = parts.some(p => {
      const pJid = getParticipantJid(p)
      return (
        pJid.replace(/@.*$/, '') === resolvedSender.replace(/@.*$/, '') &&
        (p.admin === 'admin' || p.admin === 'superadmin')
      )
    })

    if (senderIsAdmin) return false

    const botIsAdmin = parts.some(p => {
      const pJid = getParticipantJid(p)
      return (
        pJid.replace(/@.*$/, '') === resolvedBot.replace(/@.*$/, '') &&
        (p.admin === 'admin' || p.admin === 'superadmin')
      )
    })

    if (!botIsAdmin) {
      await sock.sendMessage(key.remoteJid, {
        text: `⚠️ Anti-tag status aktif tapi bot bukan admin, tidak bisa hapus pesan.`,
      })
      return true
    }

    await sock.sendMessage(key.remoteJid, {
      delete: {
        remoteJid:   key.remoteJid,
        fromMe:      false,
        id:          key.id,
        participant: sender,
      },
    })

    await sock.sendMessage(key.remoteJid, {
      text:     `⚠️ @${resolvedSender.split('@')[0]} dilarang tag status di grup ini!`,
      mentions: [resolvedSender],
    })

    return true
  } catch {
    return false
  }
}