import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'truth',
  alias: ['truthquestion', 'jujur'],
  category: 'game',
  description: 'Dapatkan pertanyaan truth acak',
  usage: '.truth',
  example: '.truth',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const TRUTH_LIST = [
  'Apa hal paling memalukan yang pernah kamu lakukan?',
  'Siapa yang kamu suka diam-diam?',
  'Pernahkah kamu berbohong pada orang tua?',
  'Apa rahasia terbesarmu?',
  'Pernahkah kamu menangis karena film?',
  'Siapa orang yang paling kamu benci?',
  'Pernahkah kamu jatuh cinta pada sahabatmu?',
  'Apa yang paling kamu sesali?',
  'Pernahkah kamu mencuri sesuatu?',
  'Siapa yang paling kamu rindukan?'
]

export async function handler(m, { sock }) {
  const rand = Math.floor(Math.random() * TRUTH_LIST.length)
  await new AIRich(sock)
    .setTitle('🤫 Truth')
    .addText(`## ${TRUTH_LIST[rand]}`)
    .addSuggest(['truth', 'dare', '8ball'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}