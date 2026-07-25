// plugins/main/totalfitur.js
import { pluginStore } from '../../src/plugins.js'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'totalfitur',
  alias: ['stats', 'fitur', 'features'],
  category: 'main',
  description: 'Tampilkan statistik jumlah fitur bot per kategori (termasuk alias)',
  usage: '.totalfitur',
  example: '.totalfitur',
  isOwner: false,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const categories = {}
  let totalCommands = 0

  for (const [key, plugin] of pluginStore.entries()) {
    const cfg = plugin.config
    const cat = cfg.category || 'other'
    if (!categories[cat]) categories[cat] = 0
    categories[cat]++
    totalCommands++
  }

  const tableRows = [['Kategori', 'Jumlah']]
  const sortedCats = Object.keys(categories).sort((a, b) => a.localeCompare(b))

  for (const cat of sortedCats) {
    tableRows.push([cat, String(categories[cat])])
  }
  tableRows.push(['TOTAL', String(totalCommands)])

  const text = `📊 *Statistik Fitur Bot*\n\nTotal kategori: ${sortedCats.length}\nTotal command (termasuk alias): ${totalCommands}`

  try {
    await new AIRich(sock)
      .setTitle('📊 Total Fitur Bot')
      .addText(text)
      .addTable(tableRows)
      .send(m.chat, { quoted: m.raw })
  } catch {
    let fallback = text + '\n\n'
    for (const row of tableRows) {
      fallback += `${row[0]}: ${row[1]}\n`
    }
    await m.reply(fallback)
  }
}