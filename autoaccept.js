// plugins/group/autojoin.js
import { AIRich } from '../../src/lib/_build-m.js'
import { getDatabase } from '../../src/database.js'

export const config_ = {
  name: 'autojoin',
  alias: ['autogroupaccept', 'autorequest', 'autoaccept'],
  category: 'group',
  description: 'Auto-accept anggota yang meminta join (anti-pending)',
  usage: '.autojoin on/off',
  example: '.autojoin on',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const db = getDatabase()
  const group = db.getGroup(m.chat) || db.setGroup(m.chat, {})
  const args = m.args || []

  if (!args.length) {
    const status = group.autoJoin ? '✅ Aktif' : '❌ Nonaktif'
    return m.reply(`📋 *Auto Join Request*\n\nStatus: ${status}\n\nGunakan .autojoin on/off untuk mengatur.`)
  }

  const action = args[0].toLowerCase()
  if (action === 'on') {
    group.autoJoin = true
    db.setGroup(m.chat, group)
    await new AIRich(sock)
      .setTitle('✅ Auto Join Aktif')
      .addText('Bot akan otomatis menyetujui semua permintaan bergabung.\nGrup tidak akan ada pending member lagi.')
      .send(m.chat, { quoted: m.raw })
  } else if (action === 'off') {
    group.autoJoin = false
    db.setGroup(m.chat, group)
    await new AIRich(sock)
      .setTitle('❌ Auto Join Nonaktif')
      .addText('Bot tidak akan menyetujui permintaan bergabung secara otomatis.')
      .send(m.chat, { quoted: m.raw })
  } else {
    return m.reply('❌ Gunakan .autojoin on/off')
  }
}

// Fungsi yang dipanggil dari index.js saat event group.join-request
export async function handleJoinRequest(sock, joinRequest) {
  const db = getDatabase()
  const { id: gid, participant } = joinRequest
  if (!gid || !participant) return

  const group = db.getGroup(gid)
  if (group?.autoJoin) {
    try {
      await sock.groupRequestParticipantsUpdate(gid, [participant], 'approve')
      console.log(`[AUTO-JOIN] Approved ${participant} in ${gid}`)
    } catch (err) {
      console.error(`[AUTO-JOIN] Gagal approve ${participant}: ${err.message}`)
    }
  }
}