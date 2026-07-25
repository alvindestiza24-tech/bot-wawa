import {
  listSlots,
  getSlotCount,
  getMaxSlots,
  removeSlot,
} from '../../src/lib/jadibot-manager.js'
import { AIRich } from '../../src/lib/_build-m.js'
import { bf, sf, div } from '../../src/lib/text-formater.js'
import { _mCtx } from '../../src/lib/ctx.js'
import config from '../../config.js'

export const config_ = {
  name:        'listjadibot',
  alias:       ['listjb', 'slotbot', 'cekjb', 'cekjadibot'],
  category:    'owner',
  description: 'Lihat semua slot JadiBot aktif',
  usage:       '.listjadibot',
  example:     '.listjadibot',
  isOwner:     true,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   false,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

function fmtDur(isoStr) {
  if (!isoStr) return '-'
  const s = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (s < 60)   return `${s}d`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}j`
  return `${Math.floor(s / 86400)}h`
}

function statusIcon(s) {
  return { active: '🟢', connecting: '🟡', reconnecting: '🔄', error: '🔴' }[s] || '⚪'
}

export async function handler(m, { sock }) {
  const slots = listSlots()
  const used  = getSlotCount()
  const max   = getMaxSlots()
  const free  = max - used

  if (!slots.length) {
    return new AIRich(sock)
      .setTitle(`🤖 ${bf('JadiBot Manager')}`)
      .setSubtitle(sf('multi device system'))
      .setContextInfo({ ..._mCtx(m.sender) })
      .addText(
        `${div()}\n\n` +
        `ꗃ ${sf('slot aktif')} ⦂ *0 / ${max}*\n` +
        `ꗃ ${sf('slot tersedia')} ⦂ *${max}*\n\n` +
        `${div()}\n\n` +
        `Belum ada slot bot yang aktif.\n` +
        `User dapat mendaftar dengan *.jadibot*`
      )
      .addTip(`${sf('Kapasitas')}: ${max} slot tersedia untuk digunakan`)
      .addSuggest(['.jadibot', '.stopjadibot'])
      .send(m.chat, { quoted: m.raw })
  }

  const tableData = [
    ['Slot', 'Nomor', 'Status', 'Uptime', 'Reconnect'],
    ...slots.map(s => [
      s.slotId,
      `+${s.num}`,
      `${statusIcon(s.status)} ${s.status}`,
      fmtDur(s.startedAt),
      `${s.reconnectCount}x`,
    ]),
  ]

  const emptySlots = []
  for (let i = 1; i <= max; i++) {
    const id = `slot${i}`
    if (!slots.find(s => s.slotId === id)) emptySlots.push(id)
  }

  await new AIRich(sock)
    .setTitle(`🤖 ${bf('JadiBot Manager')}`)
    .setSubtitle(sf('multi device system'))
    .setContextInfo({ ..._mCtx(m.sender) })
    .addText(
      `${div()}\n\n` +
      `ꗃ ${sf('slot aktif')} ⦂ *${used} / ${max}*\n` +
      `ꗃ ${sf('slot kosong')} ⦂ *${free}*\n` +
      `ꗃ ${sf('slot tersedia')} ⦂ ${emptySlots.length ? emptySlots.join(', ') : 'penuh'}\n\n` +
      `${div()}`
    )
    .addTable(tableData)
    .addTip(`${sf('Hentikan slot')}: .stopjadibot slot1 — ${sf('Tambah slot')}: user kirim .jadibot`)
    .addSuggest(['.stopjadibot slot1', '.jadibot', '.restartjadibot'])
    .send(m.chat, { quoted: m.raw })
}
