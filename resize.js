import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'resize',
  alias: ['resizeimg', 'ubahukuran', 'size'],
  category: 'maker',
  description: 'Ubah ukuran gambar (width height)',
  usage: '.resize <width> <height>',
  example: '.resize 500 500',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .resize', { pushName: m.pushName }))

  const width = parseInt(m.args[0])
  const height = parseInt(m.args[1])
  if (!width || !height || width < 10 || height < 10 || width > 4000 || height > 4000) {
    return m.reply('❌ Masukkan width dan height (10-4000). Contoh: .resize 500 500')
  }

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).resize(width, height, { fit: 'cover' }).toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: `✅ Resize ${width}x${height}` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}