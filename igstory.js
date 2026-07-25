// plugins/maker/igstory.js
import { createFakeStory } from '../../src/canvas/igstory.js';
import { uploadBuffer } from '../../src/lib/uploader.js';

export const config_ = {
  name: 'igstory',
  alias: ['ig', 'story'],
  category: 'maker',
  description: 'Buat fake Instagram Story (reply gambar)',
  usage: '.igstory [teks] | [teks2]',
  example: '.igstory keren banget',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};
export { config_ as config };

export async function handler(m, { sock }) {
  let text1 = '';
  let text2 = '';

  const rawText = m.args.join(' ').trim();
  if (rawText.includes('|')) {
    const parts = rawText.split('|');
    text1 = parts[0]?.trim() || '';
    text2 = parts[1]?.trim() || '';
  } else {
    text1 = rawText;
  }

  if (!m.quoted || (m.quoted.type !== 'imageMessage' && m.quoted.type !== 'stickerMessage')) {
    return m.reply('❌ Reply gambar dengan caption .igstory [teks]');
  }

  await m.react('⏳');

  try {
    const mediaBuffer = await m.quoted.download();
    const imgUrl = await uploadBuffer(mediaBuffer);

    let avatarUrl = null;
    try {
      avatarUrl = await sock.profilePictureUrl(m.sender, 'image');
    } catch {}

    const storyBuffer = await createFakeStory({
      username: m.pushName || 'User',
      timeStr: 'Baru saja',
      avatarSrc: avatarUrl,
      imgTop: imgUrl,
      imgBot: null,
      text1,
      text2,
      mode: text2 ? 3 : 2,
    });

    await sock.sendMessage(m.chat, {
      image: storyBuffer,
      caption: '✅ Story berhasil dibuat!',
      mimetype: 'image/jpeg',
    }, { quoted: m.raw });

    await m.react('✅');
  } catch (err) {
    console.error('[IGSTORY]', err);
    await m.react('❌');
    await m.reply('❌ Gagal membuat story: ' + err.message);
  }
}