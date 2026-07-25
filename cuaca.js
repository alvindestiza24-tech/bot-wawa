// plugins/tools/weather.js
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSET_DIR = join(__dirname, '..', '..', 'storage', 'weather')

const BACKGROUNDS = {
  clear: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1600&q=80',
  clouds: 'https://images.unsplash.com/photo-1499956827185-0d63ee78a910?w=1600&q=80',
  rain: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1600&q=80',
  thunderstorm: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1600&q=80',
  snow: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1600&q=80',
  mist: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1600&q=80',
  default: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1600&q=80'
}

const WEATHER_ICONS = {
  clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️',
  thunderstorm: '⛈️', snow: '❄️', mist: '🌫️', default: '🌤️'
}

async function downloadFile(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function getWeatherKey(condition) {
  const c = (condition || '').toLowerCase()
  if (c.includes('clear')) return 'clear'
  if (c.includes('cloud')) return 'clouds'
  if (c.includes('drizzle')) return 'drizzle'
  if (c.includes('rain')) return 'rain'
  if (c.includes('thunderstorm')) return 'thunderstorm'
  if (c.includes('snow')) return 'snow'
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'mist'
  return 'default'
}

function getWindDirection(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function capitalize(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function drawRoundedRect(ctx, x, y, w, h, r) {
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

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height
  const cr = w / h
  let sx, sy, sw, sh
  if (ir > cr) {
    sh = img.height
    sw = sh * cr
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / cr
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

async function getBackgroundImage(key) {
  if (!existsSync(ASSET_DIR)) mkdirSync(ASSET_DIR, { recursive: true })
  const dest = join(ASSET_DIR, `${key}.jpg`)
  if (!existsSync(dest)) {
    const buf = await downloadFile(BACKGROUNDS[key] || BACKGROUNDS.default)
    writeFileSync(dest, buf)
  }
  return await loadImage(dest)
}

export const config_ = {
  name: 'weather',
  alias: ['cuaca'],
  category: 'tools',
  description: 'Cek informasi cuaca suatu kota',
  usage: '.cuaca <nama kota>',
  example: '.cuaca Jakarta',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const city = m.text?.trim() || ''
  if (!city) {
    return m.reply('❌ Masukkan nama kota.\nContoh: *.cuaca Jakarta*')
  }

  const apiKey = 'ac61bb96d2ce45e36f01454afb2c5e6f'
  await m.react('🕒')

  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    const res = await fetch(apiUrl)
    if (!res.ok) {
      await m.react('❌')
      return m.reply('❌ Kota tidak ditemukan! Periksa ejaan.')
    }
    const data = await res.json()

    const W = 1280, H = 800
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    const conditionMain = data.weather?.[0]?.main || ''
    const weatherKey = getWeatherKey(conditionMain)
    const bgImg = await getBackgroundImage(weatherKey)

    ctx.save()
    ctx.filter = 'brightness(1.1) contrast(1.05) saturate(1.15)'
    drawCover(ctx, bgImg, 0, 0, W, H)
    ctx.restore()

    const grad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H)
    grad.addColorStop(0, 'rgba(255,255,255,0.18)')
    grad.addColorStop(1, 'rgba(0,0,0,0.32)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    const blurCanvas = createCanvas(W, H)
    const bctx = blurCanvas.getContext('2d')
    bctx.filter = 'blur(24px)'
    bctx.drawImage(canvas, 0, 0)

    const cardW = 1000, cardH = 560
    const cardX = (W - cardW) / 2, cardY = (H - cardH) / 2
    const radius = 28

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 50
    ctx.shadowOffsetY = 18
    ctx.fillStyle = 'rgba(0,0,0,0.01)'
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.fill()
    ctx.restore()

    ctx.save()
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.clip()
    ctx.drawImage(blurCanvas, cardX, cardY, cardW, cardH, cardX, cardY, cardW, cardH)
    ctx.fillStyle = 'rgba(8,10,18,0.42)'
    ctx.fillRect(cardX, cardY, cardW, cardH)
    ctx.restore()

    ctx.save()
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.stroke()
    ctx.restore()

    const pad = 48
    const dividerX = cardX + cardW / 2

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dividerX, cardY + pad)
    ctx.lineTo(dividerX, cardY + cardH - pad)
    ctx.stroke()
    ctx.restore()

    ctx.textBaseline = 'alphabetic'
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2

    const leftX = cardX + pad
    const headerY = cardY + pad + 22
    ctx.font = '600 30px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(`${WEATHER_ICONS[weatherKey] || '🌤️'} Weather Information`, leftX, headerY)

    const items = [
      ['Location', `${data.name || 'N/A'}, ${data.sys?.country || 'N/A'}`],
      ['Feels Like', data.main?.feels_like != null ? `${Math.round(data.main.feels_like)}°C` : 'N/A'],
      ['Humidity', data.main?.humidity != null ? `${data.main.humidity}%` : 'N/A'],
      ['Pressure', data.main?.pressure != null ? `${data.main.pressure} hPa` : 'N/A'],
      ['Cloudiness', data.clouds?.all != null ? `${data.clouds.all}%` : 'N/A'],
      ['Visibility', data.visibility != null ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A'],
      ['Wind', `${data.wind?.speed ?? 'N/A'} m/s ${data.wind?.deg !== undefined ? getWindDirection(data.wind.deg) : ''}`.trim()],
      ['Sunrise', new Date((data.sys?.sunrise + data.timezone) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) || 'N/A'],
      ['Sunset', new Date((data.sys?.sunset + data.timezone) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) || 'N/A']
    ]

    let iy = headerY + 56
    for (const [label, value] of items) {
      ctx.font = '300 22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.fillText(label, leftX, iy)

      ctx.font = '600 22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      const valW = ctx.measureText(value).width
      ctx.fillText(value, cardX + cardW / 2 - pad - valW, iy)

      iy += 44
    }

    const rightX = dividerX + pad
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = '600 64px sans-serif'
    ctx.fillText(data.name || 'Unknown', rightX, cardY + pad + 60)

    ctx.font = '600 96px sans-serif'
    const tempText = data.main?.temp != null ? `${Math.round(data.main.temp)}°C` : 'N/A'
    ctx.fillText(tempText, rightX, cardY + pad + 180)

    const description = capitalize(data.weather?.[0]?.description || '')
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '400 28px sans-serif'
    ctx.fillText(description, rightX, cardY + pad + 222)

    const updatedAt = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })
    ctx.font = '400 18px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(`⏰ Updated: ${updatedAt} WIB`, rightX, cardY + cardH - pad)

    const buffer = canvas.toBuffer('image/png')

    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: `📍 ${data.name}, ${data.sys?.country || 'N/A'} • ${Math.round(data.main?.temp)}°C • ${capitalize(data.weather?.[0]?.description || '')}`
    }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[WEATHER]', err)
    await m.react('❌')
    await m.reply('❌ Terjadi kesalahan saat mengambil data cuaca.')
  }
}