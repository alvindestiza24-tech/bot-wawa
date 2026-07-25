// plugins/maker/ttqc.js
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { generateIQC } from '../../src/canvas/Tiktokqc.js';
import { uploadBuffer } from '../../src/lib/uploader.js';
import { downloadContentFromMessage } from '@kyyinfinite/baileys';

const DEFAULT_AVATAR = 'https://raw.githubusercontent.com/kyyinfinite/kyyinfinite/main/uploads/1782525389807-6283815201912.jpg';
const FALLBACK_AVATAR_URL = 'https://raw.githubusercontent.com/kyyinfinite/kyyinfinite/main/uploads/1782525389807-6283815201912.jpg';

export const config_ = {
  name: 'ttqc',
  alias: ['tiktokqc', 'tiktokchat'],
  category: 'maker',
  description: 'Membuat gambar TikTok Quote Chat (support avatar dari reply)',
  usage: '.ttqc <username> <teks>',
  example: '.ttqc Ditzzx Just friend kok cemburu 😂😂',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 7,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let [username, ...textArr] = m.args
  let chatText = textArr.join(' ').trim()

  if (!username || username.trim() === '') {
    username = m.pushName || 'User'
  }

  if (!chatText && m.quoted?.body) {
    chatText = m.quoted.body
  }

  if (!chatText) {
    return m.reply(
      '📱 *TikTok Quote Chat Maker*\n\n' +
      '_Cara pakai:_\n' +
      '• `.ttqc <username> <teks>`\n' +
      '• Reply pesan (teks) dengan `.ttqc <username>`\n' +
      '• Reply gambar untuk avatar + `.ttqc <username> <teks>`\n\n' +
      '_Contoh:_\n' +
      '`.ttqc Ditzzx Just friend kok cemburu 😂😂`'
    )
  }

  let avatarPath = DEFAULT_AVATAR

  // Jika ada reply gambar/sticker, download lalu upload untuk dapat URL
  if (m.quoted?.type === 'imageMessage' || m.quoted?.type === 'stickerMessage') {
    try {
      const messageType = m.quoted.type.replace('Message', '')
      const stream = await downloadContentFromMessage(m.quoted.message[messageType], messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      if (buffer && buffer.length > 0) {
        try {
          avatarPath = await uploadBuffer(buffer)
        } catch (uploadErr) {
          console.error('[TTQC] Upload avatar gagal, pakai default:', uploadErr.message)
        }
      }
    } catch (downloadErr) {
      console.error('[TTQC] Download avatar gagal, pakai default:', downloadErr.message)
    }
  }

  // Fallback jika avatar default tidak ada di disk
  if (avatarPath === DEFAULT_AVATAR && !existsSync(DEFAULT_AVATAR)) {
    console.log('[TTQC] Avatar default tidak ditemukan, gunakan URL fallback')
    avatarPath = FALLBACK_AVATAR_URL
  }

  await m.react('⏳')

  try {
    const outputPath = await generateIQC(username, chatText, avatarPath)

    const buffer = await readFile(outputPath)
    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `📱 *TikTok Quote Chat*\n👤 ${username}`,
        mimetype: 'image/png',
      },
      { quoted: m.raw }
    )
    await unlink(outputPath).catch(() => {})
    await m.react('✅')
  } catch (err) {
    console.error('[TTQC] Error:', err.message)
    console.error('[TTQC] Stack:', err.stack)
    await m.react('❌')

    let errorMsg = '❌ Gagal membuat gambar.\n\n'
    if (err.message.includes('No such file')) {
      errorMsg += 'Asset belum terdownload. Coba jalankan ulang bot.'
    } else if (err.message.includes('fetch')) {
      errorMsg += 'Gagal mengunduh asset. Periksa koneksi internet.'
    } else {
      errorMsg += `Detail: ${err.message}`
    }

    await m.reply(errorMsg)
  }
}