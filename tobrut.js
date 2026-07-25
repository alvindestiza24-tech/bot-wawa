// plugins/random/tobrut.js
import axios from 'axios'
import { Button } from '../../src/lib/_build-m.js'
import { prepareWAMessageMedia } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'tobrut',
  alias: ['randomvid', 'randomvideo'],
  category: 'random',
  description: 'Kirim video random dari koleksi Tobrut (khusus premium)',
  usage: '.tobrut',
  example: '.tobrut',
  isOwner: false,
  isPremium: true,    
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const VIDEOS = [
  "https://files.catbox.moe/053cbw.mp4",
  "https://files.catbox.moe/fke4ht.mp4",
  "https://files.catbox.moe/mi8ouf.mp4",
  "https://files.catbox.moe/wtc2c9.mp4",
  "https://files.catbox.moe/j40xwe.mp4",
  "https://files.catbox.moe/l7shcw.mp4",
  "https://files.catbox.moe/18izfd.mp4",
  "https://files.catbox.moe/malsfc.mp4",
  "https://files.catbox.moe/xgfmr2.mp4",
  "https://files.catbox.moe/n317h3.mp4",
  "https://files.catbox.moe/lrffgg.mp4",
  "https://files.catbox.moe/z6pt9y.mp4",
  "https://files.catbox.moe/urdave.mp4",
  "https://files.catbox.moe/gcyk70.mp4",
  "https://files.catbox.moe/zm0p4a.mp4",
  "https://files.catbox.moe/k9pg17.mp4",
  "https://files.catbox.moe/l4i0gn.mp4",
  "https://files.catbox.moe/ap31lj.mp4",
  "https://files.catbox.moe/3a7beg.mp4",
  "https://files.catbox.moe/osgu8o.mp4",
  "https://files.catbox.moe/ysedtl.mp4",
  "https://files.catbox.moe/i8sewv.mp4",
  "https://files.catbox.moe/3i9kq4.mp4",
  "https://files.catbox.moe/nq4v6b.mp4",
  "https://files.catbox.moe/39yyc7.mp4",
  "https://files.soonex.biz.id/upload/f9edfd299a6b.mp4",
  "https://files.soonex.biz.id/upload/4eb2ab3e492c.mp4",
  "https://files.soonex.biz.id/upload/c58370d04a00.mp4",
  "https://files.soonex.biz.id/upload/fa6146882809.mp4",
  "https://files.soonex.biz.id/upload/27c3c85295e9.mp4",
  "https://files.soonex.biz.id/upload/9400448f7c2c.mp4",
  "https://files.soonex.biz.id/upload/217ed43801a8.mp4",
  "https://files.soonex.biz.id/upload/ffc02dfb4fae.mp4"
]


async function downloadVideo(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'video/mp4,video/webm,video/*,*/*;q=0.8',
        }
      })

      const buffer = Buffer.from(res.data)


      if (buffer.length < 50 * 1024) {
        throw new Error(`Ukuran video terlalu kecil: ${buffer.length} bytes`)
      }

      return buffer
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`[TOBRUT] Percobaan ${attempt + 1} gagal untuk ${url}: ${err.message}`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  throw new Error('Gagal mengunduh setelah percobaan ulang')
}

export async function handler(m, { sock }) {
  await m.react('⏳')

  try {
    const shuffled = [...VIDEOS].sort(() => Math.random() - 0.5)

    let videoBuffer = null
    let usedUrl = null


    for (const url of shuffled) {
      try {
        videoBuffer = await downloadVideo(url)
        usedUrl = url
        break
      } catch (err) {
        console.warn('[TOBRUT] Gagal download URL:', url, err.message)
        continue
      }
    }

    if (!videoBuffer) {
      return m.reply('❌ Gagal mengunduh video dari semua sumber. Coba lagi nanti.')
    }

    const media = await prepareWAMessageMedia(
      { video: videoBuffer },
      { upload: sock.waUploadToServer }
    )


    const msg = await new Button(sock)
      .setBody('*Tobrut video*')
      .setVideo(media.videoMessage.url)
      .addReply('Ambil Lagi', '.tobrut')
      .build(m.chat)

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await m.react('✅')
  } catch (err) {
    console.error('[TOBRUT]', err)
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil video: ${err.message}`)
  }
}