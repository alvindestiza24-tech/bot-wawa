// plugins/downloader/youtube.js
import { y2mate } from '../../src/scrape/y2mate.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js';
import axios from 'axios';

export const config_ = {
  name: 'youtube',
  alias: ['ytdl', 'ytmp3', 'ytmp4', 'yt'],
  category: 'downloader',
  description: 'Download video/audio YouTube via y2mate',
  usage: '.youtube <url> [mp3/mp4]',
  example: '.youtube https://youtu.be/xxxxx mp3',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  let url = m.args[0];
  let type = m.args[1]?.toLowerCase() || 'mp4';

  if (!url && m.quoted?.body) {
    const quotedText = m.quoted.body;
    const urlMatch = quotedText.match(/(https?:\/\/\S+)/);
    if (urlMatch) url = urlMatch[1];
  }

  if (!url) return m.reply(beautifulMessage('❌ Masukkan URL YouTube. Contoh: .yt https://youtu.be/xxxxx', { pushName: m.pushName }));

  if (!/(youtube\.com|youtu\.be)/i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari YouTube.', { pushName: m.pushName }));
  }

  if (!['mp3', 'mp4'].includes(type)) type = 'mp4';

  await m.react('⏳');

  try {
    const result = await y2mate(url, type, type === 'mp3' ? '128kbps' : '360p');

    if (!result.status) {
      return m.reply(beautifulMessage(`❌ Gagal: ${result.error || 'Tidak diketahui'}`, { pushName: m.pushName }));
    }

    const response = await axios.get(result.url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const filename = `${result.title || 'video'}.${type}`;

    if (type === 'mp3') {
      await sock.sendMessage(m.chat, {
        audio: buffer,
        mimetype: 'audio/mp3',
        fileName: filename
      }, { quoted: m.raw });
    } else {
      await sock.sendMessage(m.chat, {
        video: buffer,
        caption: `🎥 ${result.title}\n📦 ${result.size || '-'}`,
        mimetype: 'video/mp4',
        fileName: filename
      }, { quoted: m.raw });
    }

    await m.react('✅');
  } catch (err) {
    console.error('[YOUTUBE]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}