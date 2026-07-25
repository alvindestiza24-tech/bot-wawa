// plugins/maker/brat.js
import { generateBrat } from '../../src/canvas/brat.js'
import { writeExifImg } from '../../src/lib/exif.js'

export const config_ = {
  name: 'brat',
  alias: ['brattext', 'bratmaker'],
  category: 'maker',
  description: 'Buat stiker ala "brat" dengan teks besar',
  usage: '.brat <teks>',
  example: '.brat Hallo dunia!',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 7,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  if (!text && m.quoted?.body) text = m.quoted.body
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .brat Hallo!')

  await m.react('⏳')
  try {
    const imageBuffer = await generateBrat(text)
    // Konversi ke stiker WebP dengan exif
    const stickerBuffer = await writeExifImg(imageBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[BRAT]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker.')
  }
}