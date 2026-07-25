import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import sharp from 'sharp'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'watermark',
  alias: ['wm', 'tandatangan'],
  category: 'maker',
  description: 'Tambah watermark gambar di atas foto (reply 2 gambar)',
  usage: '.watermark (reply gambar utama + reply gambar watermark)',
  example: '.watermark',
  isOwner: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

async function getImageBuffer(msg, sock) {
  const target = msg.quoted || msg
  const isImage = target.type === 'imageMessage'
  if (!isImage) return null
  const stream = await downloadContentFromMessage(target.message[target.type], 'image')
  let buffer = Buffer.from([])
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
  return buffer.length ? buffer : null
}

export async function handler(m, { sock }) {
  // Cek apakah ada 2 gambar (main + watermark)
  if (!m.quoted) return m.reply(beautifulMessage('❌ Reply gambar utama, lalu reply gambar watermark di pesan berikutnya', { pushName: m.pushName }))

  const mainBuffer = await getImageBuffer(m, sock)
  if (!mainBuffer) return m.reply('❌ Gagal download gambar utama.')

  // Cari pesan sebelumnya yang berisi gambar untuk watermark
  const messages = await sock.loadMessages(m.chat, 5)
  let wmBuffer = null
  for (const msg of messages) {
    if (msg.key.fromMe && msg.message?.imageMessage) {
      const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      if (buffer.length) { wmBuffer = buffer; break }
    }
  }

  if (!wmBuffer) return m.reply('❌ Tidak ditemukan gambar watermark. Kirim gambar watermark setelah gambar utama.')

  await m.react('⏳')
  try {
    const { width, height } = await sharp(mainBuffer).metadata()
    const wmMeta = await sharp(wmBuffer).metadata()
    const wmWidth = Math.round(width * 0.25)
    const wmHeight = Math.round(wmMeta.height * (wmWidth / wmMeta.width))
    const wmResized = await sharp(wmBuffer).resize(wmWidth, wmHeight).toBuffer()

    const result = await sharp(mainBuffer)
      .composite([{
        input: wmResized,
        gravity: 'southeast',
        left: 20,
        top: 20
      }])
      .toBuffer()

    await sock.sendMessage(m.chat, { image: result, caption: '✅ Watermark berhasil ditambahkan' }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}