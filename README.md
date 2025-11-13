<div align="center">

<a href="https://github.com/vandebry10-star">
  <img src="https://imgkub.com/images/2025/11/13/image.jpg?size=400" width="400" height="400" style="border-radius:50%;" alt="FebryWesker Profile"/>
</a>

# ⚡ AZBRY-MD — WhatsApp Multi-Device Bot

Built by **FebryWesker** for the **Azbry** System.  
Designed for stability, clean structure, and a bold aesthetic.

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js_20+-informational?style=for-the-badge">
  <img src="https://img.shields.io/badge/Platform-WhatsApp_MD-7A42F4?style=for-the-badge">
</p>

</div>

---

## ✨ Why AZBRY‑MD?
> _“Simple, multifungsi, Free”_

- ⚙️ **Modular & maintainable** — plugin‑based, gampang diatur.
- 🧠 **Smart defaults** — config rapi, tanpa `.env` (pakai `config.js`).
- 🚀 **Production ready** — cocok buat panel/VPS, auto‑restart friendly.
- 💡 **Aesthetic** — README & UX bernuansa **Azbry** (dark + neon).
---

<div align="center">

<table>
<tr>

<td>
  <img 
    src="https://imgkub.com/images/2025/11/13/image9574ffca2d5bcb46.jpg" 
    width="240" 
    style="border: 4px solid #444; border-radius: 10px;">
</td>

<td>
  <img 
    src="https://imgkub.com/images/2025/11/13/image2ffabc8c1ddc1415.jpg" 
    width="240" 
    style="border: 4px solid #444; border-radius: 10px;">
</td>

</tr>
</table>

</div>

---

## Developer Portofolio

<div align="center">

<a href="https://febrywesker-portofolio.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/VISIT%20PORTOFOLIO-00CC88?style=for-the-badge&logo=vercel&logoColor=white&labelColor=111&size=large" width="260" height="60" />
</a>

</div>

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
global.owner        = ['628xxxxxxxxxx']       // WAJIB: daftar owner (tanpa @s.whatsapp.net)
global.mods         = ['628xxxxxxxxxx']       // Opsional: moderator
global.prems        = ['628xxxxxxxxxx']       // Opsional: premium default
global.nameowner    = 'FebryWesker'           // Nama owner
global.numberowner  = '628xxxxxxxxxxx']'         // Nomor owner (Indonesia pakai 62)
global.mail         = 'support@azbry.dev'     // Email support (opsional)
global.gc           = 'https://chat.whatsapp.com/...' // Link GC (opsional)
global.instagram    = 'https://instagram.com/username' // Sosmed (opsional)
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
cd AZBRY-MD <<< setelah ini langsung lanjut 🔽
npm i node-cron <<< tunggu sekitar 3 menit
npm i <<< tunggu sekitar 3 menit (kalau ini belum kelar bot tidak berfungsi dengan baik)
```
# Setelah npm install tampilan panel harus seperti ini:
<td>
  <img 
    src="https://imgkub.com/images/2025/11/13/image27bbde1ea5870eb3.jpg" 
    width="240" 
    style="border: 4px solid #444; border-radius: 10px;">
</td>

</tr>
</table>

</div>
```
npm start <<< tunggu sampai diminta memasukkan nomor bot (awalan 628xx)
```

> **Catatan:**
> - Minimal **Node.js 20+**
> - Jika pakai PM2: `pm2 start npm --name "azbry-md" -- start`
> - Pastikan port firewall & permission file sudah benar.

---

## 🧩 Dependencies

Pastikan semua komponen berikut sudah terinstal di server/panel kamu:
```
- FFmpeg
- ImageMagick
- Python3
- python3-pip
- Puppeteer
- Chromium
- PM2
- Node.js (NPM)
- Yarn
- speedtest-net
- DLL & Library tambahan
```

---

> ### 🔒 Edit Menu & MenuAll
> Beberapa bagian bot seperti **isi menu (`.menu`) dan menu lengkap (`.menuall`) sudah dienkripsi**
> untuk menjaga struktur, estetika, dan stabilitas **AZBRY-MD**.
>
> Jika kamu ingin:
> - Mengubah tampilan atau isi menu  
> - Menambah / menghapus kategori  
> - Mengatur ulang struktur menuall  
>
> 👉 **Wajib menghubungi developer resmi (FebryWesker)** untuk akses atau versi modifikasinya.  
> ❗ Hal ini untuk mencegah error dan menjaga konsistensi brand **Azbry**.

---
<div align="center">
  
## ⚠️ Risiko
# Jika salah satu tidak terpasang, bot bisa error atau fitur tertentu tidak berfungsi dengan benar.

---

## 💠 SPECIAL THANKS

> _Every masterpiece has its foundation._  
> This one stands tall because of the brilliance and dedication of:

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/BOTCAHX">
        <img src="https://github.com/BOTCAHX.png?size=100" width="100" height="100" alt="BOTCAHX"/>
        <br />
        <sub><b>Tio</b></sub>
      </a>
    </td>
  </tr>
</table>

✨ Inspirasi, API, dan kontribusi mereka jadi fondasi penting dalam pengembangan **AZBRY-MD**. dari struktur modular, integrasi API, hingga pendekatan *bot intelligence* yang efisien.  

💎 *Respect to the creator who paved the path for the next generation of developers.*

</div>
---

---

---

# ✨ Layanan Kami

## 🔧 Layanan Bot (Azbry-MD / Bot Lain)
Kami menyediakan berbagai jasa profesional seputar pengelolaan dan pengembangan bot:

- ⚙️ **Pasang SC di panel sampai jadi** — instalasi script, setup environment, dan testing hingga bot aktif sepenuhnya.  
- 🧩 **Edit `config.js`** — sesuaikan konfigurasi, token, prefix, API key, dan pengaturan lainnya.  
- 💻 **Edit / modifikasi source code (SC)** — kustomisasi fitur, perintah, dan tampilan bot sesuai kebutuhan.  
- 🔌 **Menambahkan plugin baru** — integrasi fitur tambahan ke dalam bot.  
- 🧠 **Mengedit plugin lama** — optimasi atau ubah fungsi plugin biar lebih efisien.  
- 🛠️ **Jasa bot lainnya** — termasuk debugging, optimasi performa, setup auto-restart (PM2), dan integrasi API eksternal.  

---

## 🌐 Layanan Web
Kami juga membuka jasa pembuatan website profesional, baik untuk keperluan pribadi maupun bisnis:

- 🖥️ **Web portofolio** — desain elegan untuk menampilkan karya, identitas, dan profil kamu.  
- 💼 **Project web custom** — landing page, web app ringan, atau sistem sederhana sesuai permintaan.  
- 🔄 **Maintenance & update** — perbaikan, pembaruan konten, atau deploy ulang.  

---

## ✅ Keunggulan
- Penjelasan dan konfirmasi scope kerja sebelum mulai.  
- Backup file (jika tersedia) sebelum dilakukan perubahan.  
- Testing penuh setelah pekerjaan selesai.  
- Panduan singkat penggunaan hasil akhir.  

---

<div align="center">
  
## ⚠️ Catatan
Pastikan kamu menyediakan akses (panel, SSH, atau file) yang dibutuhkan sebelum pengerjaan.  
Backup data kamu selalu disarankan sebelum instalasi atau modifikasi sistem.

---

## 💬 Hubungi CS

Butuh bantuan atau mau order jasa?  
Klik tombol di bawah untuk langsung chat via WhatsApp 👇  

<a href="https://wa.me/6281510040802" target="_blank">
  <img src="https://img.shields.io/badge/Chat%20CS%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white"/>
</a>

---

## 🧾 Lisensi
Kode ini bersifat edukatif dan dapat dikembangkan bebas sesuai kebutuhan.  
Tetap hargai **credit** dan **komunitas**.

---

<div align="center">

**Crafted with pride by _FebryWesker_**  
The Core of the **Azbry-MD**

</div>
