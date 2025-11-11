// plugins/limit.js
let handler = async (m, { conn, usedPrefix }) => {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  const user = global.db.data.users[who] || {}
  const sisa = Number.isFinite(user.limit) ? user.limit : 0
  const premium = user.premium || (user.premiumTime && user.premiumTime > Date.now())

  m.reply(
`╭──「 𝗟𝗜𝗠𝗜𝗧 𝗜𝗡𝗙𝗢 」
│ 
│ 🧍 User : @${who.split('@')[0]}
│ 💠 Limit tersisa : *${sisa}* (Reset ke 10 setiap hari)
│ 
│ ${premium 
  ? '👑 *Premium User (Ⓟ)*\n│ Unlimited limit & full akses cmd.' 
  : '💎 *Non-premium*\n│ Bisa upgrade ke premium (cek *.sewa*)\nSstt.. bisa invite ke grup kamu lhoo 🤫'}
│ 
╰──────────────────────`, null, { mentions: [who] })
}

handler.help = ['limit [@user]']
handler.tags = ['xp']
handler.command = /^limit$/i

module.exports = handler