import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function fmtSize(bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + u[i]
}

export function fmtUptime(s) {
  s = Number(s)
  const d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60),
    sc = Math.floor(s % 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${sc}s`
  return `${m}m ${sc}s`
}

export function fmtDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h} jam ${m % 60} menit`
  if (m > 0) return `${m} menit ${s % 60} detik`
  return `${s} detik`
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function toJid(num) {
  const n = String(num).replace(/[^0-9]/g, '')
  return n + '@s.whatsapp.net'
}

export function fromJid(jid) {
  return String(jid || '').split('@')[0]
}

export function normalizeNumber(input) {
  let num = String(input).replace(/[^0-9]/g, '')
  if (num.startsWith('08')) num = '62' + num.slice(1)
  else if (num.startsWith('0')) num = '62' + num.slice(1)
  return num
}

export function getLevelBar(current, target, total = 10) {
  const filled = Math.min(Math.floor((current / target) * total), total)
  return '▰'.repeat(filled) + '▱'.repeat(total - filled)
}

export function getRole(level) {
  if (level >= 100) return '👑 Legenda'
  if (level >= 75) return '🌟 Grandmaster'
  if (level >= 50) return '💎 Master'
  if (level >= 30) return '🔥 Expert'
  if (level >= 20) return '⚔️ Veteran'
  if (level >= 10) return '🛡️ Warrior'
  if (level >= 5) return '🗡️ Fighter'
  return '🌱 Pemula'
}
