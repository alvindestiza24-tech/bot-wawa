
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_PATH  = path.resolve(__dirname, '../../storage/logs/security.log')
const CMD_PREFIXES = new Set(['.', '!', '#', '/', '\\', '$', '%', '&', '-'])

const BAILEYS_ID_PATTERNS = [
  { re: /^3EB0[0-9A-F]{10,}/i,  score: 22, label: 'Baileys-3EB0'  },
  { re: /^BAE5[0-9A-F]{10,}/i,  score: 20, label: 'Baileys-BAE5'  },
  { re: /^BAAE[0-9A-F]{10,}/i,  score: 20, label: 'Baileys-BAAE'  },
  { re: /^3A[A-F0-9]{16,}/i,    score: 16, label: 'Baileys-3A'    },
  { re: /^[A-F0-9]{28,40}$/,    score: 10, label: 'Baileys-HEX'   },
  { re: /^[0-9A-F]{20,32}$/,    score: 6,  label: 'Baileys-short' },
]
const ALWAYS_BOT_TYPES = new Set([
  'buttonsMessage',
  'highlyStructuredMessage',
  'templateMessage',
  'listMessage',
  'orderMessage',
  'invoiceMessage',
])

const CONTENT_PATTERNS = [
  { re: /[┌┐└┘│─╔╗╚╝║═╠╣╦╩╬]+/u,                pts: 5,  tag: 'box-draw'         },
  { re: /┕━+/u,                                  pts: 4,  tag: 'box-corner-heavy' },
  { re: /[◈◦►•▸▷⊹⌗⬦⋆☆]+/u,                     pts: 3,  tag: 'deco-chars'       },
  { re: /─{3,}\s*[⌗⋆☆⊹]\s*[\w\s]{2,}/u,         pts: 5,  tag: 'stat-separator'   },
  { re: /\[.*PANEL.*(?:LEGAL|STORE|SHOP).*\]/i,  pts: 8,  tag: 'panel-legal'      },
  { re: /\bVersion\s*[:*]\s*v?\d+\.\d+/i,        pts: 6,  tag: 'version'          },
  { re: /\b(?:Creator|Developer|Owner)\s*[:*]/i,  pts: 5,  tag: 'creator'          },
  { re: /\bType\s+bot\s*[:*]\s*\w+/i,            pts: 6,  tag: 'type-bot'         },
  { re: /Prefix\s*(?:Bot)?\s*[:*]\s*[\[\(]/i,    pts: 5,  tag: 'prefix-info'      },
  { re: /Script\s+(?:Type|Version|Vip)\b/i,       pts: 5,  tag: 'script-info'      },
  { re: /©\s*[\w\s]{2,30}/u,                     pts: 4,  tag: 'copyright'        },
  { re: /\bXP\s*[:]\s*\d+/i,                     pts: 6,  tag: 'xp-display'       },
  { re: /[ʟ][ɪɪ][ᴍᴍ][ɪɪ][ᴛᴛ]\s*[:]\s*\d+/u,   pts: 6,  tag: 'limit-display'    },
  { re: /[ʀ][ᴏᴏ][ʟʟ][ᴇᴇ]\s*[:]/u,             pts: 5,  tag: 'role-display'     },
  { re: /[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ]{4,}/u,  pts: 8,  tag: 'smallcaps-bot'   },
  { re: /[\u{1D400}-\u{1D7FF}]/u,                pts: 7,  tag: 'math-bold-unicode' },
  { re: /\.(list|all)?(menu|cmd|help|command)/i,  pts: 8,  tag: 'menu-cmd'         },
  { re: /Tekan\s+Tombol|klik\s+tombol/iu,        pts: 5,  tag: 'button-cta'       },
]

export function extractDeviceId(jid) {
  if (!jid) return 0
  const m = String(jid).match(/:(\d+)@/)
  const n = parseInt(m?.[1], 10)
  return isNaN(n) ? 0 : n
}

function inferClientType(rawMsg, deviceId) {
  const msgId  = String(rawMsg?.key?.id || '')
  const msg    = rawMsg?.message || {}
  const types  = Object.keys(msg)
  const isBotType  = types.some(t => ALWAYS_BOT_TYPES.has(t))
  const isBaileyId = BAILEYS_ID_PATTERNS.some(({ re }) => re.test(msgId))
  if (rawMsg?.isBaileys || isBotType || isBaileyId) return 'baileys'
  if (deviceId >= 1 && deviceId <= 4) return 'web'
  if (deviceId === 0) return 'phone'
  return 'unknown'
}
function getContextInfo(rawMsg) {
  const msg  = rawMsg?.message || {}
  const SCAN = [
    'extendedTextMessage','imageMessage','videoMessage','documentMessage',
    'audioMessage','stickerMessage','conversation','contactMessage',
    'locationMessage','buttonsMessage','listMessage','templateMessage',
    'highlyStructuredMessage','interactiveMessage','ephemeralMessage',
  ]
  for (const k of SCAN) {
    if (msg[k]?.contextInfo) return msg[k].contextInfo
  }
  return {}
}
function getForwardingScore(rawMsg) {
  const msg  = rawMsg?.message || {}
  const SCAN = [
    'extendedTextMessage','imageMessage','videoMessage','documentMessage',
    'audioMessage','stickerMessage','buttonsMessage','listMessage',
  ]
  for (const k of SCAN) {
    const s = msg[k]?.contextInfo?.forwardingScore
    if (typeof s === 'number' && s > 0) return s
  }
  return 0
}

function getAllButtonIds(rawMsg) {
  const msg = rawMsg?.message || {}
  const ids = []
  for (const b of msg.buttonsMessage?.buttons || []) {
    if (b.buttonId)               ids.push(b.buttonId)
    if (b.buttonText?.displayText) ids.push(b.buttonText.displayText)
  }
  for (const sec of msg.listMessage?.sections || []) {
    for (const row of sec.rows || []) {
      if (row.rowId) ids.push(row.rowId)
      if (row.title) ids.push(row.title)
    }
  }
  for (const b of msg.interactiveMessage?.nativeFlowMessage?.buttons || []) {
    try {
      const p = JSON.parse(b.buttonParamsJson || '{}')
      if (b.name === 'quick_reply') {
        // { id: ".menu all", display_text: "..." }
        if (p.id) ids.push(p.id)

      } else if (b.name === 'single_select') {
        // { title: "...", sections: [{ rows: [{ id: ".menu ai", title:"..." }] }] }
        for (const sec of p.sections || []) {
          for (const row of sec.rows || []) {
            if (row.id)    ids.push(row.id)
            if (row.title) ids.push(row.title)
          }
        }

      } else if (b.name === 'cta_url') {
        if (p.display_text) ids.push(p.display_text)

      } else {
        if (p.id)           ids.push(p.id)
        if (p.display_text) ids.push(p.display_text)
      }
    } catch {}
  }
  const hydrBtns =
    msg.templateMessage?.hydratedTemplate?.hydratedButtons ||
    msg.highlyStructuredMessage?.hydratedHsm?.hydratedButtons || []
  for (const b of hydrBtns) {
    const r = b.quickReplyButton || b.urlButton || b.callButton
    if (r?.id)          ids.push(r.id)
    if (r?.displayText) ids.push(r.displayText)
  }

  return ids.map(s => String(s).trim()).filter(Boolean)
}
function getFullText(rawMsg) {
  const msg   = rawMsg?.message || {}
  const parts = []

  const push = (...vals) => vals.forEach(v => v && parts.push(v))

  push(
    msg.conversation,
    msg.extendedTextMessage?.text,
    msg.buttonsMessage?.contentText,
    msg.buttonsMessage?.footerText,
    msg.listMessage?.title,
    msg.listMessage?.description,
    msg.listMessage?.buttonText,
    msg.interactiveMessage?.body?.text,
    msg.interactiveMessage?.footer?.text,
    msg.interactiveMessage?.header?.title,
    msg.templateMessage?.hydratedTemplate?.hydratedContentText,
    msg.templateMessage?.hydratedTemplate?.hydratedFooterText,
  )
  for (const sec of msg.listMessage?.sections || []) {
    push(sec.title)
    for (const row of sec.rows || []) push(row.title, row.description)
  }
  try {
    const p = JSON.parse(msg.interactiveMessage?.nativeFlowMessage?.messageParamsJson || '{}')
    push(
      p.limited_time_offer?.text,
      p.bottom_sheet?.list_title,
      p.bottom_sheet?.button_title,
    )
  } catch {}

  return parts.filter(Boolean).join('\n')
}
export function isSuspiciousPushName(name, cfg) {
  if (!name) return false
  const lower    = String(name).toLowerCase().trim()
  const patterns = cfg?.suspiciousPushNames || [
    'bot','admin','support','official','server','api','system','robot','auto','spam','md',
  ]
  if (patterns.some(p => lower.includes(p))) return true
  if (/[0-9]{4,}$/.test(name))           return true   // angka acak di akhir
  if (/^[a-z0-9_]{25,}$/.test(lower))    return true   // auto-generated
  return false
}

function _analyzeId(rawMsg) {
  const id = String(rawMsg?.key?.id || '').trim()
  if (!id) return { score: 0, reasons: [] }
  if (/^WAMID\./i.test(id) || /^(?:false|true)_/.test(id) || /^\d{15,}$/.test(id))
    return { score: 0, reasons: [] }

  for (const { re, score, label } of BAILEYS_ID_PATTERNS) {
    if (re.test(id)) {
      return {
        score,
        reasons: [`Message-ID fingerprint ${label} (${id.slice(0, 14)}…) +${score}`],
      }
    }
  }
  return { score: 0, reasons: [] }
}
function _analyzeType(rawMsg) {
  const msg     = rawMsg?.message || {}
  const msgType = Object.keys(msg)[0] || ''
  let   score   = 0
  const reasons = []
  if (ALWAYS_BOT_TYPES.has(msgType)) {
    if (msgType === 'buttonsMessage') {
      const bm = msg.buttonsMessage || {}
      if      (bm.locationMessage || bm.headerType === 'LOCATION') {
        score += 45; reasons.push('buttonsMessage + locationMessage header = Baileys relay signature +45')
      } else if (bm.imageMessage   || bm.headerType === 'IMAGE') {
        score += 38; reasons.push('buttonsMessage + imageMessage header = Baileys relay +38')
      } else if (bm.videoMessage   || bm.headerType === 'VIDEO') {
        score += 38; reasons.push('buttonsMessage + videoMessage header +38')
      } else if (bm.documentMessage|| bm.headerType === 'DOCUMENT') {
        score += 35; reasons.push('buttonsMessage + documentMessage header +35')
      } else {
        score += 28; reasons.push('buttonsMessage text-only = relay bot +28')
      }
    } else if (msgType === 'listMessage') {
      score += 30; reasons.push('listMessage = bot menu relay +30')
    } else if (msgType === 'highlyStructuredMessage' || msgType === 'templateMessage') {
      score += 30; reasons.push(`${msgType} = bot template relay +30`)
    } else {
      score += 22; reasons.push(`${msgType} = bot-only message type +22`)
    }
  }

  if (msgType === 'interactiveMessage') {
    const im  = msg.interactiveMessage || {}
    const nfm = im.nativeFlowMessage   || {}
    if (im.contextInfo?.pairedMediaType === 'NOT_PAIRED_MEDIA') {
      score += 15; reasons.push('contextInfo.pairedMediaType=NOT_PAIRED_MEDIA (Baileys signature) +15')
    }

    const btns = nfm.buttons || []

    if (btns.length > 0) {
      score += 10; reasons.push(`interactiveMessage + nativeFlowMessage (${btns.length} buttons) +10`)
      let totalRows   = 0
      let hasSSelect  = false
      let hasQReply   = false
      let hasCTA      = false

      for (const b of btns) {
        if (b.name === 'single_select') {
          hasSSelect = true
          try {
            const p = JSON.parse(b.buttonParamsJson || '{}')
            for (const s of p.sections || []) totalRows += (s.rows || []).length
          } catch {}
        }
        if (b.name === 'quick_reply') hasQReply = true
        if (b.name === 'cta_url')     hasCTA    = true
      }

      if (hasSSelect) {
        const extra = totalRows >= 20 ? 35 : totalRows >= 10 ? 25 : totalRows >= 3 ? 15 : 8
        score += extra
        reasons.push(`interactiveMessage single_select (${totalRows} rows) +${extra}`)
      }
      if (hasQReply && hasSSelect) {
        score += 5; reasons.push('kombinasi single_select + quick_reply = bot menu pattern +5')
      }
      try {
        const mp = JSON.parse(nfm.messageParamsJson || '{}')
        if (mp.limited_time_offer) {
          score += 20; reasons.push('nativeFlowMessage.limited_time_offer terdeteksi (Baileys-specific) +20')
        }
        if (Array.isArray(mp.bottom_sheet?.divider_indices)) {
          score += 8;  reasons.push('nativeFlowMessage.bottom_sheet.divider_indices (Baileys field) +8')
        }
      } catch {}
    }
  }
  if (msg.deviceSentMessage) {
    score += 20; reasons.push('deviceSentMessage terdeteksi +20')
  }

  return { score, reasons }
}
function _analyzeButtons(rawMsg) {
  const ids = getAllButtonIds(rawMsg)
  if (!ids.length) return { score: 0, reasons: [] }

  const cmdIds = ids.filter(id => id.length > 0 && CMD_PREFIXES.has(id[0]))
  if (!cmdIds.length) return { score: 0, reasons: [] }
  const score = cmdIds.length >= 15 ? 45
              : cmdIds.length >= 8  ? 38
              : cmdIds.length >= 3  ? 28
              : cmdIds.length >= 1  ? 15
              : 0

  const sample = cmdIds.slice(0, 5).join(', ')
  return {
    score,
    reasons: [
      `${cmdIds.length}/${ids.length} button/row ID dengan command prefix ` +
      `(${sample}${cmdIds.length > 5 ? ', …' : ''}) +${score}`,
    ],
  }
}

function _analyzeContent(rawMsg) {
  const text = getFullText(rawMsg)
  if (!text) return { score: 0, reasons: [] }

  const matched = []
  let   total   = 0

  for (const { re, pts, tag } of CONTENT_PATTERNS) {
    if (re.test(text)) { matched.push(tag); total += pts }
  }

  if (!matched.length) return { score: 0, reasons: [] }

  total = Math.min(total, 30)  // cap agar tidak over-score dari konten saja
  return {
    score:   total,
    reasons: [`Pola konten bot (${matched.join(', ')}) +${total}`],
  }
}
function _analyzeForwarding(rawMsg, sc) {
  const reasons = []
  let   score   = 0

  const fw = getForwardingScore(rawMsg)
  if      (fw >= 999) { const p = sc.forwardingScoreMax  ?? 40; score += p; reasons.push(`Forwarding score max (${fw}) +${p}`) }
  else if (fw >= 500) {                                            score += 30; reasons.push(`Forwarding score sangat tinggi (${fw}) +30`) }
  else if (fw >= 100) { const p = sc.forwardingScoreHigh ?? 20; score += p; reasons.push(`Forwarding score tinggi (${fw}) +${p}`) }

  const ctx = getContextInfo(rawMsg)
  if (ctx.forwardedNewsletterMessageInfo) { const p = sc.newsletter ?? 20; score += p; reasons.push(`Newsletter/broadcast +${p}`) }
  if (ctx.botMetadata || ctx.richResponseSourcesMetadata) { const p = sc.botMetadata ?? 25; score += p; reasons.push(`Bot metadata terdeteksi +${p}`) }
  if (ctx.isGroupStatus || ctx.statusSourceType)          { const p = sc.statusGroup  ?? 10; score += p; reasons.push(`Status grup +${p}`) }

  return { score, reasons, fw }
}

function _analyzeDevice(rawMsg, rawSender, senderNumber, cfg, windowMs) {
  const reasons  = []
  let   score    = 0
  const sc       = cfg.scoring  || {}
  const dvc      = cfg.deviceId || {}
  const maxDev   = dvc.maxAllowedDeviceId ?? 5

  const deviceId   = extractDeviceId(rawSender)
  const clientType = inferClientType(rawMsg, deviceId)

  if (clientType === 'baileys') {
    score += 25; reasons.push(`Client type: Baileys bot (struktur pesan / message-ID) +25`)
  }

  if (deviceId > maxDev) {
    const p = sc.deviceIdAnomaly ?? 15
    score += p; reasons.push(`Device ID tidak wajar (${deviceId} > max ${maxDev}) +${p}`)
  }

  const hist     = _trackDevice(senderNumber, deviceId, windowMs)
  const uniqDevs = new Set(hist.map(e => e.deviceId))
  if (uniqDevs.size > 1) {
    const p = sc.deviceIdChange ?? 20
    score += p; reasons.push(`Device berganti dalam window (${[...uniqDevs].join('→')}) +${p}`)
  }

  if (rawMsg?.isBaileys === true) {
    score += 25; reasons.push('rawMsg.isBaileys=true (flag eksplisit Baileys) +25')
  }

  return { score, reasons, deviceId, clientType }
}


const _msgRate    = new Map()   // senderNumber → [timestamp,...]
const _devHistory = new Map()   // senderNumber → [{deviceId,ts},...]
const _warnCD     = new Map()   // sender       → timestamp

function _trackRate(n, windowMs) {
  const now  = Date.now()
  const hist = (_msgRate.get(n) || []).filter(t => now - t < windowMs)
  hist.push(now); _msgRate.set(n, hist)
  return hist.length
}

function _trackDevice(n, deviceId, windowMs) {
  const now  = Date.now()
  const hist = (_devHistory.get(n) || []).filter(e => now - e.ts < windowMs)
  hist.push({ deviceId, ts: now }); _devHistory.set(n, hist)
  return hist
}

export function canWarn(sender, cooldownMs) {
  const last = _warnCD.get(sender), now = Date.now()
  if (!last || now - last >= cooldownMs) { _warnCD.set(sender, now); return true }
  return false
}

/**
 * Analisis pesan secara komprehensif.
 * @param {object} m       — pesan hasil serialize()
 * @param {object} sock    — Baileys socket
 * @param {object} rawMsg  — raw message (sebelum serialize)
 * @param {object} cfg     — config.security.botDetection
 * @returns {{ score, reasons, suspicious, deviceId, clientType, fw, msgType }}
 */
export function analyzeMessage(m, sock, rawMsg, cfg) {
  const sc        = cfg?.scoring  || {}
  const cd        = cfg?.cooldown || {}
  const windowMs  = cd.messageWindow        ?? 60_000
  const maxPerWin = cd.maxMessagesPerWindow  ?? 15
  const rawSender = rawMsg?.key?.participant
                 || rawMsg?.participant
                 || rawMsg?.key?.remoteJid
                 || m.sender
                 || ''

  let   score   = 0
  const reasons = []

  const add = ({ score: s, reasons: r }) => { score += s || 0; reasons.push(...(r || [])) }

  add(_analyzeId(rawMsg))
  add(_analyzeType(rawMsg))
  add(_analyzeButtons(rawMsg))
  add(_analyzeContent(rawMsg))

  const fwRes = _analyzeForwarding(rawMsg, sc)
  add(fwRes)

  const devRes = _analyzeDevice(rawMsg, rawSender, m.senderNumber, cfg, windowMs)
  add(devRes)


  if (m.type === 'protocolMessage' || m.type === 'senderKeyDistributionMessage') {
    const p = sc.protocolMessage ?? 30
    score += p; reasons.push(`Protocol/system message +${p}`)
  }

  if (m.quoted?.sender) {
    const botNum = String(sock.user?.id || '').split(':')[0].split('@')[0]
    const qNum   = String(m.quoted.sender).split(':')[0].split('@')[0]
    if (botNum && qNum && botNum === qNum) {
      const p = sc.quotedBot ?? 15
      score += p; reasons.push(`Reply ke pesan bot sendiri +${p}`)
    }
  }

  if (isSuspiciousPushName(m.pushName, cfg)) {
    const p = sc.pushNameSuspicious ?? 10
    score += p; reasons.push(`PushName mencurigakan ("${m.pushName}") +${p}`)
  }

  if (m.from && !m.from.endsWith('@g.us') && !m.from.endsWith('@s.whatsapp.net')) {
    const p = sc.unknownJid ?? 10
    score += p; reasons.push(`JID sumber tidak dikenal (${m.from}) +${p}`)
  }

  const cnt = _trackRate(m.senderNumber, windowMs)
  if (cnt > maxPerWin) {
    const p = Math.min(30, 10 + (cnt - maxPerWin) * 2)
    score += p; reasons.push(`Rate tinggi (${cnt}/${maxPerWin} per menit) +${p}`)
  }

  return {
    score,
    reasons,
    suspicious:  score >= (cfg?.thresholds?.warn ?? 20),
    deviceId:    devRes.deviceId,
    clientType:  devRes.clientType,
    fw:          fwRes.fw,
    msgType:     Object.keys(rawMsg?.message || {})[0] || '',
  }
}

export function logSecurity(entry) {
  try {
    const dir = path.dirname(LOG_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8')
  } catch {}
}
