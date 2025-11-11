// plugins/cekuser.js
// Menampilkan semua user terdaftar + sisa limitnya

let handler = async (m, { conn }) => {
  try {
    const users = global.db?.data?.users || {}
    const ids = Object.keys(users)

    if (!ids.length) 
      return m.reply('❌ Tidak ada user yang terdaftar di database.')

    let text = `👥 *Daftar User & Limit*\n\n`

    for (const id of ids) {
      const u = users[id]
      const limit = u?.limit ?? 0
      text += `• wa.me/${id.split('@')[0]}\n  🔹 ${limit} limit\n\n`
    }

    // kirim sebagai file kalau terlalu panjang
    if (text.length > 3500) {
      const fs = require('fs')
      const path = require('path')
      const tmp = path.join(__dirname, '..', 'tmp')
      try { fs.mkdirSync(tmp, { recursive: true }) } catch {}
      const file = path.join(tmp, `cekuser-${Date.now()}.txt`)
      fs.writeFileSync(file, text, 'utf8')
      await conn.sendMessage(m.chat, {
        document: fs.readFileSync(file),
        fileName: 'daftar-user.txt',
        mimetype: 'text/plain'
      }, { quoted: m })
      fs.unlinkSync(file)
    } else {
      await m.reply(text.trim())
    }

  } catch (e) {
    console.error('[CEKUSER ERR]', e)
    m.reply('⚠️ Terjadi kesalahan saat membaca database user.')
  }
}

handler.help = ['cekuser']
handler.tags = ['info']
handler.command = /^cekuser$/i
handler.owner = true // biar cuma kamu (Febry) yang bisa

module.exports = handler