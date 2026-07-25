import { AIRich } from '../../src/lib/_build-m.js'
import { getDatabase } from '../../src/database.js'

export const config_ = {
  name: 'jadwal',
  alias: ['setjadwal', 'jadwalopen', 'jadwalclose', 'deljadwal', 'schedule'],
  category: 'group',
  description: 'Atur jadwal buka/tutup grup otomatis',
  usage: '.setjadwal open 06:00 | .setjadwal close 22:00 | .jadwal | .deljadwal',
  example: '.setjadwal open 06:00',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

function formatTime(time) {
  if (!time) return '—'
  const [h, m] = time.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')} WIB`
}

export async function handler(m, { sock, isGroupAdmin, isOwner }) {
  if (!isGroupAdmin && !isOwner) {
    return m.reply('❌ Hanya admin grup yang dapat mengatur jadwal.')
  }

  const db = getDatabase()
  const group = db.getGroup(m.chat) || db.setGroup(m.chat, {})
  const command = m.command?.toLowerCase() || ''
  const args = m.args || []

  // Lihat jadwal saat ini
  if (command === 'jadwal' || command === 'schedule') {
    const openTime = group.scheduleOpen || null
    const closeTime = group.scheduleClose || null

    if (!openTime && !closeTime) {
      return m.reply('📅 Belum ada jadwal buka/tutup untuk grup ini. \n gunakan command *.setjadwal*')
    }

    const text = [
      '📅 *Jadwal Buka/Tutup Otomatis*',
      '',
      `🔓 Buka : ${formatTime(openTime)}`,
      `🔒 Tutup: ${formatTime(closeTime)}`,
      '',
      'Gunakan *.setjadwal open/tutup HH:MM* untuk mengubah.',
    ].join('\n')

    await new AIRich(sock)
      .setTitle('📅 Jadwal Grup')
      .addText(text)
      .addSuggest(['setjadwal open 06:00', 'setjadwal close 22:00', 'deljadwal'])
      .send(m.chat, { quoted: m.raw })
    return
  }

  // Hapus jadwal
  if (command === 'deljadwal') {
    delete group.scheduleOpen
    delete group.scheduleClose
    db.setGroup(m.chat, group)

    await new AIRich(sock)
      .setTitle('🗑️ Jadwal Dihapus')
      .addText('Jadwal buka/tutup otomatis telah dihapus.')
      .send(m.chat, { quoted: m.raw })
    return
  }

  // Atur jadwal
  if (command === 'setjadwal') {
    const type = args[0]?.toLowerCase()
    const time = args[1]

    if (!type || !time || !['open', 'close'].includes(type)) {
      return m.reply('❌ Format: *.setjadwal open/tutup HH:MM*\nContoh: *.setjadwal open 06:00*')
    }

    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      return m.reply('❌ Format waktu salah. Gunakan HH:MM (contoh: 06:00, 22:00).')
    }

    const [hour, minute] = time.split(':').map(Number)
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return m.reply('❌ Jam tidak valid (0-23, 0-59).')
    }

    if (type === 'open') {
      group.scheduleOpen = time
    } else {
      group.scheduleClose = time
    }

    db.setGroup(m.chat, group)

    const emoji = type === 'open' ? '🔓' : '🔒'
    const action = type === 'open' ? 'Buka' : 'Tutup'

    await new AIRich(sock)
      .setTitle(`${emoji} Jadwal ${action}`)
      .addText(`Grup akan otomatis *${action.toLowerCase()}* setiap hari pukul *${formatTime(time)}*.`)
      .addSuggest(['jadwal', 'setjadwal', 'deljadwal'])
      .send(m.chat, { quoted: m.raw })
    return
  }

  return m.reply('Gunakan *.jadwal* untuk melihat jadwal, *.setjadwal open/tutup HH:MM* untuk mengatur.')
}