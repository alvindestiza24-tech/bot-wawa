import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'inspect',
  alias: ['rawmsg', 'raw', 'ins', 'showmsg'],
  category: 'owner',
  description: 'Tampilkan struktur asli pesan Baileys (raw) dengan AIRich',
  usage: '.inspect (reply pesan)',
  example: '.inspect',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

function serializeKey(key) {
  if (!key) return null
  return {
    remoteJid: key.remoteJid,
    fromMe: key.fromMe,
    id: key.id,
    participant: key.participant || undefined,
  }
}

export async function handler(m, { sock }) {
  if (!m.quoted) {
    return m.reply('❌ Reply pesan yang ingin diinspeksi.')
  }

  const quotedMsg = m.quoted.message
  if (!quotedMsg) {
    return m.reply('❌ Pesan tidak memiliki konten.')
  }

  const inspection = {
    key: serializeKey(m.quoted.key),
    messageTimestamp: m.quoted.messageTimestamp || null,
    pushName: m.quoted.pushName || null,
    participant: m.quoted.participant || null,
    message: quotedMsg,
  }

  const clean = JSON.parse(JSON.stringify(inspection))
  const jsonString = JSON.stringify(clean, null, 2)

  try {
    await new AIRich(sock)
      .setTitle('🔍 Raw Message Inspector')
      .addCode('json', jsonString)
      .addText('Salin kode JSON di atas untuk dianalisis lebih lanjut.')
      .send(m.chat, { quoted: m.raw })
  } catch {
    await m.reply(`🔍 *Raw Message Inspector*\n\`\`\`json\n${jsonString.slice(0, 3500)}\n\`\`\``)
  }
}