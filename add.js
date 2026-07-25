// plugins/group/add.js
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'add',
  alias: ['tambah', 'invite'],
  category: 'group',
  description: 'Tambah anggota ke grup',
  usage: '.add <nomor> [nomor2...]',
  example: '.add 62812xxxx 08xxxx +62xxxx',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  isBotAdmin: true,   // bot harus admin agar bisa menambahkan
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

function cleanNumber(num) {
  let cleaned = String(num).replace(/[^0-9]/g, '') // hapus semua non-digit
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('62')) {
    // sudah benar
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1)
  } else {
    // angka biasa tanpa kode negara, anggap 62
    if (cleaned.length >= 9) cleaned = '62' + cleaned
  }
  return cleaned
}

export async function handler(m, { sock, isGroupAdmin, isOwner, isBotAdmin }) {
  if (!isGroupAdmin && !isOwner) {
    return m.reply('❌ Hanya admin grup yang dapat menambahkan anggota.')
  }
  if (!isBotAdmin) {
    return m.reply('❌ Bot harus menjadi admin grup untuk menambahkan anggota.')
  }

  const input = m.text?.trim() || ''
  if (!input) {
    return m.reply('❌ Masukkan nomor yang ingin ditambahkan.\nContoh: *.add 62812xxxx*')
  }

  const rawNumbers = input.split(/\s+/)
  const results = []

  for (const raw of rawNumbers) {
    const clean = cleanNumber(raw)
    if (clean.length < 9 || clean.length > 16) {
      results.push(`❌ Nomor tidak valid: ${raw}`)
      continue
    }
    const jid = clean + '@s.whatsapp.net'
    try {
      await sock.groupParticipantsUpdate(m.chat, [jid], 'add')
      results.push(`✅ Berhasil menambahkan +${clean}`)
    } catch (err) {
      results.push(`❌ Gagal menambahkan +${clean}: ${err.message}`)
    }
  }

  await m.reply(results.join('\n'))
}