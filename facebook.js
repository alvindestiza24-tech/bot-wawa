// plugins/downloader/facebook.js
import { facebookDownloader } from '../../src/scrape/facebook.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { AIRich } from '../../src/lib/_build-m.js';

export const config_ = {
  name: 'facebook',
  alias: ['fbdl', 'fb', 'facebookdl'],
  category: 'downloader',
  description: 'Download video/foto dari Facebook (AI Rich)',
  usage: '.facebook <url>',
  example: '.facebook https://www.facebook.com/share/v/xxxxx',
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
    const urlMatch = quotedText.match(/(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/[^\s]+)/);
    if (urlMatch) url = urlMatch[1];
  }

  if (!url) {
    return m.reply(beautifulMessage(
      '❌ Masukkan URL Facebook.\nContoh: .facebook https://www.facebook.com/share/v/xxxxx',
      { pushName: m.pushName }
    ));
  }

  if (!/https?:\/\/(www\.|web\.|m\.)?facebook\.com\//i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari Facebook (facebook.com)', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const result = await facebookDownloader(url);

    if (!result.status || !result.media || result.media.length === 0) {
      return m.reply(beautifulMessage('❌ Media tidak ditemukan.', { pushName: m.pushName }));
    }

    const builder = new AIRich(sock)
      .setTitle('📘 Facebook Downloader')
      .addText(`## ${result.title || 'Facebook Post'}\n` +
        (result.username ? `👤 **Username:** ${result.username}\n` : '') +
        `📁 **Total Media:** ${result.media.length}`
      );

    // Pisahkan video dan gambar
    const videos = result.media.filter(m => m.type === 'video' || m.type === 'file');
    const images = result.media.filter(m => m.type === 'image' || m.type === 'photo');

    // Kirim video pertama (jika ada)
    if (videos.length > 0) {
      const video = videos[0];
      if (video.url) {
        builder.addVideo(video.url, {
          thumbnail: video.thumbnail || video.cover || '',
          duration: 0,
          file_length: video.size || 0,
          mime_type: 'video/mp4'
        });
      }
    }

    // Kirim gambar
    if (images.length === 1) {
      builder.addImage(images[0].url, { resolveUrl: false });
    } else if (images.length > 1) {
      const reelItems = images.map((img, i) => ({
        username: result.username || 'Facebook',
        profile: 'https://via.placeholder.com/150',
        thumbnail: img.url,
        url: img.url,
        title: `Gambar ${i + 1}`,
        source: 'FB',
        verified: false
      }));
      builder.addReels(reelItems);
    }

    // Tambahkan tabel statistik (opsional)
    if (result.media.length > 0) {
      const rows = [
        ['Tipe', 'Jumlah'],
        ['Video', String(videos.length)],
        ['Gambar', String(images.length)]
      ];
      builder.addTable(rows);
    }

    builder.addSuggest(['Download Lagi', 'Cari Facebook Lain']);

    await builder.send(m.chat, { quoted: m.raw });
    await m.react('✅');

  } catch (err) {
    console.error('[FACEBOOK]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}