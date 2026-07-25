// plugins/maker/ovorupiah.js
import { generateOvo } from '../../src/canvas/fake-ovo.js';

export const config_ = {
  name: 'fake-ovo',
  alias: ['ovorf', 'fakeovo'],
  category: 'maker',
  description: 'Buat gambar transfer OVO palsu',
  usage: '.ovorupiah <nominal>',
  example: '.ovorupiah 5000000',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 7,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  let amount = m.args[0];
  if (!amount) {
    return m.reply('❌ Masukkan nominal. Contoh: .ovorupiah 5000000');
  }
  if (!/^\d+$/.test(amount)) {
    return m.reply('❌ Nominal harus angka.');
  }

  await m.react('⏳');
  try {
    const buffer = await generateOvo(amount);
    await sock.sendMessage(m.chat, {
      image: buffer,
      caption: `💸 *OVO Transfer*\nNominal: Rp ${Number(amount).toLocaleString('id-ID')}`,
      mimetype: 'image/png',
    }, { quoted: m.raw });
    await m.react('✅');
  } catch (err) {
    console.error('[OVORUPIAH]', err);
    await m.react('❌');
    await m.reply('❌ Gagal membuat gambar.');
  }
}