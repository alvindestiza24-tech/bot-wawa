// src/lib/antiBot.js

/**
 * Mendeteksi apakah sebuah pesan dikirim oleh bot Baileys.
 * Mengembalikan objek { isBot, score, reasons, confidence, messageId, senderDevice }
 */
export function analyzeBotMessage(m) {
  // Pastikan m memiliki key.id
  const messageId = String(m?.key?.id || m?.id || '').trim()
  if (!messageId) {
    return { isBot: false, score: 0, reasons: [], confidence: 'low' }
  }

  // Abaikan ID yang jelas bukan bot
  if (messageId.startsWith('WAMID.') || messageId.startsWith('false_')) {
    return { isBot: false, score: 0, reasons: [], confidence: 'low' }
  }

  let score = 0
  const reasons = []

  // Pola ID pesan khas Baileys
  if (/^3EB0[0-9A-F]{12,}$/i.test(messageId)) {
    score += 5
    reasons.push('id-3EB0')
  } else if (/^BAE5[0-9A-F]{12}$/i.test(messageId)) {
    score += 5
    reasons.push('id-BAE5')
  } else if (/^3A[A-F0-9]{18,}$/i.test(messageId)) {
    score += 3
    reasons.push('id-3A')
  } else if (/^[A-F0-9]{28,40}$/i.test(messageId)) {
    score += 2
    reasons.push('id-upper-hex')
  }

  // Flag isBaileys (jika tersedia di serialize)
  if (m?.isBaileys === true) {
    score += 4
    reasons.push('flag-isBaileys')
  }

  // Pesan mengandung deviceSentMessage (ciri Baileys)
  const msg = m?.raw?.message || m?.message || {}
  if (msg.deviceSentMessage) {
    score += 1
    reasons.push('message-deviceSent')
    if (msg.deviceSentMessage?.message) {
      score += 1
      reasons.push('message-deviceWrapper')
    }
  }

  // Device ID di participant (contoh: 13135550002:7@s.whatsapp.net)
  const participant = String(m?.key?.participant || '')
  const match = participant.match(/:(\d+)@/)
  if (match) {
    const deviceId = Number.parseInt(match[1], 10)
    if (!isNaN(deviceId) && deviceId > 20) {
      score += 1
      reasons.push('participant-highDevice')
    }
  }

  // PushName tidak dikenal
  const pushName = String(m?.pushName || '').trim().toLowerCase()
  if (!pushName || ['unknown', 'undefined', 'null'].includes(pushName)) {
    score += 1
    reasons.push('pushname-unknown')
  }

  const confidence = score >= 6 ? 'high' : score >= 4 ? 'medium' : 'low'
  return {
    isBot: score >= 5,
    score,
    reasons,
    confidence,
    messageId,
    senderDevice: match ? parseInt(match[1]) : null,
  }
}

/**
 * Mendapatkan tipe device berdasarkan raw message.
 */
export function getDeviceType(m) {
  const raw = m?.raw || {}
  const msg = raw.message || {}
  if (msg.deviceSentMessage?.deviceSentMetaData) {
    const meta = msg.deviceSentMessage.deviceSentMetaData
    if (meta.deviceType === 'web') return 'web'
    if (meta.deviceType === 'android') return 'android'
    if (meta.deviceType === 'ios') return 'ios'
  }
  const participant = String(m?.key?.participant || '')
  const match = participant.match(/:(\d+)@/)
  if (match) {
    const dev = parseInt(match[1])
    if (dev > 100) return 'web' // device ID >100 biasanya web
    if (dev > 0) return 'android'
  }
  return 'unknown'
}

/**
 * Memeriksa apakah pengirim atau device-nya ada di daftar trusted grup.
 * Mengembalikan true jika diizinkan (trusted).
 */
export function isTrusted(m, groupData) {
  if (!groupData?.antiBotTrusted) return false
  const trusted = groupData.antiBotTrusted
  const senderJid = m?.sender || m?.key?.participant || ''
  if (trusted[senderJid]) return true
  const device = getDeviceType(m)
  const deviceKey = `device:${device}`
  return !!trusted[deviceKey]
}