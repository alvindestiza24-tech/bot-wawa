import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'script',
  alias: ['sc', 'freebot', 'scriptbot', 'donasi'],
  category: 'main',
  description: 'Informasi script bot WhatsApp gratis',
  usage: 'sc',
  example: 'sc',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  prefix: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const botName = 'Feldway WhatsApp'
  const developerName = 'AoXue'
  const developerContact = 'https://wa.me/089509275817'
  const channelLink = 'https://whatsapp.com/channel/0029Vb816qs6LwHheK1KT044'
  const websiteLink = 'https://alvindestiza24-tech.github.io/my-tools//'
  const repoLink = ''
 const releasev1 = ''

  const marketingText = `
# 🆓 ${botName} — Script Bot WhatsApp GRATIS!

Dapatkan source code bot WhatsApp lengkap dengan fitur premium secara **gratis**! Bot ini siap pakai dan bisa dikustomisasi sesuai kebutuhan Anda.

## 🤖 Tentang Bot
*Nama Bot:* ${botName}
*Developer:* [${developerName}](${developerContact})
*Channel:* [Official Channel](${channelLink})
*Website:* [Official Site](${websiteLink})
*Repository:* [GitHub](${repoLink})

## 📥 Cara Mendapatkan
1. Join [Channel Official](${channelLink})
2. Download [MediaFire](${releasev1})
3. Ikuti panduan instalasi yang tersedia
4. Bot siap digunakan!

*catatan*:
- versi yang tersedia di platform ini hanyalah versi pertama, jika ingin mencoba script versi terbaru join ke ch devloper [Channel Dev](${channelLink})

## ☕ Dukungan Pengembangan
Jika Anda ingin mendukung pengembangan bot ini, Anda bisa memberikan donasi atau kontribusi melalui:
- [Hubungi Developer](${developerContact})
- [Website Donasi](${websiteLink})

## ❓ FAQ
- *Apakah benar-benar gratis?* Ya, 100% gratis dan open source.
- *Bisa digunakan untuk bisnis?* Tentu, silakan digunakan sesuai kebutuhan.
- *Ada garansi atau support?* Support komunitas melalui channel dan GitHub.
- *Bisa request fitur?* Bisa, buat issue di GitHub atau hubungi developer.
`

  try {
    const builder = new AIRich(sock)
      .setTitle(`🆓 ${botName}`)
      .setFooter(`© ${developerName} — Open Source & Gratis`)
      .addText(marketingText)
      .addText('## 📦 Versi Tersedia')
      .addProduct([
        {
          title: 'Feldway lite version',
          brand: botName,
          price: 'Gratis',
          sale_price: '',
          url: '',
          image: ''
        }
      ])
            .addProduct([
        {
          title: 'Feldway md',
          brand: botName,
          price: 'Gratis',
          sale_price: '',
          url: ,
          image: ''
        }
      ])
      .addTip('💡 Source code tersedia gratis di GitHub. Silakan clone dan gunakan.')
      .addTip('🌟 Dukung proyek ini dengan ⭐ di GitHub atau donasi sukarela.')
      .addSuggest([
        'Kunjungi Channel',
        'Lihat GitHub',
        'Hubungi Developer',
        'Donasi',
        'Tanya Fitur'
      ])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    console.error('[SC]', err)
    await m.reply(`❌ Gagal menampilkan info: ${err.message}`)
  }
}