// src/scrape/spotify-dl.js (terpisah)
import axios from 'axios'

export async function spotifyDl(url) {
  try {
    const { data: pp } = await axios.post('https://gamepvz.com/api/download/get-url', {
      url: url
    }, {
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.34 Mobile Safari/537.36',
      }
    })
    if (!pp || !pp.originalVideoUrl) return { status: false }
    const dl = Buffer.from(pp.originalVideoUrl.split('url=')[1], 'base64').toString('utf8')
    return {
      status: true,
      title: pp.title,
      author: pp.authorName,
      cover: pp.coverUrl,
      dl
    }
  } catch (e) {
    return { status: false }
  }
}