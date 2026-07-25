import { join } from 'path'
import { existsSync, mkdirSync, createWriteStream, unlinkSync } from 'fs'
import { ZipArchive } from 'archiver'

export const config_ = {
  name: 'backup',
  alias: ['backupdata', 'bk', 'arsip'],
  category: 'owner',
  description: 'Backup storage & config ke file ZIP dan kirim ke owner',
  usage: '.backup',
  example: '.backup',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  await m.react('🔄')

  const rootDir = process.cwd()
  const tmpDir = join(rootDir, 'storage', '.tmp')

  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  const zipFileName = `backup_${timestamp}.zip`
  const zipPath = join(tmpDir, zipFileName)

  const output = createWriteStream(zipPath)
  const archive = new ZipArchive({ zlib: { level: 9 } })

  archive.on('error', async (err) => {
    await m.react('❌')
    await m.reply(`❌ Gagal membuat backup: ${err.message}`)
  })

  const streamFinish = new Promise((resolve) => output.on('close', resolve))

  archive.pipe(output)

  // Tambahkan folder storage (kecuali .tmp)
  const storageDir = join(rootDir, 'storage')
  if (existsSync(storageDir)) {
    archive.directory(storageDir, 'storage', (entry) => {
      if (entry.name.startsWith('.tmp')) return false
      return entry
    })
  }

  // Tambahkan file config.js
  const configPath = join(rootDir, 'config.js')
  if (existsSync(configPath)) {
    archive.file(configPath, { name: 'config.js' })
  }

  await archive.finalize()
  await streamFinish

  const caption = `📦 *Backup Data*\n📅 Tanggal: ${new Date().toLocaleString('id-ID')}\n📁 File: ${zipFileName}\n\n_Berisi folder storage & config.js._`
  await sock.sendMessage(m.chat, {
    document: { url: zipPath },
    fileName: zipFileName,
    mimetype: 'application/zip',
    caption,
  }, { quoted: m.raw })

  try { unlinkSync(zipPath) } catch {}

  await m.react('✅')
}