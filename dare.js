import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'dare',
  alias: ['darechallenge', 'tantangan'],
  category: 'game',
  description: 'Dapatkan tantangan dare acak',
  usage: '.dare',
  example: '.dare',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const DARE_LIST = [
  'Kirim pesan ke mantan!',
  'Posting status random di WA',
  'Telepon seseorang dan ceritakan lelucon',
  'Kirim voice note nyanyikan lagu',
  'Lakukan push-up 10 kali',
  'Ceritakan rahasia kecilmu',
  'Kirim stiker paling jelek di grup',
  'Tiru suara artis favoritmu',
  'Posting foto wajah di status',
  'Kirim pesan ke crush dengan "Aku suka kamu"'
]

export async function handler(m, { sock }) {
  const rand = Math.floor(Math.random() * DARE_LIST.length)
  await new AIRich(sock)
    .setTitle('😈 Dare')
    .addText(`## ${DARE_LIST[rand]}`)
    .addSuggest(['dare', 'truth', '8ball'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}