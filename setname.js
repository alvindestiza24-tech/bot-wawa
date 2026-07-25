// plugins/group/setname.js
import { Button } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'setname',
  alias: ['setnamegc', 'renamegc'],
  category: 'group',
  description: 'Ubah nama grup',
  usage: '.setname <nama baru>',
  example: '.setname Grup Baru',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const name = m.text?.trim()
  if (!name) return m.reply('❌ Masukkan nama baru. Contoh: .setname Grup Baru')
  if (name.length > 25) return m.reply('❌ Nama maksimal 25 karakter.')
  try {
    await sock.groupUpdateSubject(m.chat, name)
    await m.react('✅')
    await m.reply(`✅ Nama grup berhasil diubah menjadi: *${name}*`)
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}