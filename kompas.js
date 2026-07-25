import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'

const __dirname = dirname(fileURLToPath(import.meta.url))

const NEWS_BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/Fberita.png'
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2'
const PHOTO_SOURCE = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/jpg'

const ASSETS_DIR = join(__dirname, 'assets', 'newsrin')
const FONTS_DIR = join(ASSETS_DIR, 'fonts')
const BG_LOCAL = join(ASSETS_DIR, 'berita.png')
const FONT_LOCAL = join(FONTS_DIR, 'Inter-Bold.ttf')
const PHOTO_CACHE = join(ASSETS_DIR, 'photo_cache.jpg')

const BG_W = 962
const BG_H = 1634

const config = {
  text: {
    x: 30,
    y: 277,
    maxWidth: 1010,
  },
  foto: {
    a: 1025,
    b: 1634,
    c: 0,
    d: 962,
    radius: 0,
  },
}

async function download(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    maxRedirects: 5,
  })
  return Buffer.from(res.data)
}

async function ensureAssets() {
  await mkdir(FONTS_DIR, { recursive: true })

  if (!existsSync(BG_LOCAL)) {
    console.log('⬇ Mengunduh background berita...')
    await writeFile(BG_LOCAL, await download(NEWS_BG_URL))
  }

  if (!existsSync(FONT_LOCAL)) {
    console.log('⬇ Mengunduh font berita...')
    await writeFile(FONT_LOCAL, await download(FONT_URL))
  }

  GlobalFonts.registerFromPath(FONT_LOCAL, 'InterNews')
}

async function resolvePhoto(src) {
  if (!src || src === PHOTO_SOURCE) {
    // Jika tidak ada foto, download default
    if (!existsSync(PHOTO_CACHE)) {
      await writeFile(PHOTO_CACHE, await download(PHOTO_SOURCE))
    }
    return PHOTO_CACHE
  }

  if (/^https?:\/\//i.test(src)) {
    await writeFile(PHOTO_CACHE, await download(src))
    return PHOTO_CACHE
  }

  if (existsSync(src)) return src
  throw new Error(`File lokal tidak ditemukan: ${src}`)
}

function wordWrap(text, ctx, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (let i = 0; i < words.length; i++) {
    const test = current + words[i] + ' '
    if (ctx.measureText(test.trim()).width > maxWidth && i > 0) {
      lines.push(current.trim())
      current = words[i] + ' '
    } else {
      current = test
    }
  }
  if (current) lines.push(current.trim())
  return lines
}

function roundedClipPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

async function drawFoto(ctx, imagePath, zone) {
  const { a, b, c, d, radius } = zone
  const x = c
  const y = a
  const w = d - c
  const h = b - a
  const r = radius ?? 0

  const img = await loadImage(imagePath)
  const imgRatio = img.width / img.height
  const boxRatio = w / h

  ctx.save()
  roundedClipPath(ctx, x, y, w, h, r)
  ctx.clip()

  ctx.filter = 'blur(28px)'
  ctx.drawImage(img, x - 40, y - 40, w + 80, h + 80)
  ctx.filter = 'none'

  let fw, fh
  if (imgRatio > boxRatio) {
    fw = w
    fh = fw / imgRatio
  } else {
    fh = h
    fw = fh * imgRatio
  }

  ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh)
  ctx.restore()
}

export async function generateNews(newsText, photoSrc, outputPath) {
  await ensureAssets()

  const text = newsText.replace(/\s+/g, ' ').trim()
  const { x, y, maxWidth } = config.text

  const photoPath = await resolvePhoto(photoSrc)

  const canvas = createCanvas(BG_W, BG_H)
  const ctx = canvas.getContext('2d')
  const bgImg = await loadImage(BG_LOCAL)
  ctx.drawImage(bgImg, 0, 0, BG_W, BG_H)

  await drawFoto(ctx, photoPath, config.foto)

  const words = text.split(' ')
  const fontSize = words.length <= 18 ? 76 : 56
  const lineGap = words.length <= 18 ? 12 : 18
  const lineHeight = fontSize + lineGap

  ctx.font = `700 ${fontSize}px InterNews`
  ctx.fillStyle = '#eaf2f8'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  let lines = wordWrap(text, ctx, maxWidth)
  if (lines.length > 6) {
    lines = lines.slice(0, 5)
    lines.push('...')
  }

  ctx.save()
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight)
  }
  ctx.restore()

  const pngData = await canvas.encode('png')
  const TMP_DIR = join(process.cwd(), 'storage', '.tmp')
  await mkdir(TMP_DIR, { recursive: true })
  const out = outputPath ?? join(TMP_DIR, `news-${Date.now()}.png`)
  await writeFile(out, pngData)
  console.log('Saved:', out)
  return out
}

// Jalankan langsung hanya jika file ini dijalankan sebagai skrip utama
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const newsText = process.argv[2] || 'Halo my bini i am gwh'
  const photoSrc = process.argv[3] || PHOTO_SOURCE
  generateNews(newsText, photoSrc).catch(err => {
    console.error('❌ Error:', err.message || err)
    process.exit(1)
  })
}