// plugins/downloader/instagram.js
import instagramDownloader from '../../src/scrape/instagram.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { AIRich } from '../../src/lib/_build-m.js';

export const config_ = {
  name: 'instagram',
  alias: ['igdl', 'insta', 'ig'],
  category: 'downloader',
  description: 'Download video/foto dari Instagram (AI Rich)',
  usage: '.instagram <url>',
  example: '.instagram https://www.instagram.com/p/xxxxx',
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
    const urlMatch = quotedText.match(/(https?:\/\/www\.instagram\.com\/[^\s]+)/);
    if (urlMatch) url = urlMatch[1];
  }

  if (!url) return m.reply(beautifulMessage('❌ Masukkan URL Instagram. Contoh: .ig https://www.instagram.com/p/xxxxx', { pushName: m.pushName }));

  if (!/https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari Instagram (instagram.com)', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const result = await instagramDownloader(url);

    if (!result || !result.media || result.media.length === 0) {
      return m.reply(beautifulMessage('❌ Media tidak ditemukan.', { pushName: m.pushName }));
    }

    const isStory = url.includes('/stories/');
    const typeLabel = isStory ? 'Story' : 'Post';

    const builder = new AIRich(sock)
      .setTitle('📸 Instagram Downloader')
      .addText(`## ${typeLabel}\n👤 **Username:** ${result.username || '-'}\n` +
        (result.likes ? `❤️ **Likes:** ${result.likes}\n` : '') +
        (result.comment ? `💬 **Comments:** ${result.comment}\n` : '') +
        (result.taken_at ? `📅 **Taken:** ${result.taken_at}\n` : '')
      );

    // Cari video dan gambar dengan deteksi yang lebih baik
    const videos = result.media.filter(m => {
      const type = (m.type || '').toLowerCase();
      return type === 'video' || type === 'mp4' || type === 'reel' || 
             (m.url && /\.(mp4|mov|webm)$/i.test(m.url));
    });

    const images = result.media.filter(m => {
      const type = (m.type || '').toLowerCase();
      return type === 'image' || type === 'photo' || type === 'jpg' || type === 'png' ||
             (m.url && !videos.includes(m) && /\.(jpg|jpeg|png|webp)$/i.test(m.url));
    });

    // Kirim video jika ada
    if (videos.length > 0) {
      const videoUrl = videos[0].url || videos[0];
      if (videoUrl) {
        builder.addVideo(videoUrl);
      }
    }

    // Kirim gambar
    if (images.length === 1) {
      builder.addImage(images[0].url || images[0], { resolveUrl: false });
    } else if (images.length > 1) {
      const reelItems = images.map((img, i) => ({
        username: result.username || 'Instagram',
        profile: 'https://via.placeholder.com/150',
        thumbnail: img.url || img,
        url: img.url || img,
        title: `Gambar ${i + 1}`,
        source: 'IG',
        verified: false
      }));
      builder.addReels(reelItems);
    }

    // Tambahkan saran
    builder.addSuggest(['Download Lagi', 'Cari Instagram Lain']);

    await builder.send(m.chat, { quoted: m.raw });
    await m.react('✅');

  } catch (err) {
    console.error('[INSTAGRAM]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}