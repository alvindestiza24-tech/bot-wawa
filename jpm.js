
import { getDatabase } from '../../src/database.js'
import { fetchGroupsSafe } from '../../src/lib/jpm-helper.js'
import { AIRich, ButtonV2, Toolkit } from '../../src/lib/_build-m.js'
import { sf, bf, itf, div, fl, ac, kr, nowTime, nowDate, beautifulMessage, toAestheticFont } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import config from '../../config.js'

export const config_ = {
  name:        'jpm',
  alias:       ['jasher', 'jaser', 'jpmht', 'jpmhidetag', 'jpmch', 'jpmchannel',
                'autojpm', 'autojasher', 'stopjpm', 'stopjasher',
                'setdelayjpm', 'delayjpm', 'jedajpm', 'setjedajpm',
                'jpmupdate', 'updatejpm', 'broadcastupdate',
                'blacklistjpm', 'bljpm', 'jpmbl', 'jpmblacklist',
                'blautojpm', 'blacklistautojpm', 'autojpmbl'],
  category:    'owner',
  description: 'Sistem Broadcast Massal dengan UI Interaktif',
  usage:       '.jpm',
  example:     '.jpm',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    3,
  isEnabled:   true
}
export { config_ as config }

const SESSIONS = new Map()
const DEFAULT_DELAY = 5000
const DELAY_OPTIONS = [
  { label: '⚡ 1 detik',  value: 1000,  desc: 'Sangat cepat, risiko spam tinggi' },
  { label: '⚡ 2 detik',  value: 2000,  desc: 'Cepat, risiko spam sedang' },
  { label: '⚡ 3 detik',  value: 3000,  desc: 'Standar, cukup aman' },
  { label: '🕐 5 detik',  value: 5000,  desc: 'Aman, paling umum' },
  { label: '🕐 7 detik',  value: 7000,  desc: 'Sangat aman' },
  { label: '🕐 10 detik', value: 10000, desc: 'Paling aman dari spam' },
  { label: '🕐 15 detik', value: 15000, desc: 'Untuk grup sangat banyak' },
]

const MODE_LABELS = {
  basic:   '📢 JPM Basic',
  hidetag: '👁️ JPM Hidetag',
  channel: '📺 JPM Channel',
  update:  '🚀 JPM Update',
}

function parseInterval(raw) {
  if (!raw) return 0
  const cleaned = raw.toLowerCase().replace(/\s+/g, '')
  const matches = [...cleaned.matchAll(/(\d+)([smhdw])/g)]
  if (!matches.length) return 0
  const combined = matches.map(m => m[0]).join('')
  if (combined !== cleaned) return 0
  let total = 0
  for (const [_, value, unit] of matches) {
    const v = parseInt(value)
    if (unit === 's') total += v * 1000
    if (unit === 'm') total += v * 60 * 1000
    if (unit === 'h') total += v * 60 * 60 * 1000
    if (unit === 'd') total += v * 24 * 60 * 60 * 1000
    if (unit === 'w') total += v * 7 * 24 * 60 * 60 * 1000
  }
  return total
}

function formatInterval(ms) {
  if (!ms || ms <= 0) return '0 detik'
  const units = [
    { label: 'hari',  value: 86400000 },
    { label: 'jam',   value: 3600000 },
    { label: 'menit', value: 60000 },
    { label: 'detik', value: 1000 },
  ]
  let remaining = ms
  const parts = []
  for (const u of units) {
    const amount = Math.floor(remaining / u.value)
    if (amount > 0) {
      parts.push(`${amount} ${u.label}`)
      remaining -= amount * u.value
    }
  }
  return parts.join(' ') || '0 detik'
}

function previewText(text) {
  if (!text) return '-'
  const cleaned = text.replace(/\s+/g, ' ').trim()
  return cleaned.length <= 80 ? cleaned : cleaned.slice(0, 77) + '...'
}

async function getTargetGroups(sock, db, blacklistKey = 'jpmBlacklist') {
  const allGroups = await fetchGroupsSafe(sock)
  const groupIds = Object.keys(allGroups)
  const blacklist = db.setting(blacklistKey) || []
  const filtered = groupIds.filter(id => !blacklist.includes(id))
  return { groupIds: filtered, allGroups, blacklistedCount: groupIds.length - filtered.length }
}

function getOrCreateSession(sender) {
  if (!SESSIONS.has(sender)) SESSIONS.set(sender, { text: '', mediaBuffer: null, mediaType: null, timestamp: 0 })
  return SESSIONS.get(sender)
}

function clearSession(sender) {
  SESSIONS.delete(sender)
}

export async function handler(m, { sock }) {
  const cmd = m.command?.toLowerCase() || ''
  const text = m.text?.trim() || ''
  const db = getDatabase()
  const prefix = Array.isArray(config.command?.prefix) ? config.command.prefix[0] : '.'

  // Quick commands
  if (cmd === 'stopjpm' || cmd === 'stopjasher') return handleStop(m)
  if (cmd.includes('delay') || cmd.includes('jeda')) return handleDelayMenu(m, sock, db, text)
  if (cmd.includes('blacklist') || cmd.includes('bljpm') || cmd.includes('blauto')) return handleBlacklistMenu(m, sock, db, cmd, text)
  if (cmd === 'autojpm' || cmd === 'autojasher') return handleAutoJpmMenu(m, sock, db, text)
  if (cmd === 'jpmupdate' || cmd === 'updatejpm') return handleUpdateMode(m, sock, db, text)

  // Collect content from quoted or input
  let mediaBuffer = null, mediaType = null
  let contentText = text || ''

  if (m.quoted) {
    contentText = contentText || m.quoted.body || m.quoted.text || ''
    try {
      if (m.quoted.isImage) { mediaBuffer = await m.quoted.download(); mediaType = 'image' }
      else if (m.quoted.isVideo) { mediaBuffer = await m.quoted.download(); mediaType = 'video' }
      else if (m.quoted.isAudio) { mediaBuffer = await m.quoted.download(); mediaType = 'audio' }
      else if (m.quoted.isDocument) { mediaBuffer = await m.quoted.download(); mediaType = 'document' }
    } catch {}
  }

  // Save session
  const session = getOrCreateSession(m.sender)
  if (contentText) session.text = contentText
  if (mediaBuffer) { session.mediaBuffer = mediaBuffer; session.mediaType = mediaType }
  session.timestamp = Date.now()

  // If mode specified directly
  if (cmd === 'jpmht' || cmd === 'jpmhidetag') return executeBroadcast(m, sock, db, 'hidetag')
  if (cmd === 'jpmch' || cmd === 'jpmchannel') return executeBroadcast(m, sock, db, 'channel')

  // Main menu
  return showMainMenu(m, sock, db)
}

async function showMainMenu(m, sock, db) {
  const prefix = Array.isArray(config.command?.prefix) ? config.command.prefix[0] : '.'
  const currentDelay = db.setting('jedaJpm') || DEFAULT_DELAY
  const blCount = (db.setting('jpmBlacklist') || []).length
  const autoBlCount = (db.setting('autoJpmBlacklist') || []).length
  const isRunning = global.statusjpm ? true : false
  const session = SESSIONS.get(m.sender)
  const hasContent = session?.text || session?.mediaBuffer
  const f = fl(), a = ac(), d = div()

  const headerText = [
    `꒰ ${bf('JPM SYSTEM')} ꒱`,
    `${d}`,
    ` ˓ ✦ ${sf('status')} ⦂ ${isRunning ? '⚠️ Berjalan' : '💤 Idle'}`,
    ` ˓ ✦ ${sf('delay')} ⦂ ${(currentDelay / 1000).toFixed(1)} detik`,
    ` ˓ ✦ ${sf('blacklist')} ⦂ ${blCount} grup`,
    ` ˓ ✦ ${sf('auto bl')} ⦂ ${autoBlCount} grup`,
    `${d}`,
  ].join('\n')

  let infoText = ''
  if (hasContent) {
    infoText = [
      `📦 *${sf('Konten Siap')}*`,
      ` ˓ Teks: ${previewText(session.text)}`,
      ` ˓ Media: ${session.mediaType || 'Tidak ada'}`,
      `${d}`,
    ].join('\n')
  }

  const tipText = hasContent
    ? `${a} ${sf('Pilih mode broadcast di bawah')} ${f}`
    : `${a} ${sf('Kirim/reply konten dulu, lalu pilih mode')} ${f}`

  try {
    await new AIRich(sock)
      .setTitle(`📢 ${bf('JPM BROADCAST')}`)
      .addText(headerText + '\n' + infoText)
      .addTip(tipText)
      .addSuggest([
        hasContent ? `jpm basic` : `jpm`,
        hasContent ? `jpm hidetag` : `jpmht`,
        hasContent ? `jpm channel` : `jpmch`,
        `delayjpm`,
        `blacklistjpm`,
        `autojpm`,
      ])
      .send(m.chat, { quoted: createFakeQuoted() })
  } catch {
    await m.reply(headerText + '\n' + infoText + `\n\n${d}\n` + tipText)
  }
}

async function handleDelayMenu(m, sock, db, text) {
  const prefix = Array.isArray(config.command?.prefix) ? config.command.prefix[0] : '.'
  const current = db.setting('jedaJpm') || DEFAULT_DELAY
  const f = fl(), a = ac(), d = div()

  // If user provides direct number
  const numInput = parseInt(text)
  if (!isNaN(numInput) && numInput >= 1000 && numInput <= 30000) {
    db.setting('jedaJpm', numInput)
    return m.reply(beautifulMessage(
      `✅ ${sf('Delay JPM Diubah')}\n\n` +
      `${d}\n` +
      `⏱️ Sebelumnya: ${(current / 1000).toFixed(1)} detik\n` +
      `⏱️ Sekarang: ${(numInput / 1000).toFixed(1)} detik\n` +
      `${d}\n\n` +
      `${a} Estimasi 100 grup: ${Math.ceil(100 * numInput / 60000)} menit`,
      { pushName: m.pushName || 'Owner', theme: 'sparkle' }
    ))
  }

  // Show interactive delay picker
  const body = [
    `${d}`,
    ` ˓ ✦ ${sf('delay saat ini')} ⦂ *${(current / 1000).toFixed(1)} detik*`,
    `${d}`,
    `${a} ${sf('Pilih dari tombol atau ketik angka')}`,
  ].join('\n')

  const buttons = DELAY_OPTIONS.map(opt => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({
      display_text: opt.label,
      id: `.setdelayjpm ${opt.value}`,
    }),
  }))

  try {
    const msg = new ButtonV2(sock)
      .setTitle(`⏱️ ${bf('JPM DELAY')}`)
      .setBody(body)
    buttons.forEach(b => msg.addRawButton(b))
    const built = await msg.build(m.chat)
    await sock.relayMessage(m.chat, built.message, { messageId: built.key.id })
  } catch {
    await m.reply(
      `⏱️ *JPM Delay*\n\n` +
      DELAY_OPTIONS.map(o => `> ${o.label} — ${o.desc}`).join('\n') +
      `\n\nKetik: .setdelayjpm <angka dalam ms>`
    )
  }
}
async function handleBlacklistMenu(m, sock, db, cmd, text) {
  const isAuto = cmd.includes('auto')
  const key = isAuto ? 'autoJpmBlacklist' : 'jpmBlacklist'
  const label = isAuto ? 'AutoJPM' : 'JPM'
  const allGroups = await fetchGroupsSafe(sock)
  const groups = Object.values(allGroups).sort((a, b) => a.subject.localeCompare(b.subject))
  let blacklist = db.setting(key) || []

  // If user provides numbers
  const args = text.trim().split(/\s+/).filter(Boolean)
  if (args.length && args.every(n => !isNaN(parseInt(n)))) {
    const toggled = []
    for (const numStr of args) {
      const idx = parseInt(numStr) - 1
      if (idx >= 0 && idx < groups.length) {
        const g = groups[idx]
        if (blacklist.includes(g.id)) {
          blacklist = blacklist.filter(id => id !== g.id)
          toggled.push(`✅ ${g.subject} — *Unblacklist*`)
        } else {
          blacklist.push(g.id)
          toggled.push(`🚫 ${g.subject} — *Blacklist*`)
        }
      }
    }
    db.setting(key, blacklist)
    return m.reply(
      `📢 *${label} Blacklist*\n\n` + toggled.join('\n') + `\n\nTotal blacklist: ${blacklist.length} grup`
    )
  }

  // Show list
  const tableRows = [['No', 'Nama Grup', 'Status']]
  groups.forEach((g, i) => {
    tableRows.push([
      String(i + 1),
      g.subject.slice(0, 25),
      blacklist.includes(g.id) ? '🚫' : '✅',
    ])
  })

  try {
    await new AIRich(sock)
      .setTitle(`🚫 ${bf(label + ' Blacklist')}`)
      .addText(`${sf('Total')}: ${groups.length} grup | Blacklist: ${blacklist.length}`)
      .addTable(tableRows.slice(0, 15))
      .addTip(`Ketik .${cmd.split(/[,\s]+/)[0]} <no> <no> untuk toggle`)
      .addSuggest([isAuto ? 'autojpm' : 'jpm', 'delayjpm'])
      .send(m.chat, { quoted: createFakeQuoted() })
  } catch {
    let listText = `📋 *${label} Blacklist*\n\n`
    groups.forEach((g, i) => {
      listText += `${i + 1}. ${g.subject} ${blacklist.includes(g.id) ? '🚫' : ''}\n`
    })
    await m.reply(listText)
  }
}

async function handleAutoJpmMenu(m, sock, db, text) {
  const prefix = Array.isArray(config.command?.prefix) ? config.command.prefix[0] : '.'
  const d = div(), f = fl(), a = ac()

  if (!text || text === 'status') {
    // Tampilkan status sederhana
    return m.reply(beautifulMessage(
      `🔄 *Auto JPM*\n\n` +
      `${d}\n` +
      `Fitur AutoJPM memerlukan modul auto-jpm terpisah.\n` +
      `Gunakan: .autojpm <interval> <pesan>\n` +
      `Contoh: .autojpm 1h Update bot sudah live!\n` +
      `${d}`,
      { pushName: m.pushName || 'Owner', theme: 'dreamy' }
    ))
  }

  // Parse interval + message
  const parts = text.match(/^(\S+)\s+(.+)$/)
  if (!parts) return m.reply(`Format: .autojpm <interval> <pesan>\nContoh: .autojpm 1h Promo hari ini!`)

  const intervalMs = parseInterval(parts[1])
  if (!intervalMs || intervalMs < 15 * 60000) return m.reply(`❌ Interval minimal 15m, contoh: 15m, 1h, 2h30m, 1d`)

  return m.reply(beautifulMessage(
    `✅ *Auto JPM Diset*\n\n` +
    `${d}\n` +
    `⏱️ Interval: ${formatInterval(intervalMs)}\n` +
    `📝 Pesan: ${previewText(parts[2])}\n` +
    `${d}\n\n` +
    `${a} AutoJPM akan berjalan sesuai jadwal`,
    { pushName: m.pushName || 'Owner', theme: 'sakura' }
  ))
}

async function handleUpdateMode(m, sock, db, text) {
  const d = div(), f = fl(), a = ac()
  let content = text || m.quoted?.body || ''

  if (!content) return m.reply(`Format: .jpmupdate <versi> | <changelog>`)

  let version = config.bot?.version || '1.0'
  let changelog = content
  if (content.includes('|')) {
    const parts = content.split('|')
    version = parts[0].trim()
    changelog = parts.slice(1).join('|').trim()
  }

  const { groupIds } = await getTargetGroups(sock, db)
  if (!groupIds.length) return m.reply('❌ Tidak ada grup target.')

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const message = [
    `🚀 *UPDATE !! | ${bf(version)}*`,
    `${d}`,
    `📅 *Tanggal:* ${dateStr}`,
    ``,
    `*CHANGELOG:*`,
    changelog,
    ``,
    `${d}`,
    `💡 Ketik *.menu* untuk eksplorasi fitur`,
    `${a} Terima kasih ~ ${config.bot?.name || 'Bot'}`,
  ].join('\n')

  return executeBroadcastWithContent(m, sock, db, 'update', message)
}
async function handleStop(m) {
  if (!global.statusjpm) return m.reply('❌ Tidak ada JPM yang berjalan.')
  global.stopjpm = true
  return m.reply('⏹️ JPM dihentikan.')
}
async function executeBroadcast(m, sock, db, mode) {
  const session = SESSIONS.get(m.sender)
  const text = session?.text || m.text?.trim() || m.quoted?.body || ''
  const mediaBuffer = session?.mediaBuffer || null
  const mediaType = session?.mediaType || null

  if (!text && !mediaBuffer) {
    return m.reply(
      `❌ *Tidak Ada Konten*\n\n` +
      `1. Kirim teks/foto/video/audio\n` +
      `2. Reply dengan .jpm lalu pilih mode`
    )
  }

  return executeBroadcastWithContent(m, sock, db, mode, text, mediaBuffer, mediaType)
}

async function executeBroadcastWithContent(m, sock, db, mode, text, mediaBuffer, mediaType) {
  const d = div(), f = fl(), a = ac()
  const prefix = Array.isArray(config.command?.prefix) ? config.command.prefix[0] : '.'
  const delay = db.setting('jedaJpm') || DEFAULT_DELAY

  if (global.statusjpm) return m.reply('❌ JPM sedang berjalan. Ketik .stopjpm untuk berhenti.')

  const { groupIds, allGroups } = await getTargetGroups(sock, db)
  if (!groupIds.length) return m.reply('❌ Tidak ada grup target.')

  global.statusjpm = true
  const total = groupIds.length
  let success = 0, failed = 0
  const startTime = Date.now()

  const startMsg = [
    `📢 *${bf(MODE_LABELS[mode] || mode.toUpperCase())}*`,
    `${d}`,
    ` ˓ Target: *${total}* grup`,
    ` ˓ Delay: *${(delay / 1000).toFixed(1)} detik*`,
    ` ˓ Estimasi: *${Math.ceil(total * delay / 60000)} menit*`,
    `${d}`,
    `${a} Sedang mengirim...`,
  ].join('\n')

  await m.reply(startMsg)
  m.react('📢')

  const ctx = _mCtx(m.sender)
  for (let i = 0; i < total; i++) {
    if (global.stopjpm) {
      delete global.stopjpm
      delete global.statusjpm
      return m.reply(`⏹️ Berhenti. ${success} berhasil, ${failed} gagal.`)
    }

    const targetId = groupIds[i]
    try {
      if (mode === 'hidetag' && allGroups[targetId]) {
        const mentions = allGroups[targetId].participants.map(p => p.id || p.jid).filter(Boolean)
        if (mediaBuffer) {
          await sock.sendMessage(targetId, { [mediaType]: mediaBuffer, caption: text, mentions, contextInfo: { ...ctx, mentionedJid: mentions } })
        } else {
          await sock.sendMessage(targetId, { text, mentions, contextInfo: { ...ctx, mentionedJid: mentions } })
        }
      } else if (mediaBuffer) {
        await sock.sendMessage(targetId, { [mediaType]: mediaBuffer, caption: text, contextInfo: ctx })
      } else {
        await sock.sendMessage(targetId, { text, contextInfo: ctx })
      }
      success++
    } catch {
      failed++
    }

    // Update progress setiap 10 grup atau terakhir
    if ((i + 1) % 10 === 0 || i === total - 1) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const remaining = Math.round(((total - i - 1) * delay) / 1000)
      try {
        await new AIRich(sock)
          .setTitle(`📊 ${bf('Progress JPM')}`)
          .addText([
            `${d}`,
            ` ${sf('progress')} ⦂ [${'█'.repeat(Math.round((i + 1) / total * 10))}${'░'.repeat(10 - Math.round((i + 1) / total * 10))}] ${Math.round((i + 1) / total * 100)}%`,
            ` ${sf('berhasil')} ⦂ ${success} | ${sf('gagal')} ⦂ ${failed}`,
            ` ${sf('waktu')} ⦂ ${elapsed}s | ${sf('sisa')} ⦂ ~${remaining}s`,
            `${d}`,
          ].join('\n'))
          .addTip(`${f} ${kr(2)} ${a}`)
          .send(m.chat, { quoted: createFakeQuoted() })
      } catch {}
    }

    await new Promise(r => setTimeout(r, delay))
  }

  delete global.statusjpm
  m.react('✅')
  clearSession(m.sender)

  return m.reply(beautifulMessage(
    `✅ *JPM Selesai!*\n\n` +
    `${d}\n` +
    ` ✅ Berhasil: *${success}*\n` +
    ` ❌ Gagal: *${failed}*\n` +
    ` 📊 Total: *${total}*\n` +
    ` ⏱️ Waktu: *${Math.round((Date.now() - startTime) / 1000)} detik*\n` +
    `${d}`,
    { pushName: m.pushName || 'Owner', theme: 'sparkle' }
  ))
}