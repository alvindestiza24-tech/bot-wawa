// plugins/group/setgoodbye.js
import { getDatabase } from '../../src/database.js'

const DEFAULT_BG = 'https://files.catbox.moe/p8y6nb.jpg'

export const config_ = {
  name: 'setgoodbye',
  alias: ['goodbye', 'sg'],
  category: 'group',
  description: 'Atur kartu perpisahan anggota keluar',
  usage: '.setgoodbye on/off [pesan] [url bg]',
  example: '.setgoodbye on Sampai jumpa @user',
  isOwner: false, isPremium: false, isGroup: true, isPrivate: false,
  isAdmin: true, isBotAdmin: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const group = db.getGroup(m.chat) || db.setGroup(m.chat, {})
  const args = m.args || []

  if (!args.length) {
    const g = group.goodbye || {}
    const status = g.enabled ? '✅ Aktif' : '❌ Nonaktif'
    const msg = g.message || 'Selamat tinggal @user!'
    const bg = g.background || DEFAULT_BG
    return m.reply(
      `📋 *Pengaturan Goodbye*\n\n` +
      `Status : ${status}\n` +
      `Pesan  : ${msg}\n` +
      `BG     : ${bg}\n\n` +
      `*Variabel:* @user @group @time @date @owner @bot\n` +
      `*Perintah:* .setgoodbye on/off [pesan] [url bg]`
    )
  }

  const action = args[0].toLowerCase()
  if (action !== 'on' && action !== 'off') return m.reply('❌ Gunakan .setgoodbye on/off [pesan] [url bg]')

  const enabled = action === 'on'
  const remaining = args.slice(1).join(' ')
  let message = remaining, background = ''
  const urlMatch = remaining.match(/(https?:\/\/\S+)$/)
  if (urlMatch) { background = urlMatch[1]; message = remaining.replace(urlMatch[1], '').trim() }

  group.goodbye = {
    enabled,
    message: message || group.goodbye?.message || 'Selamat tinggal @user!',
    background: background || group.goodbye?.background || DEFAULT_BG,
  }
  db.setGroup(m.chat, group)
  await m.reply(`✅ Goodbye card *${enabled ? 'diaktifkan' : 'dinonaktifkan'}*.`)
}