// plugins/grouplist.js
// List semua grup: "Nama Grup" + JID (@g.us)
// - Pakai groupFetchAllParticipating kalau ada (cepat & akurat)
// - Fallback ke conn.chats + getName()
// - Auto chunk / kirim .txt kalau kepanjangan

const fs = require('fs')
const path = require('path')

let handler = async (m, { conn }) => {
  try {
    let groups = []

    // 1) Cara utama: API Baileys
    if (conn.groupFetchAllParticipating) {
      const all = await conn.groupFetchAllParticipating()
      groups = Object.values(all || []).map(g => ({
        jid: g.id,
        name: g.subject || g.id
      }))
    } else {
      // 2) Fallback: dari conn.chats
      const jids = Object.keys(conn.chats || {}).filter(j => j.endsWith('@g.us'))
      for (const jid of jids) {
        let name = jid
        try { name = await conn.getName(jid) } catch {}
        groups.push({ jid, name })
      }
    }

    // Unik + sort alfabet
    const seen = new Set()
    groups = groups.filter(g => {
      if (!g?.jid || !g.jid.endsWith('@g.us')) return false
      if (seen.has(g.jid)) return false
      seen.add(g.jid)
      return true
    }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }))

    // Format output sederhana
    const lines = groups.map((g, i) => `${i + 1}. ${g.name}\n   ${g.jid}`)
    const header = `List Groups (${groups.length})\n`
    const body = lines.join('\n')
    const out = `${header}\n${body}`.trim()

    // Kirim sebagai teks kalau cukup pendek, otherwise kirim file .txt
    if (out.length <= 3500) {
      await m.reply(out)
    } else {
      const dir = path.join(__dirname, '..', 'tmp')
      try { fs.mkdirSync(dir, { recursive: true }) } catch {}
      const file = path.join(dir, `grouplist-${Date.now()}.txt`)
      fs.writeFileSync(file, out, 'utf8')
      await conn.sendMessage(m.chat, {
        document: fs.readFileSync(file),
        fileName: 'grouplist.txt',
        mimetype: 'text/plain'
      }, { quoted: m })
      try { fs.unlinkSync(file) } catch {}
    }
  } catch (e) {
    console.error('[GROUPLIST ERR]', e?.message)
    await m.reply('⚠️ Gagal mengambil daftar grup. Coba lagi nanti.')
  }
}

handler.help = ['grouplist', 'groups', 'listgroup']
handler.tags = ['group']
handler.command = /^(group(s|list)|(s|list)group|groups|grouplist)$/i
handler.owner = true

module.exports = handler