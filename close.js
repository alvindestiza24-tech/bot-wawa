// plugins/group/open.js
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'open',
  alias: ['unlock', 'buka'],
  category: 'group',
  description: 'Buka grup, semua anggota bisa kirim pesan',
  usage: '.open',
  example: '.open',
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
    return m.reply('❌ Hanya admin grup yang dapat membuka grup.')
  }

  try {
    await sock.groupSettingUpdate(m.chat, 'not_announcement')
    
    await new AIRich(sock)
      .setTitle('🔓 Grup Dibuka')
      .addText('Grup telah dibuka.\nSemua anggota dapat mengirim pesan kembali.')
      .addSuggest(['close', 'menu'])
      .send(m.chat, { quoted: m.raw })
  } catch (err) {
    await m.reply(`❌ Gagal membuka grup: ${err.message}`)
  }
}