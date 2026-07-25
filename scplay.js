import { scdl } from '../../src/scrape/soundcloud.js';
import { AIRich } from '../../src/lib/_build-m.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js';
import axios from 'axios';

export const config_ = {
  name: 'soundcloudplay',
  alias: ['scplay', 'scdl'],
  category: 'downloader',
  description: 'Putar & download lagu dari SoundCloud (AI Rich + audio)',
  usage: '.soundcloudplay <url>',
  example: '.soundcloudplay https://soundcloud.com/...',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  let url = m.args[0];
  if (!url && m.quoted?.body) {
    const match = m.quoted.body.match(/scplay_(https?:\/\/[^\s]+)/);
    if (match) url = match[1];
  }

  if (!url || !url.includes('soundcloud.com')) {
    return m.reply(
      beautifulMessage('❌ Masukkan URL SoundCloud. Contoh: .scplay https://soundcloud.com/artist/track', { pushName: m.pushName })
    );
  }

  await m.react('⏳');

  try {
    const info = await scdl(url);

    if (!info || !info.download_url) {
      return m.reply(beautifulMessage('❌ Gagal mendapatkan info lagu.', { pushName: m.pushName }));
    }

    // Kirim AI Rich
    const infoText = `## 🎵 ${info.title}\n` +
      `**Artist:** ${info.uploader}\n` +
      `**Duration:** ${info.duration}\n` +
      `**Views:** ${info.views}\n` +
      `**Likes:** ${info.likes}\n` +
      `**Size:** ${info.size}`;

    const builder = new AIRich(sock)
      .setTitle('🎧 Now Playing (SoundCloud)')
      .addText(infoText);

    if (info.thumbnail) {
      builder.addImage(info.thumbnail);
    }

    builder.addSuggest(['Download Lagi', 'Cari Lagu Lain']);

    const fakeQuoted = createFakeQuoted();
    await builder.send(m.chat, { quoted: fakeQuoted });

    // Download buffer MP3
    const audioRes = await axios.get(info.download_url, { responseType: 'arraybuffer', timeout: 60000 });
    const audioBuffer = Buffer.from(audioRes.data);

    if (!audioBuffer || audioBuffer.length === 0) {
      return m.reply(beautifulMessage('❌ Gagal mengunduh audio.', { pushName: m.pushName }));
    }

    // Kirim audio sebagai reply
    await sock.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      fileName: `${info.title}.mp3`,
      contextInfo: _mCtx(m.sender),
    }, { quoted: fakeQuoted });

    await m.react('✅');
  } catch (err) {
    console.error('[SCPLAY]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Gagal memutar lagu: ${err.message}`, { pushName: m.pushName }));
  }
}