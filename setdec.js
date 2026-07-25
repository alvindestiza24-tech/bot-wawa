// plugins/group/setdesc.js
import { Button } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'setdesc',
  alias: ['setdeskgc', 'setdeskripsi'],
  category: 'group',
  description: 'Ubah deskripsi grup',
  usage: '.setdesc <deskripsi>',
  example: '.setdesc Ini adalah grup untuk berbagi info',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const desc = m.text?.trim()
  if (!desc) return m.reply('❌ Masukkan deskripsi baru.')
  try {
    await sock.groupUpdateDescription(m.chat, desc)
    await m.react('✅')
    const msg = await new Button(sock)
      .setTitle('✅ Deskripsi Grup Diubah')
      .setBody(`Deskripsi baru:\n${desc}`)
      .addCopy('📋 Copy Deskripsi', desc)
      .build(m.chat)
    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}