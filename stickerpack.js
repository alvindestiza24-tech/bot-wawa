import { scrapeImagesForPack, downloadImageBuffer } from '../../src/scrape/pinterest.js'
import { sendCustomStickerPack } from '../../src/lib/stickerPack.js'
import sharp from 'sharp'

export const config_ = {
  name: 'stickerpack',
  alias: ['sp', 'stickpack', 'pinsticker'],
  category: 'search',
  description: 'Buat sticker pack dari gambar Pinterest',
  usage: '.stickerpack <query>',
  example: '.stickerpack meme patrick',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const query = m.text?.trim()
  if (!query) return m.reply('❌ Masukkan query pencarian.\nContoh: .stickerpack meme patrick')

  await m.react('⏳')

  try {
    const imageUrls = await scrapeImagesForPack(query, 15)
    if (!imageUrls.length) {
      await m.react('😔')
      return m.reply('❌ Tidak ada gambar ditemukan setelah mencoba semua sumber.')
    }

    const pack = []
    for (const url of imageUrls) {
      try {
        const buffer = await downloadImageBuffer(url)
        const webpBuffer = await sharp(buffer, { animated: false })
          .resize(512, 512, { fit: 'cover' })
          .webp()
          .toBuffer()
        pack.push({
          buffer: webpBuffer,
          ext: 'webp',
          mimetype: 'image/webp',
          isAnimated: false,
          isLottie: false,
        })
      } catch (e) {
        console.error('[STICKERPACK] gagal proses:', url, e.message)
      }
    }

    if (!pack.length) {
      await m.react('😔')
      return m.reply('❌ Semua gambar gagal diproses.')
    }

    await m.reply(`✅ ${pack.length} stiker siap, mengunggah...`)
    await sendCustomStickerPack(sock, m, pack)
    await m.react('✅')
  } catch (e) {
    console.error('[STICKERPACK]', e)
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${e.message}`)
  }
}