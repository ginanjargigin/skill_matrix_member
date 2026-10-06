# CHECKPOINT — Man Power Replacement V1
Tanggal: 2026-10-06

## Keputusan yang sudah disetujui
1. Tujuan utama: membantu Leader memilih man power replacement ketika member tidak masuk / ada kebutuhan back-up.
2. Target data: 300+ member.
3. Desktop UI: disetujui.
4. Mobile UI: disetujui.
5. UX: standar IMK; pencarian cepat, status jelas, tindakan utama mudah ditemukan.
6. Pencarian: berdasarkan Line dan Nama/No Reg member.
7. Kandidat: diurutkan berdasarkan kecocokan skill + status tersedia.
8. Foto member: wajib tersedia sebagai fitur upload.
9. Kode: dipisahkan berdasarkan fungsi, bukan satu file besar/spaghetti code.
10. Database rencana: JSONBin.
11. Data awal berasal dari `data awal(1).xlsx`.
12. Data awal yang terbaca: 30 member, 4 line; Stamping memiliki contoh skill Operation 1–4 dan member training.

## Struktur V1
- index.html
- config.js
- css/global.css
- css/dashboard.css
- css/member.css
- css/replacement.css
- js/data.js
- js/storage.js
- js/ui.js
- js/replacement.js
- js/app.js
- data/seed.json

## Logika inti
Line → Operation → filter member tersedia → hitung kecocokan skill → ranking → pilih → simpan riwayat.

## Foto
V1: preview + simpan data URL di localStorage untuk pengujian.
Production: foto harus dipisahkan dari JSONBin; simpan URL saja di data member.

## Keputusan arsitektur penting
CodeIgniter cocok bila deployment menggunakan PHP hosting.
Jika target deployment Vercel static, gunakan frontend modular + backend/proxy terpisah. Jangan expose JSONBin Master Key di browser.

## Fase berikutnya
Fase 1: validasi UI + data model.
Fase 2: integrasi JSONBin melalui backend/proxy aman.
Fase 3: skill matrix lengkap untuk semua line.
Fase 4: availability/shift + assignment rules + audit/history.
Fase 5: production hardening untuk 300+ member dan foto.

## Aturan untuk chat berikutnya
Jangan mengulang desain dari nol.
Mulai dari CHECKPOINT ini.
Pertahankan pemisahan file dan fungsi.
Setiap perubahan kode harus menyebutkan file yang diubah.
