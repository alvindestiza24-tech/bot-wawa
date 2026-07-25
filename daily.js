import { getDatabase } from '../../src/database.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'daily',
  alias: ['dailyreward', 'claim'],
  category: 'user',
  description: 'Klaim reward harian (koin + exp)',
  usage: '.daily',
  example: '.daily',
  isOwner: false,
  cooldown: 86400,
  isEnabled: true,
}
export { config_ as config }

const DAILY_EXP = 500
const DAILY_KOIN = 100

export async function handler(m, { sock }) {
  const db = getDatabase()
  const userId = m.sender

  const lastClaim = db.setting(`daily_${userId}`) || 0
  const now = Date.now()
  const cooldown = 24 * 60 * 60 * 1000

  if (now - lastClaim < cooldown) {
    const remaining = Math.ceil((cooldown - (now - lastClaim)) / 3600000)
    return m.reply(`⏳ Tunggu ${remaining} jam lagi untuk claim daily berikutnya.`)
  }

  db.updateExp(userId, DAILY_EXP)
  db.updateKoin(userId, DAILY_KOIN)
  db.setting(`daily_${userId}`, now)

  await new AIRich(sock)
    .setTitle('🎁 Daily Reward')
    .addText(`## Selamat! Kamu mendapat:\n✨ +${DAILY_EXP} XP\n💰 +${DAILY_KOIN} Koin`)
    .addSuggest(['daily', 'profile', 'top'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}