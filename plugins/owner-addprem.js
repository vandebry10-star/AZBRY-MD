// plugins/owner-premium.js
// Tambah / Hapus akses premium (by tag, nomor, atau reply)

const DAY = 24 * 60 * 60 * 1000
const TZ = 'Asia/Makassar'

function toJid(input) {
  if (!input) return null
  const num = input.replace(/[()\-+ @]/g, '').replace(/^0/, '62')
  return num + '@s.whatsapp.net'
}

function fmtUntil(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', {
      timeZone: TZ, year: 'numeric', month: 'long', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  } catch { return String(ts) }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const users = global.db.data.users ||= {}
  const cmd = command.toLowerCase()

  // Ambil target: dari tag / reply / text
  let target = m.mentionedJid?.[0] 
             || (m.quoted && m.quoted.sender)
             || toJid(text.split('|')[0] || text)
  if (!target) return m.reply(`Tag atau reply user!\n\n📌 *Contoh:*\n${usedPrefix}${cmd} @user|30`)

  const u = users[target] ||= { premium: false, premiumTime: 0 }

  // ADD PREMIUM
  if (/addprem|prem/.test(cmd)) {
    const days = Math.max(1, parseInt(text.split('|')[1]) || 1)
    const now = Date.now()
    const addMs = days * DAY
    u.premium = true
    u.premiumTime = now < (u.premiumTime || 0) ? u.premiumTime + addMs : now + addMs

    return conn.sendMessage(m.chat, {
      text: `✅ *PREMIUM AKTIF*\n\nUser: *@${target.split('@')[0]}*\nDurasi: *${days} hari*\nBerakhir: *${fmtUntil(u.premiumTime)}*`,
      mentions: [target]
    }, { quoted: m })
  }

  // DELETE PREMIUM
  if (/delprem|unprem|removeprem/.test(cmd)) {
    if (!u.premium) return m.reply(`❌ User *@${target.split('@')[0]}* tidak memiliki status premium.`, null, { mentions: [target] })
    u.premium = false
    u.premiumTime = 0
    return conn.sendMessage(m.chat, {
      text: `🗑️ *PREMIUM DIHAPUS*\n\nUser *@${target.split('@')[0]}* kini bukan premium.`,
      mentions: [target]
    }, { quoted: m })
  }
}

handler.help = ['addprem *@user|hari*', 'delprem *@user*']
handler.tags = ['owner']
handler.command = /^(addprem|prem|delprem|unprem|removeprem)$/i
handler.owner = true

module.exports = handler