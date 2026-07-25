import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio'

// ── TelegraPh (dari file path) ───────────────────────────────────
export async function TelegraPh(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  const fileBuffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: 'file.jpg',
    contentType: 'image/jpeg'
  });
  const headers = {
    ...form.getHeaders(),
    'User-Agent': 'Mozilla/5.0'
  };
  const response = await axios.post('https://telegra.ph/upload', form, {
    headers: headers,
    timeout: 30000
  });
  const data = response.data;
  if (Array.isArray(data) && data[0] && data[0].src) {
    return 'https://telegra.ph' + data[0].src;
  } else {
    throw new Error('Invalid response from Telegraph');
  }
}

// ── floNime ──────────────────────────────────────────────────────
export async function floNime(filePath) {
  if (typeof filePath !== 'string') {
    throw new Error('Input harus berupa path file (string)');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`Path harus berupa file: ${filePath}`);
  }
  const filename = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const form = new FormData();
  form.append('file', fileStream, {
    filename: filename
  });
  try {
    const response = await axios.post('https://uploadyuk.web.id/v1/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Upload failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('Tidak ada respons dari server. Periksa koneksi internet Anda.');
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

// ── CatBox (dari file path) ──────────────────────────────────────
export async function CatBox(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('fileToUpload', fileStream);
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', '');
    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error at Catbox uploader:", error);
    return "Terjadi kesalahan saat upload ke Catbox.";
  }
}

// ── UploadFileUgu ────────────────────────────────────────────────
export async function UploadFileUgu(input) {
  return new Promise(async (resolve, reject) => {
    const form = new FormData();
    form.append("files[]", fs.createReadStream(input));
    await axios({
      url: "https://uguu.se/upload.php",
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
        ...form.getHeaders()
      },
      data: form
    }).then((data) => {
      resolve(data.data.files[0]);
    }).catch((err) => reject(err));
  });
}

// ── webp2mp4File ─────────────────────────────────────────────────
export function webp2mp4File(inputPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`File not found: ${inputPath}`));
    }
    const form = new FormData();
    form.append('new-image-url', '');
    form.append('new-image', fs.createReadStream(inputPath));
    axios({
      method: 'post',
      url: 'https://s6.ezgif.com/webp-to-mp4',
      data: form,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${form._boundary}`
      }
    }).then(({ data }) => {
      const $ = cheerio.load(data);
      const file = $('input[name="file"]').attr('value');
      if (!file) {
        const errorElement = $('.error, .alert, [class*="error"], [class*="alert"]').first();
        const errorMsg = errorElement.length ? errorElement.text().trim() : 'File value not found in response';
        return reject(new Error(`Conversion failed: ${errorMsg}`));
      }
      const bodyFormThen = new FormData();
      bodyFormThen.append('file', file);
      bodyFormThen.append('convert', "Convert WebP to MP4!");
      axios({
        method: 'post',
        url: 'https://ezgif.com/webp-to-mp4/' + file,
        data: bodyFormThen,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
        }
      }).then(({ data }) => {
        const $ = cheerio.load(data);
        let result = $('div#output > p.outfile > video > source').attr('src');
        if (!result) {
          result = $('video source').attr('src');
          result = result || $('a[download]').attr('href');
          result = result || $('p.outfile a').attr('href');
        }
        if (!result) {
          const errorMsg = $('.error, .alert, [class*="error"], [class*="alert"]').text().trim();
          if (errorMsg) {
            return reject(new Error(`Conversion failed: ${errorMsg}`));
          }
          const htmlPreview = data.substring(0, 2000);
          console.log('HTML preview for debugging:', htmlPreview);
          return reject(new Error('Could not find converted video URL'));
        }
        if (result.startsWith('//')) {
          result = 'https:' + result;
        } else if (!result.startsWith('http')) {
          result = 'https://ezgif.com' + (result.startsWith('/') ? result : '/' + result);
        }
        resolve({
          status: true,
          message: "Conversion successful",
          result: result
        });
      }).catch(reject);
    }).catch(reject);
  });
}

// ── uptotelegra (dari file path) ─────────────────────────────────
export async function uptotelegra(Path) {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(Path)) return reject(new Error("File not Found"));
    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(Path));
      const data = await axios({
        url: "https://telegra.ph/upload",
        method: "POST",
        headers: {
          ...form.getHeaders()
        },
        data: form
      });
      return resolve("https://telegra.ph" + data.data[0].src);
    } catch (err) {
      return reject(new Error(String(err)));
    }
  });
}

// ── Fungsi khusus untuk menerima Buffer (digunakan plugin) ────────
async function uploadToTelegraphBuffer(buffer) {
  const form = new FormData();
  form.append('file', buffer, {
    filename: 'file.jpg',
    contentType: 'image/jpeg'
  });
  const headers = {
    ...form.getHeaders(),
    'User-Agent': 'Mozilla/5.0'
  };
  const response = await axios.post('https://telegra.ph/upload', form, {
    headers: headers,
    timeout: 30000
  });
  const data = response.data;
  if (Array.isArray(data) && data[0] && data[0].src) {
    return 'https://telegra.ph' + data[0].src;
  } else {
    throw new Error('Invalid response from Telegraph');
  }
}

async function uploadToCatboxBuffer(buffer) {
  const form = new FormData();
  form.append('fileToUpload', buffer, {
    filename: 'file.jpg',
    contentType: 'image/jpeg'
  });
  form.append('reqtype', 'fileupload');
  form.append('userhash', '');
  const response = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
  });
  return response.data.trim();
}

export async function uploadBuffer(buffer) {
  try {
    return await uploadToTelegraphBuffer(buffer);
  } catch {
    try {
      return await uploadToCatboxBuffer(buffer);
    } catch {
      throw new Error('Gagal mengunggah gambar ke semua layanan.');
    }
  }
}