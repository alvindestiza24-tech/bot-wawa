/**
 * role-db.js
 * Inspired by Ourin's ourin-premium-db.js
 * Mengelola owner / premium / banned sebagai file JSON terpisah
 * Path: storage/data/database/{owner,premium,banned}.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Path setup ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR    = path.join(__dirname, '..', '..', 'storage', 'data', 'database')

const FILES = {
  owner:   path.join(DB_DIR, 'owner.json'),
  premium: path.join(DB_DIR, 'premium.json'),
  banned:  path.join(DB_DIR, 'banned.json'),
}

// ── In-memory cache (TTL 15 detik) ───────────────────────────────────────────
const CACHE_TTL = 15_000
const cache = {
  owner:   { data: null, ts: 0 },
  premium: { data: null, ts: 0 },
  banned:  { data: null, ts: 0 },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}

/**
 * Baca JSON dari disk.
 * @param {string} filePath
 * @param {*} defaultVal - nilai default jika file tidak ada / corrupt
 */
function readJson(filePath, defaultVal) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, defaultVal)
      return JSON.parse(JSON.stringify(defaultVal))
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return JSON.parse(JSON.stringify(defaultVal))
  }
}

/** Tulis JSON ke disk secara atomic (via .tmp) */
function writeJson(filePath, data) {
  ensureDir()
  const tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, filePath)
}

/**
 * Normalisasi JID / nomor menjadi angka murni.
 * Contoh: "62812:42@s.whatsapp.net" → "62812"
 */
function norm(raw) {
  return String(raw || '').split(':')[0].split('@')[0].replace(/[^0-9]/g, '')
}

/** Cocokkan dua nomor yang sudah dinormalisasi */
function matchNum(a, b) {
  return !!(a && b && (a === b || a.endsWith(b) || b.endsWith(a)))
}

/** Ambil nomor dari entry (bisa string atau objek) */
function entryNum(e) {
  if (typeof e === 'string') return norm(e)
  return norm(e?.number || e?.jid || '')
}

// ══════════════════════════════════════════════════════════════════════════════
// OWNER
// ══════════════════════════════════════════════════════════════════════════════

function loadOwners() {
  const now = Date.now()
  if (cache.owner.data && now - cache.owner.ts < CACHE_TTL) return cache.owner.data
  ensureDir()
  const raw  = readJson(FILES.owner, { owners: [] })
  const data = Array.isArray(raw.owners) ? raw.owners : []
  cache.owner = { data, ts: now }
  return data
}

function saveOwners(owners) {
  writeJson(FILES.owner, { owners, updatedAt: new Date().toISOString() })
  cache.owner = { data: owners, ts: Date.now() }
}

/** Cek apakah JID ada di daftar owner (database saja, tanpa config) */
export function isOwnerDb(jid) {
  const num = norm(jid)
  if (!num) return false
  return loadOwners().some(o => matchNum(num, entryNum(o)))
}

/** Tambah owner baru ke database */
export function addOwner(jid, name = 'Owner') {
  const num = norm(jid)
  if (!num) return { success: false, message: 'JID tidak valid' }
  if (isOwnerDb(num)) return { success: false, message: 'Sudah menjadi owner' }
  const owners = loadOwners()
  owners.push({ number: num, name, addedAt: new Date().toISOString() })
  saveOwners(owners)
  return { success: true, message: `${num} ditambah sebagai owner` }
}

/** Hapus owner dari database */
export function removeOwner(jid) {
  const num   = norm(jid)
  const list  = loadOwners()
  const idx   = list.findIndex(o => matchNum(num, entryNum(o)))
  if (idx === -1) return { success: false, message: 'Tidak ada di daftar owner' }
  list.splice(idx, 1)
  saveOwners(list)
  return { success: true, message: `${num} dihapus dari owner` }
}

export function getOwnerList() { return loadOwners() }

// ══════════════════════════════════════════════════════════════════════════════
// PREMIUM
// ══════════════════════════════════════════════════════════════════════════════

function loadPremium() {
  const now = Date.now()
  if (cache.premium.data && now - cache.premium.ts < CACHE_TTL) return cache.premium.data
  ensureDir()
  const raw  = readJson(FILES.premium, { premium: [] })
  const data = Array.isArray(raw.premium) ? raw.premium : []
  cache.premium = { data, ts: now }
  return data
}

function savePremium(premium) {
  writeJson(FILES.premium, { premium, updatedAt: new Date().toISOString() })
  cache.premium = { data: premium, ts: Date.now() }
}

/** Cek apakah JID premium dan belum expired */
export function isPremiumDb(jid) {
  const num  = norm(jid)
  if (!num) return false
  const list = loadPremium()
  const user = list.find(p => matchNum(num, entryNum(p)))
  if (!user) return false
  if (typeof user === 'string') return true
  if (user.expiredAt && new Date(user.expiredAt) < new Date()) {
    removePremium(num) // auto-cleanup expired
    return false
  }
  return true
}

/** Tambah / perpanjang premium */
export function addPremium(jid, days = 30, name = 'User') {
  const num  = norm(jid)
  if (!num) return { success: false, message: 'JID tidak valid' }
  const list = loadPremium()
  const idx  = list.findIndex(p => matchNum(num, entryNum(p)))
  const ms   = days * 24 * 60 * 60 * 1000

  if (idx !== -1) {
    // perpanjang dari expiry yang ada (jika belum expired) atau dari sekarang
    const cur  = list[idx]
    const base = cur.expiredAt && new Date(cur.expiredAt) > new Date()
      ? new Date(cur.expiredAt)
      : new Date()
    list[idx].expiredAt = new Date(base.getTime() + ms).toISOString()
    list[idx].name = name || list[idx].name
    savePremium(list)
    return { success: true, message: `Premium diperpanjang ${days} hari`, expiredAt: list[idx].expiredAt }
  }

  const expiredAt = new Date(Date.now() + ms).toISOString()
  list.push({ number: num, name, addedAt: new Date().toISOString(), expiredAt })
  savePremium(list)
  return { success: true, message: `Ditambah premium ${days} hari`, expiredAt }
}

/** Hapus premium */
export function removePremium(jid) {
  const num  = norm(jid)
  const list = loadPremium()
  const idx  = list.findIndex(p => matchNum(num, entryNum(p)))
  if (idx === -1) return { success: false, message: 'Tidak ada di daftar premium' }
  list.splice(idx, 1)
  savePremium(list)
  return { success: true, message: `${num} dihapus dari premium` }
}

/** Ambil daftar premium (expired otomatis dibuang) */
export function getPremiumList() {
  const now = new Date()
  return loadPremium().filter(p => {
    if (p.expiredAt && new Date(p.expiredAt) < now) {
      removePremium(p.number || p.jid)
      return false
    }
    return true
  })
}

/** Ambil info premium satu user */
export function getPremiumInfo(jid) {
  const num = norm(jid)
  return loadPremium().find(p => matchNum(num, entryNum(p))) || null
}

// ══════════════════════════════════════════════════════════════════════════════
// BANNED
// ══════════════════════════════════════════════════════════════════════════════

function loadBanned() {
  const now = Date.now()
  if (cache.banned.data && now - cache.banned.ts < CACHE_TTL) return cache.banned.data
  ensureDir()
  const raw  = readJson(FILES.banned, { bannedUsers: [] })
  const data = Array.isArray(raw.bannedUsers) ? raw.bannedUsers : []
  cache.banned = { data, ts: now }
  return data
}

function saveBanned(bannedUsers) {
  writeJson(FILES.banned, { bannedUsers, updatedAt: new Date().toISOString() })
  cache.banned = { data: bannedUsers, ts: Date.now() }
}

/** Cek apakah JID dibanned */
export function isBannedDb(jid) {
  const num = norm(jid)
  if (!num) return false
  return loadBanned().some(b => matchNum(num, entryNum(b)))
}

/** Ban user */
export function addBanned(jid, reason = '-') {
  const num = norm(jid)
  if (!num) return { success: false, message: 'JID tidak valid' }
  if (isBannedDb(num)) return { success: false, message: 'Sudah dibanned' }
  const list = loadBanned()
  list.push({ number: num, reason, bannedAt: new Date().toISOString() })
  saveBanned(list)
  return { success: true, message: `${num} berhasil dibanned` }
}

/** Hapus ban */
export function removeBanned(jid) {
  const num  = norm(jid)
  const list = loadBanned()
  const idx  = list.findIndex(b => matchNum(num, entryNum(b)))
  if (idx === -1) return { success: false, message: 'Tidak ada di daftar banned' }
  list.splice(idx, 1)
  saveBanned(list)
  return { success: true, message: `${num} berhasil diunban` }
}

export function getBannedList() { return loadBanned() }
export { norm }
