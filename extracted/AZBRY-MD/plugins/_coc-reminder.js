// plugins/coc-reminder.js
// CoC Build Reminder + X10/X24 accelerator + "|" support + list + del
// by FebryWesker / Azbry-MD

const fs = require('fs')
const path = require('path')
const DB_DIR = path.join(__dirname, '..', 'database')
const DB_FILE = path.join(DB_DIR, 'coc_reminders.json')
const ZONE = 'Asia/Makassar'

// ========== DB ==========
function ensureDB() { try { fs.mkdirSync(DB_DIR, { recursive: true }) } catch {} }
function loadDB() {
  ensureDB()
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch {}
  return { tasks: [] }
}
function saveDB(db) { ensureDB(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)) }

// ========== Utils ==========
function fmtDate(d) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: ZONE, day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d)
  } catch { return d.toISOString() }
}
function now() { return Date.now() }
function clampTimeout(ms) { return Math.max(1, Math.min(ms, 0x7FFFFFFF)) }

function parseDurationMs(text) {
  if (!text) return 0
  const s = String(text).toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
  let total = 0
  const regexWord = /(\d+)\s*(hari|hr|d|jam|j|h|menit|mnt|m|detik|dtk|s)/g
  let m
  while ((m = regexWord.exec(s)) !== null) {
    const val = parseInt(m[1])
    const unit = m[2]
    if (['hari','hr','d'].includes(unit)) total += val * 86400000
    else if (['jam','j','h'].includes(unit)) total += val * 3600000
    else if (['menit','mnt','m'].includes(unit)) total += val * 60000
    else if (['detik','dtk','s'].includes(unit)) total += val * 1000
  }
  if (total) return total
  const compact = /(?:(\d+)\s*(?:d|hari))?\s*(?:(\d+)\s*(?:h|j|jam))?\s*(?:(\d+)\s*(?:m|menit|mnt))?\s*(?:(\d+)\s*(?:s|detik|dtk))?/i
  const mc = compact.exec(s)
  if (mc) {
    const [_, d, h, mi, se] = mc.map(x => parseInt(x || '0', 10))
    total += (d||0)*86400000 + (h||0)*3600000 + (mi||0)*60000 + (se||0)*1000
  }
  return total
}
function humanize(ms) {
  const sec = Math.floor(ms / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const parts = []
  if (d) parts.push(`${d} hari`)
  if (h) parts.push(`${h} jam`)
  if (m) parts.push(`${m} menit`)
  if (s && !d && !h) parts.push(`${s} detik`)
  return parts.length ? parts.join(' ') : '0 detik'
}

// ========== Arg Parser ==========
function parseCocArgs(args) {
  const joined = args.join(' ').trim()
  let title = 'Bangunan', durStr = '', mult = 1, usedPipe = false
  const multMatch = joined.match(/\bx(10|24)\b/i)
  if (multMatch) mult = parseInt(multMatch[1], 10)
  const cleaned = joined.replace(/\bx(10|24)\b/ig, '').trim()
  if (cleaned.includes('|')) {
    usedPipe = true
    const [left, right] = cleaned.split('|')
    title = (left || 'Bangunan').trim()
    durStr = (right || '').trim()
  } else {
    const toks = cleaned.split(/\s+/)
    let splitAt = -1
    for (let i = toks.length - 1; i >= 0; i--) if (/\d/.test(toks[i])) { splitAt = i; break }
    if (splitAt > 0) {
      title = toks.slice(0, splitAt).join(' ').trim() || 'Bangunan'
      durStr = toks.slice(splitAt).join(' ').trim()
    } else title = cleaned
  }
  return { title, durStr, mult, usedPipe }
}

// ========== Scheduler ==========
global.__cocTimers = global.__cocTimers || new Map()
function scheduleOne(conn, task) {
  const old = global.__cocTimers.get(task.id)
  if (old) clearTimeout(old)
  const remain = task.endsAt - now()
  if (remain <= 0) return triggerTask(conn, task)
  const t = setTimeout(async function chunk() {
    const left = task.endsAt - now()
    if (left > 0x7FFFFFFF) {
      const t2 = setTimeout(chunk, clampTimeout(left))
      global.__cocTimers.set(task.id, t2)
    } else await triggerTask(conn, task)
  }, clampTimeout(remain))
  global.__cocTimers.set(task.id, t)
}
async function triggerTask(conn, task) {
  try {
    const mention = [task.userId]
    const who = '@' + String(task.userId || '').split('@')[0]
    const factorTxt = task.factor !== 1 ? ` (x${task.factor})` : ''
    const msg = `✅ *Selesai!*
${task.title} kamu sudah rampung${factorTxt}.

⏱️ Durasi: ${humanize(task.durationMs)}
🕒 Mulai: ${fmtDate(new Date(task.createdAt))}
🛎️ Selesai: ${fmtDate(new Date(task.endsAt))}

${who} silakan cek permainannya.`
    await conn.sendMessage(task.chatId, { text: msg, mentions: mention })
  } catch (e) { console.error('[coc reminder send ERR]', e) }
  finally {
    const db = loadDB()
    const idx = db.tasks.findIndex(x => x.id === task.id)
    if (idx >= 0) db.tasks.splice(idx, 1)
    saveDB(db)
    const tmr = global.__cocTimers.get(task.id)
    if (tmr) clearTimeout(tmr)
    global.__cocTimers.delete(task.id)
  }
}
function cancelSchedule(taskId) {
  const tmr = global.__cocTimers.get(taskId)
  if (tmr) clearTimeout(tmr)
  global.__cocTimers.delete(taskId)
}

// ========== Command ==========
let handler = async (m, { conn, usedPrefix, command, args }) => {
  const db = loadDB()

  // SUBCOMMAND: LIST
  if ((args[0] || '').toLowerCase() === 'list') {
    const list = db.tasks.filter(t => t.chatId === m.chat)
    if (!list.length) return m.reply('📭 Tidak ada build yang dijadwalkan di chat ini.')
    let out = '🧱 *Daftar Build Terjadwal*\n\n'
    list.forEach((t, i) => {
      const shortId = t.id.split('-')[0].slice(-6) + '-' + t.id.split('-')[1]
      out += `${i+1}. ${t.title}\n   ⌛ selesai: ${fmtDate(new Date(t.endsAt))}\n   🆔 ${shortId}\n`
    })
    return m.reply(out.trim())
  }

  // SUBCOMMAND: DEL
  if ((args[0] || '').toLowerCase() === 'del') {
    const key = (args[1] || '').trim()
    if (!key) return m.reply(`Format: *${usedPrefix}${command} del <nomor|id>*\nContoh:\n• ${usedPrefix}${command} del 2\n• ${usedPrefix}${command} del 1698912345-ab12cd`)
    const list = db.tasks.filter(t => t.chatId === m.chat)
    if (!list.length) return m.reply('Tidak ada task di chat ini.')

    let task = null

    // nomor (index)
    if (/^\d+$/.test(key)) {
      const idxNum = parseInt(key, 10) - 1
      if (idxNum < 0 || idxNum >= list.length) return m.reply('Nomor tidak ditemukan di list.')
      task = list[idxNum]
    } else {
      // id penuh atau pendek
      task = db.tasks.find(t => t.chatId === m.chat && (t.id === key || t.id.endsWith(key)))
    }

    if (!task) return m.reply('ID/nomor task tidak ditemukan.')

    // hanya pembuat atau owner
    if (task.userId !== m.sender && !m.isOwner) {
      return m.reply('Kamu tidak berhak menghapus task ini (bukan pembuat).')
    }

    // hapus
    const delIdx = db.tasks.findIndex(t => t.id === task.id)
    if (delIdx >= 0) db.tasks.splice(delIdx, 1)
    saveDB(db)
    cancelSchedule(task.id)

    return m.reply(`🗑️ Task dihapus:\n• ${task.title}\n• Selesai: ${fmtDate(new Date(task.endsAt))}`)
  }

  // NORMAL: BUAT TASK
  const { title, durStr, mult } = parseCocArgs(args)
  if (!durStr) {
    return m.reply(
`Format kurang lengkap.
Gunakan pemisah *|* antara nama & durasi.

Contoh:
• ${usedPrefix}${command} Artileri Lv.5 | 2 hari 7 jam 20 menit x10`
    )
  }

  const durationMsRaw = parseDurationMs(durStr)
  if (!durationMsRaw || durationMsRaw < 1000) return m.reply('Durasi tidak valid.')

  const durationMs = Math.floor(durationMsRaw / mult)
  const createdAt = now()
  const endsAt = createdAt + durationMs
  const task = {
    id: String(createdAt) + '-' + Math.random().toString(36).slice(2, 8),
    chatId: m.chat,
    userId: m.sender,
    title, durationMs, factor: mult,
    createdAt, endsAt
  }

  db.tasks.push(task)
  saveDB(db)
  scheduleOne(conn, task)

  m.reply(
`🧱 *Build dijadwalkan!*
Nama: ${title}
Durasi: ${humanize(durationMsRaw)}${mult !== 1 ? ` → x${mult} = *${humanize(durationMs)}*` : ''}
Selesai: ${fmtDate(new Date(endsAt))}
ID: ${task.id}

Pengingat akan *tag* kamu saat selesai.`
  )
}

handler.help = ['coc', 'coc list', 'coc del <no|id>']
handler.tags = ['tools','reminder']
handler.command = /^coc$/i

module.exports = handler

// ========== Auto reload tasks saat bot restart ==========
module.exports.after = async function (m, { conn }) {
  if (global.__coc_boot) return
  global.__coc_boot = true
  try {
    const db = loadDB()
    for (const t of db.tasks) scheduleOne(conn, t)
    console.log('[coc] Re-scheduled', db.tasks.length, 'task(s)')
  } catch (e) { console.error('[coc boot ERR]', e) }
}