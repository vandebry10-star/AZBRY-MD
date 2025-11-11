// plugins/register-enforce.js
// 🚧 Enforce Registrasi Wajib (blok semua fitur + cegah auto-seed)

process.env.TZ = 'Asia/Makassar'

// ============ Konfigurasi ============
const MIN_NAME = 3
const MAX_NAME = 30
const MIN_AGE  = 10
const MAX_AGE  = 80

// command yang tetap boleh walau belum terdaftar (minimal banget)
const WHITELIST_CMDS = new Set([
  'reg', 'daftar', 'unreg', 'owner' // menu/help TIDAK di-whitelist
])

// ================= Utils =================
function parseNameAge(s) {
  s = String(s || '').trim()
  if (!s) return null
  // dukung "nama.umur" | "nama|umur" | "nama umur"
  let parts = s.split(/[.|]| +/g).filter(Boolean)
  if (parts.length < 2) return null
  const age = parseInt(parts.pop(), 10)
  const name = parts.join(' ').trim()
  if (!name || !Number.isFinite(age)) return null
  return { name, age }
}

function genSerial(n = 6) {
  let s = ''
  while (s.length < n) s += Math.floor(Math.random() * 10)
  return s
}

function nowTs() { return Date.now() }

function ensureDB() {
  global.db ||= { data: { users: {} } }
  global.db.data ||= { users: {} }
  global.db.data.users ||= {}
  return global.db.data.users
}

// ================== Gate (before) ==================
// Blokir SEMUA command termasuk menu/help untuk user yang belum registered.
// Sekaligus "menghilangkan" data user otomatis jika belum registered (hapus entry).
module.exports.before = async function (m, ctx) {
  const users = ensureDB()

  // deteksi command sederhana
  const isCmd = ctx?.isCommand ?? (/^[.~!#$/%^&*+=?,;:<>\\|]/i.test(m?.text || ''))
  const cmd = (ctx?.command || (m?.text || '').trim().split(/\s+/)[0] || '')
    .replace(/^[^\p{L}\p{N}]+/u, '') // buang prefix
    .toLowerCase()

  // Kalau bukan command, gak usah blok (biar chat berjalan normal)
  if (!isCmd) return

  // Kalau command masuk whitelist, biarkan
  if (WHITELIST_CMDS.has(cmd)) return

  // Cek status user
  const u = users[m.sender]
  // Jika belum ada entry → JANGAN buat, dan blokir
  if (!u) {
    return this.reply(m.chat,
      `Kamu belum terdaftar.\nDaftar dulu dengan:\n*.reg Nama.Umur*\n\nContoh: *.reg Febry.20*`,
      m)
  }

  // Jika ada entry tapi belum registered → hapus & blokir (anti auto-seed)
  if (!u.registered) {
    try { delete users[m.sender] } catch {}
    return this.reply(m.chat,
      `Akses ditolak. Silakan daftar dulu:\n*.reg Nama.Umur*\n\nContoh: *.reg Febry.20*`,
      m)
  }

  // registered = true → lewat
}

// ================== Command Handler ==================
let handler = async function (m, { conn, usedPrefix, command, text, args, isOwner }) {
  const users = ensureDB()

  // --------- REGISTER ---------
  if (/^(reg|daftar)$/i.test(command)) {
    if (users[m.sender]?.registered) {
      return conn.reply(m.chat,
        `Kamu sudah terdaftar.\nSerial: *${users[m.sender].serial || '-'}*\nNama: *${users[m.sender].name || '-'}* • Umur: *${users[m.sender].age || '-'}*`,
        m)
    }

    const parsed = parseNameAge(text)
    if (!parsed) {
      return conn.reply(m.chat,
        `Format salah.\nGunakan: *${usedPrefix}reg Nama.Umur*\nContoh: *${usedPrefix}reg Febry.20*`,
        m)
    }

    // validasi
    const name = parsed.name.trim()
    const age  = parsed.age
    if (name.length < MIN_NAME || name.length > MAX_NAME)
      return conn.reply(m.chat, `Nama minimal ${MIN_NAME} huruf dan maksimal ${MAX_NAME} huruf.`, m)
    if (age < MIN_AGE || age > MAX_AGE)
      return conn.reply(m.chat, `Umur harus ${MIN_AGE}–${MAX_AGE} tahun.`, m)

    // Buat entry user HANYA saat register
    const serial = genSerial(6)
    users[m.sender] = {
      registered: true,
      name,
      age,
      serial,
      regTime: nowTs(),
      // field lain opsional — jangan auto-set limit/exp kalau kamu mau strict
    }

    const txt =
`✅ *Registrasi Berhasil*
• Nama : *${name}*
• Umur : *${age}*
• Serial : *${serial}*

Sekarang kamu bisa pakai semua fitur.
Ketik *.menu* untuk mulai.`
    return conn.reply(m.chat, txt, m)
  }

  // --------- UNREGISTER ---------
  if (/^unreg$/i.test(command)) {
    const me = users[m.sender]

    // Owner bisa pakai: .unreg force @user
    if (/^force$/i.test(args[0] || '') && isOwner) {
      const target = m.mentionedJid && m.mentionedJid[0]
      if (!target) return conn.reply(m.chat, `Tag target: *${usedPrefix}unreg force @user*`, m)
      if (users[target]?.registered) {
        delete users[target]
        return conn.reply(m.chat, `✅ Unreg paksa: @${target.split('@')[0]} sudah dihapus.`, m, { mentions: [target] })
      }
      return conn.reply(m.chat, `User tersebut belum terdaftar / sudah dihapus.`, m)
    }

    if (!me?.registered) {
      return conn.reply(m.chat, `Kamu belum terdaftar. Daftar dengan *.reg Nama.Umur*`, m)
    }

    const serialInput = (args[0] || '').trim()
    if (!serialInput) {
      return conn.reply(m.chat,
        `Masukkan serial untuk konfirmasi.\nContoh: *${usedPrefix}unreg ${me.serial}*`,
        m)
    }

    if (serialInput !== me.serial) {
      return conn.reply(m.chat, `Serial salah. Coba cek lagi serialmu: *${me.serial}*`, m)
    }

    delete users[m.sender]
    return conn.reply(m.chat, `✅ Unreg berhasil. Data kamu sudah dihapus.`, m)
  }
}

handler.help = ['reg <nama.umur>', 'unreg <serial>']
handler.tags = ['main']
handler.command = /^(reg|daftar|unreg)$/i

module.exports = handler