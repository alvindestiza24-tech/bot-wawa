import config from '../../config.js'
import { pluginStore } from '../../src/plugins.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import { renderMainMenu, renderCategoryMenu } from '../../src/lib/text-formater.js'
import { ButtonV2 } from '../../src/lib/_build-m.js'

let weatherCache = { data: null, lastFetch: 0 }

async function fetchWeather() {
  const now = Date.now()
  if (weatherCache.data && (now - weatherCache.lastFetch) < 30 * 60 * 1000) {
    return weatherCache.data
  }
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-6.9175&longitude=107.6191&current_weather=true&timezone=Asia/Jakarta'
    )
    if (!res.ok) return null
    const json = await res.json()
    const w = json.current_weather
    const temp = w.temperature
    const code = w.weathercode
    
    // Ikon cuaca standar (sudah dibersihkan dari karakter aneh)
    const icons = {
      0: ' Cerah', 1: ' Cerah Berawan', 2: ' Berawan', 3: ' Mendung',
      45: ' Kabut', 48: ' Kabut Beku', 51: ' Gerimis', 53: ' Gerimis',
      55: ' Gerimis Lebat', 61: ' Hujan Ringan', 63: ' Hujan', 65: ' Hujan Lebat',
      71: ' Salju Ringan', 73: ' Salju', 75: ' Salju Lebat',
      80: ' Hujan Ringan', 81: ' Hujan', 82: ' Hujan Lebat',
      95: ' Badai', 96: ' Hujan Es', 99: ' Hujan Es Lebat'
    }
    const desc = icons[code] || ` Kode ${code}`
    const result = ` Info ${temp}°C • ${desc}`
    weatherCache = { data: result, lastFetch: now }
    return result
  } catch {
    return null
  }
}

export const config_ = {
  name:      'menu',
  alias:     ['help', 'start'],
  category:  'main',
  description: 'Tampilkan menu bot',
  usage:     'menu | <kategori>menu',
  example:   'menu | groupmenu',
  isOwner:   false,
  isPremium: false,
  isGroup:   false,
  isPrivate: false,
  cooldown:  5,
  prefix:    false,
  isEnabled: true,
}
export { config_ as config }

const USAGE_HINTS = {
  on: '( on/off )',
  off: '( on/off )',
  add: '( 628xx )',
  kick: '( 628xx )',
  promote: '( 628xx )',
  demote: '( 628xx )',
  ban: '( 628xx )',
  unban: '( 628xx )',
  addprem: '( 628xx )',
  delprem: '( 628xx )',
  warn: '( @tag )',
  setstock: '( cat id +n )',
  additem: '( cat|nama|harga|stok )',
  addcat: '( id|nama|emoji )',
  edititem: '( cat id field val )',
  rekap: '( export excel )',
  afk: '( alasan )',
  buy: '( produk/id )',
  confirm: '( INV-xxx )',
  done: '( INV-xxx )',
}

function getHint(p) {
  if (USAGE_HINTS[p.name]) return ` ${USAGE_HINTS[p.name]}`
  if (p.usage) {
    const parts = p.usage.trim().split(/\s+/)
    if (parts.length > 1) {
      const args = parts.slice(1).join(' ')
      return ` ( ${args} )`
    }
  }
  return ''
}

function collectCategories(isOwner) {
  const cats = {}
  const seen = new Set()
  for (const [key, plugin] of pluginStore.entries()) {
    const cfg = plugin.config
    if (cfg.name !== key) continue
    if (seen.has(cfg.name)) continue
    seen.add(cfg.name)
    if (cfg.isOwner && !isOwner) continue
    const cat = cfg.category || 'other'
    if (!cats[cat]) cats[cat] = []
    cats[cat].push(cfg)
  }
  return cats
}

export async function handler(m, { sock, isOwner }) {
  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0]
    : config.command?.prefix || '.'

  const opts = {
    pushName:   m.pushName || m.senderNumber,
    prefix,
    ownerName:  config.owner?.name || 'Owner',
    botName:    config.bot?.name   || 'Bot',
    botVersion: config.bot?.version || '1.0.0',
    mode:       config.mode || 'public',
  }

  const categories = collectCategories(isOwner)

  const rawCmd = (m.args?.[0] || m.rawCommand || '').toLowerCase()
  let targetCat = null

  if (rawCmd && rawCmd !== 'menu' && rawCmd.endsWith('menu')) {
    targetCat = rawCmd.slice(0, -4)
  }

  if (targetCat && categories[targetCat]) {
    const plugins  = categories[targetCat]
    const commands = plugins.map(p => p.name + getHint(p))
    const label    = targetCat.charAt(0).toUpperCase() + targetCat.slice(1) + ' Menu'
    const text = renderCategoryMenu(label, commands, opts)

    return sock.sendMessage(
      m.chat,
      { text, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
      { quoted: createFakeQuoted() }
    )
  }

  const menuBody = renderMainMenu(
    Object.keys(categories).map(c => c + 'menu'),
    opts
  )

  try {
    const botName = config.bot?.name || 'Bot'
    const thumbUrl = config.assets?.menuThumbnail
      || 'https://files.catbox.moe/lmttt0.jpeg'

    const weatherSub = (await fetchWeather()) || 'Interactive Menu'

    const builder = new ButtonV2(sock)
      .setTitle(botName)
      .setSubtitle(weatherSub)
      .setBody(menuBody)
      .setThumbnail(thumbUrl)

    builder.addButton('All Menu', 'allmenu')

    const storePlugins = (categories['store'] || []).sort((a, b) => a.name.localeCompare(b.name))

    if (storePlugins.length > 0) {
      const rows = storePlugins.map(p => ({
        title: p.name,
        description: p.description || ' ',
        id: p.name,
      }))

      const sections = []
      for (let i = 0; i < rows.length; i += 10) {
        sections.push({
          title: i === 0 ? ' Perintah Store' : ' ',
          rows: rows.slice(i, i + 10),
        })
      }

      const paramsJson = JSON.stringify({
        title: ' Store Commands',
        sections,
      })

      builder.addRawButton({
        buttonText: { displayText: 'Store Menu' },
        buttonId: 'storemenu',
        type: 1,
        nativeFlowInfo: {
          name: 'single_select',
          paramsJson,
        },
      })
    } else {
      builder.addButton('Store Menu', 'storemenu')
    }

    const quickMsg = await builder.build(m.chat)
    await sock.relayMessage(m.chat, quickMsg.message, { messageId: quickMsg.key.id })
  } catch (err) {
    console.error('[menu] ButtonV2 quick menu gagal:', err.message)
    await sock.sendMessage(
      m.chat,
      { text: menuBody, contextInfo: _mCtx(m.sender), mentions: [m.sender] },
      { quoted: createFakeQuoted() }
    )
  }
}