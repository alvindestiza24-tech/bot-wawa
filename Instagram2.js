
import { reelsvideo } from '../../src/scrape/ig2.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'
import axios from 'axios'

export const config_ = {
  name: 'instagram2',
  alias: ['ig2', 'reelsdl', 'igreelsdl', 'igdl'],
  category: 'downloader',
  description: 'Download Reels / Carousel Instagram dengan tampilan AI Rich (video + reels)',
  usage: '.instagram2 <url>',
  example: '.instagram2 https://www.instagram.com/reel/xxxxx',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let url = m.args[0]

  if (!url && m.quoted?.body) {
    const quotedText = m.quoted.body
    const urlMatch = quotedText.match(/(https?:\/\/www\.instagram\.com\/[^\s]+)/)
    if (urlMatch) url = urlMatch[1]
  }

  if (!url) {
    return m.reply(beautifulMessage(
      '❌ Masukkan URL Instagram.\nContoh: .instagram2 https://www.instagram.com/reel/xxxxx',
      { pushName: m.pushName }
    ))
  }

  if (!/https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari Instagram (instagram.com)', { pushName: m.pushName }))
  }

  await m.react('⏳')

  try {
    const result = await reelsvideo(url)

    if (!result || (result.type === 'unknown' && result.videos.length === 0 && result.images.length === 0)) {
      return m.reply(beautifulMessage('❌ Tidak dapat menemukan media untuk URL ini.', { pushName: m.pushName }))
    }

    const { type, username, thumb, videos, images, mp3 } = result

    const builder = new AIRich(sock)
      .setTitle('📸 Instagram Downloader')
      .addText(`## ${type === 'carousel' ? '🖼️ Carousel' : '🎬 Reel'}\n` +
        `👤 **Username:** ${username || 'Unknown'}\n` +
        `📂 **Tipe:** ${type}\n` +
        (videos.length > 0 ? `🎥 **Video:** ${videos.length}\n` : '') +
        (images.length > 0 ? `🖼️ **Gambar:** ${images.length}\n` : '') +
        (mp3.length > 0 ? `🎵 **Audio:** Tersedia ✅\n` : '')
      )


    if (videos.length > 0) {
      const videoUrl = videos[0]
      builder.addVideo(videoUrl, {
        thumbnail: thumb || 'https://via.placeholder.com/300x300',
        file_length: 0,
        duration: 0,
        mime_type: 'video/mp4'
      })
    }

    if (type === 'carousel' && images.length > 0) {
      const reelItems = images.map((img, i) => ({
        username: username || 'Instagram',
        profile: thumb || 'https://via.placeholder.com/150',
        thumbnail: img,
        url: img,
        title: `Carousel ${i + 1}`,
        source: 'IG',
        verified: false
      }))
      builder.addReels(reelItems)
    }

    if (videos.length === 0 && images.length > 0 && type !== 'carousel') {
      builder.addImage(images[0], { resolveUrl: false })
    }

    builder.addTable([
      ['📹 Video', '🖼️ Gambar', '🎵 Audio'],
      [String(videos.length), String(images.length), String(mp3.length)]
    ])

    const suggests = []
    if (videos.length > 0) suggests.push('📥 Download Video')
    if (mp3.length > 0) suggests.push('🎵 Download Audio')
    suggests.push('🔁 Cari Lagi')
    builder.addSuggest(suggests)
    await builder.send(m.chat, { quoted: m.raw })
    await m.react('✅')

  } catch (err) {
    console.error('[INSTAGRAM2]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }))
  }
}