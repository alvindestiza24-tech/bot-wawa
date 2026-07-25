import { getDatabase } from '../database.js'

let schedulerInterval = null

function getCurrentTime() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function startScheduleRunner(sock) {
  if (schedulerInterval) clearInterval(schedulerInterval)

  schedulerInterval = setInterval(async () => {
    const now = getCurrentTime()
    const db = getDatabase()
    const groups = db.getAllGroups()

    for (const [jid, groupData] of groups) {
      if (!groupData) continue

      // Cek jadwal buka
      if (groupData.scheduleOpen === now) {
        try {
          await sock.groupSettingUpdate(jid, 'not_announcement')
          // Kirim notifikasi
          await sock.sendMessage(jid, {
            text: `🔓 *Grup Dibuka Otomatis*\n\nGrup telah dibuka sesuai jadwal (${now} WIB). Semua anggota dapat mengirim pesan.`
          })
        } catch {}
      }

      // Cek jadwal tutup
      if (groupData.scheduleClose === now) {
        try {
          await sock.groupSettingUpdate(jid, 'announcement')
          await sock.sendMessage(jid, {
            text: `🔒 *Grup Dikunci Otomatis*\n\nGrup telah dikunci sesuai jadwal (${now} WIB). Hanya admin yang dapat mengirim pesan.`
          })
        } catch {}
      }
    }
  }, 30_000) // cek setiap 30 detik
}

export function stopScheduleRunner() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
}