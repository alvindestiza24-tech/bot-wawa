// plugins/group/close.js
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'close',
  alias: ['lock', 'kunci'],
  category: 'group',
  description: 'Kunci grup, hanya admin yang bisa kirim pesan',
  usage: '.close',
  example: '.close',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock, isGroupAdmin, isOwner }) {
  if (!isGroupAdmin && !isOwner) {
    return m.reply('❌ Hanya admin grup yang dapat mengunci grup.')
  }

  try {
    await sock.groupSettingUpdate(m.chat, 'announcement')
    
    await new AIRich(sock)
      .setTitle('🔒 Grup Dikunci')
      .addText('Grup telah dikunci.\nHanya admin yang dapat mengirim pesan.')
      .addSuggest(['open', 'menu'])
      .send(m.chat, { quoted: m.raw })
  } catch (err) {
    await m.reply(`❌ Gagal mengunci grup: ${err.message}`)
  }
}