const fetch = require('node-fetch')

const btc = 'bijikepala67' // ambil dari api.botcahx.eu.org
const wait = '⏳ Sedang menghitung keberuntungan angkamu...'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let angka
  let randomMode = false

  // kalau gak ada input → angka random 1–999
  if (!text) {
    angka = Math.floor(Math.random() * 999) + 1
    randomMode = true
  } else {
    angka = text.replace(/\D/g, '')
    if (!angka) throw `Masukkan angka yang valid!\n\nContoh: ${usedPrefix + command} 88`
  }

  try {
    await m.reply(wait)
    const res = await fetch(`https://api.botcahx.eu.org/api/primbon/nomerhoki?nomer=${angka}&apikey=${btc}`)
    const json = await res.json()
    if (!json.status || !json.result?.message) throw '⚠️ Gagal mendapatkan data hoki.'

    const data = json.result.message
    const pos = data.energi_positif
    const neg = data.energi_negatif

    // vibe/yapping
    const posP = parseInt(pos.persentase)
    const negP = parseInt(neg.persentase)
    let vibe
    if (posP > negP + 10) vibe = '🌟 Angka ini sangat hoki! Energinya positif dan membawa keberuntungan finansial maupun asmara.'
    else if (posP > negP) vibe = '✨ Angka ini cenderung positif, cocok untuk digunakan sebagai nomor penting atau simbol keberuntungan.'
    else if (posP === negP) vibe = '⚖️ Angka ini netral, tidak terlalu hoki tapi juga tidak membawa sial.'
    else vibe = '☁️ Angka ini agak berat auranya. Banyakin doa dan niat baik kalau mau dipakai.'

    const txt = `
🎲 *CEK ANGKA HOKI* ${randomMode ? '(acak)' : ''}
────────────────────
🔢 Angka: ${data.nomer_hp}
🔮 Angka Shuzi: ${data.angka_shuzi}

💫 *Energi Positif*
• Kekayaan: ${pos.kekayaan}
• Kesehatan: ${pos.kesehatan}
• Cinta: ${pos.cinta}
• Kestabilan: ${pos.kestabilan}
• Persentase: ${pos.persentase}

💀 *Energi Negatif*
• Perselisihan: ${neg.perselisihan}
• Kehilangan: ${neg.kehilangan}
• Malapetaka: ${neg.malapetaka}
• Kehancuran: ${neg.kehancuran}
• Persentase: ${neg.persentase}

📜 Catatan: ${data.catatan}

──────────────
${vibe}
──────────────
${randomMode ? 'Angka dipilih acak antara 1–999 🎰' : ''}
`
    await conn.reply(m.chat, txt.trim(), m)
  } catch (e) {
    console.error(e)
    throw `❌ Terjadi kesalahan saat memeriksa hoki angka.`
  }
}

handler.help = ['nomerhoki [angka]']
handler.tags = ['fun', 'primbon']
handler.command = /^nomerhoki$/i
handler.limit = true

module.exports = handler