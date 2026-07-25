import { getDatabase } from '../../src/database.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'antitoxic',
  alias: ['antitoxic'],
  category: 'group',
  description: 'Aktifkan/matikan filter anti toxic di grup',
  usage: '.antitoxic on/off',
  example: '.antitoxic on',
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m) {
  const db = getDatabase()
  const action = m.args[0]?.toLowerCase()
  if (!action || !['on', 'off'].includes(action)) {
    return m.reply(beautifulMessage('❌ Gunakan: .antitoxic on/off', { pushName: m.pushName }))
  }
  const enabled = action === 'on'
  db.setGroupAntitoxic(m.chat, enabled)
  const status = enabled ? 'diaktifkan' : 'dinonaktifkan'
  return m.reply(beautifulMessage(`✅ Filter anti toxic telah *${status}* untuk grup ini.`, { pushName: m.pushName }))
}
