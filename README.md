# Man Power Replacement — V1

Versi awal berbasis HTML/CSS/JavaScript modular untuk validasi UI/UX dan alur replacement.

## Data awal
Seed data berasal dari `data awal(1).xlsx`:
- 30 member
- 4 line: Stamping, Assy, Sub Assy, Molding
- matriks skill Stamping dan data training yang tersedia pada file

## Menjalankan
Bisa dibuka melalui static hosting. Untuk local test, gunakan server sederhana (misalnya Live Server), karena `fetch(data/seed.json)` membutuhkan HTTP.

## Foto member
Fitur upload foto sudah tersedia. Pada V1 foto disimpan sebagai data URL di browser (localStorage) untuk validasi UX.
Untuk production 300+ member, foto **jangan** disimpan sebagai base64 di JSONBin. Gunakan object/image storage terpisah dan simpan hanya `photoUrl` di data member.

## JSONBin
`config.js` menyediakan tempat konfigurasi, tetapi Master Key tidak boleh ditanam di frontend production.
Arsitektur production yang aman:
Browser → backend/proxy → JSONBin
Browser → image storage → photoUrl

## Catatan CodeIgniter
Jika deployment final menggunakan CodeIgniter/PHP, frontend V1 ini dapat dijadikan layer UI dan endpoint JSONBin dipindahkan ke Controller/Service PHP. Jangan memaksa CodeIgniter pada Vercel static deployment.
