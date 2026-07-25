import { getDatabase } from '../../src/database.js'
import { clearHistory, sessionCount } from '../../src/ai/cs-ai/cs-session.js'
import { toAestheticFont } from '../../src/lib/text-formater.js'

export const config_ = {
  name:      'csai',
  alias:     ['cson', 'csoff', 'csstatus', 'csreset'],
  category:  'owner',
  description: 'Kontrol sistem Customer Service AI',
  usage:     '.csai on/off/status/reset',
  isOwner:   true,
  isGroup:   false,
  cooldown:  3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db     = getDatabase()
  const cmd    = m.command?.toLowerCase()
  const arg    = (m.args?.[0] || '').toLowerCase()

  const action = cmd === 'cson' ? 'on' : cmd === 'csoff' ? 'off' : cmd === 'csreset' ? 'reset' : arg

  if (action === 'on') {
    db.setting('cs_ai_private', true)
    return m.reply(
      `✅ *CS AI Aktif*\n\n` +
      `${toAestheticFont('private chat')}: aktif\n` +
      `Tag bot di grup atau DM langsung untuk mulai.`
    )
  }

  if (action === 'off') {
    db.setting('cs_ai_private', false)
    return m.reply(`❌ *CS AI Nonaktif*\n\nSemua sesi private CS AI dimatikan.`)
  }

  if (action === 'reset') {
    clearHistory(m.senderNumber)
    return m.reply(`🔄 *History Chat CS AI Reset*\n\nPercakapan sebelumnya telah dihapus.`)
  }

  if (action === 'status') {
    const privateOn = db.setting('cs_ai_private') !== false
    return m.reply(
      `📊 *Status CS AI*\n\n` +
      `Private: ${privateOn ? '✅ Aktif' : '❌ Nonaktif'}\n` +
      `Active sessions: ${sessionCount()}\n\n` +
      `Command:\n` +
      `• \`.csai on\` — aktifkan private\n` +
      `• \`.csai off\` — matikan private\n` +
      `• \`.csai reset\` — hapus history\n` +
      `• \`.setcs on/off\` — toggle di grup`
    )
  }

  return m.reply(
    `꒰ csai ꒱\n\n` +
    `\`.csai on\` — aktifkan\n` +
    `\`.csai off\` — matikan\n` +
    `\`.csai status\` — lihat status\n` +
    `\`.csai reset\` — hapus history\n` +
    `\`.setcs on/off\` — toggle di grup`
  )
}