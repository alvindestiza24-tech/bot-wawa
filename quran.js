import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'quran',
  alias: ['ayat', 'randomquran', 'quranrandom'],
  category: 'islamic',
  description: 'Dapatkan ayat Al-Quran acak atau berdasarkan surah:ayat',
  usage: '.quran [surah:ayat]',
  example: '.quran 1:1',
  isOwner: false,
  cooldown: 8,
  isEnabled: true,
}
export { config_ as config }

// Hardcoded fallback untuk surah populer
const FALLBACK_AYAT = {
  '1:1': { surah: 'Al-Fatihah', number: 1, arab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', indo: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.' },
  '1:2': { surah: 'Al-Fatihah', number: 2, arab: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', indo: 'Segala puji bagi Allah, Tuhan seluruh alam.' },
  '1:3': { surah: 'Al-Fatihah', number: 3, arab: 'الرَّحْمَٰنِ الرَّحِيمِ', indo: 'Yang Maha Pengasih, Maha Penyayang.' },
  '1:4': { surah: 'Al-Fatihah', number: 4, arab: 'مَالِكِ يَوْمِ الدِّينِ', indo: 'Pemilik hari pembalasan.' },
  '1:5': { surah: 'Al-Fatihah', number: 5, arab: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', indo: 'Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan.' },
  '1:6': { surah: 'Al-Fatihah', number: 6, arab: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', indo: 'Tunjukilah kami jalan yang lurus.' },
  '1:7': { surah: 'Al-Fatihah', number: 7, arab: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', indo: 'Yaitu jalan orang-orang yang telah Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan jalan mereka yang sesat.' },
  '2:255': { surah: 'Al-Baqarah', number: 255, arab: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ', indo: 'Allah, tidak ada Tuhan selain Dia. Yang Maha Hidup, Yang terus menerus mengurus makhluk-Nya. Tidak mengantuk dan tidak tidur. Milik-Nya apa yang di langit dan apa di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya kecuali apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Maha Tinggi, Maha Agung.' },
  '3:26': { surah: 'Ali-Imran', number: 26, arab: 'قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ وَتَنْزِعُ الْمُلْكَ مِمَّنْ تَشَاءُ وَتُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ بِيَدِكَ الْخَيْرُ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', indo: 'Katakanlah, "Wahai Tuhan pemilik kekuasaan, Engkau berikan kekuasaan kepada siapa yang Engkau kehendaki dan Engkau cabut kekuasaan dari siapa yang Engkau kehendaki. Engkau muliakan siapa yang Engkau kehendaki dan Engkau hinakan siapa yang Engkau kehendaki. Di tangan-Mu-lah segala kebaikan. Sesungguhnya Engkau Maha Kuasa atas segala sesuatu."' },
  '36:1': { surah: 'Yasin', number: 1, arab: 'يس', indo: 'Yasin.' },
  '36:2': { surah: 'Yasin', number: 2, arab: 'وَالْقُرْآنِ الْحَكِيمِ', indo: 'Demi Al-Quran yang penuh hikmah.' },
  '36:3': { surah: 'Yasin', number: 3, arab: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ', indo: 'Sesungguhnya engkau (Muhammad) adalah salah seorang rasul.' },
  '112:1': { surah: 'Al-Ikhlas', number: 1, arab: 'قُلْ هُوَ اللَّهُ أَحَدٌ', indo: 'Katakanlah, "Dialah Allah, Yang Maha Esa."' },
  '112:2': { surah: 'Al-Ikhlas', number: 2, arab: 'اللَّهُ الصَّمَدُ', indo: 'Allah adalah Tuhan yang bergantung kepada-Nya segala sesuatu.' },
  '112:3': { surah: 'Al-Ikhlas', number: 3, arab: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', indo: 'Dia tidak beranak dan tidak diperanakkan.' },
  '112:4': { surah: 'Al-Ikhlas', number: 4, arab: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', indo: 'Dan tidak ada sesuatu yang setara dengan Dia.' }
}

async function fetchAyah(surah, ayah) {
  const key = `${surah}:${ayah}`
  if (FALLBACK_AYAT[key]) {
    return FALLBACK_AYAT[key]
  }

  try {
    const res = await axios.get(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,id.indonesian`,
      { timeout: 15000 }
    )
    if (!res.data?.data) throw new Error('Ayat tidak ditemukan')
    const data = res.data.data
    const arab = data[0]?.text || ''
    const indo = data[1]?.text || ''
    const surahName = data[0]?.surah?.name || 'Unknown'
    return { surah: surahName, number: ayah, arab, indo }
  } catch (err) {
    console.error('[QURAN] API Error:', err.message)
    throw new Error(`Gagal mengambil ayat ${key}: ${err.message}`)
  }
}

async function fetchRandomAyah() {
  try {
    const res = await axios.get('https://api.alquran.cloud/v1/ayah/random/editions/quran-uthmani,id.indonesian', { timeout: 15000 })
    if (!res.data?.data) throw new Error('Ayat tidak ditemukan')
    const data = res.data.data
    const arab = data[0]?.text || ''
    const indo = data[1]?.text || ''
    const surah = data[0]?.surah?.name || 'Unknown'
    const number = data[0]?.numberInSurah || 0
    return { surah, number, arab, indo }
  } catch (err) {
    console.error('[QURAN] Random API Error:', err.message)
    const keys = Object.keys(FALLBACK_AYAT)
    const rand = keys[Math.floor(Math.random() * keys.length)]
    return { ...FALLBACK_AYAT[rand], surah: FALLBACK_AYAT[rand].surah, number: FALLBACK_AYAT[rand].number }
  }
}

export async function handler(m, { sock }) {
  const input = m.text?.trim() || ''

  await m.react('⏳')
  try {
    let result = null
    if (/^\d+:\d+$/.test(input)) {
      const [s, a] = input.split(':').map(Number)
      if (s < 1 || s > 114 || a < 1) return m.reply('❌ Surah (1-114) atau ayat tidak valid')
      result = await fetchAyah(s, a)
    } else {
      result = await fetchRandomAyah()
    }

    const text = `## 📖 Al-Quran\n**${result.surah}** : ${result.number}\n\n${result.arab}\n\n**Terjemahan:**\n${result.indo}`

    await new AIRich(sock)
      .setTitle('📖 Ayat Al-Quran')
      .addText(text)
      .addSuggest(['quran', 'quran 2:255', 'asmaulhusna'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message || 'Terjadi kesalahan'}`)
  }
}