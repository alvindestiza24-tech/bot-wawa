import config from '../../config.js'
import { getDatabase } from '../../src/database.js'
// ... sisa kode tetap
import { AIRich } from '../../src/lib/_build-m.js'
import { sf, bf, div, fl, ac, kr, beautifulMessage } from '../../src/lib/text-formater.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'public',
  alias: ['publicmode' ],
  category: 'owner',
  description: 'Kembalikan akses bot ke publik',
  usage: '.public',
  example: '.public',
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

  if (currentMode === 'public') {
    return m.reply(beautifulMessage(
      `ℹ️ ${sf('Bot sudah dalam mode')} *${bf('PUBLIC')}*`,
      { pushName: m.pushName, theme: 'dreamy' }
    ))
  }

  config.mode = 'public'
  db.setting('botMode', 'public')

  const f = fl(), a = ac(), d = div()
  const headerText = [
    `🌍 *${bf('MODE PUBLIC AKTIF')}*`,
    `${d}`,
    ` ${sf('sekarang bot merespon semua orang')}`,
    ` ${a} ${sf('selamat datang kembali')} ${f}`,
    `${d}`,
  ].join('\n')

  try {
    await new AIRich(sock)
      .setTitle(`🌍 ${bf('PUBLIC MODE')}`)
      .addText(headerText)
      .addSuggest(['self', 'menu', 'list'])
      .send(m.chat, { quoted: createFakeQuoted() })
  } catch {
    await m.reply(headerText)
  }
}