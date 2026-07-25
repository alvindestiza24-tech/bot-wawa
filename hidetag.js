// plugins/group/hidetag.js
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: 'hidetag',
  alias: ['ht', 'hdtg', 'sembunyitag'],
  category: 'group',
  description: 'Hidetag pesan dengan mention semua member (support reply teks/media)',
  usage: '.hidetag [pesan] atau reply pesan',
  example: '.hidetag Halo semuanya',
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  prefix: false,
  isAdmin: true,
  isBotAdmin: false,
  cooldown: 15,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock, isOwner, isPremium, isGroupAdmin, isBotAdmin, groupMeta }) {
  const participants = groupMeta?.participants || []
  const mentions = participants.map(p => p.id || p.jid).filter(Boolean)

  const quoted = m.quoted
  const text = m.text?.trim() || m.args?.join(' ')?.trim()

  // ===== REPLY MODE =====
  if (quoted) {
    const qMsg = quoted.message || {}
    const type = quoted.type || Object.keys(qMsg)[0]

    // ===== IMAGE =====
    if (type === 'imageMessage') {
      try {
        const media = await quoted.download()
        const caption = quoted.body || text || ''
        await sock.sendMessage(m.chat, {
          image: media,
          caption,
          mentions
        })
        return
      } catch (err) {
        console.error('[HIDETAG] Gagal download gambar:', err.message)
      }
    }

    // ===== VIDEO =====
    if (type === 'videoMessage') {
      try {
        const media = await quoted.download()
        const caption = quoted.body || text || ''
        await sock.sendMessage(m.chat, {
          video: media,
          caption,
          mentions
        })
        return
      } catch (err) {
        console.error('[HIDETAG] Gagal download video:', err.message)
      }
    }

    // ===== STICKER =====
    if (type === 'stickerMessage') {
      try {
        const media = await quoted.download()
        await sock.sendMessage(m.chat, {
          sticker: media,
          mentions
        })
        if (text) {
          await sock.sendMessage(m.chat, {
            text,
            mentions
          })
        }
        return
      } catch (err) {
        console.error('[HIDETAG] Gagal download stiker:', err.message)
      }
    }

    // ===== AUDIO =====
    if (type === 'audioMessage') {
      try {
        const media = await quoted.download()
        await sock.sendMessage(m.chat, {
          audio: media,
          mimetype: 'audio/mpeg',
          mentions
        })
        if (text) {
          await sock.sendMessage(m.chat, {
            text,
            mentions
          })
        }
        return
      } catch (err) {
        console.error('[HIDETAG] Gagal download audio:', err.message)
      }
    }

    // ===== DOCUMENT =====
    if (type === 'documentMessage') {
      try {
        const media = await quoted.download()
        await sock.sendMessage(m.chat, {
          document: media,
          mimetype: quoted.mimetype || 'application/octet-stream',
          fileName: quoted.fileName || 'file',
          mentions
        })
        if (text) {
          await sock.sendMessage(m.chat, {
            text,
            mentions
          })
        }
        return
      } catch (err) {
        console.error('[HIDETAG] Gagal download dokumen:', err.message)
      }
    }

    // ===== TEXT / LAINNYA =====
    const quotedText = quoted.body || ''
    const finalText = text || quotedText

    if (!finalText) {
      return m.reply(beautifulMessage('❌ Pesan kosong.', { pushName: m.pushName }))
    }

    await sock.sendMessage(m.chat, {
      text: finalText,
      mentions
    })
    return
  }

  // ===== TANPA REPLY =====
  if (!text) {
    return m.reply(
      beautifulMessage(
        `📢 *HIDETAG*\n\n` +
        `• Reply pesan lalu ketik .ht\n` +
        `• Atau ketik .ht <pesan>\n\n` +
        `Support: teks, gambar, video, stiker, audio, dokumen`,
        { pushName: m.pushName }
      )
    )
  }

  await sock.sendMessage(m.chat, {
    text,
    mentions
  })
}