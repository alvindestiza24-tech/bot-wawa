// plugins/maker/bratvermeil.js
import { generateBratVermeil } from '../../src/canvas/bratvid-vermeil.js';
import { addExif } from '../../src/lib/exif.js';
import config from '../../config.js';

export const config_ = {
  name: 'bratvidvermeil',
  alias: ['vermeil', 'bratvidver'],
  category: 'maker',
  description: 'Buat stiker video brat Vermeil dengan teks animasi',
  usage: '.bratvermeil <teks>',
  example: '.bratvermeil Watashi wa Verumei',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 15,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  let text = m.args.join(' ').trim();
  if (!text && m.quoted?.body) text = m.quoted.body;
  if (!text) return m.reply('❌ Masukkan teks. Contoh: .bratvermeil Hallo dunia!');

  await m.react('⏳');
  try {
    const webpBuffer = await generateBratVermeil(text);
    // Tambahkan exif
    const packname = config.bot?.name || 'MyBot';
    const author = config.owner?.name || 'Owner';
    const stickerBuffer = await addExif(webpBuffer, packname, author);
    await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw });
    await m.react('✅');
  } catch (err) {
    console.error('[BRATVERMEIL]', err);
    await m.react('❌');
    await m.reply('❌ Gagal membuat stiker video.');
  }
}