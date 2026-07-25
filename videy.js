// src/scrape/videy.js
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export async function videy(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Buffer video diperlukan')

  const tmpDir = join(process.cwd(), 'storage', '.tmp')
  await mkdir(tmpDir, { recursive: true })
  const tmpFile = join(tmpDir, `videy-${Date.now()}.mp4`)
  await writeFile(tmpFile, buffer)

  try {
    const form = new FormData()
    form.append(
      'file',
      fs.createReadStream(tmpFile),
      {
        filename: 'video.mp4',
        contentType: 'video/mp4'
      }
    )

    const { data } = await axios.post(
      `https://videy.co/api/upload?visitorId=${crypto.randomUUID()}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
          origin: 'https://videy.co',
          referer: 'https://videy.co/',
          accept: 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120000
      }
    )

    return { status: 'success', output: data }
  } catch (e) {
    return { status: 'error', msg: e.message }
  } finally {
    await unlink(tmpFile).catch(() => {})
  }
}