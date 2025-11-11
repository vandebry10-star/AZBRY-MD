// plugins/quiet-hours.js
// 🌙 Smart Quiet Hours — by FebryWesker (Azbry Edition 😴)

const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const DATA = path.join(__dirname, '..', 'database', 'quiet-hours.json')

function ensureFile() {
  if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, JSON.stringify({}), 'utf-8')
}
function loadDB() {
  ensureFile()
  return JSON.parse(fs.readFileSync(DATA, 'utf-8') || '{}')
}
function saveDB(db) {
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2), 'utf-8')
}

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}
function isQuietNow(cfg) {
  if (!cfg || !cfg.on) return false
  const now = moment().tz('Asia/Makassar')
  const cur = now.hours() * 60 + now.minutes()
  const start = timeToMin(cfg.start)
  const end = timeToMin(cfg.end)
  if (start < end) return cur >= start && cur < end
  return cur >= start || cur < end
}

let handler = async (m, { conn, args, command }) => {
  const gid = m.chat
  const db = loadDB()
  if (!db[gid]) db[gid] = { on: false, start: '23:00', end: '06:00' }
  const cfg = db[gid]
  const sub = (args[0] || '').toLowerCase()

  if (sub === 'on' || sub === 'off') {
    cfg.on = sub === 'on'
    saveDB(db)
    return m.reply(cfg.on
      ? `🌙 Mode tenang diaktifkan.\nBot akan diam antara ${cfg.start}–${cfg.end}.`
      : '☀️ Mode tenang dimatikan, bot aktif 24 jam.')
  }

  if (sub === 'set' && args[1]) {
    const [range] = args.slice(1)
    const [s, e] = range.split('-').map(v => v.trim())
    if (!s || !e || !/^\d{1,2}:\d{2}$/.test(s) || !/^\d{1,2}:\d{2}$/.test(e))
      return m.reply('Format salah!\nContoh: `.quiet set 23:00-06:00`')
    cfg.start = s
    cfg.end = e
    cfg.on = true
    saveDB(db)
    return m.reply(`✅ Mode tenang diatur: ${s}–${e}`)
  }

  if (sub === 'status') {
    return m.reply(cfg.on
      ? `🌙 Mode tenang aktif (${cfg.start}–${cfg.end})`
      : '☀️ Mode tenang nonaktif.')
  }

  return m.reply(`🕒 Pengaturan Mode Tenang:
- Aktifkan: .quiet on/off
- Atur jam: .quiet set 23:00-06:00
- Cek status: .quiet status`)
}

handler.help = ['quiet [on/off/set/status]']
handler.tags = ['group', 'tools']
handler.command = /^quiet$/i
handler.group = true

// Blok pesan saat mode tenang
handler.before = async function (m) {
  if (!m.isGroup) return
  const db = loadDB()
  const cfg = db[m.chat]
  if (!cfg || !cfg.on) return
  if (isQuietNow(cfg)) {
    if (/^[.!/#$%^&*?]/.test(m.text || '')) {
      return !1 // blok command
    }
  }
}

module.exports = handler