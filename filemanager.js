// plugins/owner/filemanager.js
import { readFileSync, existsSync, unlinkSync, readdirSync, statSync } from 'fs'
import { join, resolve, extname } from 'path'
import config from '../../config.js'
import { writeErrorLog, analyzeAndFix, readErrorLog, catAllFiles, readFileAndAsk } from '../../src/ai/file-manager.js'
import logger from '../../src/lib/logger.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'filemanager',
  alias: ['fm'],
  category: 'owner',
  description: 'Manajemen file bot (owner only)',
  usage: '.fm read/delete/list/analyze/catall/ask <path>',
  example: '.fm read plugins/menu.js',
  isOwner: true,
  isEnabled: true,
}
export { config_ as config }

function getLanguage(filePath) {
  const ext = extname(filePath).toLowerCase()
  const map = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.json': 'json',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.html': 'html',
    '.css': 'css',
    '.md': 'markdown',
    '.sh': 'bash',
    '.txt': 'text',
  }
  return map[ext] || 'text'
}

export async function handler(m, { sock }) {
  const [action, ...args] = m.args
  const target = args.join(' ')

  if (!action) {
    return m.reply('❌ Gunakan: .fm read/delete/list/analyze/catall/ask [path]')
  }

  const base = process.cwd()

  try {
    switch (action) {
      case 'read': {
        if (!target) return m.reply('❌ Masukkan path file.')
        const fp = resolve(base, target)
        if (!fp.startsWith(base)) return m.reply('❌ Akses di luar direktori proyek dilarang.')
        if (!existsSync(fp)) return m.reply('❌ File tidak ditemukan.')
        const stat = statSync(fp)
        if (stat.size > 500 * 1024) { // batas 500KB
          return m.reply('❌ File terlalu besar (>500KB). Gunakan catatan lain.')
        }
        const content = readFileSync(fp, 'utf-8')
        const lang = getLanguage(fp)
        // Kirim seluruh isi file dengan AIRich code block
        await new AIRich(sock)
          .setTitle(`📄 ${target}`)
          .addCode(lang, content)
          .send(m.chat)
        break
      }
      case 'delete': {
        if (!target) return m.reply('❌ Masukkan path file.')
        const fp = resolve(base, target)
        if (!fp.startsWith(base)) return m.reply('❌ Akses di luar direktori proyek dilarang.')
        if (!existsSync(fp)) return m.reply('❌ File tidak ditemukan.')
        unlinkSync(fp)
        await new AIRich(sock)
          .setTitle('✅ File Dihapus')
          .addText(`File \`${target}\` berhasil dihapus.`)
          .send(m.chat)
        break
      }
      case 'list': {
        const dir = target ? resolve(base, target) : base
        if (!dir.startsWith(base)) return m.reply('❌ Akses di luar direktori proyek dilarang.')
        if (!existsSync(dir)) return m.reply('❌ Direktori tidak ditemukan.')
        const items = readdirSync(dir, { withFileTypes: true })
        const folders = items.filter(d => d.isDirectory()).map(d => `📁 ${d.name}/`)
        const files = items.filter(d => d.isFile()).map(d => `📄 ${d.name}`)
        const list = [...folders, ...files]
        if (list.length === 0) {
          await new AIRich(sock)
            .setTitle(`📂 ${target || '/'}`)
            .addText('Direktori kosong.')
            .send(m.chat)
        } else {
          // Tampilkan sebagai daftar teks
          await new AIRich(sock)
            .setTitle(`📂 ${target || '/'} (${list.length} entri)`)
            .addText(list.join('\n'))
            .send(m.chat)
        }
        break
      }
      case 'analyze': {
        await m.reply('🔍 Memulai analisis AI dengan Groq...')
        const result = await analyzeAndFix({ verbose: false, dryRun: false })
        if (!result.success) {
          return m.reply(`❌ Analisis gagal: ${result.error}`)
        }
        const { analysis, patchResults } = result
        const fixes = (analysis.fixes ?? []).map((fix, i) => {
          const res = patchResults?.[i]
          const icon = res?.success ? '✅' : (fix.action === 'LOG_ONLY' ? '📝' : '❌')
          return (
            `${icon} \`${fix.filePath}\`\n` +
            `   └ ${fix.reason ?? '-'}\n` +
            `   └ Confidence: ${(fix.confidence * 100).toFixed(0)}%` +
            (res?.message ? `\n   └ ${res.message}` : '')
          )
        }).join('\n\n')

        const msg = [
          `🤖 *GROQ ANALYSIS RESULT*`,
          ``,
          `📊 *Diagnosis:*`,
          analysis.diagnosis ?? '-',
          ``,
          `⚠️ *Severity:* ${analysis.severity ?? '-'}`,
          ``,
          `🔧 *Fixes:*`,
          fixes || '_(tidak ada fix yang diperlukan)_',
          ``,
          `📝 *Summary:* ${analysis.summary ?? '-'}`,
        ].join('\n')

        await new AIRich(sock)
          .setTitle('🤖 Analisis AI')
          .addText(msg)
          .send(m.chat)
        break
      }
      case 'catall': {
        const { totalFiles, files } = catAllFiles()
        const fileList = files.map((f, i) => `${i + 1}. \`${f}\``).join('\n')
        await new AIRich(sock)
          .setTitle(`📁 Total Files: ${totalFiles}`)
          .addText(fileList)
          .send(m.chat)
        break
      }
      case 'ask': {
        if (!target) return m.reply('❌ Masukkan path file dan pertanyaan. Contoh: .fm ask plugins/menu.js apa bug di file ini?')
        const parts = target.split(' ')
        const filePath = parts[0]
        const question = parts.slice(1).join(' ')
        if (!filePath || !question) return m.reply('❌ Format: .fm ask <path> <pertanyaan>')
        const fp = resolve(base, filePath)
        if (!fp.startsWith(base)) return m.reply('❌ Akses di luar direktori proyek dilarang.')
        if (!existsSync(fp)) return m.reply('❌ File tidak ditemukan.')
        await m.reply('🔍 Menganalisis file dengan Groq...')
        const askResult = await readFileAndAsk(filePath, question)
        // readFileAndAsk seharusnya mengembalikan { diagnosis, summary, raw? }
        const diagnosis = askResult.diagnosis || 'Tidak ada diagnosis.'
        const summary = askResult.summary || 'Tidak ada ringkasan.'
        const text = `📄 *File:* ${filePath}\n\n📊 *Diagnosis:* ${diagnosis}\n📝 *Summary:* ${summary}`
        await new AIRich(sock)
          .setTitle(`🔍 Analisis File: ${filePath}`)
          .addText(text)
          .send(m.chat)
        break
      }
      default:
        return m.reply('❌ Aksi tidak dikenal. Gunakan: read, delete, list, analyze, catall, ask')
    }
  } catch (err) {
    logger.error('FILEMANAGER', err.message)
    await m.reply(`❌ Error: ${err.message}`)
  }
}