// plugins/_auto-reminder.js
// Aktifkan pengingat sholat & makan otomatis setiap menit
process.env.TZ = 'Asia/Makassar'
const fs = require('fs')
const path = require('path')

const load = (file, def={}) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return def }
}

const DB_SHOLAT = path.join(__dirname, '..', 'database', 'autosholat.json')
const DB_MAKAN = path.join(__dirname, '..', 'database', 'automakan.json')

function nowHHMM() {
  const d = new Date()
  return d.toLocaleTimeString('id-ID', { hour12:false, timeZone:'Asia/Makassar' }).slice(0,5)
}

global.sendSholatReminder = async (conn, chatId, slot, opt={}) => {
  const msg = opt.test
    ? `🕌 Test Pengingat Sholat *${slot.toUpperCase()}*`
    : `🕌 Waktu Sholat *${slot.toUpperCase()}* telah tiba.`
  await conn.sendMessage(chatId, { text: msg })
}

global.sendMakanReminder = async (conn, chatId, slot, opt={}) => {
  const msg = opt.test
    ? `🍽️ Test Pengingat Makan *${slot.toUpperCase()}*`
    : `🍽️ Saatnya makan *${slot.toUpperCase()}*!`
  await conn.sendMessage(chatId, { text: msg })
}

// ========== Loop utama ==========
setInterval(async () => {
  if (!global.conn) return

  const t = nowHHMM()
  const sh = load(DB_SHOLAT, {})
  const mk = load(DB_MAKAN, {})

  // Sholat
  if (sh.on) {
    for (const [slot, jam] of Object.entries(sh.times || {})) {
      if (jam === t) {
        const targets = sh.whitelist?.length ? sh.whitelist : Object.keys(global.conn.chats)
        for (const id of targets) {
          await global.sendSholatReminder(global.conn, id, slot)
        }
      }
    }
  }

  // Makan
  if (mk.on) {
    for (const [slot, jam] of Object.entries(mk.times || {})) {
      if (jam === t) {
        const targets = mk.whitelist?.length ? mk.whitelist : Object.keys(global.conn.chats)
        for (const id of targets) {
          await global.sendMakanReminder(global.conn, id, slot)
        }
      }
    }
  }
}, 60000) // cek setiap menit