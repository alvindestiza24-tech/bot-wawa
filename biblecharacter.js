import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'biblecharacter',
  alias: ['tokohalkitab', 'character', 'saint'],
  category: 'christian',
  description: 'Dapatkan informasi tentang tokoh Alkitab',
  usage: '.biblecharacter [nama]',
  example: '.biblecharacter Daud',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const CHARACTERS = [
  { name: 'Daud', description: 'Raja Israel yang terkenal. Daud adalah seorang gembala yang menjadi raja. Dia dikenal sebagai "orang yang berkenan di hati Allah". Menulis banyak Mazmur.' },
  { name: 'Moses', description: 'Nabi besar yang memimpin bangsa Israel keluar dari Mesir. Menerima 10 Perintah Allah di Gunung Sinai. Nama lain: Musa.' },
  { name: 'Yesus', description: 'Anak Allah yang menjadi manusia. Juruselamat dunia. Mengajar tentang kasih, mengampuni dosa, dan mati di kayu salib untuk menebus dosa manusia.' },
  { name: 'Petrus', description: 'Rasul Yesus, nama asli Simon. Diberi nama Petrus yang berarti "batu karang". Menjadi pemimpin gereja mula-mula.' },
  { name: 'Paulus', description: 'Rasul bagi bangsa-bangsa bukan Yahudi. Awalnya bernama Saulus dan menganiaya orang Kristen, tetapi bertobat setelah bertemu Yesus.' },
  { name: 'Maria', description: 'Ibu Yesus. Seorang perawan yang dipilih Allah untuk melahirkan Juruselamat. Penuh iman dan ketaatan.' },
  { name: 'Abraham', description: 'Bapa orang percaya. Dipanggil Allah untuk keluar dari tanah kelahirannya dan menjadi bangsa yang besar. Diuji imannya ketika diminta mempersembahkan Ishak.' },
  { name: 'Yusuf', description: 'Anak Yakub yang dijual oleh saudara-saudaranya ke Mesir. Kemudian menjadi pemimpin Mesir dan menyelamatkan keluarganya dari kelaparan.' },
  { name: 'Ruth', description: 'Perempuan Moab yang setia kepada Naomi dan Allah Israel. Nenek moyang Raja Daud.' },
  { name: 'Yohanes Pembaptis', description: 'Nabi yang mempersiapkan jalan bagi Yesus. Membaptis orang di sungai Yordan dan menyerukan pertobatan.' }
]

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''
  await m.react('⏳')
  try {
    let character = null
    if (input) {
      const found = CHARACTERS.find(c => c.name.toLowerCase() === input.toLowerCase())
      if (found) character = found
    }
    if (!character) {
      const rand = Math.floor(Math.random() * CHARACTERS.length)
      character = CHARACTERS[rand]
    }

    const text = `## 👤 ${character.name}\n\n${character.description}`

    await new AIRich(sock)
      .setTitle('📖 Tokoh Alkitab')
      .addText(text)
      .addSuggest(['biblecharacter Daud', 'biblecharacter Paulus', 'bible'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}