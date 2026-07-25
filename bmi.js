// plugins/tools/bmi.js
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'bmi',
  alias: ['indeksmassatubuh', 'kalkulatorbmi'],
  category: 'tools',
  description: 'Hitung Indeks Massa Tubuh (BMI)',
  usage: '.bmi <tinggi_cm> <berat_kg>',
  example: '.bmi 170 65',
  isOwner: false,
  cooldown: 3,
  isEnabled: true,
}
export { config_ as config }

export async function handler(m, { sock }) {
  const args = m.args
  if (args.length < 2) {
    return m.reply('❌ Masukkan tinggi (cm) dan berat (kg).\nContoh: .bmi 170 65')
  }

  const height = parseFloat(args[0])
  const weight = parseFloat(args[1])

  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    return m.reply('❌ Masukkan angka yang valid!')
  }

  const heightM = height / 100
  const bmi = weight / (heightM * heightM)
  const bmiRounded = bmi.toFixed(1)

  let category = ''
  let emoji = ''
  let color = ''

  if (bmi < 18.5) {
    category = 'Kurus'
    emoji = '⚠️'
    color = '🟡'
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal (Sehat)'
    emoji = '✅'
    color = '🟢'
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Gemuk'
    emoji = '⚠️'
    color = '🟠'
  } else if (bmi >= 30 && bmi < 40) {
    category = 'Obesitas'
    emoji = '❌'
    color = '🔴'
  } else {
    category = 'Obesitas Berat'
    emoji = '‼️'
    color = '⛔'
  }

  const text = `## ${emoji} Kalkulator BMI\n` +
    `**Tinggi:** ${height} cm\n` +
    `**Berat:** ${weight} kg\n` +
    `**BMI:** ${bmiRounded}\n` +
    `**Kategori:** ${color} ${category}`

  await new AIRich(sock)
    .setTitle('⚕️ BMI Calculator')
    .addText(text)
    .addSuggest(['bmi', 'cal', 'konversi'])
    .send(m.chat, { quoted: m.raw })
  await m.react('✅')
}