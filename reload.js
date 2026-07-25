import { getHotReloader } from '../../src/lib/hot-reload.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR  = path.resolve(__dirname, '../../')

export const config = {
  name:     'reload',
  alias:    ['reloadall', 'hotreload', 'reloadstats'],
  category: 'owner',
  desc:     'Hot reload plugin/lib tanpa restart bot',
  isOwner:  true,
  cooldown: 5,
}

export async function handler(m, { sock }) {
  const cmd = m.command?.toLowerCase()
  const hr  = getHotReloader()

  if (!hr) {
    return m.reply('❌ Hot reload belum diinisialisasi.')
  }

  // ── .reloadstats — lihat statistik ──────────────────────────────────────────
  if (cmd === 'reloadstats') {
    const s = hr.getStats()
    return m.reply(
      `📊 *Hot Reload Stats*\n\n` +
      `👁️ Watching  : ${s.watched} files\n` +
      `✅ Reloaded  : ${s.reloaded}x\n` +
      `❌ Failed    : ${s.failed}x\n` +
      `⏱️ Uptime    : ${s.uptime}s`
    )
  }

  // ── .reloadall — reload semua plugin sekarang ────────────────────────────────
  if (cmd === 'reloadall') {
    await m.reply('🔄 Reloading semua plugin...')

    const results  = await hr.reloadAllPlugins('plugins')
    const ok       = results.filter(r => r.success)
    const fail     = results.filter(r => !r.success)

    let msg = `✅ *Reload All Selesai*\n\n`
    msg    += `Total   : ${results.length} plugin\n`
    msg    += `Berhasil: ${ok.length}\n`
    msg    += `Gagal   : ${fail.length}`

    if (fail.length > 0) {
      msg += '\n\n❌ *Yang Gagal:*\n'
      msg += fail.map(f => `• \`${f.file}\`\n  ${f.error}`).join('\n')
    }

    return m.reply(msg)
  }

  // ── .hotreload / .reload — info & usage ────────────────────────────────────
  const s = hr.getStats()
  return m.reply(
    `🔥 *Hot Reload Active*\n\n` +
    `👁️ Watching ${s.watched} files\n\n` +
    `*Commands:*\n` +
    `• \`.reloadall\` — reload semua plugin sekarang\n` +
    `• \`.reloadstats\` — lihat statistik\n\n` +
    `_Perubahan file otomatis terdeteksi & direload tanpa restart._`
  )
}
