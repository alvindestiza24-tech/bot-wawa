// plugins/maker/smeme.js
import axios from 'axios'
import FormData from 'form-data'
import { writeExifImg } from '../../src/lib/exif.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import sharp from 'sharp' // untuk resize
import { createCanvas, loadImage } from '@napi-rs/canvas' // fallback canvas

export const config_ = {
  name: 'smeme',
  alias: ['meme', 'stickermeme', 'makememe'],
  category: 'maker',
  description: 'Buat sticker meme dari gambar dengan teks atas/bawah (via API + fallback canvas)',
  usage: '.smeme <atas>|<bawah> (reply gambar)',
  example: '.smeme LO PILIH DIEM|ATAU GUE SAYANG?',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function uploadToTelegraph(buffer) {
  const form = new FormData()
  form.append('file', buffer, { filename: 'image.jpg' })
  const res = await axios.post('https://telegra.ph/upload', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 15000,
  })
  if (!Array.isArray(res.data) || !res.data[0]?.src) throw new Error('Telegra.ph no src')
  return `https://telegra.ph${res.data[0].src}`
}

async function uploadToCatbox(buffer) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, { filename: 'image.jpg' })
  const res = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 30000,
  })
  const url = String(res.data).trim()
  if (!url.startsWith('https://files.catbox.moe/')) throw new Error('Catbox URL invalid')
  return url
}

async function uploadToZero(buffer) {
  const form = new FormData()
  form.append('file', buffer, { filename: 'image.jpg' })
  const res = await axios.post('https://0x0.st', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 30000,
  })
  const url = String(res.data).trim()
  if (!url.startsWith('https://0x0.st/')) throw new Error('0x0.st URL invalid')
  return url
}

async function uploadToTmpNinja(buffer) {
  const form = new FormData()
  form.append('file', buffer, { filename: 'image.jpg' })
  const res = await axios.post('https://tmp.ninja/api.php?d=upload-temp', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 30000,
  })
  if (!res.data?.url) throw new Error('tmp.ninja no url')
  return res.data.url
}

async function uploadToImgbb(buffer) {
  const form = new FormData()
  form.append('image', buffer.toString('base64'))
  form.append('key', 'e5b2e8f4b3c9d1a7f6e4d3c2b1a9f8e7')
  const res = await axios.post('https://api.imgbb.com/1/upload', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 30000,
  })
  if (res.data?.data?.url) return res.data.data.url
  throw new Error('Imgbb no url')
}

async function uploadToFileIo(buffer) {
  const form = new FormData()
  form.append('file', buffer, { filename: 'image.jpg' })
  const res = await axios.post('https://file.io', form, {
    headers: { ...form.getHeaders(), 'User-Agent': UA },
    timeout: 30000,
  })
  if (res.data?.success && res.data?.link) return res.data.link
  throw new Error('file.io upload gagal')
}

const UPLOADERS = [
  uploadToTelegraph,
  uploadToCatbox,
  uploadToZero,
  uploadToTmpNinja,
  uploadToImgbb,
  uploadToFileIo,
]


async function uploadWithFallback(originalBuffer) {
  const compressedBuffer = await sharp(originalBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()

  const errors = []
  for (const fn of UPLOADERS) {
    try {
      const url = await fn(compressedBuffer)
      return url
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Semua uploader gagal:\n${errors.join('\n')}`)
}

async function generateMemeCanvas(imageBuffer, topText, bottomText) {
  const img = await loadImage(imageBuffer)
  const W = img.width
  const H = img.height
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, W, H)

  const pad = W * 0.04
  const padV = H * 0.022
  const maxW = W - pad * 2
  const maxH = H * 0.38

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ')
    const lines = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur)
        cur = w
      } else cur = test
    }
    if (cur) lines.push(cur)
    return lines
  }

  const calcFontSize = (ctx, text, maxWidth, maxHeight) => {
    let size = Math.round(Math.min(maxWidth, maxHeight) * 0.13)
    while (size > 24) {
      ctx.font = `900 ${size}px Impact, Arial Black, sans-serif`
      const lines = wrapText(ctx, text, maxWidth)
      const totalH = lines.length * size * 1.2
      const maxLineW = Math.max(...lines.map(l => ctx.measureText(l).width))
      if (totalH <= maxHeight && maxLineW <= maxWidth) break
      size -= 2
    }
    return size
  }

  const drawText = (text, pos) => {
    if (!text) return
    const fs = calcFontSize(ctx, text, maxW, maxH)
    ctx.font = `900 ${fs}px Impact, Arial Black, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = pos === 'top' ? 'top' : 'bottom'
    ctx.lineJoin = 'round'
    const lines = wrapText(ctx, text, maxW)
    const lineH = fs * 1.18
    const strokeW = Math.max(Math.round(fs * 0.085), 4)
    lines.forEach((line, i) => {
      const y = pos === 'top' ? padV + i * lineH : H - padV - (lines.length - 1 - i) * lineH
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur = fs * 0.10
      ctx.shadowOffsetX = fs * 0.04
      ctx.shadowOffsetY = fs * 0.04
      ctx.strokeStyle = '#000'
      ctx.lineWidth = strokeW
      ctx.strokeText(line, W / 2, y)
      ctx.fillStyle = '#FFF'
      ctx.fillText(line, W / 2, y)
      ctx.restore()
    })
  }

  drawText(topText, 'top')
  drawText(bottomText, 'bottom')

  return canvas.toBuffer('image/jpeg', { quality: 0.95 })
}

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  if (!text && m.quoted?.body) text = m.quoted.body.trim()
  if (!text) {
    return m.reply(beautifulMessage(
      '❌ Masukkan teks format: atas|bawah\nContoh: .smeme LO PILIH DIEM|ATAU GUE SAYANG?',
      { pushName: m.pushName }
    ))
  }

  const parts = text.split('|').map(s => s.trim().toUpperCase())
  const topText = parts[0] || ''
  const bottomText = parts[1] || ''
  if (!topText && !bottomText) {
    return m.reply('❌ Teks tidak boleh kosong semua!')
  }
  const target = m.quoted || m
  const isImage = target.type === 'imageMessage'
  if (!isImage) {
    return m.reply(beautifulMessage(
      '❌ Reply gambar terlebih dahulu!\n\nContoh: .smeme LO PILIH DIEM|ATAU GUE SAYANG? (reply ke gambar)',
      { pushName: m.pushName }
    ))
  }

  await m.react('⏳')

  try {
    const stream = await downloadContentFromMessage(target.message[target.type], 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    if (!buffer || buffer.length === 0) {
      return m.reply('❌ Gagal download gambar. Coba kirim ulang.')
    }

    let finalStickerBuffer = null
    try {
      const backgroundUrl = await uploadWithFallback(buffer)
      const apiUrl = 'https://api.nexray.eu.cc/maker/smeme'
      const response = await axios.get(apiUrl, {
        params: {
          text_atas: topText,
          text_bawah: bottomText,
          background: backgroundUrl,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
      })
      if (response.data && response.data.length > 0) {
        finalStickerBuffer = await writeExifImg(response.data)
      } else {
        throw new Error('Response kosong')
      }
    } catch (apiErr) {
      console.warn('[SMEME] API gagal, fallback ke canvas:', apiErr.message)
      const memeBuffer = await generateMemeCanvas(buffer, topText, bottomText)
      finalStickerBuffer = await writeExifImg(memeBuffer)
    }

    if (!finalStickerBuffer) {
      throw new Error('Gagal membuat stiker melalui API dan canvas')
    }

    await sock.sendMessage(m.chat, { sticker: finalStickerBuffer }, { quoted: m.raw })
    await m.react('✅')

  } catch (err) {
    console.error('[SMEME]', err)
    await m.react('❌')
    await m.reply(beautifulMessage(
      `❌ Gagal membuat meme: ${err.message}`,
      { pushName: m.pushName }
    ))
  }
}