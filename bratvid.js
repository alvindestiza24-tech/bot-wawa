
import axios from 'axios'
import { writeExifVid } from '../../src/lib/exif.js' 

export const config_ = {
  name: 'bratvid',
  alias: ['bratvideo', 'bratvidmaker'],
  category: 'maker',
  description: 'Buat stiker video ala "brat" dengan teks besar',
  usage: '.bratvid <teks>',
  example: '.bratvid Hallo dunia!',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  if (!text && m.quoted?.body) text = m.quoted.body
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .bratvid Hallo!')

  await m.react('⏳')

  try {
    const apiUrl = 'https://api.nexray.eu.cc/maker/bratvid'
    const response = await axios.get(apiUrl, {
      params: { text },
      responseType: 'arraybuffer',
      timeout: 60000,
    })

    const videoBuffer = response.data

    const stickerBuffer = await writeExifVid(videoBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[BRATVID]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat stiker video. Mungkin server API sedang sibuk.')
  }
}