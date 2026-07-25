/**
 * afk-store.js
 * Menyimpan status AFK ke file JSON agar tidak hilang saat bot restart.
 * Path: storage/data/database/afk.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR     = path.join(__dirname, '..', '..', 'storage', 'data', 'database')
const AFK_FILE   = path.join(DB_DIR, 'afk.json')

// Cache singkat — tulis ke disk langsung, baca dengan cache 3 detik
const CACHE_TTL = 3_000
let _cache = { data: null, ts: 0 }

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}

function load() {
  const now = Date.now()
  if (_cache.data && now - _cache.ts < CACHE_TTL) return _cache.data
  ensureDir()
  try {
    if (!fs.existsSync(AFK_FILE)) {
      fs.writeFileSync(AFK_FILE, '{}')
      _cache = { data: {}, ts: now }
      return {}
    }
    const data = JSON.parse(fs.readFileSync(AFK_FILE, 'utf-8'))
    _cache = { data, ts: now }
    return data
  } catch {
    _cache = { data: {}, ts: now }
    return {}
  }
}

function save(data) {
  ensureDir()
  const tmp = AFK_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, AFK_FILE)
  _cache = { data, ts: Date.now() }
}

/** Normalisasi JID ke nomor saja */
function key(jid) {
  return String(jid || '').split(':')[0].split('@')[0]
}

/** Set status AFK */
export function setAfk(jid, reason = 'Tidak ada alasan') {
  const data = load()
  data[key(jid)] = { reason, time: Date.now() }
  save(data)
}

/** Ambil data AFK (null jika tidak AFK) */
export function getAfk(jid) {
  return load()[key(jid)] || null
}

/** Hapus status AFK, return true jika ada yang dihapus */
export function deleteAfk(jid) {
  const data = load()
  const k    = key(jid)
  if (!data[k]) return false
  delete data[k]
  save(data)
  return true
}

/** Cek apakah sedang AFK */
export function hasAfk(jid) {
  return !!load()[key(jid)]
}

/** Ambil semua AFK aktif (untuk keperluan debug / lisafk) */
export function getAllAfk() {
  return load()
}
