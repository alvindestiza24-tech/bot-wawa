import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'contrast',
  alias: ['kontras', 'efekkontras'],
  category: 'maker',
  description: 'Atur kontras gambar (0.1 - 3.0)',
  usage: '.contrast [nilai]',
  example: '.contrast 2',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .contrast', { pushName: m.pushName }))

  const val = parseFloat(m.args[0]) || 1.5
  if (val < 0.1 || val > 3.0) return m.reply('❌ Nilai kontras antara 0.1 - 3.0')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).linear(val, -(val - 1) * 127).toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: `✅ Kontras x${val.toFixed(1)}` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}