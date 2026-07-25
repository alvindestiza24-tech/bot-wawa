import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { generateNews } from '../../src/canvas/kompas.js'
import { downloadContentFromMessage } from '@kyyinfinite/baileys'

export const config_ = {
  name: 'news',
  alias: ['berita', 'newsmaker'],
  category: 'maker',
  description: 'Buat gambar berita dengan teks dan foto (reply gambar atau langsung)',
  usage: '.news <teks> (reply gambar)',
  example: '.news Halo dunia',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  if (!text && m.quoted?.body) text = m.quoted.body
  if (!text) return m.reply('❌ Masukkan teks berita. Contoh: .news Halo dunia')

  // Cek apakah ada gambar yang di-reply atau dikirim langsung dengan caption
  let photoSrc = null
  let mediaTarget = null

  if (m.quoted?.type === 'imageMessage') {
    mediaTarget = m.quoted
  } else if (m.type === 'imageMessage' && m.quoted) {
    mediaTarget = m
  } else if (m.type === 'imageMessage' && !m.quoted) {
    mediaTarget = m
  }

  if (mediaTarget) {
    try {
      const messageType = mediaTarget.type.replace('Message', '')
      const stream = await downloadContentFromMessage(mediaTarget.message[messageType], messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }
      if (buffer && buffer.length > 0) {
        const tempPath = join(process.cwd(), 'storage', '.tmp', `newsphoto-${Date.now()}.jpg`)
        await writeFile(tempPath, buffer)
        photoSrc = tempPath
      }
    } catch (err) {
      console.error('[NEWS] Gagal download foto:', err.message)
    }
  }

  await m.react('⏳')

  try {
    const outputPath = await generateNews(text, photoSrc)
    const buffer = await readFile(outputPath)
    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: `📰 *${text}*`,
      mimetype: 'image/png',
    }, { quoted: m.raw })
    await unlink(outputPath).catch(() => {})
    if (photoSrc) await unlink(photoSrc).catch(() => {})
    await m.react('✅')
  } catch (err) {
    console.error('[NEWS]', err)
    await m.react('❌')
    await m.reply(`❌ Gagal membuat gambar: ${err.message}`)
  }
}