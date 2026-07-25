// plugins/maker/iqc.js
import { readFile, unlink } from 'fs/promises'
import { render } from '../../src/canvas/Iqcbyrin.js'  // ✅ jalur benar

export const config_ = {
  name: 'iqc',
  alias: ['iphoneqc', 'quotedchat'],
  category: 'maker',
  description: 'Membuat gambar iPhone Quoted Chat',
  usage: '.iqc <teks>',
  example: '.iqc Kesendirian adalah teman terbaik ku 😂😂',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 7,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim()
  let sourceTime = null

  if (!text && m.quoted?.body) {
    text = m.quoted.body
  }

  if (!text) {
    return m.reply(
      '📝 *iPhone Quoted Chat Maker*\n\n' +
      '_Cara pakai:_\n' +
      '• `.iqc <teks>`\n' +
      '• Reply pesan dengan `.iqc`\n\n' +
      '_Contoh:_\n' +
      '`.iqc Kesendirian adalah teman terbaik ku 😂😂`'
    )
  }

  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`

  await m.react('⏳')

  let outputPath
  try {
    outputPath = await render(text, time)
  } catch (err) {
    console.error('[IQC] Render error:', err.message)
    await m.react('❌')
    return m.reply('❌ Gagal membuat gambar. Coba lagi nanti.')
  }

  try {
    const buffer = await readFile(outputPath)
    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `📱 *iPhone Quoted Chat*\n⏰ ${time}`,
        mimetype: 'image/png',
      },
      { quoted: m.raw }
    )
    await unlink(outputPath).catch(() => {})
    await m.react('✅')
  } catch (err) {
    console.error('[IQC] Send error:', err.message)
    await m.react('❌')
    await m.reply('❌ Gagal mengirim gambar.')
  }
}