// plugins/tools/cekid.js
import { generateWAMessageFromContent } from '@kyyinfinite/baileys'
import { _mCtx, createFakeQuoted } from '../../src/lib/ctx.js'

export const config_ = {
  name: 'cekid',
  alias: ['cekidgc', 'cekidch', 'cekidchannel', 'idgc', 'idch'],
  category: 'tools',
  description: 'Cek ID grup atau channel saat ini',
  usage: '.cekid',
  example: '.cekid',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const chat = m.chat
  const isGroup = chat.endsWith('@g.us')
  const isNewsletter = chat.endsWith('@newsletter')

  let type = 'Private Chat'
  let id = chat
  let displayName = ''

  if (isGroup) {
    type = 'Grup'
    try {
      const meta = await sock.groupMetadata(chat)
      displayName = meta.subject || ''
    } catch {}
  } else if (isNewsletter) {
    type = 'Channel'
    try {
      const info = await sock.newsletterMetadata(chat)
      displayName = info.name || ''
    } catch {}
  }

  const idOnly = id.split('@')[0]
  const bodyText = `📋 *Informasi ${type}*\n\n` +
    `Nama: ${displayName || '-'}\n` +
    `ID: \`${idOnly}\`\n` +
    `Full JID: \`${id}\`\n\n` +
    `Klik tombol di bawah untuk menyalin ID.`

  try {
    const msg = generateWAMessageFromContent(m.chat, {
      interactiveMessage: {
        header: { title: `🔍 Cek ID ${type}`, subtitle: displayName || ' ' },
        body: { text: bodyText },
        footer: { text: 'ID Checker' },
        contextInfo: { ..._mCtx(m.sender) },
        nativeFlowMessage: {
          buttons: [
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy ID ' + type,
                copy_code: idOnly,
              }),
            },
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy Full JID',
                copy_code: id,
              }),
            },
          ],
        },
      },
    }, { quoted: createFakeQuoted() })

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    await m.react('✅')
  } catch (err) {
    // Fallback teks biasa
    await m.reply(bodyText + `\n\n_${idOnly}_`)
    await m.react('✅')
  }
}