import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'doa',
  alias: ['dua', 'doahar', 'doaseharihari'],
  category: 'islamic',
  description: 'Dapatkan doa harian acak',
  usage: '.doa',
  example: '.doa',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const DOA_LIST = [
  { arab: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', indo: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan peliharalah kami dari siksa neraka.', sumber: 'QS. Al-Baqarah: 201' },
  { arab: 'رَبِّ زِدْنِي عِلْمًا', indo: 'Ya Tuhanku, tambahkanlah aku ilmu.', sumber: 'QS. Thaha: 114' },
  { arab: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي', indo: 'Ya Tuhanku, lapangkanlah dadaku, mudahkanlah urusanku, dan lepaskanlah kekakuan dari lidahku, agar mereka mengerti perkataanku.', sumber: 'QS. Thaha: 25-28' },
  { arab: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', indo: 'Tiada Tuhan selain Engkau, Maha Suci Engkau, sesungguhnya aku termasuk orang-orang yang zalim.', sumber: 'QS. Al-Anbiya: 87' },
  { arab: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', indo: 'Cukuplah Allah bagiku, tiada Tuhan selain Dia. Hanya kepada-Nya aku bertawakal dan Dia adalah Rabb yang memiliki Arsy yang agung.', sumber: 'QS. At-Taubah: 129' },
  { arab: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', indo: 'Ya Allah, aku memohon kesehatan kepada-Mu.', sumber: 'HR. Ahmad' },
  { arab: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', indo: 'Ya Allah, aku memohon petunjuk, ketakwaan, kesucian, dan kecukupan.', sumber: 'HR. Muslim' }
]

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const rand = Math.floor(Math.random() * DOA_LIST.length)
    const doa = DOA_LIST[rand]

    const text = `## 🤲 Doa Harian\n${doa.arab}\n\n**Artinya:**\n${doa.indo}\n\n📖 **Sumber:** ${doa.sumber}`

    await new AIRich(sock)
      .setTitle('🤲 Doa Harian')
      .addText(text)
      .addSuggest(['doa', 'dzikir', 'hadits'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}