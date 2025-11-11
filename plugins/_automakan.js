// plugins/_makan-pacar.js
// 🍽️ Pengingat Makan (Chat-Triggered) — WITA — vibes perhatian (lembut & sopan)

process.env.TZ = 'Asia/Makassar'

module.exports = {
  before: async function (m) {
    // Jalan hanya di grup & kalau ada isi teks/caption
    if (!m.chat || !m.chat.endsWith?.('@g.us')) return
    const textish = (m.text || m.caption || '').trim()
    if (!textish && !m.message) return

    // Tag orang yang chat (pengirim)
    const who = m.sender

    // === CONFIG WAKTU (WITA) ===
    const jadwalMakan = { sarapan: '06:30', siang: '12:15', malam: '20:00' }
    const windowMinutes = 6  // jendela 6 menit setiap slot

    // === STATE: sekali kirim per grup per slot per hari ===
    this.__makanHit = this.__makanHit || {} // key: `${date}|${jid}|${slot}` = true

    // Waktu lokal WITA
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
    const HH = now.getHours().toString().padStart(2, '0')
    const MM = now.getMinutes().toString().padStart(2, '0')
    const timeNow = `${HH}:${MM}`
    const dateKey = now.toISOString().slice(0,10)

    const toMin = (hhmm) => {
      const [h, m] = String(hhmm).split(':').map(x => parseInt(x, 10))
      return (h * 60) + (m || 0)
    }
    const nowMin = toMin(timeNow)

    // ===== Pesan Sarapan (Hangat & Tulus) =====
    const SARAPAN_MSG = [
      '@user, pagi ini udaranya enak banget ya 🌤️. Yuk *sarapan* dulu, biar harinya mulai dengan energi dan hati yang tenang.\n🕒 ${jam} WITA',
      '@user, jangan lupa *sarapan* ya. Badanmu juga butuh perhatian, bukan cuma pikiranmu 😊\n🕒 ${jam} WITA',
      '@user, pagi gak lengkap kalau perut masih kosong. *Sarapan* dulu ya, biar senyummu gak lemas 😌\n🕒 ${jam} WITA',
      '@user, udah *sarapan* belum? Aku cuma mau ngingetin… jaga dirimu juga, bukan cuma kerjaanmu 💛\n🕒 ${jam} WITA',
      '@user, pagi ini mulai dengan hal kecil: makan, tersenyum, dan bersyukur 🌼\n🕒 ${jam} WITA'
    ]

    // ===== Pesan Makan Siang (Tenang & Perhatian) =====
    const SIANG_MSG = [
      '@user, udah waktunya *makan siang* 🍛. Istirahat bentar ya, kamu juga butuh tenang, bukan cuma produktif.\n🕒 ${jam} WITA',
      '@user, jangan lupa makan ya. Dunia bisa nunggu, tapi tubuhmu gak bisa 😌\n🕒 ${jam} WITA',
      '@user, aku tau kamu sibuk, tapi sempetin *makan siang* dulu ya. Kadang peduli sama diri sendiri juga bentuk tanggung jawab 💬\n🕒 ${jam} WITA',
      '@user, waktunya *makan siang*. Cuma pengingat kecil biar kamu gak lupa istirahat juga 🍃\n🕒 ${jam} WITA',
      '@user, *makan siang* dulu yuk. Gak perlu buru-buru, nikmatin aja — kamu pantas buat tenang sejenak ☀️\n🕒 ${jam} WITA'
    ]

    // ===== Pesan Makan Malam (Lembut & Nyaman) =====
    const MALAM_MSG = [
      '@user, udah malem 🌙. *Makan malam* dulu ya, biar bisa tidur dengan perut dan hati yang tenang.\n🕒 ${jam} WITA',
      '@user, kadang hal sederhana kayak *makan malam tepat waktu* itu bentuk sayang ke diri sendiri 🍚\n🕒 ${jam} WITA',
      '@user, sebelum istirahat, *makan malam* dulu ya. Hari ini udah cukup berat, kasih tubuhmu istirahat yang layak 💛\n🕒 ${jam} WITA',
      '@user, jangan lupa makan malam. Aku cuma pengen kamu baik-baik aja, sesederhana itu 🌃\n🕒 ${jam} WITA',
      '@user, *makan malam* yuk. Biar hari ini ditutup dengan rasa cukup — cukup kenyang, cukup tenang, cukup bahagia 💫\n🕒 ${jam} WITA'
    ]

    const MSGS = { sarapan: SARAPAN_MSG, siang: SIANG_MSG, malam: MALAM_MSG }
    const niceName = (slot) => slot === 'siang' ? 'makan siang' : (slot === 'malam' ? 'makan malam' : 'sarapan')

    for (const [slot, jam] of Object.entries(jadwalMakan)) {
      const startMin = toMin(jam)
      const endMin   = startMin + windowMinutes

      if (nowMin >= startMin && nowMin < endMin) {
        const key = `${dateKey}|${m.chat}|${slot}`
        if (this.__makanHit[key]) continue

        // ambil pesan random & replace placeholder
        const arr = MSGS[slot] || []
        if (!arr.length) continue
        const raw = arr[Math.floor(Math.random() * arr.length)]
        const tag = who.split('@')[0]
        const msg = raw.replace('@user', '@' + tag).replace('${jam}', jam)

        try {
          await this.sendMessage(m.chat, { text: msg, mentions: [who] })
          this.__makanHit[key] = true

          // bersihkan flag setelah window lewat (buffer 10 detik)
          const msLeft = ((endMin - nowMin) * 60 + 10) * 1000
          setTimeout(() => { delete this.__makanHit[key] }, Math.max(10_000, msLeft))
        } catch {
          // kalau gagal kirim, jangan set flag — biar bisa nyoba lagi dalam window
        }
      }
    }
  },
  disabled: false
}