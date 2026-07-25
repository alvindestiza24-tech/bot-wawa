// plugins/main/owner.js
import config from '../../config.js'

export const config_ = {
  name: 'owner',
  alias: ['creator', 'dev', 'developer'],
  category: 'main',
  description: 'Tampilkan kontak owner bot',
  usage: 'owner',
  example: 'owner',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  prefix: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const owner = config.owner || {}
  const name = owner.name || 'Owner'
  const numbers = Array.isArray(owner.number) ? owner.number : []

  if (!numbers.length) {
    return m.reply('❌ Data owner tidak ditemukan di config.')
  }

  const primaryNumber = numbers[0].replace(/[^0-9]/g, '')
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${primaryNumber}:+${primaryNumber}\nEND:VCARD`

  try {
    await sock.sendMessage(
      m.chat,
      {
        contacts: {
          displayName: name,
          contacts: [{ vcard }],
        },
      },
      { quoted: m.raw }
    )
    await m.react('✅')
  } catch (err) {
    console.error('[OWNER] Gagal kirim vcard:', err.message)
    await m.reply('❌ Gagal mengirim kontak owner.')
  }
}