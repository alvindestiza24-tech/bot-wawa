// plugins/tools/removebg.js
import { removeBg } from '../../src/scrape/removebg.js';
import { downloadContentFromMessage } from '@kyyinfinite/baileys';
import { writeExifImg } from '../../src/lib/exif.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import axios from 'axios';

export const config_ = {
  name: 'removebg',
  alias: ['nobg', 'hapusbg', 'rmbg'],
  category: 'tools',
  description: 'Hapus background gambar menjadi stiker transparan',
  usage: '.removebg (reply gambar)',
  example: '.removebg',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  const target = m.quoted || m;
  const type = target.type || '';

  const isImage = type === 'imageMessage';

  if (!isImage) {
    return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .removebg', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const messageType = type.replace('Message', '');
    const stream = await downloadContentFromMessage(target.message[type], messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (!buffer || buffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mendownload gambar.', { pushName: m.pushName }));
    }

    const resultUrl = await removeBg(buffer);
    if (!resultUrl) {
      return m.reply(beautifulMessage('❌ Gagal menghapus background. Coba gambar lain.', { pushName: m.pushName }));
    }

    // Download gambar hasil
    const res = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    const resultBuffer = Buffer.from(res.data);

    // Konversi ke stiker
    const stickerBuffer = await writeExifImg(resultBuffer);

    await sock.sendMessage(m.chat, {
      sticker: stickerBuffer
    }, { quoted: m.raw });

    await m.react('✅');
  } catch (err) {
    console.error('[REMOVEBG]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Gagal memproses gambar: ${err.message}`, { pushName: m.pushName }));
  }
}