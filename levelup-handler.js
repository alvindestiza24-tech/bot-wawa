// src/lib/levelup-handler.js
import { getDatabase }         from '../database.js'
import { getRole }             from './function.js'
import { generateLevelUpCard } from '../canvas/levelup-card.js'
import logger                  from './logger.js'

/**
 * Dipanggil dari handler.js setiap kali updateExp() mendeteksi level naik.
 * Fetch foto profil, generate canvas, kirim ke chat sebagai gambar.
 *
 * @param {object} m       - Serialized message object
 * @param {object} sock    - Baileys socket
 * @param {object} result  - { leveledUp, oldLevel, newLevel } dari updateExp()
 */
export async function handleLevelUp(m, sock, result) {
  const { oldLevel, newLevel } = result

  try {
    const db   = getDatabase()
    const user = db.getUser(m.sender)

    // Nama: prioritas pushName → nomor
    const name = m.pushName?.trim() || m.senderNumber

    // Foto profil — fallback null kalau private / error
    let ppUrl = null
    try {
      ppUrl = await sock.profilePictureUrl(m.sender, 'image')
    } catch {
      // dibiarkan null → levelup-card.js pakai default avatar
    }

    const exp  = user?.exp ?? 0
    const role = getRole(newLevel)

    logger.info('LEVELUP', `${name} naik ke Level ${newLevel} (exp: ${exp})`)

    // Generate canvas
    const cardBuffer = await generateLevelUpCard({
      ppUrl,
      name,
      oldLevel,
      newLevel,
      exp,
      role,
    })

    // Caption notifikasi
    const caption =
      `🎉 *LEVEL UP!* @${m.senderNumber}\n` +
      `Selamat, kamu berhasil naik ke *Level ${newLevel}*! 🚀\n` +
      `Role barumu: *${role}*`

    // Kirim ke chat yang sama
    await sock.sendMessage(
      m.chat,
      {
        image:    cardBuffer,
        caption,
        mentions: [m.sender],
      },
      { quoted: m.data }
    )
  } catch (err) {
    // Jangan crash handler utama karena error level-up
    logger.error('LEVELUP', `Gagal kirim notifikasi: ${err.message}`)
  }
}
