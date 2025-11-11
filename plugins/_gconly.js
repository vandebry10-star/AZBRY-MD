// plugins/_force-group-only.js
// Paksa GC only, tapi boleh whitelist & owner

const ALLOW_CMDS_PM = [
  'menu','help','owner','sewa','runtime'
] // perintah yang tetap boleh di PM
const ALLOW_JIDS_PM = [
  // tambahkan JID yang boleh PM, mis: '6281510040802@s.whatsapp.net'
]

let handler = m => m

handler.before = async function (m, { isOwner, command }) {
  // kalau bukan chat pribadi, lolos
  if (m.isGroup) return false

  // owner selalu lolos
  if (isOwner) return false

  // whitelist JID tertentu
  if (ALLOW_JIDS_PM.includes(m.sender)) return false

  // izinkan beberapa command ringan di PM
  const cmd = (command || '').toLowerCase()
  if (ALLOW_CMDS_PM.includes(cmd)) return false

  // sisanya ditolak (PM)
  this.reply(m.chat,
`🙅‍♂️ *GC Only*
Fitur bot hanya bisa digunakan di *grup*.

• Ketik *.owner* kalau mau sewa/butuh bantuan.
• Invite bot ke grup untuk memakai semua fitur ketik *.sewa*`, m)
  return true
}

module.exports = handler