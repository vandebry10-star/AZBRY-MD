// plugins/_autosholat_onchat_wita.js
// 🕌 Pengingat Sholat (WITA) — on-chat, window 6 menit, sekali kirim per grup per slot per hari
// Tone: sopan, hangat, care (bukan formal kaku, bukan terlalu romantis)

process.env.TZ = 'Asia/Makassar'

module.exports = {
  before: async function (m) {
    try {
      if (!m || !m.chat) return
      // aktifkan baris ini jika mau grup-only
      // if (!m.chat.endsWith('@g.us')) return

      // === CONFIG ===
      const JADWAL_WITA = {
        Subuh:   '04:30',
        Dzuhur:  '12:00', // revisi tone
        Ashar:   '15:22',
        Maghrib: '18:00',
        Isya:    '19:18',
      }
      const WINDOW_MIN = 6 // kirim jika ada chat dari HH:MM s/d HH:MM+6

      // STATE penanda (“sudah kirim?”) per chat|slot|tanggal
      global.__AUTOSHOLAT_SENT = global.__AUTOSHOLAT_SENT || Object.create(null)

      // waktu lokal WITA
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')
      const minutesNow = now.getHours() * 60 + now.getMinutes()

      // target mention (yang kirim chat / yang dimention)
      const who =
        (m.mentionedJid && m.mentionedJid[0]) ||
        ((m.fromMe && this?.user?.jid) ? this.user.jid : m.sender)

      const tag = '@' + (String(who || '').split('@')[0])

      // ===== Pesan lembut per slot (5 alternatif masing-masing) =====
      const MSG = {
        Subuh: (jam) => [
          `${tag}, Subuh udah masuk 🌅. Yuk sholat dulu biar awal harinya lebih enteng.\n🕒 ${jam} WITA`,
          `Pagi, ${tag} ☀️. Waktunya Subuh ya. Biar harinya berkah, kita mulai dengan sholat.\n🕒 ${jam} WITA`,
          `Hai ${tag}, Subuh tiba. Bangun pelan-pelan ya, lanjut wudhu dan sholat dulu 🤍\n🕒 ${jam} WITA`,
          `${tag}, sebelum aktivitas mulai, Subuh dulu yuk. Tenangin hati sebentar 🌿\n🕒 ${jam} WITA`,
          `Good morning, ${tag} ✨. Waktunya Subuh. Biar hari ini lebih adem, sholat dulu ya.\n🕒 ${jam} WITA`,
        ],
        Dzuhur: (jam) => [
          `${tag}, udah masuk Dzuhur ☀️. Yuk sholat dulu, rehat bentar biar gak terlalu capek.\n🕒 ${jam} WITA`,
          `Siang udah lumayan panas ya, ${tag} 😅. Pas banget buat sholat Dzuhur dulu biar adem lagi.\n🕒 ${jam} WITA`,
          `${tag}, Dzuhur udah tiba. Rehat sejenak yuk dari aktivitas, sekalian nyegerin pikiran 🌿\n🕒 ${jam} WITA`,
          `Hei ${tag}, jangan lupa Dzuhur ya 🌤️. Habis ini lanjut kerja lagi, tapi isi tenang dulu di sajadah.\n🕒 ${jam} WITA`,
          `${tag}, waktunya Dzuhur nih. Tarik napas dulu, sholat bentar, terus lanjut lagi dengan kepala ringan 🤍\n🕒 ${jam} WITA`,
        ],
        Ashar: (jam) => [
          `${tag}, Ashar udah masuk 🌤️. Ambil jeda sebentar ya, sholat dulu biar sore ini lebih tenang.\n🕒 ${jam} WITA`,
          `Sore gini enak buat tarik napas, ${tag}. Yuk Ashar dulu, biar fokus lagi setelahnya.\n🕒 ${jam} WITA`,
          `${tag}, waktunya Ashar. Pelan-pelan ditutup notifikasi, sholat dulu, habis itu lanjut santai.\n🕒 ${jam} WITA`,
          `Ashar nih, ${tag}. Rehat dikit gak apa-apa, yang penting kamu tetap terjaga dan seimbang.\n🕒 ${jam} WITA`,
          `${tag}, yuk Ashar. Biar sisa hari ini jalan lebih rapi dan ringan 🌱\n🕒 ${jam} WITA`,
        ],
        Maghrib: (jam) => [
          `${tag}, Maghrib udah masuk 🌇. Yuk sholat dulu, habis itu baru lanjut kegiatan malammu.\n🕒 ${jam} WITA`,
          `Senja udah turun, ${tag}. Maghrib dulu ya, biar hati ikut adem bareng langit.\n🕒 ${jam} WITA`,
          `${tag}, waktunya Maghrib. Rehat sebentar, sholat, terus lanjut santai bareng keluarga.\n🕒 ${jam} WITA`,
          `Maghrib-nya jangan kelewat ya, ${tag} 🌆. Biar malamnya terasa lebih tenang.\n🕒 ${jam} WITA`,
          `${tag}, ayo Maghrib dulu. Sempatkan sedikit waktu buat diri sendiri juga 🤍\n🕒 ${jam} WITA`,
        ],
        Isya: (jam) => [
          `${tag}, Isya udah tiba 🌙. Yuk sholat dulu, habis itu boleh istirahat nyantai.\n🕒 ${jam} WITA`,
          `Malamnya udah pas, ${tag}. Isya dulu ya, biar tidur nanti lebih enak.\n🕒 ${jam} WITA`,
          `${tag}, waktunya Isya. Tenangkan pikiran sebentar, sholat, lalu lanjut kegiatanmu.\n🕒 ${jam} WITA`,
          `Isya dulu yuk, ${tag} ✨. Biar harinya ditutup dengan baik dan ringan.\n🕒 ${jam} WITA`,
          `${tag}, jangan lupa Isya ya. Habis ini istirahat juga gak apa-apa, yang penting kamu tetap terjaga 🤍\n🕒 ${jam} WITA`,
        ],
      }

      // util
      const toMin = (hhmm) => {
        const [H, M] = hhmm.split(':').map(n => parseInt(n, 10))
        return H * 60 + (M || 0)
      }

      // cek setiap slot
      for (const [slot, hhmm] of Object.entries(JADWAL_WITA)) {
        if (!/^\d{2}:\d{2}$/.test(hhmm)) continue
        const slotMin = toMin(hhmm)
        const diff = minutesNow - slotMin

        // hanya kirim dalam window 0..WINDOW_MIN
        if (diff < 0 || diff > WINDOW_MIN) continue

        // sudah pernah kirim hari ini di chat ini untuk slot ini?
        const sentKey = `${m.chat}|${slot}|${today}`
        if (global.__AUTOSHOLAT_SENT[sentKey]) continue

        // ambil pesan random untuk slot tsb
        const choices = MSG[slot]?.(hhmm) || []
        if (!choices.length) continue
        const text = choices[Math.floor(Math.random() * choices.length)]

        // kirim + cap “sudah”
        await this.reply(m.chat, text, null, { contextInfo: { mentionedJid: [who] } })
        global.__AUTOSHOLAT_SENT[sentKey] = true
      }
    } catch (e) {
      // diamkan agar tidak spam log; aktifkan kalau perlu debug:
      // console.error('[autosholat onchat WITA ERR]', e?.message)
    }
  },
  disabled: false
}