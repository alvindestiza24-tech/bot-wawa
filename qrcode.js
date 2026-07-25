// plugins/tools/qris.js
import { createCanvas } from '@napi-rs/canvas'
import QRCode from 'qrcode'

export const config_ = {
  name: 'qris',
  alias: ['qr', 'generateqr', 'qrgen'],
  category: 'tools',
  description: 'Generate QR code dengan tampilan cute (pink & biru pastel)',
  usage: '.qris <teks atau url>',
  example: '.qris https://example.com',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const PASTEL_PINK = '#F8BBD0'
const PASTEL_BLUE = '#BBDEFB'
const DARK_PINK   = '#D81B60'

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

export async function handler(m, { sock }) {
  const text = m.text?.trim() || ''
  if (!text) {
    return m.reply('❌ Masukkan teks atau URL untuk dijadikan QR Code.\nContoh: .qris https://lynk.id/kyyinfinite')
  }

  try {
    // Generate QR code matrix (dengan opsi error correction tinggi agar tetap terbaca walau diberi style)
    const qrData = await QRCode.create(text, { errorCorrectionLevel: 'H' })
    const modules = qrData.modules
    const moduleCount = modules.size

    // Ukuran canvas
    const padding = 40
    const qrSize = 512
    const canvasSize = qrSize + padding * 2
    const canvas = createCanvas(canvasSize, canvasSize)
    const ctx = canvas.getContext('2d')

    // Background gradient pastel
    const bgGrad = ctx.createLinearGradient(0, 0, canvasSize, canvasSize)
    bgGrad.addColorStop(0, PASTEL_PINK)
    bgGrad.addColorStop(1, PASTEL_BLUE)
    drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, 30)
    ctx.fillStyle = bgGrad
    ctx.fill()

    // Draw QR modules dengan warna pink tua (dark pink) dan efek rounded pixel
    const moduleSize = qrSize / moduleCount
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = padding + col * moduleSize
          const y = padding + row * moduleSize
          // Rounded pixel untuk tampilan lucu
          ctx.fillStyle = DARK_PINK
          drawRoundedRect(ctx, x + 2, y + 2, moduleSize - 4, moduleSize - 4, 6)
          ctx.fill()
        }
      }
    }

    // Tambahkan logo kecil di tengah? (opsional, untuk tampilan lebih imut bisa tambahkan ikon love kecil)
    // Di sini kita tambahkan hati kecil di tengah QR code
    const centerX = canvasSize / 2
    const centerY = canvasSize / 2
    const heartSize = 36
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${heartSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💗', centerX, centerY)

    // Border luar
    drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, 30)
    ctx.strokeStyle = DARK_PINK
    ctx.lineWidth = 4
    ctx.stroke()

    const buffer = canvas.toBuffer('image/png')

    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: `💗 QR Code generated!\n\nData: ${text.length > 50 ? text.slice(0, 50) + '...' : text}`,
    }, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[QRIS]', err)
    await m.react('❌')
    await m.reply('❌ Gagal membuat QR code.')
  }
}