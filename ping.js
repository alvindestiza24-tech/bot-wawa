import { performance } from 'perf_hooks'
import os from 'os'
import config from '../../config.js'
import { fmtSize, fmtUptime } from '../../src/lib/function.js'
import { AIRich } from '../../src/lib/_build-m.js'

const MODE_LABEL = {
  public: 'Publik',
  self: 'Privat',
}

function progressBar(percent, length = 10) {
  const filled = Math.round(percent / (100 / length))
  const empty = length - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

function cpuLoadBar(load) {
  const percent = Math.min(load * 100, 100)
  return progressBar(percent)
}

function memoryBar(pct) {
  return progressBar(Number(pct))
}

export const config_ = {
  name: 'ping',
  alias: ['speed', 'p', 'latency'],
  category: 'main',
  description: 'Cek performa dan status sistem bot',
  usage: '.ping',
  example: '.ping',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  prefix: false,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const tStart = performance.now()

  const cpus = os.cpus()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPct = (usedMem / totalMem * 100).toFixed(1)
  const load = os.loadavg()
  const mem = process.memoryUsage()
  const uptimeBot = process.uptime()
  const uptimeServer = os.uptime()

  const tEnd = performance.now()
  const execTime = (tEnd - tStart).toFixed(2)

  const mode = MODE_LABEL[config.mode] || config.mode
  const botName = config.bot?.name || 'Bot'
  const botVersion = config.bot?.version || '1.0.0'
  const ownerName = config.owner?.name || 'Owner'

  const lines = []
  lines.push(`⚡ *Response Time:* ${execTime} ms`)
  lines.push('')
  lines.push(`🖥️ *Sistem*`)
  lines.push(`• OS: ${os.type()} (${os.platform()}/${os.arch()})`)
  lines.push(`• NodeJS: ${process.version}`)
  lines.push(`• Mode: ${mode}`)
  lines.push(`• Bot: ${botName} v${botVersion}`)
  lines.push('')
  lines.push(`🧠 *CPU*`)
  lines.push(`• Model: ${cpus[0]?.model?.trim()?.slice(0, 30) || 'Unknown'}`)
  lines.push(`• Cores: ${cpus.length}`)
  lines.push(`• Load 1m: ${load[0].toFixed(2)} ${cpuLoadBar(load[0])}`)
  lines.push(`• Load 5m: ${load[1].toFixed(2)}`)
  lines.push(`• Load 15m: ${load[2].toFixed(2)}`)
  lines.push('')
  lines.push(`💾 *Memori*`)
  lines.push(`• Total: ${fmtSize(totalMem)}`)
  lines.push(`• Dipakai: ${fmtSize(usedMem)} (${memPct}%) ${memoryBar(memPct)}`)
  lines.push(`• Heap: ${fmtSize(mem.heapUsed)} / ${fmtSize(mem.heapTotal)}`)
  lines.push('')
  lines.push(`⏱️ *Uptime*`)
  lines.push(`• Server: ${fmtUptime(uptimeServer)}`)
  lines.push(`• Bot: ${fmtUptime(uptimeBot)}`)
  lines.push(`• Owner: ${ownerName}`)

  const text = lines.join('\n')
  const footer = `${botName} v${botVersion} • ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}`

  try {
    await new AIRich(sock)
      .setTitle(`📊 Status ${botName}`)
      .addText(text)
      .setFooter(footer)
      .addSuggest(['menu', 'info', 'list', 'ai', 'codex'])
      .send(m.chat, { quoted: m.raw })
  } catch {
    await m.reply(text)
  }

  await m.react('✅')
}