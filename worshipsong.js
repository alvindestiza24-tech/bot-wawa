import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'worshipsong',
  alias: ['lagurohani', 'praise', 'worship'],
  category: 'christian',
  description: 'Dapatkan lirik lagu rohani acak',
  usage: '.worshipsong',
  example: '.worshipsong',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const SONGS = [
  { title: 'Bapa Engkau Sungguh Baik', lyrics: 'Bapa Engkau sungguh baik, kasih setia-Mu kekal. Sepanjang hidupku, kau tak pernah tinggalkan aku. Bapa, aku bersyukur.' },
  { title: 'Kuberikan Hidupku', lyrics: 'Kuberikan hidupku dan seluruh hatiku, hanya untuk-Mu Tuhan Yesus. Di dalam nama-Mu ada keselamatan, hanya Yesus sumber hidupku.' },
  { title: 'Sungguh Indah Nama Yesus', lyrics: 'Sungguh indah nama Yesus, nama yang di atas segala nama. Raja segala raja, Tuhan atas segala tuhan.' },
  { title: 'Di Kakimu', lyrics: 'Di kakimu ku tersungkur, menyembah dan memuji. Kaulah Tuhan yang layak disembah, kekal selamanya.' },
  { title: 'Kasih Yesus', lyrics: 'Kasih Yesus sungguh besar, tak terkira, tak terbilang. Di kayu salib Dia mati, menyelamatkan umat-Nya.' },
  { title: 'Ku Mau Cinta Yesus', lyrics: 'Ku mau cinta Yesus, seumur hidupku. Ku mau ikut Dia, setia sampai akhir.' }
]

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const rand = Math.floor(Math.random() * SONGS.length)
    const song = SONGS[rand]

    await new AIRich(sock)
      .setTitle('🎵 Lagu Rohani')
      .addText(`## ${song.title}\n\n${song.lyrics}`)
      .addSuggest(['worshipsong', 'prayer', 'bible'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}