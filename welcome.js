// plugins/group/setwelcome.js
import { getDatabase } from '../../src/database.js'

const DEFAULT_BG = 'https://files.catbox.moe/p8y6nb.jpg'

export const config_ = {
  name: 'setwelcome',
  alias: ['welcome', 'sw'],
  category: 'group',
  description: 'Atur kartu sambutan anggota baru',
  usage: '.setwelcome on/off [pesan] [url bg]',
  example: '.setwelcome on Selamat datang @user di @group',
  isOwner: false, isPremium: false, isGroup: true, isPrivate: false,
  isAdmin: true, isBotAdmin: false, cooldown: 5, isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const group = db.getGroup(m.chat) || db.setGroup(m.chat, {})
  const args = m.args || []

  if (!args.length) {
    const w = group.welcome || {}
    const status = w.enabled ? '✅ Aktif' : '❌ Nonaktif'
    const msg = w.message || 'Halo @user! Selamat datang di @group'
    const bg = w.background || DEFAULT_BG
    return m.reply(
      `📋 *Pengaturan Welcome*\n\n` +
      `Status : ${status}\n` +
      `Pesan  : ${msg}\n` +
      `BG     : ${bg}\n\n` +
      `*Variabel:* @user @group @time @date @owner @bot\n` +
      `*Perintah:* .setwelcome on/off [pesan] [url bg]`
    )
  }

  const action = args[0].toLowerCase()
  if (action !== 'on' && action !== 'off') return m.reply('❌ Gunakan .setwelcome on/off [pesan] [url bg]')

  const enabled = action === 'on'
  const remaining = args.slice(1).join(' ')
  let message = remaining, background = ''
  const urlMatch = remaining.match(/(https?:\/\/\S+)$/)
  if (urlMatch) { background = urlMatch[1]; message = remaining.replace(urlMatch[1], '').trim() }

  group.welcome = {
    enabled,
    message: message || group.welcome?.message || 'Halo @user! Selamat datang di @group',
    background: background || group.welcome?.background || DEFAULT_BG,
  }
  db.setGroup(m.chat, group)
  await m.reply(`✅ Welcome card *${enabled ? 'diaktifkan' : 'dinonaktifkan'}*.`)
}