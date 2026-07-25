// plugins/random/joke.js
import axios from 'axios'
import { AIRich } from '../../src/lib/_build-m.js'

export const config_ = {
  name: 'joke',
  alias: ['lawak', 'humor'],
  category: 'random',
  description: 'Dapatkan lelucon acak',
  usage: '.joke',
  example: '.joke',
  isOwner: false,
  cooldown: 5,
  isEnabled: true,
}
export { config_ as config }

const APIS = [
  async function officialJoke() {
    const res = await axios.get('https://official-joke-api.appspot.com/random_joke')
    return { setup: res.data.setup, punchline: res.data.punchline }
  },
  async function jokeApi() {
    const res = await axios.get('https://v2.jokeapi.dev/joke/Any?safe-mode')
    const data = res.data
    if (data.type === 'single') {
      return { setup: data.joke, punchline: '' }
    }
    return { setup: data.setup, punchline: data.delivery }
  },
  async function dadJokes() {
    const res = await axios.get('https://icanhazdadjoke.com/', {
      headers: { 'Accept': 'application/json' }
    })
    return { setup: res.data.joke, punchline: '' }
  },
  async function chuckNorris() {
    const res = await axios.get('https://api.chucknorris.io/jokes/random')
    return { setup: res.data.value, punchline: '' }
  }
]

async function fetchJoke() {
  const errors = []
  for (const fn of APIS) {
    try {
      const result = await fn()
      if (result?.setup) return result
    } catch (err) {
      errors.push(err.message)
    }
  }
  throw new Error(`Semua API gagal:\n${errors.join('\n')}`)
}

export async function handler(m, { sock }) {
  await m.react('⏳')
  try {
    const joke = await fetchJoke()
    const text = joke.punchline ? `${joke.setup}\n\n${joke.punchline}` : joke.setup

    await new AIRich(sock)
      .setTitle('😂 Random Joke')
      .addText(`## ${text}`)
      .addSuggest(['joke', 'fact', 'quote'])
      .send(m.chat, { quoted: m.raw })
    await m.react('✅')
  } catch (err) {
    await m.react('❌')
    await m.reply(`❌ Gagal mengambil lelucon: ${err.message}`)
  }
}