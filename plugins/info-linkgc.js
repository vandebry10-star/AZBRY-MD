// plugins/info-linkgc.js
const LINK_GC = 'https://chat.whatsapp.com/CYa5CRl8K1lAK4NNCYmHJe?mode=wwt'
const TITLE   = 'Azbry-MD • Group Utama'
const BANNER  = 'https://i.ibb.co/6D7yXrj/azbry-banner.jpg' // opsional, boleh ganti/biarkan

let handler = async (m, { conn }) => {
  const msg =
`👥 *Link Grup Azbry-MD*

• Bergabung: ${LINK_GC}

Catatan:
- Hormati sesama member
- No spam / flood
- Gunakan perintah dengan bijak

Selamat bergabung!`

  await conn.sendMessage(m.chat, {
    text: msg,
    contextInfo: {
      externalAdReply: {
        title: TITLE,
        body: 'Klik untuk bergabung ke grup',
        thumbnailUrl: BANNER,
        sourceUrl: LINK_GC,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

handler.help = ['linkgc','gclink','gc']
handler.tags = ['info','group']
handler.command = /^(linkgc|gclink|gc)$/i
handler.limit = false

module.exports = handler