import {
  removeSlot,
  removeSlotByOwner,
  listSlots,
  getSlotCount,
  getMaxSlots,
} from '../../src/lib/jadibot-manager.js'
import { bf, sf, div } from '../../src/lib/text-formater.js'
import config from '../../config.js'

export const config_ = {
  name:        'stopjadibot',
  alias:       ['stopjb', 'hentikanbot', 'keluarbot'],
  category:    'owner',
  description: 'Hentikan slot JadiBot milikmu',
  usage:       '.stopjadibot [slotId]',
  example:     '.stopjadibot',
  isOwner:     false,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   true,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const isOwner = config.isOwner(m.sender)
  const arg     = (m.args?.[0] || '').toLowerCase().trim()

  if (isOwner && arg.startsWith('slot')) {
    const slots = listSlots()
    const found = slots.find(s => s.slotId === arg)

    if (!found) {
      return m.reply(`❌ Slot *${arg}* tidak ditemukan atau tidak aktif.`)
    }

    await m.react('⏳')
    const result = await removeSlot(arg, sock, `Dihentikan oleh owner utama`)
    await m.react(result.success ? '✅' : '❌')
    return m.reply(result.success
      ? `✅ Slot *${arg}* berhasil dihentikan.`
      : `❌ ${result.message}`
    )
  }

  await m.react('⏳')
  const result = await removeSlotByOwner(m.senderNumber, sock)
  await m.react(result.success ? '✅' : '❌')

  if (!result.success) {
    return m.reply(
      `❌ ${result.message}\n\n` +
      `Ketik *.listjadibot* untuk melihat status slot.`
    )
  }

  return m.reply(
    `✅ *Bot kamu berhasil dihentikan*\n\n` +
    `${div()}\n\n` +
    `Slot telah dihapus dan sesi dihentikan.\n` +
    `Ketik *.jadibot* kapan saja untuk mulai lagi.`
  )
}
