// plugins/tools/hdr-wink.js
import { hdrWink } from '../../src/scrape/hdr-wink.js';
import { downloadContentFromMessage } from '@kyyinfinite/baileys';
import { beautifulMessage } from '../../src/lib/text-formater.js';

export const config_ = {
  name: 'hdwink',
  alias: ['winkhd', 'upscalewink', 'enhancewink', 'hd2'],
  category: 'tools',
  description: 'Tingkatkan kualitas gambar menjadi HD/HDR menggunakan Wink AI',
  usage: '.hdwink (reply gambar)',
  example: '.hdwink',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 20,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  const target = m.quoted || m;
  const type = target.type || '';

  const isImage = type === 'imageMessage';

  if (!isImage) {
    return m.reply(beautifulMessage('❌ Reply atau kirim gambar dengan caption .hdwink', { pushName: m.pushName }));
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

    const upscaledBuffer = await hdrWink(buffer, target.fileName || 'image.jpg');

    await sock.sendMessage(m.chat, {
      image: upscaledBuffer,
      caption: '✅ *Gambar berhasil ditingkatkan kualitasnya dengan Wink AI!*\n\n✨ *HD/HDR Quality*',
      mimetype: 'image/jpeg',
    }, { quoted: m.raw });

    await m.react('✅');
  } catch (err) {
    console.error('[HDWINK]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Gagal memproses gambar: ${err.message}`, { pushName: m.pushName }));
  }
}