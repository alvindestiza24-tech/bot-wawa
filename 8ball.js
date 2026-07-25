import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: '8ball',
  alias: ['magicball', 'bolaajaib'],
  category: 'game',
  description: 'Tanya jawab dengan Magic 8-Ball',
  usage: '.8ball <pertanyaan>',
  example: '.8ball Apakah aku akan sukses?',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const ANSWERS = [
  'Ya, pasti.', 'Tidak.', 'Mungkin.', 'Coba lagi nanti.',
  'Sangat mungkin.', 'Ragu-ragu.', 'Tidak tahu.', 'Ya, dengan syarat.',
  'Jangan diharapkan.', 'Tentu saja.', 'Tidak mungkin.', 'Sulit diprediksi.'
]

export async function handler(m, { sock }) {
  const question = m.text?.trim()
  if (!question) return m.reply('❌ Masukkan pertanyaan. Contoh: .8ball Apakah aku sukses?')

  const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]

  await new AIRich(sock)
    .setTitle('🔮 Magic 8-Ball')
    .addText(`## Pertanyaan:\n${question}\n\n**Jawaban:** ${answer}`)
    .addSuggest(['8ball', 'truth', 'dare'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}