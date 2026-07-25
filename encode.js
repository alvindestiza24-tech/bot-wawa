import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'encode',
  alias: ['decode', 'base64', 'hex'],
  category: 'tools',
  description: 'Encode/decode Base64, Hex, URL',
  usage: '.encode <base64|hex|url> <teks>',
  example: '.encode base64 hello',
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 2) return m.reply('❌ Format: .encode <base64|hex|url> <teks>')

  const method = args[0].toLowerCase()
  const text = args.slice(1).join(' ')

  let result
  switch (method) {
    case 'base64':
      result = Buffer.from(text).toString('base64')
      break
    case 'decodeb64':
      result = Buffer.from(text, 'base64').toString('utf-8')
      break
    case 'hex':
      result = Buffer.from(text).toString('hex')
      break
    case 'decodehex':
      result = Buffer.from(text, 'hex').toString('utf-8')
      break
    case 'url':
      result = encodeURIComponent(text)
      break
    case 'decodeurl':
      result = decodeURIComponent(text)
      break
    default:
      return m.reply('❌ Metode: base64, decodeb64, hex, decodehex, url, decodeurl')
  }

  await new AIRich(sock)
    .setTitle('🔐 Encode/Decode')
    .addText(`## ${method}\n${result}`)
    .addSuggest(['encode', 'hash', 'unit'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}