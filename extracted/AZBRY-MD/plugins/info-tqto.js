// plugins/info-tqto.js
// 💖 Azbry-MD • Ucapan Terima Kasih (TQTO)

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME   = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫'
const DEVELOPER  = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓'
const SOURCE_URL = 'https://bit.ly/4nnTGjr'
const BANNER_URL = 'https://lunara.drizznesiasite.biz.id/f/4cXLIx.jpg?key=rCSo1f4LTX-CF0dzCMnHsA'

let handler = async (m, { conn }) => {
  const date = moment.tz('Asia/Makassar').format('dddd, DD MMMM YYYY')
  const time = moment.tz('Asia/Makassar').format('HH:mm:ss')

  const text = `
╭──「 💖 *TERIMA KASIH* 💖 」──
│
│ 📅 *${date}*
│ 🕒 *${time} (WITA)*
│
│ Alhamdulillah, segala puji bagi *Allah SWT* 🙏
│ Karena atas izin-Nya, bot ini dapat berjalan dengan baik.
│
│ 💠 *Ucapan Terima Kasih Khusus Kepada:*
│ • Allah SWT
│ • Hyzer
│ • Erlanrahmat
│ • BOTCAHX
│ • Kurukuu-MD
│ • Dan kalian semua yang telah menggunakan
│   dan mendukung script ini. ❤️
│
│ Tanpa kalian semua, bot ini takkan bisa berkembang sejauh ini.
│ Semoga segala kebaikan kalian dibalas dengan berkah. 🤍
│
│ - Developer: ${DEVELOPER}
│ - Project: ${BOT_NAME}
│ - Portfolio: ${SOURCE_URL}
╰──────────────────────────────
  `

  await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      externalAdReply: {
        title: `${BOT_NAME} — Terima Kasih dari ${DEVELOPER}`,
        body: 'Dengan rasa syukur dan hormat 🙏',
        thumbnailUrl: BANNER_URL,
        sourceUrl: SOURCE_URL,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

handler.help = ['tqto', 'thanks', 'credit']
handler.tags = ['info']
handler.command = /^(tqto|thanks|credit)$/i

module.exports = handler