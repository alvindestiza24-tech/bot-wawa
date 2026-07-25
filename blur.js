import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { AIRich } from '../../src/lib/_build-m.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'blur',
  alias: ['blureffect', 'efekblur'],
  category: 'maker',
  description: 'Buat efek blur pada gambar (reply gambar)',
  usage: '.blur [sigma]',
  example: '.blur 5',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .blur', { pushName: m.pushName }))

  const sigma = parseFloat(m.args[0]) || 3
  if (sigma < 0.3 || sigma > 100) return m.reply('❌ Sigma harus antara 0.3 - 100')

  await m.react('⏳')
  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    if (!buffer.length) return m.reply('❌ Gagal download gambar.')

    const result = await sharp(buffer).blur(sigma).toBuffer()
    await sock.sendMessage(m.chat, { image: result, caption: `✅ Efek Blur (σ=${sigma})` }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}