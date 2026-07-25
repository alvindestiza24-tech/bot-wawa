// src/scrape/hdvideo.js
import crypto from 'node:crypto'
import FormData from 'form-data'

const BASE_API = 'https://api.unblurimage.ai'

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    return { __httpError: true, status: res.status, raw: text }
  }
  if (!res.ok) return { __httpError: true, status: res.status, raw: json }
  return json
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export async function hdvideo(buffer) {
  const productSerial = crypto.randomUUID().replace(/-/g, '')

  // Step 1: Upload video
  const uploadForm = new FormData()
  uploadForm.set('video_file_name', `cli-${Date.now()}.mp4`)

  const uploadResp = await jsonFetch(`${BASE_API}/api/upscaler/v1/ai-video-enhancer/upload-video`, {
    method: 'POST',
    body: uploadForm
  })

  if (uploadResp.__httpError || uploadResp.code !== 100000) {
    throw new Error('Upload gagal: ' + JSON.stringify(uploadResp))
  }

  const { url: uploadUrl, object_name } = uploadResp.result || {}
  if (!uploadUrl || !object_name) throw new Error('Upload invalid')

  // Step 2: Upload buffer video ke URL yang diberikan
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4' },
    body: buffer
  })

  if (!putRes.ok) throw new Error('Upload video ke storage gagal, status ' + putRes.status)

  // Step 3: Buat job
  const cdnUrl = `https://cdn.unblurimage.ai/${object_name}`
  const jobForm = new FormData()
  jobForm.set('original_video_file', cdnUrl)
  jobForm.set('resolution', '2k')
  jobForm.set('is_preview', 'false')

  const createJobResp = await jsonFetch(`${BASE_API}/api/upscaler/v2/ai-video-enhancer/create-job`, {
    method: 'POST',
    body: jobForm,
    headers: {
      'product-serial': productSerial,
      authorization: ''
    }
  })

  if (createJobResp.__httpError || createJobResp.code !== 100000) {
    throw new Error('Create job gagal: ' + JSON.stringify(createJobResp))
  }

  const { job_id } = createJobResp.result || {}
  if (!job_id) throw new Error('Job ID tidak ditemukan')

  // Step 4: Polling job sampai selesai
  const startTime = Date.now()
  let attempt = 0
  let result

  while (true) {
    attempt++
    const jobResp = await jsonFetch(`${BASE_API}/api/upscaler/v2/ai-video-enhancer/get-job/${job_id}`, {
      method: 'GET',
      headers: {
        'product-serial': productSerial,
        authorization: ''
      }
    })

    if (jobResp.__httpError) throw new Error('Get job gagal')

    if (jobResp.code === 100000) {
      result = jobResp.result || {}
      if (result.output_url) break
    }

    if (Date.now() - startTime > 600000) {
      throw new Error('Timeout: proses lebih dari 10 menit')
    }

    // Wait: 20 detik di percobaan pertama, 10 detik selanjutnya
    await sleep(attempt === 1 ? 20000 : 10000)
  }

  return result.output_url
}