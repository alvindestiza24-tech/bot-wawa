// plugins/group/setppgc.js
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'setppgc',
  alias: ['setppgroup', 'setfotogc'],
  category: 'group',
  description: 'Ubah foto profil grup (reply gambar)',
  usage: '.setppgc (reply gambar)',
  example: '.setppgc',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply('❌ Reply gambar untuk dijadikan foto profil grup.')
  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer || !buffer.length) return m.reply('❌ Gagal download gambar.')
    await sock.updateProfilePicture(m.chat, buffer)
    await m.react('✅')
    await m.reply('✅ Foto profil grup berhasil diubah.')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}