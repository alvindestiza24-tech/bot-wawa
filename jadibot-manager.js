import fs   from 'fs'
import path  from 'path'
import pino  from 'pino'
import { fileURLToPath } from 'url'
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} from '@kyyinfinite/baileys'
import { messageHandler }      from '../handler.js'
import { handleAntiTagSW }     from '../../plugins/group/antitagsw.js'
import { cacheParticipantLids } from './lid.js'
import logger                   from './logger.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR   = path.resolve(__dirname, '..', '..')   // src/lib → src → project root
const JADIBOT_DIR = path.join(ROOT_DIR, 'jadibot')
const MAX_SLOTS  = 5
const INFO_FILE  = 'info.json'

const _slots    = new Map()
const _pending  = new Map()
const PENDING_TTL = 2 * 60 * 1000

const loggerBaileys = pino({ level: 'silent' })

function slotPath(slotId)    { return path.join(JADIBOT_DIR, slotId) }
function sessionPath(slotId) { return path.join(slotPath(slotId), 'session') }
function infoPath(slotId)    { return path.join(slotPath(slotId), INFO_FILE) }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeInfo(slotId, data) {
  ensureDir(slotPath(slotId))
  fs.writeFileSync(infoPath(slotId), JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2))
}

function readInfo(slotId) {
  try { return JSON.parse(fs.readFileSync(infoPath(slotId), 'utf-8')) } catch { return null }
}

function getFreeSlot() {
  for (let i = 1; i <= MAX_SLOTS; i++) {
    const id = `slot${i}`
    if (!_slots.has(id)) return id
  }
  return null
}

function getSlotByOwner(ownerId) {
  for (const [id, slot] of _slots.entries()) {
    if (slot.ownerId === ownerId) return { slotId: id, ...slot }
  }
  return null
}

function getSlotByNum(num) {
  for (const [id, slot] of _slots.entries()) {
    if (slot.num === num) return { slotId: id, ...slot }
  }
  return null
}

async function startSlotConnection(slotId, info, mainSock) {
  const sesPath = sessionPath(slotId)
  ensureDir(sesPath)

  const { state, saveCreds } = await useMultiFileAuthState(sesPath)
  const { version }          = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: loggerBaileys,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, loggerBaileys),
    },
    browser:                      Browsers.ubuntu('Chrome'),
    printQRInTerminal:            false,
    syncFullHistory:              false,
    generateHighQualityLinkPreview: true,
  })

  const slotData = {
    sock,
    num:       info.num,
    ownerId:   info.ownerId,
    ownerJid:  info.ownerJid,
    startedAt: info.startedAt || new Date().toISOString(),
    status:    'connecting',
    reconnectCount: 0,
  }

  _slots.set(slotId, slotData)
  writeInfo(slotId, { slotId, ...slotData, sock: undefined })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'open') {
      const botNum  = (sock.user?.id || '').split(':')[0].split('@')[0]
      const botName = sock.user?.name || 'Unknown'

      slotData.num    = botNum
      slotData.status = 'active'
      slotData.reconnectCount = 0
      _slots.set(slotId, slotData)
      writeInfo(slotId, { slotId, num: botNum, ownerId: info.ownerId, ownerJid: info.ownerJid, startedAt: slotData.startedAt, status: 'active' })

      logger.success('JADIBOT', `${slotId} aktif — ${botName} (${botNum})`)

      if (mainSock && info.ownerJid) {
        mainSock.sendMessage(info.ownerJid, {
          text: `✅ *JadiBot Aktif!*\n\n🤖 Slot: *${slotId}*\n📱 Nomor: *+${botNum}*\n⏰ Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\nBot kamu sekarang aktif dan siap menerima pesan!`,
        }).catch(() => {})
      }
    }

    if (connection === 'close') {
      const code            = lastDisconnect?.error?.output?.statusCode
      const isLoggedOut     = code === DisconnectReason.loggedOut
      const currentData     = _slots.get(slotId)

      if (isLoggedOut) {
        logger.warn('JADIBOT', `${slotId} logged out — menghapus slot`)
        await removeSlot(slotId, mainSock, 'Sesi berakhir (logged out)')
        return
      }

      if (currentData) {
        currentData.status = 'reconnecting'
        currentData.reconnectCount = (currentData.reconnectCount || 0) + 1
        _slots.set(slotId, currentData)
      }

      logger.warn('JADIBOT', `${slotId} terputus — reconnect dalam 5 detik (percobaan #${currentData?.reconnectCount || 1})`)
      setTimeout(() => {
        if (_slots.has(slotId)) {
          startSlotConnection(slotId, readInfo(slotId) || info, mainSock).catch(() => {})
        }
      }, 5000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (!msg.message) continue
      try {
        const allKeys = Object.keys(msg.message || {})
        const msgType = allKeys[0]
        const isStatusMention =
          allKeys.includes('groupStatusMentionMessage') ||
          allKeys.includes('groupStatusMessage')        ||
          allKeys.includes('groupStatusMessageV2')      ||
          allKeys.includes('statusMentionMessage')      ||
          allKeys.includes('groupMentionedMessage')     ||
          msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0

        if (isStatusMention && msg.key?.remoteJid?.endsWith('@g.us')) {
          const handled = await handleAntiTagSW(msg, sock)
          if (handled) continue
        }

        await messageHandler(msg, sock)
      } catch (err) {
        logger.error('JADIBOT', `${slotId} handler error: ${err.message}`)
      }
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    try {
      const { handleGroupParticipantsUpdate } = await import('../group-events.js')
      await handleGroupParticipantsUpdate(sock, update)
    } catch {}
    try {
      const meta = await sock.groupMetadata(update.id).catch(() => null)
      if (meta?.participants?.length) cacheParticipantLids(meta.participants)
    } catch {}
  })

  sock.ev.on('groups.update', async (updates) => {
    try {
      for (const u of updates) {
        if (!u.id) continue
        const meta = await sock.groupMetadata(u.id).catch(() => null)
        if (meta?.participants?.length) cacheParticipantLids(meta.participants)
      }
    } catch {}
  })

  if (!state.creds.registered) {
    // Tunggu QR event muncul (pertanda socket siap untuk pairing code)
    // Timeout 30 detik agar tidak hang selamanya
    await Promise.race([
      sock.waitForConnectionUpdate(u => !!u.qr).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 30_000)),
    ])

    let code
    try {
      code = await sock.requestPairingCode(info.num, 'KYYINFIT')
    } catch {
      try {
        code = await sock.requestPairingCode(info.num)
      } catch (err2) {
        logger.error('JADIBOT', `${slotId} gagal request pairing code: ${err2.message}`)
        throw err2
      }
    }

    if (!code) throw new Error('Pairing code tidak dikembalikan oleh server')

    logger.info('JADIBOT', `${slotId} pairing code: ${code}`)
    return { sock, pairingCode: code }
  }

  return { sock, pairingCode: null }
}

export async function createSlot(ownerId, ownerJid, num, mainSock) {
  if (getSlotByOwner(ownerId)) {
    return { success: false, message: 'Kamu sudah memiliki slot bot aktif. Gunakan *.stopjadibot* untuk menghentikannya.' }
  }

  if (getSlotByNum(num)) {
    return { success: false, message: `Nomor +${num} sudah digunakan di slot lain.` }
  }

  const slotId = getFreeSlot()
  if (!slotId) {
    return { success: false, message: `Semua ${MAX_SLOTS} slot sudah penuh. Coba lagi nanti.` }
  }

  const info = {
    slotId,
    num,
    ownerId,
    ownerJid,
    startedAt: new Date().toISOString(),
    status:    'connecting',
  }

  ensureDir(sessionPath(slotId))
  writeInfo(slotId, info)

  try {
    const result = await startSlotConnection(slotId, info, mainSock)
    return { success: true, slotId, pairingCode: result.pairingCode }
  } catch (err) {
    _slots.delete(slotId)
    try { fs.rmSync(slotPath(slotId), { recursive: true, force: true }) } catch {}
    return { success: false, message: `Gagal membuat koneksi: ${err.message}` }
  }
}

export async function removeSlot(slotId, mainSock = null, reason = 'Dihentikan') {
  const slot = _slots.get(slotId)
  if (!slot) return { success: false, message: `Slot ${slotId} tidak ditemukan` }

  try { slot.sock?.end() } catch {}
  _slots.delete(slotId)

  try { fs.rmSync(slotPath(slotId), { recursive: true, force: true }) } catch {}

  logger.warn('JADIBOT', `${slotId} dihapus — ${reason}`)

  if (mainSock && slot.ownerJid) {
    mainSock.sendMessage(slot.ownerJid, {
      text: `⚠️ *JadiBot Dihentikan*\n\n🤖 Slot: *${slotId}*\n📱 Nomor: *+${slot.num}*\n📝 Alasan: ${reason}`,
    }).catch(() => {})
  }

  return { success: true, message: `Slot ${slotId} berhasil dihentikan` }
}

export async function removeSlotByOwner(ownerId, mainSock = null) {
  const slot = getSlotByOwner(ownerId)
  if (!slot) return { success: false, message: 'Kamu tidak memiliki slot bot aktif.' }
  return removeSlot(slot.slotId, mainSock, 'Dihentikan oleh pemilik')
}

export function listSlots() {
  const result = []
  for (const [slotId, slot] of _slots.entries()) {
    result.push({
      slotId,
      num:       slot.num,
      ownerId:   slot.ownerId,
      status:    slot.status,
      startedAt: slot.startedAt,
      reconnectCount: slot.reconnectCount || 0,
    })
  }
  return result
}

export function getSlot(slotId) { return _slots.get(slotId) || null }
export function getSlotCount()  { return _slots.size }
export function getMaxSlots()   { return MAX_SLOTS }
export function hasSlotByOwner(ownerId) { return !!getSlotByOwner(ownerId) }

export function setPending(ownerId, data) {
  clearTimeout(_pending.get(ownerId)?.timer)
  const timer = setTimeout(() => _pending.delete(ownerId), PENDING_TTL)
  _pending.set(ownerId, { ...data, timer, ts: Date.now() })
}

export function getPending(ownerId) {
  const p = _pending.get(ownerId)
  if (!p) return null
  if (Date.now() - p.ts > PENDING_TTL) { clearTimeout(p.timer); _pending.delete(ownerId); return null }
  return p
}

export function clearPending(ownerId) {
  const p = _pending.get(ownerId)
  if (p?.timer) clearTimeout(p.timer)
  _pending.delete(ownerId)
}

export async function initJadibotDirs() {
  ensureDir(JADIBOT_DIR)
  for (let i = 1; i <= MAX_SLOTS; i++) {
    ensureDir(slotPath(`slot${i}`))
  }
  logger.info('JADIBOT', `Direktori jadibot/slot1–slot${MAX_SLOTS} siap di: ${JADIBOT_DIR}`)
}

export async function restoreSlots(mainSock) {
  // Auto-init: pastikan folder jadibot dan slot1-5 selalu ada saat startup
  await initJadibotDirs()

  let entries
  try { entries = fs.readdirSync(JADIBOT_DIR, { withFileTypes: true }) } catch { return }

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('slot')) continue
    const slotId = entry.name
    const info   = readInfo(slotId)
    // Hanya restore slot yang punya info.json valid dan nomor terdaftar
    if (!info || !info.num || info.status === 'removed') continue
    if (_slots.has(slotId)) continue

    logger.info('JADIBOT', `Memulihkan ${slotId} (${info.num})...`)
    try {
      await startSlotConnection(slotId, info, mainSock)
    } catch (err) {
      logger.error('JADIBOT', `Gagal memulihkan ${slotId}: ${err.message}`)
    }
  }
}
