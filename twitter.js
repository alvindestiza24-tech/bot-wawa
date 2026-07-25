// plugins/downloader/twitter.js
import { x2twitterDl } from '../../src/scrape/twitter.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'twitter',
  alias: ['xdl', 'twitterdl', 'x'],
  category: 'downloader',
  description: 'Download video/foto dari Twitter/X (AI Rich)',
  usage: '.twitter <url>',
  example: '.twitter https://x.com/user/status/123',
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
    const urlMatch = quotedText.match(/(https?:\/\/(?:twitter\.com|x\.com)\/[^\s]+)/);
    if (urlMatch) url = urlMatch[1];
  }

  if (!url) return m.reply(beautifulMessage('❌ Masukkan URL Twitter/X. Contoh: .twitter https://x.com/user/status/123', { pushName: m.pushName }));

  if (!/https?:\/\/(twitter\.com|x\.com)\//i.test(url)) {
    return m.reply(beautifulMessage('❌ URL harus dari Twitter/X', { pushName: m.pushName }));
  }

  await m.react('⏳');

  try {
    const result = await x2twitterDl(url);

    if (result.error) {
      return m.reply(beautifulMessage(`❌ Gagal mendownload: ${result.message}`, { pushName: m.pushName }));
    }

    const { metadata, videos, audio } = result;
    const duration = metadata?.duration || '-';
    const thumbnail = metadata?.thumbnail || null;

    const infoText = `## 🐦 Twitter Download\n` +
      `**Duration:** ${duration}\n` +
      (videos.length > 0 ? `**Resolutions:** ${videos.map(v => v.resolution).join(', ')}\n` : '') +
      (audio ? `**Audio:** Tersedia ✅\n` : '');

    const builder = new AIRich(sock)
      .setTitle('🐦 Twitter Downloader')
      .addText(infoText);

    if (thumbnail && thumbnail !== '-') {
      builder.addImage(thumbnail);
    }

    builder.addSuggest(['Download Lagi', 'Download Audio']);

    await builder.send(m.chat, { quoted: m.raw });

    if (videos.length > 0) {
      const bestVideo = videos[videos.length - 1]; // ambil resolusi tertinggi
      const videoBuilder = new AIRich(sock);
      videoBuilder.addVideo(bestVideo.url);
      await videoBuilder.send(m.chat, { quoted: m.raw });
    }

   
    if (audio && audio.url) {
      const audioBuilder = new AIRich(sock);
      audioBuilder.addVideo(audio.url); // audio dikirim sebagai video card
      await audioBuilder.send(m.chat, { quoted: m.raw });
    }

    await m.react('✅');
  } catch (err) {
    console.error('[TWITTER]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Error: ${err.message}`, { pushName: m.pushName }));
  }
}