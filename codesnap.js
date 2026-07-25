// plugins/creator/codesnap.js
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { AIRich, Toolkit } from '../../src/lib/_build-m.js'
import { generateCodeSnap } from '../../src/canvas/codesnap.js'

export const config_ = {
  name: 'codesnap',
  alias: ['snap', 'code'],
  category: 'maker',
  description: 'Buat gambar kode dengan tema (carbon.sh like)',
  usage: '.snap <kode> atau reply kode',
  example: '.snap --dracula console.log("halo")',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  let rawCode = m.quoted?.body || m.quoted?.text || m.quoted?.caption || m.text?.trim() || ''

  if (!rawCode || rawCode.trim().length < 2) {
    return m.reply(
      `*📸 CODE SNAP*\n\n` +
      `Reply pesan berisi kode, atau:\n` +
      `\`.snap <kode>\`\n\n` +
      `*Tema tersedia:*\n` +
      `• \`.snap --dracula\` _(default)_\n` +
      `• \`.snap --oneDark\`\n` +
      `• \`.snap --monokai\``
    )
  }

  await m.react('⏳')

  try {

    const themeMap = {
      '--dracula': 'dracula',
      '--oneDark': 'oneDark',
      '--monokai': 'monokai',
      '--dark': 'oneDark',
      '--green': 'monokai',
    }
    let theme = 'dracula'
    let code = rawCode.trim()

    for (const [flag, name] of Object.entries(themeMap)) {
      if (code.includes(flag)) {
        theme = name
        code = code.replace(flag, '').trim()
        break
      }
    }

    // Bersihkan dari backtick markdown
    if (code.startsWith('```') || code.startsWith('`')) {
      code = code.replace(/^```\w*\n?/, '').replace(/```$/, '').replace(/^`/, '').replace(/`$/, '').trim()
    }

    const buffer = await generateCodeSnap(code, { theme })
    const imageUrl = await Toolkit.toUrl(sock, buffer, 'image')

    await new AIRich(sock)
      .setTitle('📸 Code Snap')
      .addImage(imageUrl, { resolveUrl: false })
      .addCode('javascript', code)
      .setFooter(`Tema: ${theme} • ${new Date().toLocaleTimeString('id-ID')}`)
      .addSuggest(['snap --dracula', 'snap --oneDark', 'snap --monokai'])
      .send(m.chat, { quoted: m.raw })

    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ *Code snap gagal:* ${err.message}`)
  }
}