import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../../')
const _watchers = new Map()
const _debounceTimers = new Map()
const _mtimes = new Map()

const _stats = {
  reloaded: 0,
  failed: 0,
  started: Date.now(),
}

async function freshImport(fullPath) {
  const url = `file://${fullPath}?t=${Date.now()}`
  return import(url)
}

async function reloadPlugin(fullPath, pluginStore) {
  const rel = path.relative(ROOT_DIR, fullPath)
  const base = path.basename(fullPath)
  const start = Date.now()

  const toDelete = []
  for (const [key, val] of pluginStore.entries()) {
    if (val?._sourcePath === fullPath) toDelete.push(key)
  }
  for (const key of toDelete) pluginStore.delete(key)

  let mod
  try {
    mod = await freshImport(fullPath)
  } catch (e) {
    logger.error(base, `Import failed — ${e.message}`)
    _stats.failed++
    return { success: false, file: rel, error: e.message }
  }

  const cfg = mod.config
  const handler = mod.handler

  if (!cfg || !handler) {
    logger.warn(base, 'Tidak ada export config/handler yang valid — skip')
    _stats.failed++
    return { success: false, file: rel, error: 'No valid config/handler export' }
  }

  const name = cfg.name?.toLowerCase()
  if (!name) {
    logger.warn(base, 'config.name kosong — skip')
    _stats.failed++
    return { success: false, file: rel, error: 'config.name is empty' }
  }

  const entry = { config: cfg, handler, _sourcePath: fullPath }
  pluginStore.set(name, entry)
  for (const alias of cfg.alias || []) {
    pluginStore.set(alias.toLowerCase(), entry)
  }

  const commands = [name, ...(cfg.alias || [])].join(', ')
  const ms = Date.now() - start
  logger.info('PLUGIN', `✓ ${base} [${commands}] (${ms}ms)`)
  _stats.reloaded++

  return { success: true, file: rel, commands: [name, ...(cfg.alias || [])] }
}

async function reloadLib(fullPath) {
  const rel = path.relative(ROOT_DIR, fullPath)
  const base = path.basename(fullPath)
  const start = Date.now()

  try {
    await freshImport(fullPath)
    const ms = Date.now() - start
    logger.info('LIB', `✓ ${base} (${ms}ms)`)
    _stats.reloaded++
    return { success: true, file: rel }
  } catch (e) {
    logger.error('LIB', `${base} — ${e.message}`)
    _stats.failed++
    return { success: false, file: rel, error: e.message }
  }
}

async function reloadConfig(fullPath, configRef) {
  const base = path.basename(fullPath)
  const start = Date.now()

  try {
    const mod = await freshImport(fullPath)
    const newCfg = mod.default ?? mod

    if (configRef && typeof newCfg === 'object') {
      Object.assign(configRef, newCfg)
    }

    const ms = Date.now() - start
    logger.info('CONFIG', `✓ ${base} merged (${ms}ms)`)
    _stats.reloaded++
    return { success: true, file: path.relative(ROOT_DIR, fullPath) }
  } catch (e) {
    logger.error('CONFIG', `${base} — ${e.message}`)
    _stats.failed++
    return { success: false, file: path.relative(ROOT_DIR, fullPath), error: e.message }
  }
}

async function dispatchReload(fullPath, type, pluginStore, configRef) {
  if (type === 'plugin') return reloadPlugin(fullPath, pluginStore)
  if (type === 'config') return reloadConfig(fullPath, configRef)
  return reloadLib(fullPath)
}

function scheduleReload(fullPath, type, pluginStore, configRef, debounceMs) {
  const existing = _debounceTimers.get(fullPath)
  if (existing) clearTimeout(existing)

  const timer = setTimeout(async () => {
    _debounceTimers.delete(fullPath)

    try {
      const newMtime = fs.statSync(fullPath).mtimeMs
      const oldMtime = _mtimes.get(fullPath) ?? 0
      if (newMtime === oldMtime) return
      _mtimes.set(fullPath, newMtime)
    } catch {
      return
    }

    await dispatchReload(fullPath, type, pluginStore, configRef)
  }, debounceMs)

  _debounceTimers.set(fullPath, timer)
}

function attachWatcher(fullPath, type, pluginStore, configRef, debounceMs) {
  if (_watchers.has(fullPath)) return

  try {
    const mtime = fs.statSync(fullPath).mtimeMs
    _mtimes.set(fullPath, mtime)
  } catch { return }

  try {
    const watcher = fs.watch(fullPath, { persistent: false }, (event) => {
      if (event !== 'change') return
      scheduleReload(fullPath, type, pluginStore, configRef, debounceMs)
    })

    watcher.on('error', () => {
      _watchers.delete(fullPath)
      setTimeout(() => attachWatcher(fullPath, type, pluginStore, configRef, debounceMs), 3000)
    })

    _watchers.set(fullPath, watcher)
  } catch (e) {
    logger.warn(path.basename(fullPath), `Failed to watch — ${e.message}`)
  }
}

function scanDir(dir, type, pluginStore, configRef, debounceMs) {
  if (!fs.existsSync(dir)) {
    logger.warn('SCAN', `Dir tidak ditemukan: ${dir}`)
    return
  }

  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      scanDir(fullPath, type, pluginStore, configRef, debounceMs)
      continue
    }

    if (!entry.name.endsWith('.js') && !entry.name.endsWith('.ts')) continue
    if (entry.name.startsWith('_')) continue

    attachWatcher(fullPath, type, pluginStore, configRef, debounceMs)
  }
}

export class HotReloader {
  constructor({ pluginStore, configRef = null, debounceMs = 300 }) {
    this._pluginStore = pluginStore
    this._configRef = configRef
    this._debounceMs = debounceMs
  }

  watchPlugins(pluginsDir) {
    const resolved = path.resolve(ROOT_DIR, pluginsDir)
    scanDir(resolved, 'plugin', this._pluginStore, this._configRef, this._debounceMs)
    logger.info('INIT', `Watching plugins: ${pluginsDir} (${_watchers.size} files)`)
  }

  watchLib(libDir) {
    const resolved = path.resolve(ROOT_DIR, libDir)
    scanDir(resolved, 'lib', this._pluginStore, this._configRef, this._debounceMs)
    logger.info('INIT', `Watching lib: ${libDir} (${_watchers.size} files)`)
  }

  watchFile(filePath, type = 'lib') {
    const resolved = path.resolve(ROOT_DIR, filePath)
    attachWatcher(resolved, type, this._pluginStore, this._configRef, this._debounceMs)
    logger.info('INIT', `Watching file: ${filePath} (${type})`)
  }

  watchConfig(configPath = 'config.js') {
    this.watchFile(configPath, 'config')
  }

  async reloadAllPlugins(pluginsDir) {
    const resolved = path.resolve(ROOT_DIR, pluginsDir)
    const results = []

    const walk = (dir) => {
      let entries
      try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
      for (const e of entries) {
        const fp = path.join(dir, e.name)
        if (e.isDirectory()) { walk(fp); continue }
        if (!e.name.endsWith('.js') && !e.name.endsWith('.ts')) continue
        if (e.name.startsWith('_')) continue
        results.push(fp)
      }
    }

    walk(resolved)

    const out = []
    for (const fp of results) {
      out.push(await reloadPlugin(fp, this._pluginStore))
    }

    const ok = out.filter(r => r.success).length
    const fail = out.filter(r => !r.success).length
    logger.info('RELOAD-ALL', `Done — ${ok} OK, ${fail} failed`)
    return out
  }

  stop() {
    for (const [, w] of _watchers) w.close()
    _watchers.clear()
    for (const [, t] of _debounceTimers) clearTimeout(t)
    _debounceTimers.clear()
    logger.info('STOP', 'All watchers stopped')
  }

  getStats() {
    return {
      watched: _watchers.size,
      reloaded: _stats.reloaded,
      failed: _stats.failed,
      uptime: Math.floor((Date.now() - _stats.started) / 1000),
    }
  }
}

let _instance = null

export function getHotReloader() {
  return _instance
}

export function createHotReloader(options) {
  _instance = new HotReloader(options)
  return _instance
}

export default { HotReloader, createHotReloader, getHotReloader }