import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const pluginStore = new Map()

export async function loadPlugins(pluginsPath) {
  pluginStore.clear()
  let count = 0

  function* walkGen(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) yield* walkGen(full)
      else if (entry.isFile() && entry.name.endsWith('.js')) yield full
    }
  }

  for (const file of walkGen(pluginsPath)) {
    try {
      const mod = await import(`${file}?t=${Date.now()}`)
      const cfg = mod.config
      const handler = mod.handler
      if (!cfg || !handler) continue

      const name = cfg.name?.toLowerCase()
      if (!name) continue

      pluginStore.set(name, { config: cfg, handler })

      for (const alias of cfg.alias || []) {
        pluginStore.set(alias.toLowerCase(), { config: cfg, handler })
      }

      count++
    } catch (err) {
      console.error(`[PLUGIN] Failed to load ${file}:`, err.message)
    }
  }

  return count
}
