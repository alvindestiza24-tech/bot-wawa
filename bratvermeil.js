// plugins/maker/bratvermeil.js
import { generateBratVermeil } from '../../src/canvas/bratvermeil.js'
import { writeExifImg } from '../../src/lib/exif.js'

export const config_ = {
  name: 'bratvermeil',
  alias: ['vermeilbrat', 'bratver'],
  category: 'maker',
  description: 'Buat stiker brat dengan karakter Vermeil',
  usage: '.bratvermeil <teks>',
  example: '.bratvermeil Hallo dunia!',
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
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .bratvermeil Hallo!')

  await m.react('⏳')
  try {
    const imageBuffer = await generateBratVermeil(text)
    const stickerBuffer = await writeExifImg(imageBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[BRATVERMEIL]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker.')
  }
}