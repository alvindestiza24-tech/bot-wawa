// plugins/search/yts.js
import yts from 'yt-search'
import { AIRich } from '../../src/lib/_build-m.js'
import { y2mate } from '../../src/scrape/y2mate.js'
import config from '../../config.js'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000

export const config_ = {
  name: 'yts',
  alias: ['ytsearch', 'youtubesearch'],
  category: 'search',
  description: 'Cari video YouTube, pilih nomor untuk download',
  usage: '.yts <judul> | .yts <nomor>',
  example: '.yts NIKI high school\n.yts 2',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''
  if (!text) {
    return m.reply('❌ Masukkan query pencarian.\nContoh: .yts NIKI high school')
  }

  // Jika input adalah angka (1-5), download dari sesi
  if (/^\d+$/.test(text)) {
    const index = parseInt(text) - 1
    const session = sessions.get(m.senderNumber)
    if (!session || Date.now() > session.expires) {
      sessions.delete(m.senderNumber)
      return m.reply('⌛ Sesi pencarian sudah habis. Silakan cari lagi dengan .yts <judul>')
    }
    if (index < 0 || index >= session.videos.length) {
      return m.reply('❌ Nomor tidak valid.')
    }

    const video = session.videos[index]
    await m.react('⏳')

    try {
      // Download video via y2mate (360p sebagai default)
      const dl = await y2mate(video.url, 'mp4', '360p')
      if (!dl.status || !dl.url) throw new Error(dl.error || 'Gagal mendapatkan link download')

      await sock.sendMessage(m.chat, {
        video: { url: dl.url },
        caption: `🎬 ${video.title}\n👤 ${video.author?.name || 'Unknown'}\n⏱️ ${video.timestamp || '-'}`,
        mimetype: 'video/mp4',
      }, { quoted: m.raw })
      await m.react('✅')
    } catch (err) {
      console.error('[YTS DOWNLOAD]', err)
      await m.react('❌')
      await m.reply(`❌ Gagal mengunduh video: ${err.message}`)
    }
    return
  }

  // Pencarian baru
  await m.react('🔍')

  try {
    const search = await yts(text)
    const videos = search.videos.slice(0, 5)

    if (!videos.length) {
      await m.react('😔')
      return m.reply(`❌ Tidak ada hasil untuk "${text}"`)
    }

    // Simpan sesi
    sessions.set(m.senderNumber, {
      videos,
      expires: Date.now() + SESSION_TTL,
    })

    // Format produk untuk AIRich
    const products = videos.map((v, i) => ({
      title: `${i + 1}. ${v.title}`,
      brand: v.author?.name || v.author?.url?.split('/').pop() || 'Unknown',
      price: v.timestamp || v.duration?.toString() || '-',
      image_url: v.thumbnail || v.image || '',
      product_url: v.url || '',
      sale_price: v.views ? `${formatNumber(v.views)} views` : '',
    }))

    await new AIRich(sock)
      .setTitle(`🎬 YouTube: "${text}"`)
      .addText(`Balas dengan *.yts <nomor>* (1-${videos.length}) untuk mendownload video.`)
      .addProduct(products)
      .addSuggest(videos.map((_, i) => `yts ${i + 1}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[YTS]', err)
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return String(num || 0)
}