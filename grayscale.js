import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'grayscale',
  alias: ['bw', 'hitamputih', 'blackwhite'],
  category: 'maker',
  description: 'Ubah gambar menjadi hitam putih (grayscale)',
  usage: '.grayscale (reply gambar)',
  example: '.grayscale',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .grayscale', { pushName: m.pushName }))

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).grayscale().toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: '✅ Efek Hitam Putih' }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}