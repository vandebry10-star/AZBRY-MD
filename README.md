<div align="center">

<img src="https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png" width="96" />

# ⚡ AZBRY‑MD — WhatsApp Multi‑Device Bot

**Dark • Fast • Neon** — Built by **FebryWesker** for the **Azbry** ecosystem.  
Designed for stability, clean structure, and a bold aesthetic.

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js_18+-informational?style=for-the-badge">
  <img src="https://img.shields.io/badge/Platform-WhatsApp_MD-7A42F4?style=for-the-badge">
  <img src="https://img.shields.io/badge/Style-Azbry%20Neon-17ff46?style=for-the-badge">
</p>

---

## ✨ Why AZBRY‑MD?
> _“Not just another bot — it’s a vibe.”_

- ⚙️ **Modular & maintainable** — plugin‑based, gampang diatur.
- 🧠 **Smart defaults** — config rapi, tanpa `.env` (pakai `config.js`).
- 🚀 **Production ready** — cocok buat panel/VPS, auto‑restart friendly.
- 💡 **Aesthetic** — README & UX bernuansa **Azbry** (dark + neon).

---

## 🧩 Quick Start (via Bot)
Simpan source langsung **lewat bot**:

```bash
.gitclone <link-github>
```
- Bot akan `git clone` ke server tempat bot jalan.
- Pastikan link repo **public** atau aksesnya sudah diizinkan.

> Tip: Untuk update, hapus folder lama atau gunakan `git pull` di folder repo.

---

## ⚙️ Konfigurasi Wajib (`config.js`)
Tidak pakai `.env`. Semua kunci/owner dikelola lewat **`config.js`**.  
**Yang wajib diubah:**

```js
global.owner        = ['6281510040802']       // WAJIB: daftar owner (tanpa @s.whatsapp.net)
global.mods         = ['6281510040802']       // Opsional: moderator
global.prems        = ['6281510040802']       // Opsional: premium default
global.nameowner    = 'FebryWesker'           // Nama owner
global.numberowner  = '6281510040802'         // Nomor owner (Indonesia pakai 62)
global.mail         = 'support@azbry.dev'     // Email support (opsional)
global.gc           = 'https://chat.whatsapp.com/...' // Link GC (opsional)
global.instagram    = 'https://instagram.com/syfebry_' // Sosmed (opsional)
global.wm           = '© AzbryMD'             // Watermark
global.wait         = '🔎 AZBRY processing...'
global.eror         = '🚨 Gagal memproses perintah.'
global.stiker_wait  = 'Mengonversi media ke .webp...'

// API Keys (contoh pakai BOTCAHX)
global.btc          = 'ISI_APIKEY_KAMU'       // <-- UBAH!
global.APIs         = { btc: 'https://api.botcahx.eu.org' }
global.APIKeys      = { 'https://api.botcahx.eu.org': global.btc }
```

### 🔎 Tentang **JID**
- **JID** = *WhatsApp ID* (format internal).
- Untuk user: `628xxx@s.whatsapp.net`  
- Untuk grup: `xxxx@g.us`  
- Saat menyimpan ke database / whitelist, **gunakan JID format lengkap**.  
- Untuk input command (seperti `.prem 628xxx|30`), script akan otomatis
  mengubah ke JID yang benar.

---

## 🖥️ Deploy di Panel / VPS
Jalankan urutan berikut setelah repo di‑clone:

```bash
cd AZBRY-MD
npm i node-cron
npm i
npm start
```

> **Catatan:**
> - Minimal **Node.js 18+**
> - Jika pakai PM2: `pm2 start npm --name "azbry-md" -- start`
> - Pastikan port firewall & permission file sudah benar.

---

## 📚 Struktur Kategori Menu (Urutan Bawah → Atas)
- `info` (paling bawah)
- `ai`
- `downloader`
- `sticker`
- `game`
- `fun`
- `github`
- `group`
- `stalk`
- `tools`
- (kategori lain bebas)
  
Pengurutan ini sudah dipakai di `menu.js` & `menuall.js` dengan gaya **Azbry**.

---

## ✅ Health Check
- Cron jalan? `node-cron` terpasang & jadwal tervalidasi.
- Welcome/bye? Pastikan **bridge listener** aktif & bot **admin grup**.
- Premium? Data user tersimpan di `global.db.data.users` dengan `premium` dan `premiumTime`.

---

<div align="center">

## 💠 SPECIAL THANKS

> _Every masterpiece has its foundation._  
> This one stands because of **<a href="https://github.com/BOTCAHX" target="_blank">BOTCAHX</a>** 🧠

✨ Inspirasi, API, dan kontribusi mereka jadi fondasi penting dalam pengembangan **AZBRY‑MD** — dari struktur modular, integrasi API, hingga pendekatan _bot intelligence_ yang efisien.

💎 *Respect to the creator who paved the path for the next generation of developers.*

</div>

---

## 🧾 Lisensi
Kode ini bersifat edukatif dan dapat dikembangkan bebas sesuai kebutuhan.  
Tetap hargai **credit** dan **komunitas**.

---

<div align="center">

**Crafted with pride by _FebryWesker_**  
The Core of the **Azbry** System — Dark • Fast • Neon

</div>
