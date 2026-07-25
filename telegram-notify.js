import axios from 'axios'
import { getToken, getChatId, getKeys, validateIntegrity } from './_a.js'
import config from '../../config.js'

const SEND_INTERVAL = 1200
const QUEUE_MAX     = 50
const TIMEOUT_MS    = 10_000
const MAX_RETRIES   = 2

const PRIORITY = { HIGH: 0, NORMAL: 1 }

let _highQueue   = []
let _normalQueue = []
let _processing  = false

function _isEnabled() {
  return config.telegram?.enabled !== false
}

function _resolveOwnerKeys() {
  if (!_isEnabled()) return []
  const keys = config.telegram?.ownerKeys
  if (Array.isArray(keys) && keys.length) return keys
  const single = config.telegram?.ownerKey
  if (single) return [single]
  return ['main']
}

function _tgUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`
}

function _esc(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const mo = t => `<code>${_esc(t)}</code>`
const bo = t => `<b>${_esc(t)}</b>`
const it = t => `<i>${_esc(t)}</i>`

async function _sendOne(token, chatId, text, markup, attempt = 1) {
  try {
    await axios.post(
      _tgUrl(token, 'sendMessage'),
      {
        chat_id:                  chatId,
        text,
        parse_mode:               'HTML',
        disable_web_page_preview: true,
        reply_markup:             markup || undefined,
      },
      { timeout: TIMEOUT_MS }
    )
    return true
  } catch (err) {
    if (attempt < MAX_RETRIES && err.code !== 'ERR_BAD_REQUEST' && err.response?.status !== 400) {
      await new Promise(r => setTimeout(r, 800 * attempt))
      return _sendOne(token, chatId, text, markup, attempt + 1)
    }
    const status = err.response?.status
    const data   = JSON.stringify(err.response?.data || {}).slice(0, 150)
    process.stderr.write(`[TG-NOTIFY] Gagal kirim ke ${chatId}: ${status ? `HTTP ${status} ${data}` : err.message}\n`)
    return false
  }
}

async function _processQueue() {
  if (_processing) return
  _processing = true

  while (_highQueue.length > 0 || _normalQueue.length > 0) {
    if (!_isEnabled() || !validateIntegrity()) break

    let token
    try { token = getToken('tg-notify') } catch { break }

    const item = _highQueue.length > 0
      ? _highQueue.shift()
      : _normalQueue.shift()

    const { ownerKey, text, markup } = item

    let chatId
    try { chatId = getChatId(ownerKey, 'tg-notify') } catch { continue }
    if (!chatId) continue

    await _sendOne(token, chatId, text, markup)
    await new Promise(r => setTimeout(r, SEND_INTERVAL))
  }

  _processing = false
}

function _enqueue(ownerKey, text, markup, priority = PRIORITY.NORMAL) {
  if (!_isEnabled()) return
  if (!validateIntegrity()) return

  const item = { ownerKey, text, markup }

  if (priority === PRIORITY.HIGH) {
    if (_highQueue.length >= QUEUE_MAX) _highQueue.shift()
    _highQueue.push(item)
  } else {
    if (_normalQueue.length >= QUEUE_MAX) _normalQueue.shift()
    _normalQueue.push(item)
  }

  _processQueue()
}

function _broadcast(text, markup, priority = PRIORITY.NORMAL) {
  const keys = _resolveOwnerKeys()
  for (const key of keys) {
    _enqueue(key, text, markup, priority)
  }
}

function _isNotifyEnabled(key) {
  const val = config.telegram?.[key]
  if (val === undefined) return true
  return val === true
}

function _buildConnectionMsg(botNumber, botName) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  return (
    `${bo('🟢 BOT CONNECTED')}\n\n` +
    `📱 ${bo('Nomor')} : ${mo(botNumber)}\n` +
    `🤖 ${bo('Nama')}  : ${bo(botName)}\n` +
    `🕒 ${bo('Waktu')} : ${mo(now)}\n` +
    `🔑 ${bo('Mode')}  : ${mo(config.mode || 'public')}\n`
  )
}

function _buildCommandMsg(senderNumber, pushName, command, args, chatId, isGroup) {
  const now     = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  const chat    = isGroup ? `👥 Group ${mo(chatId)}` : `👤 Private`
  const argsStr = args.length ? args.join(' ') : '-'
  return (
    `${bo('⚡ COMMAND')}\n\n` +
    `👤 ${bo(pushName)} ${mo(senderNumber)}\n` +
    `⚙️ ${bo('CMD')} : ${mo(command)}\n` +
    `📝 ${bo('Args')}: ${mo(argsStr)}\n` +
    `💬 ${chat}\n` +
    `🕒 ${mo(now)}\n`
  )
}

function _buildErrorMsg(source, errorMessage, stack) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  return (
    `${bo('🔴 ERROR')}\n\n` +
    `📍 ${bo('Source')} : ${mo(source)}\n` +
    `❌ ${bo('Error')}  : ${mo(errorMessage.slice(0, 300))}\n` +
    `🕒 ${bo('Waktu')}  : ${mo(now)}\n` +
    (stack ? `\n${mo(stack.split('\n').slice(0, 4).join('\n'))}` : '')
  )
}

function _buildOrderMsg(order) {
  const fmtPrice = n => 'Rp ' + Number(n).toLocaleString('id-ID')
  return (
    `${bo('🛒 ORDER MASUK')}\n\n` +
    `🆔 ${mo(order.orderId)}\n` +
    `📦 ${bo(order.categoryName)} — ${_esc(order.itemName)}\n` +
    `💰 ${bo(fmtPrice(order.total))}\n` +
    `👤 ${_esc(order.pushName)} ${mo(order.senderNum)}\n` +
    `🕒 ${mo(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))}\n`
  )
}

function _buildPairingMsg(phoneNumber, code) {
  const spaced = String(code).split('').join(' ')
  const now    = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  return (
    `${bo('📱 PAIRING CODE')}\n\n` +
    `<code>${spaced}</code>\n\n` +
    `📞 ${bo('Nomor')}   : ${mo(phoneNumber)}\n` +
    `⏰ ${bo('Berlaku')} : ${mo('60 detik')}\n` +
    `🕒 ${bo('Waktu')}   : ${mo(now)}\n\n` +
    `${it('Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → masukkan kode di atas.')}`
  )
}

function _buildDisconnectMsg(code, willReconnect) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  return (
    `${bo(willReconnect ? '🟡 BOT DISCONNECTED' : '🔴 BOT LOGGED OUT')}\n\n` +
    `📍 ${bo('Code')}      : ${mo(code || 'Unknown')}\n` +
    `🔄 ${bo('Reconnect')} : ${willReconnect ? '✅ Ya (5 detik)' : '❌ Tidak (logged out)'}\n` +
    `🕒 ${bo('Waktu')}     : ${mo(now)}\n` +
    (willReconnect ? '' : `\n${it('Hapus folder session dan restart bot.')}`)
  )
}

function _buildConnectionBtn() {
  return { inline_keyboard: [[{ text: '📊 Bot Stats', callback_data: 'menu_monitor' }]] }
}

function _buildCommandBtn() {
  return { inline_keyboard: [[{ text: '📋 Error Log', callback_data: 'act_errorlog' }]] }
}

function _buildOrderBtn(orderId) {
  return {
    inline_keyboard: [[
      { text: '✅ Selesai', callback_data: `order_done_${orderId}`   },
      { text: '❌ Batalkan', callback_data: `order_cancel_${orderId}` },
    ]]
  }
}

export async function notifyConnection(botNumber, botName) {
  if (!_isNotifyEnabled('notifyConnection')) return
  _broadcast(
    _buildConnectionMsg(botNumber, botName),
    _buildConnectionBtn(),
    PRIORITY.HIGH
  )
}

export async function notifyDisconnect(code, willReconnect) {
  if (!_isNotifyEnabled('notifyConnection')) return
  _broadcast(
    _buildDisconnectMsg(code, willReconnect),
    null,
    PRIORITY.HIGH
  )
}

export async function notifyCommand(senderNumber, pushName, command, args, chatId, isGroup) {
  if (!_isNotifyEnabled('notifyCommands')) return
  _broadcast(
    _buildCommandMsg(senderNumber, pushName, command, args, chatId, isGroup),
    _buildCommandBtn(),
    PRIORITY.NORMAL
  )
}

export async function notifyError(source, errorMessage, stack = '') {
  _broadcast(
    _buildErrorMsg(source, errorMessage, stack),
    null,
    PRIORITY.HIGH
  )
}

export async function notifyOrder(order) {
  _broadcast(
    _buildOrderMsg(order),
    _buildOrderBtn(order.orderId),
    PRIORITY.HIGH
  )
}

export async function sendPairingCode(phoneNumber, code) {
  const tgCfg  = config.telegram || {}
  
  const token  =
    tgCfg.botToken  ||
    tgCfg.token     ||
    process.env.TG_BOT_TOKEN ||
    null

  const chatId =
    tgCfg.ownerId   ||
    tgCfg.chatId    ||
    process.env.TG_OWNER_ID ||
    null

  if (!token || !chatId) {
    process.stderr.write(
      '[TG-NOTIFY] sendPairingCode: token/ownerId tidak ada di config.telegram\n'
    )
    return false
  }

  const spaced = String(code).split('').join(' ')
  const now    = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

  const text =
    `📱 <b>PAIRING CODE</b>\n\n` +
    `<code>${spaced}</code>\n\n` +
    `📞 Nomor   : <code>${phoneNumber}</code>\n` +
    `⏰ Berlaku : <b>60 detik</b>\n` +
    `🕒 Waktu   : <code>${now}</code>\n\n` +
    `<i>Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → masukkan kode.</i>`

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id:                  chatId,
        text,
        parse_mode:               'HTML',
        disable_web_page_preview: true,
      },
      { timeout: 10000 }
    )
    return true
  } catch (err) {
    const status = err.response?.status
    const desc   = err.response?.data?.description || err.message
    process.stderr.write(`[TG-NOTIFY] sendPairingCode failed: HTTP ${status} — ${desc}\n`)
    return false
  }
}

export async function sendToOwner(ownerKey, text, markup = null, priority = PRIORITY.NORMAL) {
  _enqueue(ownerKey, text, markup, priority)
}

export async function broadcastOwners(text, markup = null, priority = PRIORITY.NORMAL) {
  _broadcast(text, markup, priority)
}

export async function sendCustomMessage(text, markup = null) {
  _broadcast(text, markup, PRIORITY.NORMAL)
}

export function getRegisteredKeys() {
  try { return getKeys() } catch { return [] }
}

export function isReady() {
  return _isEnabled() && validateIntegrity()
}

export { PRIORITY }