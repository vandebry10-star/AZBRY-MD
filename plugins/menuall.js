// plugins/menuall.js
// Azbry-MD • Full Elegant Theme Menu (urutan abjad)

const moment = require('moment-timezone')
process.env.TZ = 'Asia/Makassar'

const BOT_NAME   = '𝑨𝒛𝒃𝒓𝒚-𝑴𝑫'
const DEVELOPER  = '𝑭𝒆𝒃𝒓𝒚𝑾𝒆𝒔𝒌𝒆𝒓'
const BANNER_URL = 'https://lunara.drizznesiasite.biz.id/f/4cXLIx.jpg?key=rCSo1f4LTX-CF0dzCMnHsA'
const SOURCE_URL = 'https://bit.ly/4nnTGjr'

// ikon dan nama kategori
const allTags = {
  ai:'🤖 MENU AI', main:'🧭 MENU UTAMA', downloader:'📥 MENU DOWNLOADER',
  database:'💾 MENU DATABASE', sticker:'🎨 MENU STICKER', advanced:'⚙️ MENU ADVANCED',
  xp:'🏅 MENU XP', fun:'🎭 MENU FUN', game:'🎮 MENU GAME', github:'🐙 MENU GITHUB',
  group:'👥 MENU GROUP', info:'📚 MENU INFO', internet:'🌐 MENU INTERNET', islam:'🕌 MENU ISLAM',
  kerang:'🐚 MENU KERANG', maker:'🧩 MENU MAKER', news:'📰 MENU NEWS', owner:'👑 MENU OWNER',
  voice:'🎤 MENU VOICE', quotes:'💬 MENU QUOTES', store:'🏪 MENU STORE', stalk:'🔍 MENU STALK',
  shortlink:'🔗 MENU SHORTLINK', tools:'🛠️ MENU TOOLS', anonymous:'🎭 MENU ANONYMOUS'
}

const readMore = String.fromCharCode(8206).repeat(4001)

function clockString(ms){
  if (isNaN(ms)) return '--:--:--'
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h,m,s].map(v => v.toString().padStart(2,0)).join(':')
}

// header sama dengan menu utama
function headerCard(p, m){
  const uptime = clockString(process.uptime()*1000)
  const date = moment.tz('Asia/Makassar').format('dddd, DD MMMM YYYY')
  const time = moment.tz('Asia/Makassar').format('HH:mm:ss')
  const name = `@${m.sender.split('@')[0]}`
  return (
`╭──「 ${BOT_NAME} 」──
│ Hai ${name}
│ Created by ${DEVELOPER}
│ Powered with AI & smart automation.
│ My Portofolio : ${SOURCE_URL}
│
│ ⏱ Uptime : ${uptime}
│ 📅 Tanggal : ${date}
│ 🕒 Waktu : ${time}
│ ✨ Prefix : [ ${p} ]
╰───────────────────────`
  )
}

// ambil kategori aktif dan urutkan abjad
function buildAlphabeticalCategories() {
  const helps = Object.values(global.plugins || {})
    .filter(pl => !pl.disabled)
    .map(pl => ({
      tags: Array.isArray(pl.tags) ? pl.tags : (pl.tags ? [pl.tags] : [])
    }))

  const tagsInUse = new Set()
  for (const p of helps) for (const t of p.tags) if (t) tagsInUse.add(t)

  return Array.from(tagsInUse).sort((a,b)=>a.localeCompare(b))
}

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    const help = Object.values(global.plugins)
      .filter(pl => !pl.disabled)
      .map(pl => ({
        help: Array.isArray(pl.help) ? pl.help : [pl.help],
        tags: Array.isArray(pl.tags) ? pl.tags : [pl.tags],
        prefix: 'customPrefix' in pl,
        limit: pl.limit,
        premium: pl.premium
      }))

    const categories = buildAlphabeticalCategories()

    let text = `${headerCard(_p, m)}\n\n`
    text += `💠 *DAFTAR MENU KATEGORI FULL*\n`
    text += `────────────────────────────\n`
    text += `⬇️ *Baca selengkapnya untuk melihat semua menu* ⬇️\n${readMore}\n`

    for (const cat of categories) {
      const title = allTags[cat] || `📂 ${cat.toUpperCase()}`
      const cmds = help.filter(x => x.tags && x.tags.includes(cat) && x.help && x.help[0])
      if (!cmds.length) continue

      text += `\n────────────────────────────\n`
      text += `✨ ${title}\n`
      text += `────────────────────────────\n`
      for (const cm of cmds.sort((a,b)=>a.help[0]?.localeCompare(b.help[0]||''))) {
        for (const h of cm.help) {
          if (!h) continue
          text += `${cm.prefix ? h : _p + h} ${cm.limit ? '·(Ⓛ)' : ''}${cm.premium ? '·(Ⓟ)' : ''}\n`
        }
      }
    }

    text += `\n────────────────────────────\n`
    text += `Gunakan awalan ${_p} untuk menjalankan perintah.\n`
    text += `🌐 Azbry-MD • Developed by ${DEVELOPER}`

    return conn.sendMessage(m.chat, {
      text,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: `${BOT_NAME} — WhatsApp Assistant`,
          body: `Hi @${m.sender.split('@')[0]}`,
          thumbnailUrl: BANNER_URL,
          sourceUrl: SOURCE_URL,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })
  } catch (e) {
    console.error(e)
    return conn.reply(m.chat, '⚠️ Maaf, menuall sedang error.', m)
  }
}

handler.help = ['menuall','allmenu','helpall']
handler.tags = ['main']
handler.command = /^(menuall|allmenu|helpall)$/i
handler.exp = 3

module.exports = handler