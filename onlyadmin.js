import config from '../../config.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { getDatabase } from '../../src/database.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'onlyadmin',
  alias: ['adminonly', 'onlyadminmode'],
  category: 'group',
  description: 'Hanya admin grup yang dapat menggunakan bot',
  usage: '.onlyadmin (toggle on/off)',
  example: '.onlyadmin',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const groupData = db.getGroup(m.chat) || { jid: m.chat }
  const current = !!groupData.onlyAdmin

  const newState = !current
  groupData.onlyAdmin = newState
  db.setGroup(m.chat, groupData)

  const statusText = newState
    ? `🔒 *Mode OnlyAdmin AKTIF*\n\nSekarang hanya *admin grup* yang dapat menggunakan bot di grup ini.`
    : `🔓 *Mode OnlyAdmin NONAKTIF*\n\nSemua anggota dapat menggunakan bot kembali.`

  try {
    await new AIRich(sock)
      .setTitle(newState ? '🔒 Only Admin' : '🔓 Public Access')
      .addText(statusText)
      .addSuggest(['menu', 'list', 'antilink', 'antinsfw', 'antitoxic'])
      .send(m.chat, { quoted: createFakeQuoted() })
  } catch {
    await m.reply(statusText)
  }
}