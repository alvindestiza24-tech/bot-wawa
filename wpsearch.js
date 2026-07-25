import wallpaperScraper from '../../src/scrape/wallpaper.js';
import { beautifulMessage } from '../../src/lib/text-formater.js';
import { AIRich } from '../../src/lib/_build-m.js';

export const config_ = {
  name: 'wallpaper',
  alias: ['wp', 'wall', 'background'],
  category: 'search',
  description: 'Cari wallpaper HD dengan tampilan AI Rich',
  usage: '.wallpaper <kata kunci>',
  example: '.wallpaper anime girl',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  const query = m.args.join(' ').trim();
  if (!query) {
    return m.reply(
      beautifulMessage(
        '🖼️ *Wallpaper Search*\n\n' +
        'Masukkan kata kunci untuk mencari wallpaper.\n\n' +
        'Contoh: .wallpaper anime girl',
        { pushName: m.pushName }
      )
    );
  }

  await m.react('⏳');

  try {
    const result = await wallpaperScraper(query);

    if (!result.success || !result.results?.length) {
      return m.reply(
        beautifulMessage(
          `❌ Tidak ditemukan wallpaper untuk: ${query}`,
          { pushName: m.pushName }
        )
      );
    }

    // Ambil maksimal 5 hasil
    const wallpapers = result.results.slice(0, 5);

    // Kirim AI Rich untuk setiap wallpaper
    for (let i = 0; i < wallpapers.length; i++) {
      const wp = wallpapers[i];

      // Bangun teks informasi
      const infoText = 
        `## 🖼️ ${wp.title || 'Wallpaper ' + (i + 1)}\n` +
        `**Resolution:** ${wp.resolution || 'Unknown'}\n` +
        `**Source:** [WallpaperFlare](${wp.page})\n` +
        `**Index:** ${i + 1}/${wallpapers.length}`;

      // Kirim sebagai AI Rich dengan gambar
      const builder = new AIRich(sock)
        .setTitle(`🖼️ Wallpaper ${i + 1}/${wallpapers.length}`)
        .addText(infoText)
        .addImage(wp.image);

      // Tambahkan suggest hanya di wallpaper pertama
      if (i === 0) {
        builder.addSuggest([
          'Cari Wallpaper Lain',
          'Download Gambar',
        ]);
      }

      await builder.send(m.chat, { quoted: m.raw });
    }

    await m.react('✅');
  } catch (err) {
    console.error('[WALLPAPER]', err);
    await m.react('❌');
    await m.reply(
      beautifulMessage(
        `❌ Gagal mencari wallpaper: ${err.message}`,
        { pushName: m.pushName }
      )
    );
  }
}