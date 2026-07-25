// plugins/stalk/stalkyoutube.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'stalkyoutube',
  alias: ['ytstalk', 'youtubestalk'],
  category: 'stalk',
  description: 'Cek statistik channel YouTube',
  usage: '.stalkyoutube <channelID atau username>',
  example: '.stalkyoutube UCxxxxx',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function youtubeApi(channelId) {
    const apiKey = 'AIzaSyD2xJkXkXkXkXkXkXkXkXkXkXkXkXkXk' // ganti dengan keymu
    const res = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`)
    const data = res.data
    if (!data.items?.length) throw new Error('Channel tidak ditemukan')
    const channel = data.items[0]
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description || 'Tidak ada deskripsi',
      thumbnail: channel.snippet.thumbnails?.high?.url || null,
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      views: parseInt(channel.statistics.viewCount) || 0,
      videos: parseInt(channel.statistics.videoCount) || 0,
      joined: channel.snippet.publishedAt ? new Date(channel.snippet.publishedAt).toLocaleDateString('id-ID') : 'Unknown'
    }
  },
  async function youtubeScraper(channelId) {
    const res = await axios.get(`https://www.youtube.com/channel/${channelId}`)
    const html = res.data
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/)
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/)
    const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/)
    if (!titleMatch) throw new Error('Channel tidak ditemukan')
    return {
      channelId,
      title: titleMatch[1] || 'Unknown',
      description: descMatch?.[1] || '',
      thumbnail: `https://www.youtube.com/channel/${channelId}`,
      subscribers: parseInt(subMatch?.[1].replace(/[^0-9]/g, '') || '0'),
      views: 0,
      videos: 0,
      joined: 'Unknown'
    }
  }
]

async function fetchYouTube(channelId) {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn(channelId)
      if (result?.channelId) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Gagal mengambil data YouTube:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  const channelId = m.text?.trim()
  if (!channelId) return m.reply('❌ Masukkan Channel ID. Contoh: .stalkyoutube UCxxxxx')

  await m.react('⏳')
  try {
    const data = await fetchYouTube(channelId)

    const text = `## 📺 Profil YouTube Channel\n` +
      `**Nama:** ${data.title}\n` +
      `**Channel ID:** ${data.channelId}\n` +
      `**Bergabung:** ${data.joined}\n` +
      `**Subscribers:** ${data.subscribers.toLocaleString()}\n` +
      `**Total Views:** ${data.views.toLocaleString()}\n` +
      `**Total Videos:** ${data.videos}\n` +
      `**Deskripsi:** ${data.description.slice(0, 150)}${data.description.length > 150 ? '...' : ''}`

    const builder = new AIRich(sock).setTitle('🎬 YouTube Stalker')
    if (data.thumbnail) {
      builder.addImage(data.thumbnail)
    }
    builder.addText(text)
    builder.addSuggest(['stalkyoutube', 'stalksteam', 'stalkroblox'])
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}