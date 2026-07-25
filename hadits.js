import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'hadits',
  alias: ['hadis', 'randomhadits'],
  category: 'islamic',
  description: 'Dapatkan hadits acak (Bukhari, Muslim, dll)',
  usage: '.hadits',
  example: '.hadits',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

const FALLBACK_HADITS = [
  { arab: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', indo: 'Sesungguhnya amal itu tergantung pada niatnya.', narrator: 'Umar bin Khattab', reference: 'HR. Bukhari & Muslim' },
  { arab: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', indo: 'Tidak beriman salah seorang di antara kalian, hingga ia mencintai saudaranya seperti ia mencintai dirinya sendiri.', narrator: 'Anas bin Malik', reference: 'HR. Bukhari & Muslim' },
  { arab: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ', indo: 'Bertakwalah kepada Allah di mana pun engkau berada.', narrator: 'Abu Dzarr', reference: 'HR. Tirmidzi' },
  { arab: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', indo: 'Amalan yang paling dicintai oleh Allah adalah yang kontinu walaupun sedikit.', narrator: 'Aisyah', reference: 'HR. Muslim' },
  { arab: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', indo: 'Barangsiapa beriman kepada Allah dan hari akhir, maka hendaklah ia berkata baik atau diam.', narrator: 'Abu Hurairah', reference: 'HR. Bukhari & Muslim' }
]

async function fetchHadith() {
  try {
    const res = await axios.get('https://api.hadith.sa/v1/hadiths/random', { timeout: 8000 })
    if (res.data?.data) {
      const data = res.data.data
      return {
        arab: data.arab || '',
        indo: data.id || data.translation || '',
        narrator: data.narrator || 'Unknown',
        reference: data.reference || data.source || '-'
      }
    }
  } catch {}
  const rand = Math.floor(Math.random() * FALLBACK_HADITS.length)
  return FALLBACK_HADITS[rand]
}

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const data = await fetchHadith()

    const text = `## 📜 Hadits\n${data.arab || ''}\n\n**Terjemahan:**\n${data.indo || '-'}\n\n📖 **Perawi:** ${data.narrator}\n📌 **Sumber:** ${data.reference}`

    await new AIRich(sock)
      .setTitle('📜 Hadits')
      .addText(text)
      .addSuggest(['hadits', 'quran', 'asmaulhusna'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}