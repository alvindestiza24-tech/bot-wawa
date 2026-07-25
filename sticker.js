// plugins/maker/sticker.js
import { writeExifImg, writeExifVid } from '../../src/lib/exif.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'sticker',
  alias: ['s', 'stiker'],
  category: 'maker',
  description: 'Ubah gambar/video menjadi stiker',
  usage: '.sticker (reply gambar/video)',
  example: '.sticker',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  // Cek apakah ada quoted atau media langsung
  const target = m.quoted || m
  const type = target.type || ''

  const isImage = type === 'imageMessage'
  const isVideo = type === 'videoMessage'

  if (!isImage && !isVideo) {
    return m.reply('❌ Reply atau kirim gambar/video dengan caption .sticker')
  }

  await m.react('⏳')

  try {
    // Download media menggunakan downloadContentFromMessage (seperti upload)
    const messageType = type.replace('Message', '')
    const stream = await downloadContentFromMessage(target.message[type], messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      return m.reply('❌ Gagal mendownload media.')
    }

    const stickerBuffer = isVideo ? await writeExifVid(buffer) : await writeExifImg(buffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[STICKER]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker.')
  }
}