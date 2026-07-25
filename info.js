import config from '../../config.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'info',
  alias: ['botinfo', 'about'],
  category: 'main',
  description: 'Informasi bot',
  usage: '.info',
  example: '.info',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  prefix:    false,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0]
    : config.command?.prefix || '.'

  const content = 
    `♡ Owner      : ${config.owner.name}\n` +
    `✿ Developer  : ${config.bot.developer}\n` +
    `❀ Version    : ${config.bot.version}\n` +
    `⌛ Mode       : ${config.mode}\n` +
    `⚘ Prefix     : ${Array.isArray(config.command?.prefix) ? config.command.prefix.join(' | ') : config.command?.prefix}\n` +
    `⬡ Website    : ${config.info.website}\n` +
    `⬢ Grup       : ${config.info.grupwa}`

  const finalText = beautifulMessage(content, {
    pushName: m.pushName,
    prefix,
    ownerName: config.owner.name,
    botName: config.bot.name,
    botVersion: config.bot.version
  })

  await sock.sendMessage(
    m.chat,
    { text: finalText, contextInfo: _mCtx(m.sender) },
    { quoted: createFakeQuoted() }
  )
}