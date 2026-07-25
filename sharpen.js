import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'sharpen',
  alias: ['sharp', 'tajam', 'efektajam'],
  category: 'maker',
  description: 'Menajamkan gambar (sharpen)',
  usage: '.sharpen [nilai]',
  example: '.sharpen 3',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .sharpen', { pushName: m.pushName }))

  const val = parseFloat(m.args[0]) || 2
  if (val < 0.1 || val > 10) return m.reply('❌ Nilai sharpen antara 0.1 - 10')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).sharpen(val).toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: `✅ Efek Sharpen (${val})` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}