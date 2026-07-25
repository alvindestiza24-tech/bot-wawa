import crypto from 'crypto'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'hash',
  alias: ['md5', 'sha1', 'sha256'],
  category: 'tools',
  description: 'Generate hash MD5, SHA1, SHA256 dari teks',
  usage: '.hash <md5|sha1|sha256> <teks>',
  example: '.hash md5 hello',
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 2) return m.reply('❌ Format: .hash <md5|sha1|sha256> <teks>')

  const method = args[0].toLowerCase()
  const text = args.slice(1).join(' ')

  let hash
  switch (method) {
    case 'md5':
      hash = crypto.createHash('md5').update(text).digest('hex')
      break
    case 'sha1':
      hash = crypto.createHash('sha1').update(text).digest('hex')
      break
    case 'sha256':
      hash = crypto.createHash('sha256').update(text).digest('hex')
      break
    default:
      return m.reply('❌ Metode: md5, sha1, sha256')
  }

  await new AIRich(sock)
    .setTitle('🔑 Hash Generator')
    .addText(`## ${method.toUpperCase()}\n${hash}`)
    .addSuggest(['hash md5', 'hash sha256', 'encode'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}