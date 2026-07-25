// plugins/maker/bratgojovid.js
import { generateBratGojoVideo } from '../../src/canvas/bratvid-gojo.js'
import { addExif } from '../../src/lib/exif.js'
import config from '../../config.js'

export const config_ = {
  name: 'bratgojovid',
  alias: ['gojovid', 'bratgojovideo'],
  category: 'maker',
  description: 'Buat stiker video brat Gojo dengan teks animasi',
  usage: '.bratgojovid <teks>',
  example: '.bratgojovid Nah, I\'d win',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  if (!text && m.quoted?.body) text = m.quoted.body
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .bratgojovid Hallo!')

  await m.react('⏳')
  try {
    const webpBuffer = await generateBratGojoVideo(text)
    const packname = config.bot?.name || 'MyBot'
    const author = config.owner?.name || 'Owner'
    const stickerBuffer = await addExif(webpBuffer, packname, author)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[BRATGOJOVID]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker video.')
  }
}