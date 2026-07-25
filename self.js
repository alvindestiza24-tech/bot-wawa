import config from '../../config.js'
import { getDatabase } from '../../src/database.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { sf, bf, div, fl, ac, kr, beautifulMessage } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'self',
  alias: ['selfmode', 'private-mode', 'private'],
  category: 'owner',
  description: 'Aktifkan mode self (hanya owner & bot yang bisa akses)',
  usage: '.self',
  example: '.self',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const currentMode = config.mode || db.setting('botMode') || 'public'

  if (currentMode === 'self') {
    return m.reply(beautifulMessage(
      `ℹ️ ${sf('Bot sudah dalam mode')} *${bf('SELF')}*`,
      { pushName: m.pushName, theme: 'dreamy' }
    ))
  }

  // Ubah mode
  config.mode = 'self'
  db.setting('botMode', 'self')

  const f = fl(), a = ac(), d = div()
  const headerText = [
    `🔒 *${bf('MODE SELF AKTIF')}*`,
    `${d}`,
    ` ${sf('sekarang bot hanya merespon')}:`,
    ` ˓ ✦ ${sf('owner bot')} (${config.owner?.name || 'Owner'})`,
    ` ˓ ✦ ${sf('pesan dari bot sendiri')} (fromMe)`,
    ``,
    ` ${sf('pengguna lain')} ${a} ${sf('tidak akan direspon')}`,
    `${d}`,
    ` ${sf('ketik')} .public ${sf('untuk membuka akses')}`,
  ].join('\n')

  try {
    await new AIRich(sock)
      .setTitle(`🔒 ${bf('SELF MODE')}`)
      .addText(headerText)
      .addSuggest(['public', 'menu', 'jpm'])
      .send(m.chat, { quoted: createFakeQuoted() })
  } catch {
    await m.reply(headerText)
  }
}