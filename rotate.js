import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'rotate',
  alias: ['putar', 'rotasi'],
  category: 'maker',
  description: 'Putar gambar (0-360 derajat)',
  usage: '.rotate [derajat]',
  example: '.rotate 90',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .rotate', { pushName: m.pushName }))

  const angle = parseInt(m.args[0]) || 90
  if (isNaN(angle) || angle < 0 || angle > 360) return m.reply('❌ Masukkan derajat (0-360). Contoh: .rotate 90')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).rotate(angle).toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: `✅ Rotasi ${angle}°` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}