import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'redditdl',
  alias: ['redditvideo', 'rddl'],
  category: 'downloader',
  description: 'Download video dari Reddit',
  usage: '.redditdl <url>',
  example: '.redditdl https://www.reddit.com/r/videos/comments/xxxxx',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const url = m.text?.trim()
  if (!url) return m.reply('❌ Masukkan URL Reddit.')

  if (!url.includes('reddit.com')) return m.reply('❌ URL harus dari Reddit.')

  await m.react('⏳')
  try {
    const res = await axios.get(`https://api.terhambar.com/api/reddit?url=${encodeURIComponent(url)}`, { timeout: 15000 })
    const data = res.data
    if (!data.success) throw new Error(data.message || 'Gagal')

    const videoUrl = data.data?.url || data.url
    await sock.sendMessage(m.chat, { video: { url: videoUrl }, caption: '🔴 Reddit Video' }, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Error: ${err.message}`)
  }
}