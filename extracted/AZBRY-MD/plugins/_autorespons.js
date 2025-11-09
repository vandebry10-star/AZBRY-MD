// plugins/_autoresponse.js
// Auto Response • Azbry-MD by Vndbry Evo
// - Sapaan lebih menarik
// - Promo: ajak add bot ke grup → .owner
// - Anti-spam: cooldown per chat

let handler = m => m

// cooldown per chat biar ga spam (detik)
const COOLDOWN_SEC = 45
global.__autoRespCD = global.__autoRespCD || new Map()

handler.before = async function (m, { conn }) {
  try {
    if (m.isBaileys || m.fromMe || !m.text) return
    const text = (m.text || '').toLowerCase()

    // Trigger kata kunci (boleh tambah sendiri)
    const greetings = [
      'hai', 'halo', 'pagi', 'siang', 'sore', 'malam',
    ]
    if (!greetings.some(v => text.includes(v))) return

    // Cooldown per chat
    const now = Date.now()
    const last = global.__autoRespCD.get(m.chat) || 0
    if (now - last < COOLDOWN_SEC * 1000) return
    global.__autoRespCD.set(m.chat, now)

    // Salam waktu lokal (Asia/Makassar default)
    const tz = 'Asia/Makassar'
    const hour = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', hour12: false
    }).format(new Date()))
    const salam =
      hour >= 4 && hour < 11 ? 'Selamat pagi' :
      hour >= 11 && hour < 15 ? 'Selamat siang' :
      hour >= 15 && hour < 18 ? 'Selamat sore' :
      'Selamat malam'

    const nama = m.pushName || 'Kamu'

    const msg =
`👋 ${salam}, kak *${nama}*!
Aku *Azbry-MD*, Bot WhatsApp Multi-Device

✨ Cek fitur lengkap: *.menu* atau *.menuall*`

    await conn.sendMessage(m.chat, { text: msg }, { quoted: m })
  } catch (e) {
    // jangan bikin crash kalau gagal kirim
    console.error('[AUTO-RESPONSE ERR]', e?.message)
  }
}

module.exports = handler