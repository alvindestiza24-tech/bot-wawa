import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'biblebooks',
  alias: ['kitab', 'daftarkitab', 'books'],
  category: 'christian',
  description: 'Daftar kitab Perjanjian Lama dan Baru',
  usage: '.biblebooks [old|new]',
  example: '.biblebooks new',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const OLD_TESTAMENT = [
  'Kejadian', 'Keluaran', 'Imamat', 'Bilangan', 'Ulangan',
  'Yosua', 'Hakim-hakim', 'Rut', '1 Samuel', '2 Samuel',
  '1 Raja-raja', '2 Raja-raja', '1 Tawarikh', '2 Tawarikh',
  'Ezra', 'Nehemia', 'Ester', 'Ayub', 'Mazmur', 'Amsal',
  'Pengkhotbah', 'Kidung Agung', 'Yesaya', 'Yeremia', 'Ratapan',
  'Yehezkiel', 'Daniel', 'Hosea', 'Yoel', 'Amos',
  'Obaja', 'Yunus', 'Mikha', 'Nahum', 'Habakuk',
  'Zefanya', 'Hagai', 'Zakharia', 'Maleakhi'
]

const NEW_TESTAMENT = [
  'Matius', 'Markus', 'Lukas', 'Yohanes', 'Kisah Para Rasul',
  'Roma', '1 Korintus', '2 Korintus', 'Galatia', 'Efesus',
  'Filipi', 'Kolose', '1 Tesalonika', '2 Tesalonika',
  '1 Timotius', '2 Timotius', 'Titus', 'Filemon',
  'Ibrani', 'Yakobus', '1 Petrus', '2 Petrus',
  '1 Yohanes', '2 Yohanes', '3 Yohanes', 'Yudas', 'Wahyu'
]

export async function handler(m, { sock }) {
  const input = m.text?.trim()?.toLowerCase() || ''
  let title = '📖 Daftar Kitab Alkitab'
  let books = []

  if (input === 'old' || input === 'lama') {
    title = '📜 Perjanjian Lama (39 Kitab)'
    books = OLD_TESTAMENT
  } else if (input === 'new' || input === 'baru') {
    title = '✝️ Perjanjian Baru (27 Kitab)'
    books = NEW_TESTAMENT
  } else {
    books = [...OLD_TESTAMENT, ...NEW_TESTAMENT]
    title = '📖 Semua Kitab Alkitab (66 Kitab)'
  }

  const grouped = []
  for (let i = 0; i < books.length; i += 5) {
    grouped.push(books.slice(i, i + 5).join(', '))
  }

  const text = `## ${title}\n\n${grouped.join('\n')}`

  await new AIRich(sock)
    .setTitle('📚 Daftar Kitab')
    .addText(text)
    .addSuggest(['biblebooks old', 'biblebooks new', 'bible'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}