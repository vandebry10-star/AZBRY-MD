// kalau command gagal, limit user dikembalikan

let handler = m => m

handler.fail = async function (msg, { conn, usedPrefix, command }) {
  const user = global.db?.data?.users?.[m.sender]
  if (!user) return
  if (user.lastUsedCommand === command) {
    user.limit += (user.limitDeducted || 0)
  }
}

module.exports = handler