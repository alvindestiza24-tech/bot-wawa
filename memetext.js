import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'memetext',
  alias: ['meme', 'teksmeme', 'mememaker'],
  category: 'maker',
  description: 'Buat meme dengan teks atas dan bawah',
  usage: '.memetext <atas>|<bawah>',
  example: '.memetext Atas|Bawah',
  isOwner: false,
  cooldown: 12,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .memetext <atas>|<bawah>', { pushName: m.pushName }))

  const input = m.args.join(' ') || ''
  const parts = input.split('|').map(s => s.trim())
  const topText = parts[0] || ''
  const bottomText = parts[1] || ''
  if (!topText && !bottomText) return m.reply('❌ Masukkan teks. Contoh: .memetext Atas|Bawah')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const { width, height } = await sharp(buffer).metadata()
    const fontSize = Math.min(width, height) / 12
    const strokeWidth = Math.max(3, fontSize / 10)

    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="black" flood-opacity="0.8"/>
          </filter>
        </defs>
        ${topText ? `
          <text x="${width/2}" y="${fontSize + 20}" text-anchor="middle" 
                font-family="Impact, Arial Black" font-size="${fontSize}" 
                fill="white" stroke="black" stroke-width="${strokeWidth}" 
                font-weight="bold" filter="url(#shadow)">
            ${topText.toUpperCase()}
          </text>` : ''}
        ${bottomText ? `
          <text x="${width/2}" y="${height - 20}" text-anchor="middle" 
                font-family="Impact, Arial Black" font-size="${fontSize}" 
                fill="white" stroke="black" stroke-width="${strokeWidth}" 
                font-weight="bold" filter="url(#shadow)">
            ${bottomText.toUpperCase()}
          </text>` : ''}
      </svg>`

    const result = await sharp(buffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: '✅ Meme berhasil dibuat!' }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}