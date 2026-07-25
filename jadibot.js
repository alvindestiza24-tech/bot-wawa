import { generateWAMessageFromContent } from '@kyyinfinite/baileys'
import {
  createSlot,
  setPending,
  getPending,
  clearPending,
  hasSlotByOwner,
  getSlotCount,
  getMaxSlots,
} from '../../src/lib/jadibot-manager.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import { sf, bf, div } from '../../src/lib/text-formater.js'
import config from '../../config.js'

export const config_ = {
  name:        'jadibot',
  // jadibot_confirm & jadibot_cancel WAJIB ada agar interactiveResponseMessage
  // (klik tombol quick_reply) terpetakan ke handler ini.
  // Ketika user klik tombol, m.body = '.jadibot_confirm' → m.command = 'jadibot_confirm'
  // Plugin store mencari 'jadibot_confirm' → harus terdaftar sebagai alias.
  alias:       ['jb', 'jadibots', 'daftarbot', 'jadibot_confirm', 'jadibot_cancel'],
  category:    'owner',
  description: 'Daftar menjadi bot (JadiBot)',
  usage:       '.jadibot',
  example:     '.jadibot',
  isOwner:     false,
  isPremium:   false,
  isGroup:     false,
  isPrivate:   true,
  cooldown:    10,
  isEnabled:   true,
}
export { config_ as config }

const PREFIX_CONFIRM = '.jadibot_confirm'
const PREFIX_CANCEL  = '.jadibot_cancel'

function sendConfirmButton(sock, jid, senderNum, senderName) {
  const available = getMaxSlots() - getSlotCount()
  const text = [
    `⡔⢤⡀⠀⠀⠀⣠⡤⢠`,
    `⠓⣶⣿⠶⢾⡿⠶⠊`,
    `⠀⢸⡏⠀⠀⢻⡆ ─ ${bf('JadiBot')} ꞌꞋ ${sf('request')}`,
    `⠀⠈⢿⠀ ⠀⡯⠋ ε⃘з`,
    `⠀⠀⠈⠤⠁`,
    ``,
    `${div()}`,
    ``,
    `ꗃ ${sf('nama')} ⦂ ${senderName || senderNum}`,
    `ꗃ ${sf('nomor')} ⦂ +${senderNum}`,
    `ꗃ ${sf('slot tersedia')} ⦂ ${available}/${getMaxSlots()}`,
    ``,
    `${div()}`,
    ``,
    `*${sf('Apakah kamu ingin menjadikan nomor ini sebagai bot?')}*`,
    ``,
    `• Bot akan terhubung menggunakan nomor kamu`,
    `• Kamu akan mendapat pairing code`,
    `• Bot aktif maksimal ${getMaxSlots()} slot sekaligus`,
    `• Kamu bisa menghentikan kapan saja dengan *.stopjadibot*`,
    ``,
    `⏰ ${sf('Konfirmasi berlaku 2 menit')}`,
  ].join('\n')

  const msg = generateWAMessageFromContent(
    jid,
    {
      interactiveMessage: {
        header: { title: '', subtitle: '', hasMediaAttachment: false },
        body:   { text },
        footer: { text: config.bot?.name || 'Bot' },
        contextInfo: { ..._mCtx(null) },
        nativeFlowMessage: {
          buttons: [
            {
              name:             'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '✅ Ya, jadikan saya bot!',
                id:           PREFIX_CONFIRM,
              }),
            },
            {
              name:             'quick_reply',
              buttonParamsJson: JSON.stringify({
                display_text: '❌ Batal',
                id:           PREFIX_CANCEL,
              }),
            },
          ],
        },
      },
    },
    { quoted: createFakeQuoted() }
  )

  return sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
}

async function sendPairingCodeMsg(sock, jid, slotId, code) {
  const text = [
    `✅ *${bf('Pairing Code Berhasil Dibuat')}*`,
    ``,
    `${div()}`,
    ``,
    `🤖 ${sf('Slot')} ⦂ *${slotId}*`,
    `🔑 ${sf('Pairing Code')} ⦂`,
    ``,
    `*${code}*`,
    ``,
    `${div()}`,
    ``,
    `*${sf('Cara memasangkan:')}*`,
    `1. Buka WhatsApp di HP kamu`,
    `2. Tap ⋮ → Perangkat Tertaut`,
    `3. Tap *Tautkan dengan nomor telepon*`,
    `4. Masukkan kode di atas`,
    ``,
    `⏰ ${sf('Kode berlaku beberapa menit')}`,
    `ℹ️ ${sf('Setelah terhubung, bot aktif otomatis')}`,
  ].join('\n')

  const msg = generateWAMessageFromContent(
    jid,
    {
      interactiveMessage: {
        header: { title: '', subtitle: '', hasMediaAttachment: false },
        body:   { text },
        footer: { text: config.bot?.name || 'Bot' },
        contextInfo: { ..._mCtx(null) },
        nativeFlowMessage: {
          buttons: [
            {
              name:             'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: '📋 Copy Pairing Code',
                copy_code:    code,
              }),
            },
          ],
        },
      },
    },
    { quoted: createFakeQuoted() }
  )

  return sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
}

export async function handler(m, { sock }) {
  const cmd = m.body?.trim()

  // ── CANCEL (tombol atau teks langsung) ──────────────────────────────────
  if (cmd === PREFIX_CANCEL) {
    clearPending(m.senderNumber)
    return m.reply(`❌ Dibatalkan. Ketik *.jadibot* kapan saja jika ingin mencoba lagi.`)
  }

  // ── CONFIRM (klik tombol "Ya, jadikan saya bot!") ────────────────────────
  if (cmd === PREFIX_CONFIRM) {
    const pending = getPending(m.senderNumber)
    if (!pending) {
      return m.reply(`⚠️ Sesi konfirmasi kamu sudah expired. Ketik *.jadibot* untuk memulai ulang.`)
    }

    clearPending(m.senderNumber)
    await m.react('⏳')

    const result = await createSlot(
      m.senderNumber,
      m.sender,
      pending.num,
      sock
    )

    if (!result.success) {
      await m.react('❌')
      return m.reply(`❌ *Gagal membuat slot*\n\n${result.message}`)
    }

    await m.react('✅')

    if (result.pairingCode) {
      await sendPairingCodeMsg(sock, m.chat, result.slotId, result.pairingCode)
    } else {
      await m.reply(
        `✅ *Slot ${result.slotId} berhasil dibuat!*\n\n` +
        `Sesi sebelumnya terdeteksi. Bot sedang menghubungkan...`
      )
    }
    return
  }

  if (hasSlotByOwner(m.senderNumber)) {
    return m.reply(
      `⚠️ Kamu sudah memiliki slot bot aktif!\n\n` +
      `Gunakan *.stopjadibot* untuk menghentikannya terlebih dahulu,\n` +
      `atau *.listjadibot* untuk melihat status slot kamu.`
    )
  }

  if (getSlotCount() >= getMaxSlots()) {
    return m.reply(
      `❌ *Semua slot penuh (${getMaxSlots()}/${getMaxSlots()})*\n\n` +
      `Tidak ada slot yang tersedia saat ini. Coba lagi nanti.`
    )
  }

  setPending(m.senderNumber, {
    num:      m.senderNumber,
    ownerJid: m.sender,
  })

  await sendConfirmButton(sock, m.chat, m.senderNumber, m.pushName)
}
