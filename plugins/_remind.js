// plugins/reminder-custom.js
// ⏰ Custom Reminder (relatif & jam HH:MM, WITA, persist, anti-duplicate)
// By FebryWesker 🧠 — Azbry-MD

const fs = require('fs')
const path = require('path')

process.env.TZ = 'Asia/Makassar'
const TZ = 'Asia/Makassar'

// ----------------- Storage -----------------
const DATA_DIR = path.join(__dirname, '..', 'database')
const FILE = path.join(DATA_DIR, 'reminders.json')

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ items: [] }, null, 2))
}
function loadStore() {
  ensureStore()
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { return { items: [] } }
}
function saveStore(obj) {
  ensureStore()
  fs.writeFileSync(FILE, JSON.stringify(obj, null, 2))
}

// ----------------- Time utils -----------------
function fmtNow() {
  const d = new Date()
  const fmt = (opt) => new Intl.DateTimeFormat('id-ID', { timeZone: TZ, ...opt }).format(d)
  const y = fmt({ year: 'numeric' })
  const M = fmt({ month: '2-digit' })
  const _d = fmt({ day: '2-digit' })
  const hmColon = fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
  return { ymd: `${y}-${M}-${_d}`, hm: hmColon }
}
function toLocalDate(dateOrMs = Date.now()) {
  return new Date(new Date(dateOrMs).toLocaleString('en-US', { timeZone: TZ }))
}
function pad(n){ return String(n).padStart(2,'0') }
function formatWITA(ms) {
  const d = toLocalDate(ms)
  const hari = d.toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long' })
  const tgl  = d.toLocaleDateString('id-ID', { timeZone: TZ, day: '2-digit', month: 'long', year: 'numeric' })
  const jam  = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${hari}, ${tgl} ${jam} WITA`
}

// ----------------- Parser -----------------
// .remind 2h30m minum air | .remind 45m ... | .remind 1d ... | .remind 21:00 ...
function parseReminderArgs(text) {
  if (!text) return { err: 'Format: .remind <durasi|HH:MM> <pesan>' }
  const [first, ...rest] = text.trim().split(/\s+/)
  const msg = rest.join(' ').trim()
  // HH:MM absolute
  if (/^\d{1,2}[:.]\d{2}$/.test(first)) {
    if (!msg) return { err: 'Tulis pesannya. Contoh: .remind 21:00 belajar' }
    const [Hraw, Mraw] = first.replace('.', ':').split(':').map(x => parseInt(x,10))
    if (isNaN(Hraw) || isNaN(Mraw) || Hraw>23 || Mraw>59) return { err: 'Jam tidak valid. Contoh: 06:30 atau 21:05' }
    // target hari ini pada WITA, kalau sudah lewat -> besok
    const now = toLocalDate()
    const target = toLocalDate()
    target.setHours(Hraw, Mraw, 0, 0)
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
    return { due: target.getTime(), msg }
  }
  // Relative: 1d2h30m / 2h / 20m
  const rel = first.toLowerCase()
  const m = rel.match(/^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$/)
  if (!m) return { err: 'Durasi tidak valid. Contoh: 30m, 2h, 1d2h30m atau pakai jam HH:MM' }
  const d = parseInt(m[1]||0), h = parseInt(m[2]||0), min = parseInt(m[3]||0)
  if (d===0 && h===0 && min===0) return { err: 'Durasi tidak boleh 0' }
  if (!msg) return { err: 'Tulis pesannya. Contoh: .remind 30m minum air' }
  const now = toLocalDate()
  const due = new Date(now.getTime())
  due.setMinutes(due.getMinutes() + (d*24*60 + h*60 + min))
  return { due: due.getTime(), msg }
}

function genId() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2,6)).toUpperCase()
}

// ----------------- Ticker (singleton) -----------------
if (!global.__REMINDER_TICKSTATE__) global.__REMINDER_TICKSTATE__ = { started: false }
if (global.__REMINDER_INTERVAL__) { try { clearInterval(global.__REMINDER_INTERVAL__) } catch {} global.__REMINDER_INTERVAL__ = null }

async function tick(connRef) {
  const store = loadStore()
  if (!store.items.length) return
  const now = toLocalDate().getTime()

  // due items (<= now)
  const due = store.items.filter(it => it.due <= now)
  if (!due.length) return
  // kirim & buang yang sudah terkirim
  for (const it of due) {
    try {
      const text = `⏰ Reminder untuk @${(it.sender||'').split('@')[0]}\n${it.text}`
      await (global.conn || connRef).sendMessage(it.chat, { text, mentions: [it.sender] })
    } catch (e) { /* diamkan */ }
  }
  // hapus dari store
  store.items = store.items.filter(it => it.due > now)
  saveStore(store)
}

function startTicker(connRef) {
  if (global.__REMINDER_TICKSTATE__.started) return
  global.__REMINDER_TICKSTATE__.started = true
  global.__REMINDER_INTERVAL__ = setInterval(async () => {
    try {
      const conn = global.conn || connRef
      if (!conn) return
      await tick(conn)
    } catch { /* no-op */ }
  }, 60 * 1000) // cek tiap menit
}

// mulai otomatis
setTimeout(() => startTicker(global.conn), 2000)

// ----------------- Handler -----------------
let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!global.conn) global.conn = conn
  startTicker(conn)

  const cmd = (command || '').toLowerCase()

  // .remind <durasi|HH:MM> <pesan>
  if (cmd === 'remind') {
    const raw = args.join(' ')
    const parsed = parseReminderArgs(raw)
    if (parsed.err) return conn.reply(m.chat, `❌ ${parsed.err}`, m)

    const item = {
      id: genId(),
      chat: m.chat,
      sender: m.sender,
      text: parsed.msg,
      due: parsed.due,
      created: Date.now()
    }

    const store = loadStore()
    store.items.push(item)
    saveStore(store)

    return conn.reply(
      m.chat,
      `✅ Reminder diset untuk ${formatWITA(item.due)}\nID: ${item.id}\nPesan: ${item.text}`,
      m
    )
  }

  // .remindlist
  if (cmd === 'remindlist') {
    const store = loadStore()
    const mine = store.items
      .filter(it => it.chat === m.chat && it.sender === m.sender)
      .sort((a,b)=>a.due-b.due)

    if (!mine.length) return conn.reply(m.chat, '📭 Kamu belum punya reminder aktif di chat ini.', m)

    const body = mine.map((it, i) => `${i+1}. [${it.id}] ${formatWITA(it.due)} — ${it.text}`).join('\n')
    return conn.reply(
      m.chat,
      `🗒️ Daftar reminder kamu (chat ini):\n${body}\n\nHapus: ${usedPrefix}reminddel <ID>\nHapus semua: ${usedPrefix}remindclear`,
      m
    )
  }

  // .reminddel <id>
  if (cmd === 'reminddel') {
    const id = (args[0] || '').trim().toUpperCase()
    if (!id) return conn.reply(m.chat, `Format: ${usedPrefix}reminddel <ID> (lihat ID di .remindlist)`, m)

    const store = loadStore()
    const before = store.items.length
    // hanya bisa hapus milik sendiri di chat ini
    store.items = store.items.filter(it => !(it.id === id && it.chat === m.chat && it.sender === m.sender))
    saveStore(store)

    if (store.items.length === before) return conn.reply(m.chat, `ID tidak ditemukan atau bukan milikmu di chat ini.`, m)
    return conn.reply(m.chat, `✅ Reminder [${id}] dihapus.`, m)
  }

  // .remindclear
  if (cmd === 'remindclear') {
    const store = loadStore()
    const before = store.items.length
    // hapus semua milik sendiri di chat ini
    store.items = store.items.filter(it => !(it.chat === m.chat && it.sender === m.sender))
    saveStore(store)
    const removed = before - store.items.length
    return conn.reply(m.chat, `🧹 ${removed} reminder milikmu di chat ini sudah dihapus.`, m)
  }
}

handler.help = [
  'remind <durasi|HH:MM> <pesan>',
  'remindlist',
  'reminddel <id>',
  'remindclear'
]
handler.tags = ['tools', 'reminder']
handler.command = /^(remind|remindlist|reminddel|remindclear)$/i
handler.group = false // bisa di grup atau PV

module.exports = handler