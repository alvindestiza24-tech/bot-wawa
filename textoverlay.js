import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'textoverlay',
  alias: ['tulisan', 'captionfoto', 'addtext'],
  category: 'maker',
  description: 'Tambah teks di atas gambar',
  usage: '.textoverlay <teks>',
  example: '.textoverlay Hello World!',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .textoverlay <teks>', { pushName: m.pushName }))

  const text = m.args.join(' ') || m.text?.trim() || ''
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .textoverlay Hello World!')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const { width, height } = await sharp(buffer).metadata()
    const fontSize = Math.min(width, height) / 10
    const svg = `
      <svg width="${width}" height="${height}">
        <rect x="0" y="${height - 80}" width="${width}" height="80" fill="rgba(0,0,0,0.6)"/>
        <text x="${width/2}" y="${height - 25}" text-anchor="middle" 
              font-family="Arial" font-size="${fontSize}" fill="white" 
              font-weight="bold" stroke="black" stroke-width="1">
          ${text}
        </text>
      </svg>`

    const result = await sharp(buffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: `✅ Teks: ${text}` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}