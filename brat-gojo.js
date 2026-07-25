// plugins/maker/bratgojo.js
import { generateBratGojo } from '../../src/canvas/bratgojo.js'
import { writeExifImg } from '../../src/lib/exif.js'

export const config_ = {
  name: 'bratgojo',
  alias: ['gojobrat', 'bratgojo'],
  category: 'maker',
  description: 'Buat stiker brat dengan karakter Gojo',
  usage: '.bratgojo <teks>',
  example: '.bratgojo Hallo dunia!',
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
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .bratgojo Hallo!')

  await m.react('⏳')
  try {
    const imageBuffer = await generateBratGojo(text)
    const stickerBuffer = await writeExifImg(imageBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[BRATGOJO]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker.')
  }
}