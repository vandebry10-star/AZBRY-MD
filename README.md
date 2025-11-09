# 🌌 AZBRY-MD — WhatsApp Multi-Device Bot

Selamat datang di **AZBRY-MD**, sebuah proyek WhatsApp bot modern berbasis *multi-device* yang dikembangkan oleh **FebryWesker** (Developer resmi Azbry Project).  
Bot ini dibuat untuk memberikan pengalaman interaksi cerdas, stabil, dan mudah dikonfigurasi untuk berbagai kebutuhan — mulai dari hiburan, utilitas, hingga sistem otomatisasi WhatsApp pribadi.

---

## 👤 Pengenalan Developer

**Nama Developer:** FebryWesker  
**Proyek:** Azbry Project  
**Versi Bot:** Azbry-MD Stable  
**Bahasa:** JavaScript (Node.js)  
**Kontak:** [Instagram](https://instagram.com/syfebry_)  
**Portofolio:** [https://bit.ly/4nnTGjr](https://bit.ly/4nnTGjr)

Azbry dikembangkan untuk menjadi framework *open-source* yang ringan dan rapi, dengan integrasi tema dan struktur modular.  
Setiap fitur dikembangkan secara independen agar mudah diperluas dan dipelihara.

---

## 🧠 Menyimpan Script via Bot

Jika bot sudah online, kamu bisa langsung menyimpan salinan repository dengan perintah berikut:
```
.gitclone https://github.com/vandebry10-star/AZBRY-MD
```
Perintah di atas akan mengunduh repository lengkap langsung ke dalam direktori kerja bot kamu.

---

## ⚙️ Pengaturan Awal (config.js)

File utama untuk konfigurasi bot adalah `config.js`.  
Bagian-bagian penting yang **harus kamu ubah** sebelum menjalankan bot:

```js
global.owner = ['628xxxxxxx'] // Nomor WhatsApp kamu (wajib diisi)
global.mods  = ['628xxxxxxx'] // Nomor moderator (opsional, bisa sama dengan owner)
global.prems = ['628xxxxxxx'] // Nomor pengguna premium (opsional)
global.nameowner = 'Nama Kamu' // Nama tampil pemilik bot
global.numberowner = '628xxxxxxx' // Nomor utama bot
global.mail = 'emailkamu@gmail.com' // Email kontak
global.gc = 'https://chat.whatsapp.com/...' // Link grup WhatsApp (jika ada)
global.instagram = 'https://instagram.com/...' // Link Instagram (opsional)
global.wm = '© AzbryMD' // Watermark
```

### 📡 Tentang JID
JID (*Jabber ID*) adalah **identitas unik WhatsApp** berbentuk `nomor@s.whatsapp.net` untuk user, dan `xxxx@g.us` untuk grup.  
Contoh:
- User JID: `6281510040802@s.whatsapp.net`
- Grup JID: `120363112345678901@g.us`

Beberapa plugin (misal auto-welcome, broadcast, atau reminder) akan menggunakan JID untuk mengirim pesan otomatis ke target tertentu.

---

## 🚀 Menjalankan di Panel

Pastikan kamu sudah memiliki **panel hosting (seperti HexelCloud, Render, Railway, dsb)** dan repository sudah di-clone.  
Langkah-langkah eksekusi:

```bash
cd AZBRY-MD
npm i node-cron
npm i
npm start
```

Bot akan otomatis berjalan dan menampilkan QR Code untuk login ke akun WhatsApp.  
Gunakan WhatsApp yang akan dijadikan bot untuk memindai QR Code tersebut.

---

## ❤️ Ucapan Terima Kasih

Terima kasih kepada pihak-pihak yang telah berkontribusi pada pengembangan bot ini:

- Allah SWT
- [BOTCAHX (GitHub)](https://github.com/BOTCAHX)
- Para pengguna yang terus mendukung dan menggunakan script ini 🙏

---

## 🌙 Penutup

**AZBRY-MD** diciptakan dengan tujuan sederhana: menghadirkan bot WhatsApp yang stabil, elegan, dan mudah dikembangkan.  
Silakan modifikasi, eksplorasi, dan kembangkan versimu sendiri. Jadikan proyek ini titik awal kreativitasmu.  

> _“Made with ❤️ by FebryWesker | Azbry Project”_

