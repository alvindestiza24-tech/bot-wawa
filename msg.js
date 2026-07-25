// plugins/owner/inspect.js
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'msg',
  alias: ['q', 'debugmsg', 'showmsg'],
  category: 'owner',
  description: 'Tampilkan seluruh struktur objek m (serialize)',
  usage: '.inspect | .q m | .q quoted | .q raw | .q m -snip',
  example: '.inspect\n.q m\n.q quoted\n.q raw\n.q m -snip',
  isOwner: true,
  isEnabled: true,
}
export { config_ as config }

function safeStringify(obj) {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    if (typeof value === 'function') return '[Function: ' + (value.name || 'anonymous') + ']'
    if (value instanceof Buffer) return '[Buffer length=' + value.length + ']'
    if (value instanceof Uint8Array) return '[Uint8Array length=' + value.length + ']'
    return value
  }, 2)
}

export async function handler(m, { sock }) {
  const args = m.args || []
  const snipMode = args.includes('-snip')

  // Jika mode snip, hapus argumen -snip dari daftar
  const cleanArgs = snipMode ? args.filter(a => a !== '-snip') : args
  const target = cleanArgs[0]?.toLowerCase() || 'm'

  let objToShow
  switch (target) {
    case 'm':
      objToShow = m
      break
    case 'quoted':
    case 'q':
      if (!m.quoted) return m.reply('❌ Tidak ada quoted message.')
      objToShow = m.quoted
      break
    case 'raw':
      objToShow = m.raw || m
      break
    case 'key':
      objToShow = m.key
      break
    default:
      return m.reply('❌ Target tidak dikenal. Gunakan: m, quoted, raw, key')
  }

  const json = safeStringify(objToShow)
  const tmpDir = join(process.cwd(), 'storage', '.tmp')
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
  const fileName = `inspect_${Date.now()}.json`
  const filePath = join(tmpDir, fileName)

  // ── Mode Snip via AIRich ─────────────────────────────────────
  if (snipMode) {
    if (json.length > 3500) {
      // Payload terlalu besar, beri tahu user dan tawarkan kirim file
      return m.reply(
        `⚠️ *Payload terlalu besar (${json.length} karakter)*\n` +
        `Tidak bisa ditampilkan sebagai snip.\n\n` +
        `Gunakan *.q ${target}* (tanpa -snip) untuk menerima file JSON.`
      )
    }

    try {
      await new AIRich(sock)
        .setTitle(`🔍 Inspect \`${target}\``)
        .addCode('json', json)
        .addText('Snip di atas adalah representasi objek serialize.')
        .send(m.chat, { quoted: m.raw })
      await m.react('✅')
      return
    } catch (err) {
      console.error('[INSPECT SNIP]', err)
      return m.reply(`❌ Gagal menampilkan snip: ${err.message}`)
    }
  }

  // ── Mode Default (kirim file) ─────────────────────────────────
  try {
    writeFileSync(filePath, json, 'utf-8')
    await sock.sendMessage(m.chat, {
      document: { url: filePath },
      fileName: fileName,
      mimetype: 'application/json',
      caption: `🔍 *Inspect ${target}*\n\nBerisi seluruh properti objek \`${target}\` hasil serialize.`,
    }, { quoted: m.raw })
    setTimeout(() => {
      try { if (existsSync(filePath)) unlinkSync(filePath) } catch {}
    }, 15000)
    await m.react('✅')
  } catch (err) {
    // fallback kirim teks jika pendek
    if (json.length <= 3800) {
      await m.reply(`🔍 *Inspect ${target}*\n\`\`\`json\n${json}\n\`\`\``)
      await m.react('✅')
    } else {
      await m.reply(`❌ Gagal menyimpan file: ${err.message}`)
    }
  }
}