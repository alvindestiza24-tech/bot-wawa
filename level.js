import config from '../../config.js'
import { getDatabase } from '../../src/database.js'
import { getLevelBar, getRole } from '../../src/lib/function.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'level',
  alias: ['exp', 'xp', 'rank'],
  category: 'user',
  description: 'Cek level dan exp',
  usage: '.level',
  example: '.level',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const EXP_PER_LEVEL = 10000

export async function handler(m, { sock }) {
  const db = getDatabase()
  const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
  let user = db.getUser(target)
  if (!user) user = db.setUser(target)

  const userExp = user.exp || 0
  const userLevel = Math.floor(userExp / EXP_PER_LEVEL) + 1
  const expInLevel = userExp - (userLevel - 1) * EXP_PER_LEVEL
  const role = getRole(userLevel)

  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0]
    : config.command?.prefix || '.'

  const content =
    `⚔️ LEVEL & EXP\n\n` +
    `User: @${target.split('@')[0]}\n` +
    `Role: ${role}\n` +
    `Level: ${userLevel}\n` +
    `Total EXP: ${userExp.toLocaleString('id-ID')} XP\n\n` +
    `Progress ke Level ${userLevel + 1}:\n` +
    `${getLevelBar(expInLevel, EXP_PER_LEVEL)}\n` +
    `${expInLevel.toLocaleString('id-ID')} / ${EXP_PER_LEVEL.toLocaleString('id-ID')} XP`

  const finalText = beautifulMessage(content, {
    pushName: m.pushName,
    prefix,
    ownerName: config.owner.name,
    botName: config.bot.name,
    botVersion: config.bot.version
  })

  await sock.sendMessage(
    m.chat,
    {
      text: finalText,
      contextInfo: _mCtx(m.sender),
      mentions: [target]
    },
    { quoted: createFakeQuoted() }
  )
}