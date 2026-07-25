import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'dzikir',
  alias: ['dzikirpagi', 'dzikirpetang', 'wirid'],
  category: 'islamic',
  description: 'Tampilkan bacaan dzikir pagi/petang atau acak',
  usage: '.dzikir [pagi|petang|random]',
  example: '.dzikir pagi',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const DZIKIR_LIST = {
  pagi: [
    { arab: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', indo: 'Kami telah memasuki waktu pagi dan seluruh kerajaan hanya milik Allah.' },
    { arab: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا', indo: 'Ya Allah, dengan rahmat-Mu kami memasuki waktu pagi dan dengan rahmat-Mu kami memasuki waktu sore.' },
    { arab: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ', indo: 'Maha Suci Allah dan segala puji bagi-Nya sebanyak makhluk-Nya.' }
  ],
  petang: [
    { arab: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', indo: 'Kami telah memasuki waktu petang dan seluruh kerajaan hanya milik Allah.' },
    { arab: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا', indo: 'Ya Allah, dengan rahmat-Mu kami memasuki waktu petang dan dengan rahmat-Mu kami memasuki waktu pagi.' },
    { arab: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', indo: 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk-Nya.' }
  ]
}

export async function handler(m, { sock }) {
  const input = m.text?.trim()?.toLowerCase() || ''

  let type = 'random'
  if (input === 'pagi') type = 'pagi'
  else if (input === 'petang' || input === 'sore') type = 'petang'

  await m.react('⏳')
  try {
    let list = []
    if (type === 'random') {
      const all = [...DZIKIR_LIST.pagi, ...DZIKIR_LIST.petang]
      list = [all[Math.floor(Math.random() * all.length)]]
    } else {
      list = DZIKIR_LIST[type] || DZIKIR_LIST.pagi
    }

    const title = type === 'pagi' ? '🌅 Dzikir Pagi' : type === 'petang' ? '🌇 Dzikir Petang' : '☪️ Dzikir Random'

    const rows = list.map((item, i) => {
      return `**${i+1}.** ${item.arab}\n*${item.indo}*`
    }).join('\n\n')

    const text = `## ${title}\n${rows}`

    await new AIRich(sock)
      .setTitle('📿 Dzikir')
      .addText(text)
      .addSuggest(['dzikir pagi', 'dzikir petang', 'doa'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal: ${err.message}`)
  }
}