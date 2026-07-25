import { getDatabase } from '../../src/database.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'antinsfw',
  alias: ['antinsfw'],
  category: 'group',
  description: 'Aktifkan/matikan anti NSFW di grup',
  usage: '.antinsfw on/off',
  example: '.antinsfw on',
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
    return m.reply(beautifulMessage('❌ Gunakan: .antinsfw on/off', { pushName: m.pushName }))
  }
  const enabled = action === 'on'
  db.setGroupAntinsfw(m.chat, enabled)
  const status = enabled ? 'diaktifkan' : 'dinonaktifkan'
  return m.reply(beautifulMessage(`✅ Anti NSFW telah *${status}* untuk grup ini.`, { pushName: m.pushName }))
}
