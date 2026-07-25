import { createHash, createHmac } from 'crypto'

const _K1  = 'k9mQ!zR2#pL7@nW4'
const _K2  = 'x3Tp$vF8%cJ1&bM6'
const _R   = 83
const _VER = '2.0'

function _xor(buf, key) {
  return Buffer.from(buf).map((b, i) => b ^ key.charCodeAt(i % key.length))
}

function _rot(buf, n) {
  return Buffer.from(buf).map(b => ((b + n) % 256 + 256) % 256)
}

function _enc(plain) {
  let b = Buffer.from(String(plain), 'utf-8')
  b = _xor(b, _K1)
  b = _rot(b, _R)
  b = _xor(b, _K2)
  return b.toString('base64url')
}

function _dec(encoded) {
  if (!encoded || typeof encoded !== 'string') return null
  try {
    let b = Buffer.from(encoded, 'base64url')
    b = _xor(b, _K2)
    b = _rot(b, 256 - _R)
    b = _xor(b, _K1)
    return b.toString('utf-8')
  } catch { return null }
}

let _configRef   = null
let _fingerprint = null
let _initialized = false

function _normalizeConfig(cfg) {
  if (!cfg) return null

  const token =
    cfg.token     ||
    cfg.botToken  ||
    cfg.bot_token ||
    process.env.TG_BOT_TOKEN ||
    null

  const mainId =
    cfg.chatIds?.main ||
    cfg.ownerId       ||
    cfg.chatId        ||
    cfg.owner_id      ||
    process.env.TG_OWNER_ID ||
    null

  const chatIds = {
    main:   mainId,
    backup: cfg.chatIds?.backup || cfg.backupChatId || mainId,
    dev:    cfg.chatIds?.dev    || cfg.devChatId    || mainId,
    ...( cfg.chatIds || {} ),
  }

  return { token, chatIds }
}

function _buildFingerprint(normalized) {
  if (!normalized) return 'empty'
  const keys     = Object.keys(normalized.chatIds || {}).sort().join('|')
  const hasToken = normalized.token ? '1' : '0'
  return createHash('sha256')
    .update(`${_VER}:${keys}:${hasToken}`)
    .digest('hex')
    .slice(0, 24)
}

function _verify() {
  if (!_initialized || !_configRef || !_fingerprint) {
    throw new Error('[_a] not initialized — call initVault() first')
  }
  const normalized = _normalizeConfig(_configRef)
  const current    = _buildFingerprint(normalized)
  if (current !== _fingerprint) {
    throw new Error('[_a] integrity violation — config was tampered')
  }
}

const _rlMap  = new Map()
const _RL_MAX = 120
const _RL_WIN = 60_000

function _rateLimit(caller) {
  const now   = Date.now()
  const entry = _rlMap.get(caller) || { n: 0, reset: now + _RL_WIN }
  if (now > entry.reset) { entry.n = 0; entry.reset = now + _RL_WIN }
  entry.n++
  _rlMap.set(caller, entry)
  if (entry.n > _RL_MAX) throw new Error(`[_a] rate limit exceeded: ${caller}`)
}

const _accessLog = []
const _LOG_MAX   = 200

function _log(caller, action, ok, note = '') {
  if (_accessLog.length >= _LOG_MAX) _accessLog.shift()
  _accessLog.push({ ts: Date.now(), caller, action, ok, note })
}

function _resolve() {
  const normalized = _normalizeConfig(_configRef)
  if (!normalized) return null

  const token  = normalized.token?.startsWith('__enc:')
    ? _dec(normalized.token.slice(6))
    : normalized.token

  const chatIds = {}
  for (const [k, v] of Object.entries(normalized.chatIds || {})) {
    if (!v) continue
    chatIds[k] = v.startsWith?.('__enc:') ? _dec(v.slice(6)) : v
  }

  return { token, chatIds }
}

export function initVault(telegramConfig) {
  if (!telegramConfig) {
    throw new Error('[_a] telegramConfig is required')
  }

  const normalized = _normalizeConfig(telegramConfig)

  if (!normalized?.token) {
    throw new Error(
      '[_a] token tidak ditemukan di config.telegram\n' +
      '     Pastikan ada: config.telegram.botToken atau config.telegram.token'
    )
  }

  if (!normalized?.chatIds?.main) {
    throw new Error(
      '[_a] chatId tidak ditemukan di config.telegram\n' +
      '     Pastikan ada: config.telegram.ownerId atau config.telegram.chatId'
    )
  }

  _configRef   = telegramConfig
  _fingerprint = _buildFingerprint(normalized)
  _initialized = true

  _log('system', 'initVault', true, `keys: ${Object.keys(normalized.chatIds).join(', ')}`)

  return {
    success: true,
    keys:    Object.keys(normalized.chatIds),
    hasToken: !!normalized.token,
  }
}

export function getToken(caller = 'system') {
  _rateLimit(caller)
  try {
    _verify()
    const data = _resolve()
    if (!data?.token) {
      _log(caller, 'getToken', false, 'token null')
      throw new Error('[_a] token tidak ditemukan')
    }
    _log(caller, 'getToken', true)
    return data.token
  } catch (err) {
    _log(caller, 'getToken', false, err.message)
    throw err
  }
}

export function getChatId(key = 'main', caller = 'system') {
  _rateLimit(caller)
  try {
    _verify()
    const data = _resolve()
    const id   = data?.chatIds?.[key] ?? null
    _log(caller, `getChatId:${key}`, !!id)
    return id
  } catch (err) {
    _log(caller, `getChatId:${key}`, false, err.message)
    throw err
  }
}

export function getKeys() {
  _verify()
  const data = _resolve()
  return Object.keys(data?.chatIds || {})
}

export function validateIntegrity() {
  try { _verify(); return true } catch { return false }
}

export function isInitialized() {
  return _initialized
}

export function getVersion() {
  return _VER
}

export function encodeValue(plain) {
  return '__enc:' + _enc(plain)
}

export function decodeValue(encoded) {
  if (!encoded) return null
  if (typeof encoded === 'string' && encoded.startsWith('__enc:')) {
    return _dec(encoded.slice(6))
  }
  return encoded
}

export function getAccessLog(last = 20) {
  return _accessLog.slice(-last)
}

export function signData(data) {
  const key = Buffer.from(_K1 + _K2)
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  return createHmac('sha256', key).update(str).digest('hex')
}

export function verifySignature(data, sig) {
  return signData(data) === sig
}