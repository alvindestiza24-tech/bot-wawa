import { searchSoundCloud } from '../../src/scrape/soundcloud.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { Carousel } from '../../src/lib/_build-m.js';
import { prepareWAMessageMedia } from '@kyyinfinite/baileys';

export const config_ = {
  name: 'soundcloudsearch',
  alias: ['scsearch', 'soundcloud'],
  category: 'search',
  description: 'Cari lagu di SoundCloud (carousel slide)',
  usage: '.soundcloudsearch <judul lagu>',
  example: '.soundcloudsearch faded',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};
export { config_ as config };

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num || 0);
}

export async function handler(m, { sock }) {
  const query = m.args.join(' ').trim();
  if (!query) {
    return m.reply(
      beautifulMessage('❌ Masukkan judul lagu. Contoh: .soundcloudsearch faded', { pushName: m.pushName })
    );
  }

  await m.react('⏳');

  try {
    const result = await searchSoundCloud(query);
    if (!result.success || !result.results?.length) {
      return m.reply(beautifulMessage(`❌ Tidak ditemukan hasil untuk: ${query}`, { pushName: m.pushName }));
    }

    const top5 = result.results.slice(0, 5);

    const cards = await Promise.all(
      top5.map(async (track) => {
        let media = null;
        try {
          if (track.artwork) {
            media = await prepareWAMessageMedia(
              { image: { url: track.artwork } },
              { upload: sock.waUploadToServer }
            );
          }
        } catch {}

        return {
          header: {
            hasMediaAttachment: !!media,
            ...(media ? media : {}),
          },
          body: {
            text: `*${track.title}*\n👤 ${track.artist || 'Unknown'}\n⏱️ ${track.duration || '-'}  ♪ ${track.genre || '-'}\n▶️ ${formatNumber(track.plays)} plays  ❤️ ${formatNumber(track.likes)} likes`,
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                  display_text: '▶️ Putar',
                  id: `scplay_${track.url}`,
                }),
              },
              {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: '🔗 Buka',
                  url: track.url,
                }),
              },
            ],
          },
        };
      })
    );

    const carousel = new Carousel(sock)
      .setBody(`🔍 *Hasil Pencarian SoundCloud*\nQuery: "${query}"\nGeser untuk melihat lagu.`)
      .setFooter('SoundCloud Search')
      .addCard(cards)
      .build(m.chat);

    await sock.relayMessage(m.chat, carousel.message, { messageId: carousel.key.id });
    await m.react('✅');
  } catch (err) {
    console.error('[SCSEARCH]', err);
    await m.react('❌');
    await m.reply(beautifulMessage(`❌ Gagal mencari lagu: ${err.message}`, { pushName: m.pushName }));
  }
}