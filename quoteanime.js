// plugins/maker/quoteanime.js
import { generateQuoteAnime } from '../../src/canvas/quoteanime.js'
import { writeExifImg } from '../../src/lib/exif.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'quoteanime',
  alias: ['qa', 'qcanime', 'quoteanime'],
  category: 'maker',
  description: 'Buat quote aesthetic dengan background karakter anime',
  usage: '.quoteanime <teks> | .quoteanime <teks>|<username>',
  example: '.quoteanime Hukum tidak selalu adil|Higuruma',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  if (!input) {
    return m.reply(
      '🌸 *Quote Anime Maker*\n\n' +
      'Buat quote aesthetic dengan background karakter anime.\n\n' +
      'Format:\n' +
      '`.quoteanime <teks>`\n' +
      '`.quoteanime <teks>|<username>`\n\n' +
      'Contoh:\n' +
      '`.quoteanime Hukum tidak selalu adil|Higuruma`'
    )
  }

  let text = input
  let username = m.pushName || 'User'

  if (input.includes('|')) {
    const parts = input.split('|').map(s => s.trim())
    text = parts[0] || 'Hukum tidak selalu adil'
    username = parts[1] || m.pushName || 'User'
  }

  if (text.length > 200) {
    return m.reply('❌ Teks maksimal 200 karakter.')
  }

  await m.react('⏳')

  try {
    const imageBuffer = await generateQuoteAnime(text, username)
    const stickerBuffer = await writeExifImg(imageBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    console.error('[QUOTEANIME]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal membuat quote: ${err.message}`, { pushName: m.pushName }))
  }
}