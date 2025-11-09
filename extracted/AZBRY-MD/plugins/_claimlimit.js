// plugins/claimlimit.js
const TZ = 'Asia/Makassar'
const BONUS = 5
const MAX_FREE_LIMIT = 20          // batas atas user non-premium
const COOLDOWN_MS = 5_000          // anti double-trigger spam 5s

// lock in-memory (hindari klaim dobel saat latency)
const claimLock = new Map()

function todayStr(tz = TZ) {
  // hasil: YYYY-MM-DD stabil per zona waktu
  const d = new Date()
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
  })
  // Intl output: "YYYY-MM-DD"
  return fmt.format(d)
}

let handler = async (m, { conn }) => {
  const users = global.db?.data?.users || {}
  const id = m.sender

  // inisialisasi user aman (tanpa niban field lain)
  const u = users[id] ||= {}
  if (typeof u.limit !== 'number' || !isFinite(u.limit)) u.limit = 0
  if (typeof u.lastClaim !== 'string') u.lastClaim = ''
  if (typeof u.lastClaimAt !== 'number') u.lastClaimAt = 0

  // anti double-trigger (spam/lag)
  const now = Date.now()
  const lastTry = claimLock.get(id) || 0
  if (now - lastTry < COOLDOWN_MS) {
    return m.reply('⚠️ Tunggu sebentar… klaim sedang diproses.')
  }
  claimLock.set(id, now)

  const today = todayStr()
  if (u.lastClaim === today) {
    return m.reply('⚠️ Kamu sudah klaim *hari ini*. Coba lagi besok ya.')
  }

  // deteksi premium yang benar (flag atau waktu aktif)
  const isPremium = !!u.premium || (u.premiumTime && u.premiumTime > Date.now())

  // tandai lebih dulu (menghindari race)
  u.lastClaim = today
  u.lastClaimAt = now

  if (isPremium) {
    u.limit += BONUS                      // premium tanpa cap
  } else {
    u.limit = Math.min(u.limit + BONUS, MAX_FREE_LIMIT)  // non-premium pakai cap
  }

  // simpan DB kalau tersedia
  try { await global.db?.write?.() } catch {}

  return m.reply(
`✅ *Klaim Berhasil!*
+${BONUS} limit ditambahkan.
Sisa limit sekarang: *${u.limit}*${
  isPremium ? '\n\n💎 Status: Premium (tanpa batas).' :
  `\n\nℹ️ Batas harian non-premium: ${MAX_FREE_LIMIT}`
}`)
}

handler.help = ['claimlimit']
handler.tags = ['xp','tools']
handler.command = /^claimlimit$/i

module.exports = handler