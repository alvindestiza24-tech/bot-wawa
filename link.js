// plugins/group/link.js
import { Button } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'link',
  alias: ['linkgc', 'invite', 'getlink'],
  category: 'group',
  description: 'Lihat link undangan grup',
  usage: '.link',
  example: '.link',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  try {
    const code = await sock.groupInviteCode(m.chat)
    const link = `https://chat.whatsapp.com/${code}`
    const meta = await sock.groupMetadata(m.chat)
    const msg = await new Button(sock)
      .setTitle('🔗 Link Grup')
      .setBody(`*${meta.subject}*\n\n${link}`)
      .addCopy('📋 Copy Link', link)
      .addReply('🔄 Reset Link', '.revoke')
      .build(m.chat)
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}