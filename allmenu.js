import config from '../../config.js'
import { pluginStore } from '../../src/plugins.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'allmsnu',
  alias: ['allmenu', 'semuamenu'],
  category: 'main',
  description: 'Menampilkan daftar command',
  usage: '.menu',
  example: '.menu',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  prefix:    false,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock, isOwner, isPremium }) {
  const categories = {}
  const seen = new Set()

  for (const [key, plugin] of pluginStore.entries()) {
    const cfg = plugin.config
    if (cfg.name !== key) continue
    if (seen.has(cfg.name)) continue
    seen.add(cfg.name)

    const cat = cfg.category || 'other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(cfg)
  }

  const prefix = Array.isArray(config.command?.prefix)
    ? config.command.prefix[0]
    : config.command?.prefix || '.'

  const now = new Date()
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false })
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  let menuText = ''

  // Header bertema Alam / Hijau
  menuText += `🌿 ─── *[ ${config.bot.name} ]* ─── 🌿\n`
  menuText += `│ 🟢 Pengguna : @${m.pushName || 'User'}\n`
  menuText += `│ 🟢 Waktu    : ${timeStr} WIB\n`
  menuText += `│ 🟢 Tanggal  : ${dateStr}\n`
  menuText += `└───────────────────────\n\n`

  // Urutan kategori
  const order = ['main', 'user', 'group', 'owner', 'maker', 'tools', 'downloader', 'fun']
  const catList = [
    ...order.filter(c => categories[c]),
    ...Object.keys(categories).filter(c => !order.includes(c)).sort()
  ]

  for (const cat of catList) {
    const plugins = categories[cat]
    if (!plugins?.length) continue

    const catName = cat.charAt(0).toUpperCase() + cat.slice(1)
    menuText += `🌱 ── *${catName} Menu* ── 🌱\n`

    for (const p of plugins) {
      menuText += `  🍀 ${prefix}${p.name}\n`
    }
    menuText += `───────────────────────\n\n`
  }

  // Footer bertema Alam
  menuText += `🌲 *Informasi Sistem*\n`
  menuText += `  ▫️ Ketik ${prefix}<command> untuk menggunakan\n`
  menuText += `  ▫️ Prefix : ${prefix}\n`
  menuText += `  ▫️ Owner  : ${config.owner.name}\n`
  menuText += `  ▫️ Versi  : v${config.bot.version}\n`
  menuText += `🌿─────────────────────🌿`

  await sock.sendMessage(
    m.chat,
    { text: menuText, contextInfo: _mCtx(m.sender) },
    { quoted: createFakeQuoted() }
  )
}
