// plugins/toimg_togif.js
const fetch = require('node-fetch')
const uploader = require('../lib/uploadFile')

let handler = async (m, { conn, usedPrefix, command }) => {
  // Ambil pesan yang direply (kalau ada), kalau nggak pakai pesan sekarang
  const q = m.quoted ? m.quoted : m
  const msg = q.msg || q
  const mime = msg.mimetype || msg.mediaType || ''

  // Hanya terima sticker WebP
  if (!/webp/i.test(mime)) {
    return m.reply(`Balas *sticker* dengan perintah *${usedPrefix + command}*`)
  }

  // Pastikan API key ada
  const apiKey = (global?.btc || '').trim()
  if (!apiKey) {
    return m.reply('API key Botcahx (global.btc) belum diatur di *config.js*.')
  }

  try {
    await m.reply(global.wait || '⏳ Memproses...')

    // Unduh sticker jadi buffer
    const buffer = await (q.download?.() || msg.download?.())
    if (!buffer) throw new Error('Gagal mengunduh media.')

    // Upload buffer -> dapat URL
    let mediaUrl = await uploader(buffer)
    // uploader bisa return string / object / array
    if (typeof mediaUrl === 'object' && mediaUrl !== null) {
      mediaUrl = mediaUrl.url || mediaUrl.link || mediaUrl.result || mediaUrl[0]?.url || mediaUrl.toString?.()
    }
    if (!mediaUrl || typeof mediaUrl !== 'string') {
      throw new Error('Uploader tidak mengembalikan URL yang valid.')
    }

    // Tentukan endpoint
    const isGif = command === 'togif'
    const endpoint = isGif
      ? 'webp2mp4'
      : 'webp2png'

    const url = `https://api.botcahx.eu.org/api/tools/${endpoint}?url=${encodeURIComponent(mediaUrl)}&apikey=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(`API error (${res.status}): ${t || res.statusText}`)
    }
    const json = await res.json()

    // Ekstrak link hasil dari berbagai kemungkinan struktur
    const extractResultUrl = (j) => {
      if (!j) return null
      // Bentuk umum: { status: true, result: "https://..." }
      if (typeof j.result === 'string') return j.result
      // { result: { url: "https://..." } }
      if (j.result && typeof j.result.url === 'string') return j.result.url
      // { result: { link: "https://..." } }
      if (j.result && typeof j.result.link === 'string') return j.result.link
      // { data: { url: "https://..." } }
      if (j.data && typeof j.data.url === 'string') return j.data.url
      // { result: ["https://..."] }
      if (Array.isArray(j.result) && typeof j.result[0] === 'string') return j.result[0]
      // { result: [{ url: "https://..." }] }
      if (Array.isArray(j.result) && j.result[0] && typeof j.result[0].url === 'string') return j.result[0].url
      return null
    }

    const outUrl = extractResultUrl(json)
    if (!outUrl) {
      throw new Error(`Gagal konversi. Respons API tidak berisi URL.\nDetail: ${JSON.stringify(json).slice(0, 400)}...`)
    }

    // Kirim hasil
    await conn.sendFile(m.chat, outUrl, null, '*©Azbry-MD*', m)
  } catch (err) {
    console.error('[toimg/togif ERR]', err)
    return m.reply(global.eror || `Terjadi kesalahan: ${err.message}`)
  }
}

handler.help = ['toimg', 'togif']
handler.tags = ['tools']
handler.command = /^(toimg|togif)$/i
handler.limit = true

module.exports = handler