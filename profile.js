import config from '../../config.js'
import { getDatabase } from '../../src/database.js'
import { getLevelBar, getRole } from '../../src/lib/function.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'profile',
  alias: ['me', 'profil', 'myprofile'],
  category: 'user',
  description: 'Melihat profil user',
  usage: '.profile [@user]',
  example: '.profile',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const EXP_PER_LEVEL = 10000

function fmt(num) {
  return (num || 0).toLocaleString('id-ID')
}

export async function handler(m, { sock }) {
  const db = getDatabase()
  const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender

  let user = db.getUser(target)
  if (!user) user = db.setUser(target)

  const userExp = user.exp || 0
  const userLevel = Math.floor(userExp / EXP_PER_LEVEL) + 1
  const currentLevelExp = (userLevel - 1) * EXP_PER_LEVEL
  const expInLevel = userExp - currentLevelExp
  const expNeeded = EXP_PER_LEVEL

  const role = getRole(userLevel)
  const isOwnerUser = config.isOwner(target)
  const isPremiumUser = isOwnerUser || config.isPremium(target)
  const isBannedUser = user.isBanned || config.isBanned(target)

  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0]
    : config.command?.prefix || '.'

  // Bangun konten informasi profil (tanpa border dekoratif lama)
  let profileContent =
    `👤 PROFIL USER\n\n` +
    `Nama: ${user.name || m.pushName || 'User'}\n` +
    `Nomor: @${target.split('@')[0]}\n` +
    `Status: ${isOwnerUser ? '👑 Owner' : isPremiumUser ? '💎 Premium' : '🆓 Free'}\n` +
    `${isBannedUser ? `Banned: 🚫 Ya\n` : ''}\n` +
    `〔 ⚔️ STATS 〕\n` +
    `Role: ${role}\n` +
    `Level: ${userLevel}\n` +
    `EXP: ${fmt(userExp)} XP\n` +
    `Progress:\n` +
    `  ${getLevelBar(expInLevel, expNeeded)}\n` +
    `  _${fmt(expInLevel)} / ${fmt(expNeeded)} XP_\n\n` +
    `〔 💰 ASET 〕\n` +
    `Koin: 🪙 ${fmt(user.koin)}`

  // Bungkus dengan template aesthetic
  const decoratedText = beautifulMessage(profileContent, {
    pushName: m.pushName,
    prefix,
    ownerName: config.owner.name,
    botName: config.bot.name,
    botVersion: config.bot.version
  })

  // Coba ambil foto profil
  let ppUrl = null
  try {
    ppUrl = await sock.profilePictureUrl(target, 'image')
  } catch {}

  if (ppUrl) {
    // Kirim sebagai gambar dengan caption decorated
    await sock.sendMessage(
      m.chat,
      {
        image: { url: ppUrl },
        caption: decoratedText,
        mentions: [target]
      },
      { quoted: createFakeQuoted() }
    )
  } else {
    // Kirim sebagai teks biasa
    await sock.sendMessage(
      m.chat,
      {
        text: decoratedText,
        contextInfo: _mCtx(m.sender),
        mentions: [target]
      },
      { quoted: createFakeQuoted() }
    )
  }
}