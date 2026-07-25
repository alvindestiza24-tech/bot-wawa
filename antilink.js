// plugins/group/antilink.js
import { getDatabase } from '../../src/database.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'antilink',
  alias: ['antilinkgc', 'antilinkgroup'],
  category: 'group',
  description: 'Aktifkan/matikan anti link di grup',
  usage: '.antilink on/off',
  example: '.antilink on',
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
    return m.reply(beautifulMessage('❌ Gunakan: .antilink on/off', { pushName: m.pushName }))
  }

  const enabled = action === 'on'
  db.setGroupAntilink(m.chat, enabled)
  const status = enabled ? 'diaktifkan' : 'dinonaktifkan'
  return m.reply(beautifulMessage(`✅ Anti Link telah *${status}* untuk grup ini.`, { pushName: m.pushName }))
}