import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'pinterestdl',
  alias: ['pindl', 'pinterestvideo'],
  category: 'downloader',
  description: 'Download video/gambar dari Pinterest',
  usage: '.pinterestdl <url>',
  example: '.pinterestdl https://id.pinterest.com/pin/xxxxx',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const url = m.text?.trim()
  if (!url) return m.reply('❌ Masukkan URL Pinterest.')

  if (!url.includes('pinterest.com')) return m.reply('❌ URL harus dari Pinterest.')

  await m.react('⏳')
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = res.data
    const match = html.match(/"videoUrl":"([^"]+)"/) || html.match(/"url":"(https:\/\/i\.pinimg\.com\/[^"]+)"/)
    if (!match) return m.reply('❌ Tidak ditemukan media.')
    const mediaUrl = match[1].replace(/\\/g, '')
    const isVideo = mediaUrl.includes('.mp4')
    if (isVideo) {
      await sock.sendMessage(m.chat, { video: { url: mediaUrl } }, { quoted: m.raw })
    } else {
      await sock.sendMessage(m.chat, { image: { url: mediaUrl } }, { quoted: m.raw })
    }
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Error: ${err.message}`)
  }
}