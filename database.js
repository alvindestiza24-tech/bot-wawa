import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeToPhoneNumber, extractNumber } from './lib/lid.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR    = path.join(__dirname, '..', 'storage', 'data', 'database')

let _db = null

class Database {
  constructor(dbDir) {
    this.dbDir = dbDir
    this._timers = {}
    this._data = {
      users:    {},
      groups:   {},
      settings: {},
    }
    this._ensureDir()
    this._load()
  }

  _ensureDir() {
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true })
  }

  _fp(name) { return path.join(this.dbDir, `${name}.json`) }

  _read(name, fallback) {
    const fp = this._fp(name)
    try {
      if (!fs.existsSync(fp)) {
        this._write(name, fallback)
        return JSON.parse(JSON.stringify(fallback))
      }
      const parsed = JSON.parse(fs.readFileSync(fp, 'utf-8'))
      return parsed ?? fallback
    } catch {
      return JSON.parse(JSON.stringify(fallback))
    }
  }

  _write(name, data) {
    this._ensureDir()
    const fp  = this._fp(name)
    const tmp = fp + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, fp)
  }

  _scheduleSave(name) {
    if (this._timers[name]) clearTimeout(this._timers[name])
    this._timers[name] = setTimeout(() => {
      try { this._write(name, this._data[name]) } catch {}
      delete this._timers[name]
    }, 1500)
  }

  _load() {
    this._data.users    = this._read('users',    {})
    this._data.groups   = this._read('groups',   {})
    this._data.settings = this._read('settings', {})
  }

  get data() { return this._data }

  save(name) {
    if (name) {
      this._write(name, this._data[name])
    } else {
      for (const k of ['users', 'groups', 'settings']) this._write(k, this._data[k])
    }
  }

  static _uid(jid) {
    const normalized = normalizeToPhoneNumber(jid)
    return normalized || extractNumber(jid)
  }

  getUser(jid) {
    const id = Database._uid(jid)
    return this._data.users[id] || null
  }

  setUser(jid, data = {}) {
    const id = Database._uid(jid)
    if (!this._data.users[id]) {
      this._data.users[id] = {
        id,
        name: '',
        exp: 0,
        level: 1,
        koin: 0,
        warns: [],
        registeredAt: Date.now(),
        ...data,
      }
    } else {
      Object.assign(this._data.users[id], data)
    }
    this._scheduleSave('users')
    return this._data.users[id]
  }

  updateExp(jid, amount) {
    const id = Database._uid(jid)
    if (!this._data.users[id]) this.setUser(jid)
    this._data.users[id].exp = (this._data.users[id].exp || 0) + amount
    this._data.users[id].level = Math.floor(this._data.users[id].exp / 10_000) + 1
    this._scheduleSave('users')
  }

  updateKoin(jid, amount) {
    const id = Database._uid(jid)
    if (!this._data.users[id]) this.setUser(jid)
    this._data.users[id].koin = (this._data.users[id].koin || 0) + amount
    this._scheduleSave('users')
  }

  getGroup(jid) {
    return this._data.groups[jid] || null
  }

  setGroup(jid, data = {}) {
    if (!this._data.groups[jid]) {
      this._data.groups[jid] = { jid, warnings: {}, maxWarnings: 3, ...data }
    } else {
      Object.assign(this._data.groups[jid], data)
    }
    this._scheduleSave('groups')
    return this._data.groups[jid]
  }

  setGroupAntinsfw(jid, enabled) {
    const group = this.getGroup(jid) || { jid }
    group.antinsfw = !!enabled
    return this.setGroup(jid, group)
  }

  setGroupAntitoxic(jid, enabled) {
    const group = this.getGroup(jid) || { jid }
    group.antitoxic = !!enabled
    return this.setGroup(jid, group)
  }

  setGroupAntilink(jid, enabled) {
    const group = this.getGroup(jid) || { jid }
    group.antilink = !!enabled
    return this.setGroup(jid, group)
  }

  setting(key, value) {
    if (value === undefined) return this._data.settings[key]
    this._data.settings[key] = value
    this._scheduleSave('settings')
    return value
  }

  getAllUsers() {
    return Object.values(this._data.users)
  }

  getAllGroups() {
    return Object.entries(this._data.groups)
  }
}

export function initDatabase() {
  _db = new Database(DB_DIR)
  return _db
}

export function getDatabase() {
  if (!_db) throw new Error('[DB] Database belum diinisialisasi. Panggil initDatabase() dulu.')
  return _db
}