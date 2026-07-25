import { getDatabase } from '../../src/database.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'top',
  alias: ['leaderboard', 'topusers', 'ranking'],
  category: 'user',
  description: 'Lihat 10 user dengan XP tertinggi',
  usage: '.top',
  example: '.top',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const users = db.getAllUsers()
  const sorted = users.filter(u => u.exp > 0).sort((a, b) => (b.exp || 0) - (a.exp || 0))
  const top = sorted.slice(0, 10)

  if (!top.length) return m.reply('❌ Belum ada user dengan XP.')

  const rows = top.map((u, i) => [
    `${i + 1}`,
    u.name || u.id || 'Unknown',
    `${u.exp || 0}`,
    `Lv.${u.level || 1}`
  ])
  const table = [['#', 'Nama', 'XP', 'Level'], ...rows]

  await new AIRich(sock)
    .setTitle('🏆 Leaderboard XP')
    .addText('Top 10 user dengan XP tertinggi')
    .addTable(table)
    .addSuggest(['top', 'profile', 'daily'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}