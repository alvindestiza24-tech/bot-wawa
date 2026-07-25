import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'renungan',
  alias: ['devotional', 'devosi', 'renung'],
  category: 'christian',
  description: 'Renungan harian Kristen',
  usage: '.renungan',
  example: '.renungan',
  isOwner: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

const DEVOTIONS = [
  { title: 'Kasih yang Tidak Bersyarat', text: 'Allah mengasihi kita bukan karena kita sempurna, tetapi karena Dia adalah kasih. Kasih-Nya tidak tergantung pada prestasi kita, melainkan pada karakter-Nya yang setia. Hari ini, terimalah kasih-Nya yang tidak bersyarat dan biarkan itu mengubah cara kita mengasihi sesama.' },
  { title: 'Percaya di Tengah Badai', text: 'Ketika badai kehidupan melanda, ingatlah bahwa Yesus ada di dalam perahu bersama kita. Dia tidak pernah meninggalkan kita sendirian. Percayalah pada-Nya, bahkan ketika ombak terlihat besar, karena Dia berkuasa atas segala sesuatu.' },
  { title: 'Anugerah yang Cukup', text: 'Anugerah Tuhan cukup untuk setiap kelemahan kita. Tidak ada dosa yang terlalu besar untuk diampuni, tidak ada luka yang terlalu dalam untuk disembuhkan. Datanglah kepada-Nya dengan kerendahan hati, dan Dia akan memulihkan jiwamu.' },
  { title: 'Berjalan dalam Terang', text: 'Terang Kristus menerangi jalan kita. Ketika kita berjalan dalam terang-Nya, kita tidak perlu takut akan kegelapan. Hari ini, pilihlah untuk hidup dalam kebenaran dan kejujuran, karena Roh Kudus memimpin kita ke dalam seluruh kebenaran.' },
  { title: 'Kesetiaan dalam Hal Kecil', text: 'Tuhan menghargai kesetiaan kita dalam hal-hal kecil. Jangan meremehkan doa singkat, perbuatan baik, atau kata-kata penghiburan. Semua itu adalah benih yang akan menghasilkan buah dalam kerajaan-Nya.' }
]

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const today = new Date().getDate()
    const index = today % DEVOTIONS.length
    const devo = DEVOTIONS[index]

    await new AIRich(sock)
      .setTitle('☀️ Renungan Harian')
      .addText(`## ${devo.title}\n\n${devo.text}`)
      .addSuggest(['renungan', 'bible', 'doa kristen'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}