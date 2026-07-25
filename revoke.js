// plugins/group/revoke.js
import { Button } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'revoke',
  alias: ['revokelink', 'resetlink'],
  category: 'group',
  description: 'Reset link undangan grup',
  usage: '.revoke',
  example: '.revoke',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  try {
    const code = await sock.groupRevokeInvite(m.chat)
    const link = `https://chat.whatsapp.com/${code}`
    const meta = await sock.groupMetadata(m.chat)
    const msg = await new Button(sock)
      .setTitle('🔄 Link Grup Direset')
      .setBody(`*${meta.subject}*\n\nLink baru:\n${link}`)
      .addCopy('📋 Copy Link Baru', link)
      .build(m.chat)
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}