import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'rounded',
  alias: ['round', 'sudut', 'melengkung'],
  category: 'maker',
  description: 'Buat sudut gambar melengkung',
  usage: '.rounded [radius]',
  example: '.rounded 20',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .rounded', { pushName: m.pushName }))

  const radius = parseInt(m.args[0]) || 20
  if (radius < 1 || radius > 500) return m.reply('❌ Radius antara 1-500px')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const { width, height } = await sharp(buffer).metadata()
    const result = await sharp(buffer)
      .resize(width, height)
      .composite([{
        input: Buffer.from(
          `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" /></svg>`
        ),
        blend: 'dest-in'
      }])
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: `✅ Sudut Melengkung (${radius}px)` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}