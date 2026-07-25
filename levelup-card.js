// src/canvas/levelup-card.js
import { createCanvas, Image } from '@napi-rs/canvas'

// ── Warna disamakan dengan welcomecard.js ──────────────────────────────────
const COLORS = {
  navy:          '#0a1f44',
  navyLight:     '#1e3a6e',
  white:         '#ffffff',
  paper:         '#fdfbf7',
  textPrimary:   '#1a2a4a',
  textSecondary: '#3a4a6a',
  shadow:        'rgba(10, 31, 68, 0.2)',
  shadowSoft:    'rgba(10, 31, 68, 0.15)',
}

const FONTS = {
  body:        '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  handwritten: '"Dancing Script", "Segoe Script", "Comic Sans MS", cursive',
}

const DEFAULT_PFP_URL = 'https://i.imgur.com/bGqSIIq.jpg'
const DEFAULT_BG_URL  = 'https://files.catbox.moe/p8y6nb.jpg'
const EXP_PER_LEVEL   = 10_000

// Canvas size — compact horizontal banner
const W = 900
const H = 280

// ── Helper: load image ─────────────────────────────────────────────────────
const _imgCache = new Map()

async function loadImage(url) {
  if (!url) return null
  if (_imgCache.has(url)) return _imgCache.get(url)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const img = new Image()
    img.src   = buf
    _imgCache.set(url, img)
    return img
  } catch {
    return null
  }
}

// ── Draw helpers ──────────────────────────────────────────────────────────
function roundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawCircularImage(ctx, img, cx, cy, r) {
  if (!img) return
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  const scale = Math.max((r * 2) / img.width, (r * 2) / img.height)
  const iw = img.width  * scale
  const ih = img.height * scale
  ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih)
  ctx.restore()
}

function drawFivePointStar(ctx, cx, cy, outerR, innerR, rotation = 0) {
  const rot  = (rotation * Math.PI) / 180
  const step = Math.PI / 5
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r     = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2 + rot
    i === 0
      ? ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
      : ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
  }
  ctx.closePath()
  ctx.fillStyle = COLORS.navy
  ctx.fill()
  ctx.restore()
}

function drawSparkle(ctx, cx, cy, len, rotation = 0) {
  const rot   = (rotation * Math.PI) / 180
  const inner = len * 0.22
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.moveTo(0, -len)
  ctx.quadraticCurveTo(inner, -inner, len, 0)
  ctx.quadraticCurveTo(inner, inner, 0, len)
  ctx.quadraticCurveTo(-inner, inner, -len, 0)
  ctx.quadraticCurveTo(-inner, -inner, 0, -len)
  ctx.closePath()
  ctx.fillStyle = COLORS.navyLight
  ctx.fill()
  ctx.restore()
}

// ── Main render ───────────────────────────────────────────────────────────
export async function generateLevelUpCard(opts = {}) {
  const {
    ppUrl    = null,
    name     = 'User',
    oldLevel = 1,
    newLevel = 2,
    exp      = 0,
    role     = '🌱 Pemula',
  } = opts

  // XP dalam level baru
  const expInLevel = exp % EXP_PER_LEVEL
  const progress   = Math.min(expInLevel / EXP_PER_LEVEL, 1)

  // Load assets
  const [bgImg, ppImg] = await Promise.all([
    loadImage(DEFAULT_BG_URL),
    loadImage(ppUrl || DEFAULT_PFP_URL),
  ])

  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // ── 1. BACKGROUND ────────────────────────────────────────────
  if (bgImg) {
    const sc = Math.max(W / bgImg.width, H / bgImg.height)
    const bw = bgImg.width  * sc
    const bh = bgImg.height * sc
    ctx.drawImage(bgImg, (W - bw) / 2, (H - bh) / 2, bw, bh)
  } else {
    ctx.fillStyle = COLORS.paper
    ctx.fillRect(0, 0, W, H)
  }

  // Paper overlay agar teks terbaca jelas
  ctx.fillStyle = 'rgba(253, 251, 247, 0.75)'
  ctx.fillRect(0, 0, W, H)

  // ── 2. DEKORASI (style welcomecard) ──────────────────────────
  // Stars
  drawFivePointStar(ctx, 44,   40,  22, 9,  -12)
  drawFivePointStar(ctx, 858,  238, 18, 7,   14)
  drawFivePointStar(ctx, 866,  38,  12, 5,   22)
  drawFivePointStar(ctx, 32,   242, 10, 4,  -10)
  drawFivePointStar(ctx, 480,  18,  8,  3,    5)

  // Sparkles
  drawSparkle(ctx, 826, 78,  11, 30)
  drawSparkle(ctx, 58,  202, 9,   0)
  drawSparkle(ctx, 445, 262, 7,  20)

  // Dots
  ctx.fillStyle = COLORS.navy
  ;[[56, 84, 3], [840, 148, 4], [72, 246, 3], [832, 200, 2], [460, 248, 3]].forEach(([x, y, r]) => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // Accent lines
  ctx.save()
  ctx.strokeStyle = COLORS.navyLight
  ctx.lineCap     = 'round'
  ctx.lineWidth   = 3
  ctx.beginPath(); ctx.moveTo(762, 18);  ctx.lineTo(842, 18);  ctx.stroke()
  ctx.lineWidth   = 2
  ctx.beginPath(); ctx.moveTo(62,  262); ctx.lineTo(140, 262); ctx.stroke()
  ctx.restore()

  // ── 3. AVATAR ────────────────────────────────────────────────
  const AX = 138, AY = 140, AR = 88
  const ringOuter = AR + 16 + 8  // 112

  // Outer navy ring (shadow)
  ctx.save()
  ctx.shadowColor   = COLORS.shadow
  ctx.shadowBlur    = 24
  ctx.shadowOffsetY = 8
  ctx.beginPath()
  ctx.arc(AX, AY, ringOuter, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.navy
  ctx.fill()
  ctx.restore()

  // White inner ring
  ctx.beginPath()
  ctx.arc(AX, AY, AR + 8, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.white
  ctx.fill()

  // Profile photo
  drawCircularImage(ctx, ppImg, AX, AY, AR)

  // ── 4. PANEL TEXT (kanan avatar) ──────────────────────────────
  const TX   = 268          // text start X
  const PW   = W - TX - 42  // panel width ≈ 590 px

  // — Heading "⚡ LEVEL UP!" —
  ctx.save()
  ctx.font         = `bold 44px ${FONTS.body}`
  ctx.fillStyle    = COLORS.navy
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('⚡ LEVEL UP!', TX, 26)
  const headW = ctx.measureText('⚡ LEVEL UP!').width
  ctx.restore()

  // Underline (gaya welcomecard)
  ctx.save()
  ctx.strokeStyle = COLORS.navy
  ctx.lineWidth   = 4
  ctx.lineCap     = 'round'
  ctx.beginPath()
  ctx.moveTo(TX, 78)
  ctx.quadraticCurveTo(TX + headW / 2, 85, TX + headW + 10, 76)
  ctx.stroke()
  ctx.restore()

  // — Username —
  ctx.save()
  ctx.font         = `600 26px ${FONTS.body}`
  ctx.fillStyle    = COLORS.textSecondary
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  // truncate nama kalau terlalu panjang
  let displayName = name
  while (displayName.length > 3 && ctx.measureText(displayName).width > PW) {
    displayName = displayName.slice(0, -1)
  }
  if (displayName !== name) displayName += '…'
  ctx.fillText(displayName, TX, 96)
  ctx.restore()

  // — Level OLD → NEW —
  ctx.save()
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'

  const lv1Str   = `Level ${oldLevel}`
  const arrStr   = `  →  `
  const lv2Str   = `Level ${newLevel}`

  ctx.font      = `bold 34px ${FONTS.body}`
  const lv1W    = ctx.measureText(lv1Str).width
  ctx.font      = `26px ${FONTS.body}`
  const arrW    = ctx.measureText(arrStr).width

  // Level lama (abu navy)
  ctx.font      = `bold 34px ${FONTS.body}`
  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(lv1Str, TX, 134)

  // Arrow
  ctx.font      = `26px ${FONTS.body}`
  ctx.fillStyle = COLORS.navyLight
  ctx.fillText(arrStr, TX + lv1W, 140)

  // Level baru (navy bold — lebih terang)
  ctx.font      = `bold 34px ${FONTS.body}`
  ctx.fillStyle = COLORS.navy
  ctx.fillText(lv2Str, TX + lv1W + arrW, 134)
  ctx.restore()

  // — Role badge —
  ctx.save()
  ctx.font         = `22px ${FONTS.body}`
  ctx.fillStyle    = COLORS.textSecondary
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(role, TX, 182)
  ctx.restore()

  // ── 5. XP BAR ─────────────────────────────────────────────────
  const BAR_X = TX
  const BAR_Y = 215
  const BAR_W = PW - 8
  const BAR_H = 22
  const BAR_R = 11

  // Track background
  ctx.save()
  roundedRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, BAR_R)
  ctx.fillStyle = 'rgba(10, 31, 68, 0.18)'
  ctx.fill()

  // Fill gradient (navyLight → navy)
  const fillW = Math.max(BAR_R * 2, BAR_W * progress)
  const grad  = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0)
  grad.addColorStop(0, COLORS.navyLight)
  grad.addColorStop(1, COLORS.navy)
  ctx.fillStyle = grad
  roundedRect(ctx, BAR_X, BAR_Y, fillW, BAR_H, BAR_R)
  ctx.fill()
  ctx.restore()

  // XP label di dalam bar
  const xpLabel = `${expInLevel.toLocaleString('id-ID')} / ${EXP_PER_LEVEL.toLocaleString('id-ID')} XP`
  ctx.save()
  ctx.font         = `bold 12px ${FONTS.body}`
  ctx.fillStyle    = COLORS.white
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(xpLabel, BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2)
  ctx.restore()

  return canvas.toBuffer('image/png')
}
