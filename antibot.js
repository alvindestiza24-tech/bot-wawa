// plugins/group/antibot.js
// Toggle sistem bot-detector (src/lib/bot-detector.js) per grup.
// Flag yang dikontrol: groupData.botDetection (boolean)
// Default: OFF — admin grup harus aktifkan secara manual.

import { getDatabase } from '../../src/database.js'
import config          from '../../config.js'

export const config_ = {
  name:        'antibot',
  alias:       ['botdetect', 'botdeteksi', 'detectbot'],
  category:    'group',
  description: 'Aktifkan/nonaktifkan sistem deteksi bot otomatis di grup ini',
  usage:       '.antibot [on|off|status]',
  example:     '.antibot on',
  isOwner:     false,
  isPremium:   false,
  isGroup:     true,
  isPrivate:   false,
  isAdmin:     true,
  isBotAdmin:  false,
  cooldown:    5,
  isEnabled:   true,
}
export { config_ as config }

// ── Format helper ──────────────────────────────────────────────────────────
function fmtBool(val) {
  return val ? '✅ Aktif' : '❌ Nonaktif'
}

function buildStatusText(groupData) {
  const bd      = groupData?.botDetection
  const bdCfg   = config.security?.botDetection || {}
  const sc      = bdCfg.scoring    || {}
  const thr     = bdCfg.thresholds || {}
  const actions = bdCfg.actions    || {}
  const cd      = bdCfg.cooldown   || {}
  const dvc     = bdCfg.deviceId   || {}

  return (
    `🤖 *AntiBot Detector*\n` +
    `Status: ${bd ? '✅ *AKTIF*' : '❌ *NONAKTIF*'}\n` +
    `\n` +

    `━━━ *Ambang Batas Aksi* ━━━\n` +
    `⚠️ Peringatan  : skor ≥ ${thr.warn  ?? 20}\n` +
    `🗑️ Hapus pesan : skor ≥ ${thr.delete ?? 40}\n` +
    `👢 Kick        : skor ≥ ${thr.kick   ?? 60}\n` +
    `🔨 Ban permanen: skor ≥ ${thr.ban    ?? 80}\n` +
    `\n` +

    `━━━ *Bobot Indikator* ━━━\n` +
    `📤 Forwarding score tinggi : +${sc.forwardingScoreHigh ?? 20}\n` +
    `📤 Forwarding score max    : +${sc.forwardingScoreMax  ?? 40}\n` +
    `📰 Pesan newsletter        : +${sc.newsletter     ?? 20}\n` +
    `🤖 Bot metadata            : +${sc.botMetadata    ?? 25}\n` +
    `⚙️ Protocol message        : +${sc.protocolMessage ?? 30}\n` +
    `🔁 Reply ke bot sendiri    : +${sc.quotedBot      ?? 15}\n` +
    `📛 Nama mencurigakan       : +${sc.pushNameSuspicious ?? 10}\n` +
    `📱 Device ID anomali       : +${sc.deviceIdAnomaly    ?? 15}\n` +
    `🔄 Ganti device (1 menit)  : +${sc.deviceIdChange     ?? 20}\n` +
    `🌐 JID tidak dikenal       : +${sc.unknownJid          ?? 10}\n` +
    `\n` +

    `━━━ *Konfigurasi* ━━━\n` +
    `Max device ID : ${dvc.maxAllowedDeviceId ?? 5}\n` +
    `Max pesan/mnt : ${cd.maxMessagesPerWindow ?? 15}\n` +
    `\n` +

    `━━━ *Aksi yang Diaktifkan* ━━━\n` +
    `📝 Log keamanan  : ${fmtBool(actions.log           !== false)}\n` +
    `⚠️ Warn user     : ${fmtBool(actions.warnUser      !== false)}\n` +
    `🗑️ Hapus pesan  : ${fmtBool(actions.deleteMessage  !== false)}\n` +
    `👢 Kick dari grup: ${fmtBool(actions.kickFromGroup  !== false)}\n` +
    `🔨 Ban permanen  : ${fmtBool(actions.banUser        !== false)}\n` +
    `📲 Notif owner   : ${fmtBool(actions.notifyOwner    !== false)}\n` +
    `\n` +
    `_Ubah konfigurasi di \`config.js → security.botDetection\`_`
  )
}

// ── Handler utama ─────────────────────────────────────────────────────────
export async function handler(m, { sock }) {
  const db      = getDatabase()
  const gData   = db.getGroup(m.chat) || db.setGroup(m.chat, {})
  const sub     = (m.args[0] || '').toLowerCase()

  // ── Tanpa argumen atau .antibot status → tampilkan status ─────────────
  if (!sub || sub === 'status') {
    return m.reply(buildStatusText(gData))
  }

  // ── .antibot on ────────────────────────────────────────────────────────
  if (sub === 'on') {
    if (gData.botDetection === true) {
      return m.reply(
        `ℹ️ *AntiBot sudah aktif* di grup ini.\n` +
        `Ketik *.antibot status* untuk melihat konfigurasi.`
      )
    }

    gData.botDetection = true
    db.setGroup(m.chat, gData)
    await m.react('✅')
    return m.reply(
      `✅ *AntiBot Detector diaktifkan!*\n\n` +
      `Sistem akan menganalisis setiap pesan masuk dan mengambil tindakan otomatis:\n` +
      `• Skor ≥ ${config.security?.botDetection?.thresholds?.warn    ?? 20} → ⚠️ Peringatan\n` +
      `• Skor ≥ ${config.security?.botDetection?.thresholds?.delete  ?? 40} → 🗑️ Pesan dihapus\n` +
      `• Skor ≥ ${config.security?.botDetection?.thresholds?.kick    ?? 60} → 👢 Dikick\n` +
      `• Skor ≥ ${config.security?.botDetection?.thresholds?.ban     ?? 80} → 🔨 Dibanned\n\n` +
      `_Ketik *.antibot status* untuk detail konfigurasi._`
    )
  }

  // ── .antibot off ───────────────────────────────────────────────────────
  if (sub === 'off') {
    if (!gData.botDetection) {
      return m.reply(`ℹ️ *AntiBot sudah nonaktif* di grup ini.`)
    }

    gData.botDetection = false
    db.setGroup(m.chat, gData)
    await m.react('❌')
    return m.reply(
      `❌ *AntiBot Detector dinonaktifkan.*\n\n` +
      `Sistem tidak akan lagi menganalisis pesan di grup ini.\n` +
      `Ketik *.antibot on* untuk mengaktifkan kembali.`
    )
  }

  // ── Perintah tidak dikenal ─────────────────────────────────────────────
  return m.reply(
    `❓ Perintah tidak dikenal.\n\n` +
    `*Penggunaan:*\n` +
    `• \`.antibot on\` — aktifkan deteksi bot\n` +
    `• \`.antibot off\` — nonaktifkan\n` +
    `• \`.antibot status\` — lihat status & konfigurasi`
  )
}
