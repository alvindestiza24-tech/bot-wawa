// src/serialize.js
import config from '../config.js'
import { _mQuoted, _mCtx } from './lib/ctx.js'
import { resolveAnyLidToJid, normalizeToPhoneNumber, extractNumber } from './lib/lid.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

const MSG_TYPES = [
  'conversation',
  'extendedTextMessage',
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'documentMessage',
  'stickerMessage',
  'contactMessage',
  'contactsArrayMessage',
  'locationMessage',
  'liveLocationMessage',
  'reactionMessage',
  'buttonsResponseMessage',
  'listResponseMessage',
  'templateButtonReplyMessage',
  'viewOnceMessage',
  'viewOnceMessageV2',
  'ephemeralMessage',
  'documentWithCaptionMessage',
  'interactiveResponseMessage',
  'pollCreationMessage',
  'pollUpdateMessage',
]

const MEDIA_TYPES = new Set([
  'imageMessage', 'videoMessage', 'audioMessage',
  'stickerMessage', 'documentMessage'
])

function getType(message) {
  if (!message) return ''
  for (const t of MSG_TYPES) {
    if (message[t]) return t
  }
  return Object.keys(message)[0] || ''
}

function unwrap(message) {
  if (!message) return { type: '', content: null }

  let type = getType(message)
  let content = message[type]

  if (type === 'ephemeralMessage') {
    const inner = content?.message
    if (inner) { type = getType(inner); content = inner[type] }
  }

  if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
    const inner = content?.message
    if (inner) { type = getType(inner); content = inner[type] }
  }

  if (type === 'documentWithCaptionMessage') {
    const inner = content?.message
    if (inner) { type = getType(inner); content = inner[type] }
  }

  return { type, content }
}

function extractBody(type, content, message) {
  if (type === 'conversation') return message.conversation || ''
  if (type === 'extendedTextMessage') return content?.text || ''
  if (type === 'imageMessage') return content?.caption || ''
  if (type === 'videoMessage') return content?.caption || ''
  if (type === 'documentMessage') return content?.caption || ''
  if (type === 'buttonsResponseMessage')
    return content?.selectedButtonId || content?.selectedDisplayText || ''
  if (type === 'listResponseMessage')
    return content?.singleSelectReply?.selectedRowId || ''
  if (type === 'templateButtonReplyMessage') return content?.selectedId || ''
  if (type === 'interactiveResponseMessage') {
    try {
      const params = JSON.parse(content?.nativeFlowResponseMessage?.paramsJson || '{}')
      return params.id || ''
    } catch {
      return ''
    }
  }
  if (type === 'pollCreationMessage') return content?.name || ''
  if (type === 'reactionMessage') return content?.text || ''
  return ''
}

function enrichMediaInfo(target, type, content) {
  target.isMedia = MEDIA_TYPES.has(type)
  target.isImage = type === 'imageMessage'
  target.isVideo = type === 'videoMessage'
  target.isAudio = type === 'audioMessage'
  target.isSticker = type === 'stickerMessage'
  target.isDocument = type === 'documentMessage'
  target.isContact = type === 'contactMessage' || type === 'contactsArrayMessage'
  target.isLocation = type === 'locationMessage' || type === 'liveLocationMessage'
  target.isReaction = type === 'reactionMessage'
  target.isPoll = type === 'pollCreationMessage' || type === 'pollUpdateMessage'
  target.isViewOnce = type === 'viewOnceMessage' || type === 'viewOnceMessageV2'

  if (MEDIA_TYPES.has(type) && content) {
    target.mimetype = content?.mimetype || ''
    target.fileName = content?.fileName || content?.title || ''
    target.fileLength = content?.fileLength || 0
    target.seconds = content?.seconds || 0
    target.ptt = content?.ptt || false
    target.isAnimated = content?.isAnimated || false
  }
}

export function serialize(msg, sock) {
  if (!msg?.key) return null

  const m = {}

  // --- Identitas Dasar ---
  m.raw = msg
  m.key = msg.key
  m.id = msg.key.id
  m.from = msg.key.remoteJid
  m.fromMe = msg.key.fromMe || false
  m.isGroup = m.from?.endsWith('@g.us') || false
  m.chat = m.from
  m.timestamp =
    typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp * 1000
      : Date.now()

  // --- Pengirim ---
  const participant = msg.key.participant || msg.participant || ''
  let sender = m.fromMe
    ? sock.user?.id || ''
    : m.isGroup
    ? participant
    : m.from || ''

  sender = sender.split(':')[0]
  if (sender && !sender.includes('@')) sender += '@s.whatsapp.net'

  const realSender = resolveAnyLidToJid(sender)
  m.sender = realSender
  m.senderNumber = normalizeToPhoneNumber(realSender) || extractNumber(realSender)
  m.pushName = msg.pushName || ''

  const message = msg.message

  // --- Jika Pesan Kosong (notifikasi, dll.) ---
  if (!message) {
    m.type = ''
    m.body = ''
    m.text = ''
    m.isCommand = false
    m.command = ''
    m.args = []
    m.prefix = ''
    m.mentionedJid = []
    m.quoted = null
    m.isQuoted = false
    m.name = m.pushName || ''

    enrichMediaInfo(m, '', null)
    attachMethods(m, msg, sock, null, null)
    return m
  }

  // --- Unwrap & Type ---
  const { type, content } = unwrap(message)
  m.type = type
  m.body = String(extractBody(type, content, message) ?? '')
  m.text = m.body  // alias

  // --- Info Media ---
  enrichMediaInfo(m, type, content)

  // --- Command Parsing ---
  const prefixList = Array.isArray(config.command?.prefix)
    ? config.command.prefix
    : [config.command?.prefix || '.']

  let usedPrefix = ''
  let isCommand = false
  for (const p of prefixList) {
    if (m.body.startsWith(p)) {
      usedPrefix = p
      isCommand = true
      break
    }
  }

  m.prefix    = usedPrefix
  m.isCommand = isCommand

  const withoutPrefix = isCommand ? m.body.slice(usedPrefix.length) : m.body
  const parts         = withoutPrefix.trim().split(/\s+/)
  m.command = isCommand ? (parts[0] || '').toLowerCase() : ''
  m.args    = isCommand ? parts.slice(1) : []
  m.text    = isCommand ? parts.slice(1).join(' ') : m.body   // perbarui text

  const rawParts    = m.body.trim().split(/\s+/)
  m.rawCommand      = (rawParts[0] || '').toLowerCase()
  m.rawArgs         = rawParts.slice(1)
  m.rawText         = rawParts.slice(1).join(' ')

  m.mentionedJid = content?.contextInfo?.mentionedJid || []

  // --- Context Info Tambahan ---
  const ctx = content?.contextInfo || message?.messageContextInfo || {}
  m.expiration = ctx.expiration || 0
  m.ephemeralDuration = ctx.ephemeralSettingTimestamp || 0
  m.disappearingMode = ctx.disappearingMode || null
  m.category = msg.category || undefined

  // --- Quoted Message ---
  const quotedMsg = content?.contextInfo?.quotedMessage
  const quotedParticipant = content?.contextInfo?.participant || ''
  m.quoted = null
  m.isQuoted = false

  if (quotedMsg) {
    const { type: qType, content: qContent } = unwrap(quotedMsg)
    const qBody =
      qContent?.text ||
      qContent?.caption ||
      quotedMsg?.conversation ||
      ''
    let qSender = quotedParticipant.split(':')[0]
    if (qSender && !qSender.includes('@')) qSender += '@s.whatsapp.net'

    const qRealSender = resolveAnyLidToJid(qSender)

    const quoted = {
      type: qType,
      body: qBody,
      text: qBody,          // alias
      sender: qRealSender,
      senderNumber: normalizeToPhoneNumber(qRealSender) || extractNumber(qRealSender),
      name: msg.pushName || '',  // nama quoted biasanya dari pushName
      key: {
        id: content?.contextInfo?.stanzaId,
        remoteJid: m.from,
        fromMe: false,
        participant: quotedParticipant,
      },
      message: quotedMsg,
      isQuoted: true,
      download: async () => {
        const { type: innerType, content: innerContent } = unwrap(quotedMsg)
        if (!innerContent) throw new Error('No media')
        return downloadContentFromMessage(innerContent, innerType)
      },
    }

    // Enrich quoted media info
    enrichMediaInfo(quoted, qType, qContent)

    m.quoted = quoted
    m.isQuoted = true
  }

  // --- Nama ---
  m.name = m.pushName || m.senderNumber

  // --- Method Bantuan ---
  attachMethods(m, msg, sock, type, content)

  // --- Properti Tambahan (seperti di contoh) ---
  m.exp = 0
  m.limit = false

  return m
}

function attachMethods(m, msg, sock, type, content) {
  // Reply dasar
  m.reply = (text, opts = {}) => {
    const { mentions, ...rest } = opts
    const content = typeof text === 'string' ? { text } : { ...text }
    if (mentions) content.mentions = mentions
    return sock.sendMessage(m.chat, content, { quoted: msg, ...rest })
  }

  // Fake reply
  m.fakeReply = (text, opts = {}) => {
    const { mentions, ...rest } = opts
    const content = typeof text === 'string' ? { text } : { ...text }
    if (mentions) content.mentions = mentions
    return sock.sendMessage(
      m.chat,
      { ...content, contextInfo: _mCtx(m.sender) },
      { quoted: _mQuoted(), ...rest }
    )
  }

  // React
  m.react = (emoji) =>
    sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } })

  // Download
  m.download = async () => {
    if (!m.isMedia) throw new Error('Not a media message')
    return downloadContentFromMessage(content, type)
  }

  // Shortcut media replies
  m.replyImage = async (img, caption = '', opts = {}) =>
    sock.sendMessage(m.chat, { image: img, caption, ...opts }, { quoted: msg })
  m.replyVideo = async (vid, caption = '', opts = {}) =>
    sock.sendMessage(m.chat, { video: vid, caption, ...opts }, { quoted: msg })
  m.replyAudio = async (aud, ptt = false, opts = {}) =>
    sock.sendMessage(m.chat, { audio: aud, ptt, ...opts }, { quoted: msg })
  m.replySticker = async (stk, opts = {}) =>
    sock.sendMessage(m.chat, { sticker: stk, ...opts }, { quoted: msg })
  m.replyDocument = async (doc, fileName, mimetype = 'application/octet-stream', opts = {}) =>
    sock.sendMessage(m.chat, { document: doc, fileName, mimetype, ...opts }, { quoted: msg })
  m.replyContact = async (number, name, opts = {}) => {
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`
    return sock.sendMessage(m.chat, { contacts: { displayName: name, contacts: [{ vcard }] } }, { quoted: msg })
  }
  m.replyLocation = async (lat, lon, opts = {}) =>
    sock.sendMessage(m.chat, { location: { degreesLatitude: lat, degreesLongitude: lon, ...opts } }, { quoted: msg })

  // Advanced
  m.copy = (jid) => sock.sendMessage(jid, { ...msg.message }, {})
  m.forward = (jid) => sock.sendMessage(jid, { forward: msg.key, force: true })
  m.copyNForward = (jid) => sock.sendMessage(jid, { ...msg.message, contextInfo: { isForwarded: true, forwardingScore: 999 } })
  m.delete = () => sock.sendMessage(m.chat, { delete: msg.key })

  m.cMod = () => {} // dummy, bisa diimplementasikan nanti
}