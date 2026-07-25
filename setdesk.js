// plugins/group/setdeskgc.js
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'setdeskgc',
  alias: ['setdesc', 'setdescgc', 'setdeskripsi', 'setdesk'],
  category: 'group',
  description: 'Mengubah deskripsi grup',
  usage: '.setdeskgc <deskripsi baru>',
  example: '.setdeskgc Grup untuk diskusi',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const newDesc = m.text?.trim() || ''
  
  if (!newDesc) {
    return m.reply(
      beautifulMessage(
        `⚠️ *CARA PAKAI*\n\n` +
        `> \`.setdeskgc Deskripsi baru\`\n` +
        `> \`.setdeskgc clear\` - Hapus deskripsi`,
        { pushName: m.pushName }
      )
    )
  }

  const descToSet = newDesc.toLowerCase() === 'clear' ? '' : newDesc
  
  if (descToSet.length > 2048) {
    return m.reply(
      beautifulMessage('⚠️ Deskripsi maksimal 2048 karakter.', { pushName: m.pushName })
    )
  }
  
  try {
    await sock.groupUpdateDescription(m.chat, descToSet)
    
    if (descToSet) {
      await m.reply(beautifulMessage('✅ Deskripsi grup berhasil diperbarui!', { pushName: m.pushName }))
    } else {
      await m.reply(beautifulMessage('✅ Deskripsi grup berhasil dihapus!', { pushName: m.pushName }))
    }
  } catch (error) {
    await m.reply(
      beautifulMessage(
        `❌ Gagal mengubah deskripsi grup.\n> _${error.message}_`,
        { pushName: m.pushName }
      )
    )
  }
}