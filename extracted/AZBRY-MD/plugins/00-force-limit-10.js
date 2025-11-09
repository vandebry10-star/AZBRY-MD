// plugins/00-limit-default-override.js
// Set default limit free = 10 + daily reset ke 10 (non-premium) tanpa nge-lock >10

const DEFAULT_FREE = 10
const ZONE = 'Asia/Makassar' // opsional, boleh ganti

function dayKey(d = new Date()) {
  try {
    // bikin key "YYYY-MM-DD" di zona lokal (kalau server UTC juga aman)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  } catch { 
    return String(Math.floor(Date.now() / 86400000)) 
  }
}

function isPremiumUser(u = {}) {
  // deteksi premium ala “umum”: silakan sesuaikan kalau base kamu beda
  if (u.premium) return true
  if (typeof u.premiumTime === 'number' && u.premiumTime > Date.now()) return true
  return false
}

module.exports = {
  // dijalankan sebelum handler lain
  before(m) {
    const all = global.db?.data
    if (!all) return
    const users = all.users || (all.users = {})
    const u = users[m.sender] || (users[m.sender] = {})

    // 1) Default limit user baru
    if (typeof u.limit !== 'number' || isNaN(u.limit)) {
      u.limit = DEFAULT_FREE
    }

    // 2) Reset harian (override ke DEFAULT_FREE untuk non-premium)
    const today = dayKey(new Date())
    if (u._limitDay !== today) {
      u._limitDay = today
      if (!isPremiumUser(u)) {
        // cuma set ke default kalau reset harian berjalan
        u.limit = DEFAULT_FREE
      }
      // NOTE: kalau kamu pengin "carry over" sisa limit kemarin, hapus baris di atas
    }

    // 3) Safety: jangan pernah nge-lock ke 10; biarkan >10 (hasil claim/owner) tetap
    if (u.limit < 0) u.limit = 0
  }
}