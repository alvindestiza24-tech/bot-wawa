// plugins/tools/upload2.js
import { Toolkit } from '../../src/lib/_build-m.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'upload2',
  alias: ['up2', 'uploadcdn', 'toupload'],
  category: 'tools',
  description: 'Upload media ke CDN WhatsApp (newsletter) menggunakan Toolkit.toUrl',
  usage: '.upload2 (kirim/reply media)',
  example: '.upload2',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const target = m.quoted || m
  const type = target.type || ''

  // Cek tipe media yang didukung
  const isImage = type === 'imageMessage' || target.isImage
  const isVideo = type === 'videoMessage' || target.isVideo
  const isAudio = type === 'audioMessage' || target.isAudio
  const isDocument = type === 'documentMessage' || target.isDocument
  const isSticker = type === 'stickerMessage' || target.isSticker

  if (!isImage && !isVideo && !isAudio && !isDocument && !isSticker) {
    return m.reply('❌ Kirim atau reply gambar/video/audio/dokumen/stiker yang ingin diupload.')
  }

  await m.react('⏳')

  try {
    // Ambil message object
    const message = target.message
    if (!message) return m.reply('❌ Tidak dapat menemukan pesan media.')

    // Cari key media yang sesuai
    const keys = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage']
    let foundKey = null
    for (const k of keys) {
      if (message[k]) { foundKey = k; break }
    }
    if (!foundKey) return m.reply('❌ Format media tidak dikenali.')

    // Download media pakai Baileys (sama seperti sticker.js)
    const stream = await downloadContentFromMessage(message[foundKey], foundKey)
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    if (!buffer || !buffer.length) {
      await m.react('❌')
      return m.reply('❌ Gagal mengunduh media.')
    }

    // Tentukan mediaType untuk Toolkit.toUrl
    let mediaType = 'document'
    if (isImage || isSticker) mediaType = 'image'
    else if (isVideo) mediaType = 'video'
    else if (isAudio) mediaType = 'audio'

    // Upload ke CDN WhatsApp via Toolkit.toUrl (dari _build-m.js)
    const cdnUrl = await Toolkit.toUrl(sock, buffer, mediaType)

    await m.react('✅')
    await m.reply(`✅ *Upload Berhasil!*\n\n📎 *URL CDN:* \`${cdnUrl}\`\n📁 *Tipe:* ${mediaType}\n📏 *Ukuran:* ${(buffer.length / 1024).toFixed(1)} KB`)
  } catch (err) {
    console.error('[UPLOAD2]', err)
    await m.react('❌')
    await m.reply(`❌ Gagal upload: ${err.message}`)
  }
}