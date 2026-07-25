// plugins/search/tiktoksearch.js
import { tiktokSearch } from '../../src/scrape/tiktoksearch.js'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { decode } from 'html-entities'
import { AIRich } from '../../src/lib/_build-m.js'
import config from '../../config.js'

const sessions = new Map()
const SESSION_TTL = 5 * 60 * 1000

async function tikDownloader(url) {
  const BASE_URL = 'https://ikdownloader.io'
  const API_URL = `${BASE_URL}/api/ajaxSearch`
  const LANG = 'id'

  try {
    const res = await axios.post(
      API_URL,
      new URLSearchParams({ q: url, lang: LANG }).toString(),
      {
        timeout: 60000,
        validateStatus: () => true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Origin': BASE_URL,
          'Referer': `${BASE_URL}/id`,
        }
      }
    )

    const data = res.data
    if (data.status !== 'ok') {
      return { status: false, error: data.message || 'Request gagal' }
    }

    const $ = cheerio.load(data.data || '')
    const downloadLinks = $('.dl-action a')
      .map((_, el) => ({
        label: $(el).text().replace(/\s+/g, ' ').trim(),
        url: decode($(el).attr('href') || '').replaceAll('&amp;', '&')
      }))
      .get()
      .filter(l => l.url)

    if (downloadLinks.length === 0) {
      return { status: false, error: 'Link download tidak ditemukan' }
    }

    return {
      status: true,
      url: downloadLinks[0].url,
      title: $('.content h3').first().text().trim() || null,
    }
  } catch (err) {
    return { status: false, error: err.message }
  }
}

export const config_ = {
  name: 'tiktoksearch',
  alias: ['ttsearch', 'tiktokcari'],
  category: 'search',
  description: 'Cari video TikTok, pilih nomor untuk download',
  usage: '.tiktoksearch <kata kunci> | .tiktoksearch <nomor>',
  example: '.tiktoksearch dance kpop\n.tiktoksearch 2',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return String(num || 0)
}

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''

  if (!text) {
    return m.reply('❌ Masukkan kata kunci. Contoh: .tiktoksearch dance kpop')
  }

  if (/^\d+$/.test(text)) {
    const index = parseInt(text) - 1
    const session = sessions.get(m.senderNumber)

    if (!session || Date.now() > session.expires) {
      sessions.delete(m.senderNumber)
      return m.reply('⌛ Sesi pencarian sudah habis. Silakan cari lagi dengan .tiktoksearch <kata kunci>')
    }

    if (index < 0 || index >= session.videos.length) {
      return m.reply('❌ Nomor tidak valid. Pilih 1-' + session.videos.length)
    }

    const video = session.videos[index]
    await m.react('⏳')

    try {
      const dl = await tikDownloader(video.play)
      if (!dl.status || !dl.url) throw new Error(dl.error || 'Gagal mendapatkan link download')

      await sock.sendMessage(m.chat, {
        video: { url: dl.url },
        caption: `🎬 ${video.title}\n👤 ${video.author?.nickname || video.author?.unique_id || 'Unknown'}\n❤️ ${formatNumber(video.stats?.digg_count || 0)} | 💬 ${formatNumber(video.stats?.comment_count || 0)}`,
        mimetype: 'video/mp4',
      }, { quoted: m.raw })
      await m.react('✅')
    } catch (err) {
      console.error('[TIKTOKSEARCH DOWNLOAD]', err)
      await m.react('❌')
      await m.reply(`❌ Gagal mengunduh video: ${err.message}`)
    }
    return
  }

  await m.react('🔍')

  try {
    const result = await tiktokSearch(text)

    if (!result.success || !result.videos?.length) {
      await m.react('😔')
      return m.reply(`❌ ${result.message || 'Tidak ada hasil untuk: ' + text}`)
    }

    const videos = result.videos.slice(0, 5)

    sessions.set(m.senderNumber, {
      videos,
      expires: Date.now() + SESSION_TTL,
    })

    const products = videos.map((v, i) => ({
      title: `${i + 1}. ${v.title?.length > 40 ? v.title.slice(0, 37) + '...' : v.title}`,
      brand: v.author?.nickname || v.author?.unique_id || 'Unknown',
      price: `❤️ ${formatNumber(v.stats?.digg_count || 0)}`,
      image_url: v.cover || '',
      product_url: v.play || '',
      sale_price: `💬 ${formatNumber(v.stats?.comment_count || 0)} | 🔗 ${formatNumber(v.stats?.share_count || 0)}`,
    }))

    await new AIRich(sock)
      .setTitle(`🎵 TikTok: "${text}"`)
      .addText(`Balas dengan *.tiktoksearch <nomor>* (1-${videos.length}) untuk mendownload video.`)
      .addProduct(products)
      .addSuggest(videos.map((_, i) => `tiktoksearch ${i + 1}`))
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[TIKTOKSEARCH]', err)
    await m.react('❌')
    await m.reply(`❌ Terjadi kesalahan: ${err.message}`)
  }
}