import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { AIRich } from '../../src/lib/_build-m.js'
import { chatCompletion } from '../../src/ai/groq-client.js'
import config from '../../config.js'

export const config_ = {
  name: 'pluginmanager',
  alias: ['editplugin', 'edplugin', 'addplugin', 'editai', 'addai', 'accept', 'reject'],
  category: 'owner',
  description: 'Edit & tambah plugin (reply = manual, .editai/.addai = AI)',
  usage: '.editplugin <nama> | .addplugin <nama>',
  example: '.editplugin menu',
  isOwner: true,
  isEnabled: true,
}
export { config_ as config }

const session = new Map()

// Ekspor fungsi untuk dicek di handler.js
export function hasSession(sender) {
  return session.has(sender)
}

function findPluginFile(name) {
  const root = join(process.cwd(), 'plugins')
  function search(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        const full = join(dir, e.name)
        if (e.isDirectory()) {
          const found = search(full)
          if (found) return found
        } else if (e.isFile() && e.name === `${name}.js`) {
          return full
        }
      }
    } catch {}
    return null
  }
  return search(root)
}

function pluginTemplate(name) {
  return `import config from '../../config.js'
import { createFakeQuoted, _mCtx } from '../../src/lib/ctx.js'
import { beautifulMessage } from '../../src/lib/text-formater.js'

export const config_ = {
  name: '${name}',
  alias: [],
  category: 'other',
  description: 'Deskripsi plugin ${name}',
  usage: '.${name}',
  example: '.${name}',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  prefix: false,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.reply('Hello dari plugin ${name}!')
}
`
}

export async function handler(m, { sock }) {
  const body = m.body || m.text?.trim() || ''
  const args = m.args || []
  const command = m.command?.toLowerCase() || ''
  const hasSess = session.has(m.sender)
  const current = hasSess ? session.get(m.sender) : null
  const quotedBody = m.quoted?.body || m.quoted?.text || ''

  // ─── Accept / Reject AI ──────────────────────────────
  if (command === 'accept' || command === 'terima') {
    if (current?.mode !== 'ai_preview') {
      return m.reply('❌ Tidak ada preview AI.')
    }
    try {
      if (!current.path) {
        // add plugin: tentukan path
        const pluginsDir = join(process.cwd(), 'plugins')
        if (!existsSync(pluginsDir)) mkdirSync(pluginsDir, { recursive: true })
        current.path = join(pluginsDir, current.name + '.js')
      }
      writeFileSync(current.path, current.newCode)
      clearTimeout(current.timer)
      session.delete(m.sender)
      return m.reply(`✅ Plugin *${current.name}* disimpan. Reload bot.`)
    } catch (err) {
      return m.reply(`❌ Gagal menyimpan: ${err.message}`)
    }
  }

  if (command === 'reject' || command === 'tolak') {
    if (current?.mode !== 'ai_preview') {
      return m.reply('❌ Tidak ada preview AI.')
    }
    clearTimeout(current.timer)
    session.delete(m.sender)
    return m.reply('❌ Perubahan AI dibatalkan.')
  }

  // ─── MULAI SESI EDIT / ADD ─────────────────────────
  if (command === 'editplugin' || command === 'edplugin') {
    const name = args[0]?.toLowerCase()
    if (!name) return m.reply('❌ Format: .editplugin <nama>')

    const path = findPluginFile(name)
    if (!path) return m.reply(`❌ Plugin *${name}* tidak ditemukan.`)

    if (hasSess) { clearTimeout(session.get(m.sender).timer); session.delete(m.sender) }

    let code
    try { code = readFileSync(path, 'utf-8') } catch (err) { return m.reply(`❌ Gagal baca: ${err.message}`) }

    const timer = setTimeout(() => session.delete(m.sender), 5 * 60 * 1000)
    session.set(m.sender, { name, path, mode: 'edit_manual', timer })

    try {
      await new AIRich(sock)
        .setTitle(`📄 ${name}.js`)
        .addText('✏️ *Manual:* **Reply** dengan kode baru.\n🤖 *AI:* `.editai <instruksi>`')
        .addCode('javascript', code)
        .send(m.chat, { quoted: m.raw })
    } catch {
      await m.reply(`📄 *${name}.js*\n\n✏️ Reply kode baru (manual) atau .editai <instruksi>.`)
    }
    return
  }

  if (command === 'addplugin') {
    const name = args[0]?.toLowerCase()
    if (!name) return m.reply('❌ Format: .addplugin <nama>')

    if (findPluginFile(name)) return m.reply(`❌ Plugin *${name}* sudah ada.`)

    if (hasSess) { clearTimeout(session.get(m.sender).timer); session.delete(m.sender) }

    const timer = setTimeout(() => session.delete(m.sender), 5 * 60 * 1000)
    session.set(m.sender, { name, path: null, mode: 'add_manual', timer })

    const defaultCode = pluginTemplate(name)
    try {
      await new AIRich(sock)
        .setTitle(`➕ Tambah Plugin: ${name}`)
        .addText('✏️ *Manual:* **Reply** dengan kode lengkap.\n🤖 *AI:* `.addai <instruksi>`')
        .addCode('javascript', defaultCode)
        .send(m.chat, { quoted: m.raw })
    } catch {
      await m.reply(`➕ *${name}*\n\n✏️ Reply kode lengkap (manual) atau .addai <instruksi>.`)
    }
    return
  }

  // ─── EDIT AI / ADD AI ──────────────────────────────
  if (command === 'editai' || command === 'addai') {
    if (!hasSess) return m.reply('❌ Tidak ada sesi. Gunakan .editplugin/.addplugin dulu.')
    const instruction = args.join(' ')
    if (!instruction) {
      current.mode = (command === 'editai' ? 'edit_ai_wait' : 'add_ai_wait')
      session.set(m.sender, current)
      return m.reply('🤖 Kirim instruksi untuk AI.')
    }

    await m.reply('🤖 AI sedang menghasilkan kode...')
    try {
      let currentCode = ''
      if (current.mode.startsWith('edit')) {
        if (!current.path) return m.reply('❌ Tidak ada file yang bisa diedit.')
        currentCode = readFileSync(current.path, 'utf-8')
      } else {
        currentCode = pluginTemplate(current.name)
      }

      const prompt = `Kode plugin WhatsApp Bot berikut:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\nInstruksi: ${instruction}\n\nBerikan kode JavaScript lengkap yang sudah dimodifikasi. Hanya kode, tanpa penjelasan.`
      const newCodeRaw = await chatCompletion([
        { role: 'system', content: 'Anda adalah asisten coding. Hanya keluarkan kode JavaScript mentah.' },
        { role: 'user', content: prompt }
      ], { temperature: 0.2, maxTokens: 3000 })

      let cleanCode = newCodeRaw.trim()
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```(?:javascript|js)?\n?/, '').replace(/\n?```$/, '')
      }

      current.mode = 'ai_preview'
      current.newCode = cleanCode
      session.set(m.sender, current)

      await new AIRich(sock)
        .setTitle(`🔍 Preview AI: ${current.name}`)
        .addCode('javascript', cleanCode)
        .addText('Ketik `.accept` untuk menyimpan, `.reject` untuk membatalkan.')
        .send(m.chat, { quoted: m.raw })
    } catch (e) {
      clearTimeout(current.timer)
      session.delete(m.sender)
      return m.reply(`❌ AI gagal: ${e.message}`)
    }
    return
  }

  // ─── INPUT MANUAL (reply) ─────────────────────────
  if (hasSess && quotedBody) {
    if (current.mode === 'edit_manual') {
      try {
        writeFileSync(current.path, quotedBody)
        clearTimeout(current.timer)
        session.delete(m.sender)
        return m.reply(`✅ Plugin *${current.name}* diperbarui (manual). Reload bot.`)
      } catch (err) {
        return m.reply(`❌ Gagal menyimpan: ${err.message}`)
      }
    }
    if (current.mode === 'add_manual') {
      try {
        const pluginsDir = join(process.cwd(), 'plugins')
        if (!existsSync(pluginsDir)) mkdirSync(pluginsDir, { recursive: true })
        const filePath = join(pluginsDir, current.name + '.js')
        writeFileSync(filePath, quotedBody)
        clearTimeout(current.timer)
        session.delete(m.sender)
        return m.reply(`✅ Plugin *${current.name}* dibuat. Reload bot.`)
      } catch (err) {
        return m.reply(`❌ Gagal membuat: ${err.message}`)
      }
    }
    // Mode AI wait bisa juga via reply
    if (current.mode === 'edit_ai_wait' || current.mode === 'add_ai_wait') {
      // Proses instruksi dari reply
      // (kita bisa arahkan ke fungsi editai/addai dengan instruction = quotedBody)
      // Untuk menyederhanakan, kita panggil handler lagi dengan command yang sesuai
      // Tapi karena kita sudah di dalam handler, kita bisa langsung proses
      const instruction = quotedBody
      // Ulangi proses AI
      try {
        let currentCode = ''
        if (current.mode.startsWith('edit')) {
          if (!current.path) return m.reply('❌ Tidak ada file.')
          currentCode = readFileSync(current.path, 'utf-8')
        } else {
          currentCode = pluginTemplate(current.name)
        }
        const prompt = `Kode plugin WhatsApp Bot berikut:\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\nInstruksi: ${instruction}\n\nBerikan kode JavaScript lengkap yang sudah dimodifikasi. Hanya kode, tanpa penjelasan.`
        const newCodeRaw = await chatCompletion([
          { role: 'system', content: 'Anda adalah asisten coding. Hanya keluarkan kode JavaScript mentah.' },
          { role: 'user', content: prompt }
        ], { temperature: 0.2, maxTokens: 3000 })
        let cleanCode = newCodeRaw.trim()
        if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.replace(/^```(?:javascript|js)?\n?/, '').replace(/\n?```$/, '')
        }
        current.mode = 'ai_preview'
        current.newCode = cleanCode
        session.set(m.sender, current)
        await new AIRich(sock)
          .setTitle(`🔍 Preview AI: ${current.name}`)
          .addCode('javascript', cleanCode)
          .addText('Ketik `.accept` untuk menyimpan, `.reject` untuk membatalkan.')
          .send(m.chat, { quoted: m.raw })
      } catch (e) {
        clearTimeout(current.timer)
        session.delete(m.sender)
        return m.reply(`❌ AI gagal: ${e.message}`)
      }
      return
    }
  }
}