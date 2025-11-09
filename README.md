# AZBRY-MD

WhatsApp Assistant berbasis Baileys. Dikembangkan oleh **FebryWesker**.

[![Extract AZBRY-MD.zip](https://github.com/vandebry10-star/AZBRY-MD/actions/workflows/azbryextract.yml/badge.svg)](https://github.com/vandebry10-star/AZBRY-MD/actions/workflows/azbryextract.yml)

---

## ✳️ Ekstrak ZIP Otomatis (tanpa .env)
Repo ini menyertakan workflow GitHub Actions untuk mengekstrak file **`AZBRY-MD.zip`** secara otomatis ke folder `extracted/` lalu **commit** hasilnya ke branch `main`.

### Cara Pakai
1. Upload `AZBRY-MD.zip` ke **root** repository.
2. Jalankan workflow:
   - Lewat badge di atas → **Run workflow**, atau
   - Push file ZIP (workflow akan trigger otomatis).
3. Hasil ekstrak muncul di folder `extracted/`.

> Workflow aman: tidak butuh secret token custom (pakai `GITHUB_TOKEN` bawaan; sudah diberi izin `contents: write`).

---

## 📦 Struktur Penting
```
.
├─ config.js               # konfigurasi publik (tanpa .env)
├─ package.json
├─ main.js / handler.js
├─ plugins/
├─ media/
├─ AZBRY-MD.zip            # (opsional) arsip yang akan di-extract
└─ extracted/              # hasil ekstrak otomatis (dibuat oleh workflow)
```

---

## 🙏 Special Thanks
Terima kasih khusus untuk:

- [**BOTCAHX**](https://github.com/BOTCAHX) — atas inspirasi dan struktur dasar script.

---

## 📄 Lisensi
MIT
