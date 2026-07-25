import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'pixelate',
  alias: ['pixel', 'efekpixel', 'kotak'],
  category: 'maker',
  description: 'Buat efek pixel/kotak-kotak pada gambar',
  usage: '.pixelate [blockSize]',
  example: '.pixelate 8',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .pixelate', { pushName: m.pushName }))

  const blockSize = parseInt(m.args[0]) || 6
  if (blockSize < 2 || blockSize > 50) return m.reply('❌ Block size harus antara 2 - 50')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const { width, height } = await sharp(buffer).metadata()
    const result = await sharp(buffer)
      .resize(Math.floor(width / blockSize), Math.floor(height / blockSize), { fit: 'fill' })
      .resize(width, height, { fit: 'fill', kernel: 'nearest' })
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: `✅ Efek Pixel (block=${blockSize})` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}