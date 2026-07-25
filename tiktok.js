// plugins/downloader/tiktok.js
import { tiktokDl } from '../../src/scrape/tiktok.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { AIRich } from '../../src/lib/_build-m.js';
import axios from 'axios';

export const config_ = {
  name: 'tiktok',
  alias: ['ttdl', 'tiktokdl', 'tt'],
  category: 'downloader',
  description: 'Download video/slide TikTok tanpa watermark (AI Rich)',
  usage: '.tiktok <url>',
  example: '.tiktok https://vt.tiktok.com/xxxxx',
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

  if (!url && m.quoted?.body) {
    const quotedText = m.quoted.body;
    const urlMatch = quotedText.match(/(https?:\/\/(?:vt|vm|www)\.tiktok\.com\/[^\s]+)/);
    if (urlMatch) url = urlMatch[1];
  }

  if (!url) return m.reply(beautifulMessage('❌ Masukkan URL TikTok. Contoh: .tiktok https://vt.tiktok.com/xxxxx', { pushName: m.pushName }));

  if (!/https?:\/\/(vt|vm|www)\.tiktok\.com\//i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari TikTok (vt.tiktok.com / vm.tiktok.com / www.tiktok.com)', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const result = await tiktokDl(url);

    if (!result || !result.status) {
      return m.reply(beautifulMessage(`❌ Gagal mendownload: ${result?.msg || 'Tidak diketahui'}`, { pushName: m.pushName }));
    }

    // Jika slide photo
    if (result.data && result.data[0]?.type === 'photo') {
      for (let i = 0; i < result.data.length; i++) {
        const photo = result.data[i];
        const res = await axios.get(photo.url, { responseType: 'arraybuffer' });
        await sock.sendMessage(m.chat, {
          image: Buffer.from(res.data),
          caption: i === 0 ? `📸 *${result.title || 'Slide TikTok'}*\n👤 ${result.author?.nickname || 'Unknown'}` : '',
          mimetype: 'image/jpeg',
        }, { quoted: m.raw });
      }
      await m.react('✅');
      return;
    }

    // Video
    const videoUrl = result.data?.find(d => d.type === 'nowatermark_hd')?.url ||
                     result.data?.find(d => d.type === 'nowatermark')?.url ||
                     result.data?.[0]?.url;

    if (!videoUrl) {
      return m.reply(beautifulMessage('❌ URL video tidak ditemukan.', { pushName: m.pushName }));
    }

    const stats = result.stats || {};
    const author = result.author || {};

    // Bangun pesan AI Rich
    const builder = new AIRich(sock)
      .setTitle('🎵 TikTok Download')
      .addText(`## ${result.title || 'Tanpa Judul'}\n\n` +
        `👤 **Author:** [${author.nickname || 'Unknown'}](https://www.tiktok.com/@${author.fullname || author.nickname || 'user'})\n\n` +
        `📊 **Statistik:**`)
      .addTable([
        ['❤️ Likes', '💬 Comments', '🔗 Shares', '👁️ Views'],
        [
          stats.likes || '0',
          stats.comment || '0',
          stats.share || '0',
          stats.views || '0'
        ]
      ])
      .addVideo(videoUrl)
      .addSuggest([
        'Download Lagi',
        'Cari TikTok Lain',
      ]);

    if (result.music_info?.url) {
      builder.addTip('🎵 Audio tersedia. Ketik `.ttaudio ' + url + '` untuk download audio saja.');
    }

    await builder.send(m.chat, { quoted: m.raw });
    await m.react('✅');

  } catch (err) {
    console.error('[TIKTOK]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}