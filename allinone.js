// plugins/downloader/downr.js
import { downr } from '../../src/scrape/downr.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js';
import axios from 'axios';

export const config_ = {
  name: 'all-in-one',
  alias: ['allinone', 'downloader'],
  category: 'downloader',
  description: 'Download video/foto dari berbagai platform (TikTok, IG, YT, dll) via downr.org',
  usage: '.allinone <url>',
  example: '.allinone https://vt.tiktok.com/xxxxx',
  isOwner: false,
  isPremium: true,  
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
};
export { config_ as config };

function extractUrls(data) {
  if (!data) return [];
  if (typeof data === 'string') return [data];
  if (Array.isArray(data)) {
    return data.flatMap(item => extractUrls(item));
  }
  if (typeof data === 'object') {
    const urls = [];
    for (const key of ['url', 'download', 'link', 'result', 'medias', 'media', 'sources']) {
      if (data[key]) urls.push(...extractUrls(data[key]));
    }
    if (!urls.length) {
      for (const value of Object.values(data)) {
        if (typeof value === 'string' && /^https?:\/\//.test(value)) urls.push(value);
        else if (typeof value === 'object') urls.push(...extractUrls(value));
      }
    }
    return urls;
  }
  return [];
}

export async function handler(m, { sock }) {
  let url = m.args[0];
  if (!url && m.quoted?.body) {
    const match = m.quoted.body.match(/(https?:\/\/[^\s]+)/);
    if (match) url = match[1];
  }
  if (!url) return m.reply(beautifulMessage('❌ Masukkan URL. Contoh: .downr https://vt.tiktok.com/xxxxx', { pushName: m.pushName }));

  await m.react('⏳');
  try {
    const result = await downr(url);
    if (!result.status) {
      return m.reply(beautifulMessage(`❌ Gagal: ${result.error || 'Tidak diketahui'}`, { pushName: m.pushName }));
    }

    const mediaUrls = extractUrls(result.data);
    if (!mediaUrls.length) {
      return m.reply(beautifulMessage('❌ Tidak ada media ditemukan.', { pushName: m.pushName }));
    }

    
    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i];
      try {
        const res = await axios.get(mediaUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const buffer = Buffer.from(res.data);
        const contentType = res.headers['content-type'] || '';
        const isVideo = contentType.includes('video');
        const isAudio = contentType.includes('audio') || mediaUrl.endsWith('.mp3');
        if (isVideo) {
          await sock.sendMessage(m.chat, {
            video: buffer,
            caption: i === 0 ? `📥 *Downloaded via downr*\n🔗 ${url}` : '',
            mimetype: 'video/mp4',
          }, { quoted: m.raw });
        } else if (isAudio) {
          await sock.sendMessage(m.chat, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `audio_${i + 1}.mp3`,
          }, { quoted: m.raw });
        } else {
          await sock.sendMessage(m.chat, {
            image: buffer,
            caption: i === 0 ? `📥 *Downloaded via downr*\n🔗 ${url}` : '',
            mimetype: 'image/jpeg',
          }, { quoted: m.raw });
        }
      } catch (err) {
        console.error(`[DOWNR] Gagal mengunduh media ${i + 1}:`, err.message);
      }
    }

    await m.react('✅');
  } catch (err) {
    console.error('[DOWNR]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}