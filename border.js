import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'border',
  alias: ['frame', 'bingkai'],
  category: 'maker',
  description: 'Tambah border/frame pada gambar',
  usage: '.border [tebal] [warna]',
  example: '.border 10 red',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .border', { pushName: m.pushName }))

  const size = parseInt(m.args[0]) || 10
  const color = m.args[1] || '#FF0000'
  if (size < 1 || size > 200) return m.reply('❌ Tebal border antara 1-200px')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const { width, height } = await sharp(buffer).metadata()
    const result = await sharp(buffer)
      .extend({
        top: size,
        bottom: size,
        left: size,
        right: size,
        background: color
      })
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: `✅ Border ${size}px (${color})` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}