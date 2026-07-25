// plugins/group/tagall.js
import { getParticipantJid } from '../../src/lib/lid.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'tagall',
  alias: ['all', 'everyone'],
  category: 'group',
  description: 'Tag semua member grup',
  usage: '.tagall <pesan>',
  example: '.tagall Halo semua!',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: false,
  cooldown: 30,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock, groupMeta }) {
  const text = m.text || 'Tag All Members'

  try {
    const participants = groupMeta?.participants || []

    if (participants.length === 0) {
      return m.reply(beautifulMessage('❌ Tidak ada member di grup ini.', { pushName: m.pushName }))
    }

    // Filter keluar pengirim sendiri
    const targetParticipants = participants.filter(p => {
      const jid = getParticipantJid(p)
      return jid !== m.sender
    })

    if (targetParticipants.length === 0) {
      return m.reply(beautifulMessage('❌ Tidak ada member lain yang bisa di-tag.', { pushName: m.pushName }))
    }

    // Ambil JID untuk mention
    const mentions = targetParticipants.map(p => getParticipantJid(p)).filter(Boolean)

    // Buat daftar nama (pakai @nomor)
    const memberList = targetParticipants
      .map(p => {
        const jid = getParticipantJid(p)
        return jid ? `@${jid.split('@')[0]}` : ''
      })
      .filter(Boolean)
      .join('\n')

    const message = [
      `📢 *TAG ALL*`,
      ``,
      `*Pesan:* ${text}`,
      ``,
      `\`\`\`━━━ ${targetParticipants.length} MEMBER TOTAL ━━━\`\`\``,
      memberList,
    ].join('\n')

    await m.reply(message, { mentions })
  } catch (error) {
    console.error('[TAGALL]', error)
    await m.reply(beautifulMessage('❌ Gagal menge-tag member.', { pushName: m.pushName }))
  }
}