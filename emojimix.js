// plugins/maker/emojimix.js
import axios from 'axios'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { writeExifImg } from '../../src/lib/exif.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'emojimix',
  alias: ['mixemoji', 'emojiplus', 'emojimerge'],
  category: 'maker',
  description: 'Gabungkan dua emoji menjadi stiker unik',
  usage: '.emojimix <emoji1> <emoji2>',
  example: '.emojimix 😎 + 😁',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

// ─── Render emoji dengan canvas (fallback) ──────────────────────
async function renderEmojisWithCanvas(emoji1, emoji2) {
  const canvas = createCanvas(512, 512)
  const ctx = canvas.getContext('2d')

  // Background putih
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 512, 512)

  // Ukuran font
  const fontSize = 220
  ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Gambar emoji1 di kiri, emoji2 di kanan
  ctx.fillText(emoji1, 128, 256)
  ctx.fillText(emoji2, 384, 256)

  return canvas.toBuffer('image/png')
}

export async function handler(m, { sock }) {
  // ─── Parse input ──────────────────────────────────────────────
  let input = m.args.join(' ').trim()
  if (!input && m.quoted?.body) input = m.quoted.body.trim()
  if (!input) {
    return m.reply(beautifulMessage(
      '❌ Masukkan dua emoji.\nContoh: .emojimix 😎 + 😁',
      { pushName: m.pushName }
    ))
  }

  // Pisahkan berdasarkan + atau spasi
  let emojis = input.split(/\+|\s+/).filter(e => e.trim().length > 0)
  if (emojis.length < 2) {
    // Coba ambil dua karakter pertama sebagai emoji
    const chars = [...input]
    if (chars.length >= 2) emojis = chars.slice(0, 2)
    else return m.reply('❌ Masukkan dua emoji yang valid.')
  }

  const e1 = emojis[0].trim()
  const e2 = emojis[1].trim()
  if (!e1 || !e2) return m.reply('❌ Masukkan dua emoji yang valid.')

  await m.react('⏳')

  try {
    let imageBuffer = null


    try {
      const url = `https://emojimix.app/api/v1/emoji/${encodeURIComponent(e1)}/${encodeURIComponent(e2)}`
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      })
      if (res.status === 200 && res.data && res.data.length > 0) {
        imageBuffer = Buffer.from(res.data)
      }
    } catch (apiErr) {
      console.log('[EMOJIMIX] API error, using canvas fallback:', apiErr.message)
    }

    if (!imageBuffer) {
      imageBuffer = await renderEmojisWithCanvas(e1, e2)
    }

    const stickerBuffer = await writeExifImg(imageBuffer)
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[EMOJIMIX]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(`❌ Gagal: ${err.message}`, { pushName: m.pushName }))
  }
}