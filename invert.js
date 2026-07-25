import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'invert',
  alias: ['negative', 'negatif', 'warnabalik'],
  category: 'maker',
  description: 'Balik warna gambar menjadi negatif',
  usage: '.invert (reply gambar)',
  example: '.invert',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .invert', { pushName: m.pushName }))

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer)
      .negate({ alpha: false })
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: '✅ Efek Negatif' }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}