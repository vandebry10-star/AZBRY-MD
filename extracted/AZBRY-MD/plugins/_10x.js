// plugins/xspeed.js
// Percepatan waktu x10 & x24 — hitung durasi nyata dari durasi percepatan

const UNIT = {
  hari: 86400, hr: 86400, h: 86400, d: 86400,
  jam: 3600, j: 3600, hour: 3600, hours: 3600,
  menit: 60, mnt: 60, m: 60, min: 60, mins: 60,
  detik: 1, dtk: 1, s: 1, sec: 1, secs: 1,
}

function parseDuration(str='') {
  const tokens = String(str).toLowerCase().replace(/,/g,' ').split(/\s+/).filter(Boolean)
  let total = 0
  for (let i = 0; i < tokens.length; i++) {
    const num = Number(tokens[i].replace(/[^0-9.]/g,''))
    const next = tokens[i+1] || ''
    const merged = tokens[i].match(/^(\d+)([a-z]+)$/i)
    if (merged) {
      const n = Number(merged[1])
      const u = merged[2]
      const sec = UNIT[u] || 0
      if (!isNaN(n) && sec) total += n * sec
      continue
    }
    if (!isNaN(num) && num > 0) {
      const ukey = next.replace(/[^a-z]/gi,'')
      const sec = UNIT[ukey] || 0
      if (sec) { total += num * sec; i++ }
      else total += num
    }
  }
  return total
}

function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec))
  const d = Math.floor(sec / 86400); sec %= 86400
  const h = Math.floor(sec / 3600);  sec %= 3600
  const m = Math.floor(sec / 60);    sec %= 60
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (m) parts.push(`${m} menit`)
  if (sec && parts.length === 0) parts.push(`${sec} detik`)
  return parts.join(' ') || '0 detik'
}

function extractX(text) {
  const rx = /(?:x\s*(10|24))\s*([:,-])?\s*(.+)|(.+?)\s*(?:x\s*(10|24))\b/i
  const m = text.match(rx)
  if (!m) return null
  const factor = Number(m[1] || m[5])
  const durasi = (m[3] || m[4] || '').trim()
  return { factor, durasi }
}

// ===== Command .x10 dan .x24 =====
async function hitung(m, factor, args) {
  const input = args.join(' ')
  if (!input) return m.reply(`Format: *.x${factor} <durasi>*\ncontoh: *.x${factor} 2 jam 30 menit*`)
  const secs = parseDuration(input)
  if (!secs) return m.reply('Durasi tidak dikenali. Coba contoh: *2 jam 30 menit* atau *150m*')
  const real = secs / factor
  const out = fmtDuration(real)
  return m.reply(`⏱️ *Percepatan x${factor}*\nMasukan: ${input}\nWaktu nyata: *${out}*`)
}

// Handler .x10
let handler10 = async (m, { args }) => hitung(m, 10, args)
handler10.help = ['x10 <durasi>']
handler10.tags = ['tools','time']
handler10.command = /^x10$/i
handler10.limit = false
module.exports = handler10

// Handler .x24
let handler24 = async (m, { args }) => hitung(m, 24, args)
handler24.help = ['x24 <durasi>']
handler24.tags = ['tools','time']
handler24.command = /^x24$/i
handler24.limit = false
module.exports = handler24

// Listener pasif
module.exports.before = async function (m) {
  try {
    const text = (m.text || '').trim()
    if (!text || m.isBot || m.fromMe) return

    const info = extractX(text)
    if (!info) return

    const secs = parseDuration(info.durasi)
    if (!secs) return

    const real = secs / info.factor
    const out = fmtDuration(real)
    await this.reply(m.chat, `⏱️ *Percepatan x${info.factor}*\nMasukan: ${info.durasi}\nWaktu nyata: *${out}*`, m)
  } catch {}
}