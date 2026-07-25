import {
  removeSlot,
  listSlots,
  getSlot,
} from '../../src/lib/jadibot-manager.js'
import { bf, sf } from '../../src/lib/text-formater.js'

export const config_ = {
  name:        'restartjadibot',
  alias:       ['restartjb', 'rjb'],
  category:    'owner',
  description: 'Restart slot JadiBot tertentu',
  usage:       '.restartjadibot <slotId>',
  example:     '.restartjadibot slot1',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    10,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const slotId = (m.args?.[0] || '').toLowerCase().trim()

  if (!slotId) {
    const slots = listSlots()
    if (!slots.length) return m.reply(`❌ Tidak ada slot aktif saat ini.`)
    const list = slots.map(s => `• *${s.slotId}* → +${s.num} (${s.status})`).join('\n')
    return m.reply(`📋 *Slot aktif:*\n\n${list}\n\nGunakan: *.restartjadibot slot1*`)
  }

  if (!slotId.startsWith('slot')) {
    return m.reply(`❌ Format tidak valid. Gunakan: *.restartjadibot slot1*`)
  }

  const slot = getSlot(slotId)
  if (!slot) {
    return m.reply(`❌ Slot *${slotId}* tidak ditemukan atau tidak aktif.`)
  }

  await m.react('⏳')
  await m.reply(`🔄 Merestart slot *${slotId}* (${slot.num})...\n\nBot akan membutuhkan beberapa detik untuk terhubung kembali.`)

  const result = await removeSlot(slotId, sock, 'Restart manual oleh owner')

  if (!result.success) {
    await m.react('❌')
    return m.reply(`❌ Gagal restart: ${result.message}`)
  }

  await m.react('✅')
  return m.reply(
    `✅ Slot *${slotId}* berhasil dihentikan.\n\n` +
    `Pemilik slot (+${slot.num}) perlu menjalankan *.jadibot* kembali untuk mengaktifkan ulang.`
  )
}
