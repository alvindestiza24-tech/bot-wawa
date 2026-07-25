import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'prayer',
  alias: ['doakristen', 'pray', 'doa'],
  category: 'christian',
  description: 'Dapatkan doa Kristen acak',
  usage: '.prayer',
  example: '.prayer',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const PRAYERS = [
  { title: 'Doa Bapa Kami', text: 'Bapa kami yang di sorga, dikuduskanlah nama-Mu, datanglah kerajaan-Mu, jadilah kehendak-Mu di bumi seperti di sorga. Berikanlah kami pada hari ini makanan kami yang secukupnya dan ampunilah kami akan kesalahan kami, seperti kami juga mengampuni orang yang bersalah kepada kami. Dan janganlah membawa kami ke dalam pencobaan, tetapi lepaskanlah kami dari pada yang jahat. Amin.' },
  { title: 'Doa Pagi', text: 'Tuhan Yesus, di pagi ini aku datang kepada-Mu. Terima kasih untuk kehidupan yang baru. Pimpin langkahku hari ini, berikan hikmat dalam setiap keputusan, dan lindungi aku dari segala kejahatan. Penuhi hatiku dengan damai sejahtera-Mu. Amin.' },
  { title: 'Doa Sebelum Tidur', text: 'Bapa Surgawi, di penghujung hari ini aku bersyukur atas segala berkat dan perlindungan-Mu. Ampunilah dosa-dosaku, bersihkanlah hatiku. Berikanlah istirahat yang nyenyak dan pulihkan kekuatanku. Dalam nama Yesus, aku berdoa. Amin.' },
  { title: 'Doa Syukur', text: 'Tuhan, aku bersyukur untuk kasih setia-Mu yang baru setiap pagi. Syukur untuk kesehatan, keluarga, dan rezeki yang Engkau berikan. Ajarku untuk selalu melihat kebaikan-Mu dalam setiap situasi. Amin.' },
  { title: 'Doa Mohon Kekuatan', text: 'Ya Allah, Engkaulah kekuatanku. Ketika aku lemah, tunjukkanlah kuasa-Mu yang sempurna. Berikan aku keberanian untuk menghadapi tantangan, dan iman untuk percaya bahwa Engkau menyertai aku. Dalam nama Yesus. Amin.' }
]

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const rand = Math.floor(Math.random() * PRAYERS.length)
    const prayer = PRAYERS[rand]

    await new AIRich(sock)
      .setTitle('🙏 Doa Kristen')
      .addText(`## ${prayer.title}\n\n${prayer.text}`)
      .addSuggest(['prayer', 'bible', 'renungan'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}