SHOPHUB v3 — Prototype Sistem Informasi E-Commerce (dengan Backend)
=====================================================================

Cara menjalankan:
1. Pastikan Node.js sudah terpasang (cek: node -v di terminal).
2. Extract folder ini, buka di terminal / VS Code.
3. Install dependency:
     npm install
4. Jalankan server:
     npm start
5. Buka browser ke:
     http://localhost:3000
6. Coba alur: cari produk -> filter kategori -> lihat detail -> tambah ke
   keranjang -> checkout -> lihat riwayat pesanan.

Apa yang berubah dari versi sebelumnya:
- BACKEND SUNGGUHAN: sekarang ada server Node.js + Express (server.js)
  yang menyediakan REST API:
    GET  /api/products       -> daftar produk & stok dari server
    GET  /api/products/:id   -> detail satu produk
    GET  /api/orders         -> riwayat pesanan (20 terbaru)
    POST /api/orders         -> buat pesanan baru
  Stok dan riwayat pesanan sekarang benar-benar tersimpan di server,
  di file data/db.json -- bukan lagi di localStorage browser. Itu artinya
  data tidak hilang walau cache browser dibersihkan, dan (secara konsep)
  bisa diakses dari beberapa perangkat ke server yang sama.
- Validasi stok dipindah ke server: saat checkout, server mengecek ulang
  stok tiap produk sebelum pesanan disimpan dan sebelum stok dikurangi
  (bukan cuma percaya data dari browser). Kalau stok tidak cukup, server
  menolak dengan pesan error yang jelas.
- Desain visual baru: arah "berani & colorful" -- palet vivid (merah
  koral, biru elektrik, lime, kuning matahari) di atas dasar putih hangat,
  garis tebal ala poster, dan bayangan offset keras (bukan shadow blur
  abu-abu khas template SaaS). Tipografi Unbounded (judul, tebal &
  geometris) + Plus Jakarta Sans (isi).
- Wishlist & isi keranjang tetap disimpan di localStorage browser (belum
  ada sistem login/akun, jadi ini memang wajar per-perangkat).
- Tetap mempertahankan semua fitur versi sebelumnya: pencarian, filter
  kategori, urutkan harga, validasi form checkout, dark mode, aksesibilitas
  (skip link, aria-label, fokus terlihat, modal bisa ditutup dengan Esc).

Struktur folder:
  server.js         -> server Express + semua route API
  db.js              -> helper baca/tulis file database (data/db.json)
  data/db.json       -> "database" file: daftar produk, stok, & pesanan
  public/index.html  -> halaman utama
  public/style.css   -> tema visual baru
  public/script.js   -> logika frontend, sekarang fetch ke /api/...
  alur-sistem-shophub.svg -> flowchart alur sistem (belum diperbarui
                              untuk versi backend ini)

Teknologi:
- Frontend: HTML5, CSS3, JavaScript (vanilla)
- Backend: Node.js + Express
- "Database": file JSON (data/db.json), dibaca/ditulis lewat db.js
- Tidak ada login/akun pengguna, dan payment masih simulasi

Catatan untuk presentasi:
- Framing yang disarankan ke dosen: "sistem informasi e-commerce dengan
  arsitektur client-server sederhana -- frontend mengirim request ke
  REST API, backend memvalidasi & menyimpan data ke database file."
- Kalau ditanya "ini sudah e-commerce sungguhan?": jawab bahwa alur
  input-proses-simpan-output sudah nyata melalui server & file database,
  tapi belum ada login pengguna, payment gateway asli, atau database
  relasional (masih file JSON, bukan MySQL/PostgreSQL/MongoDB).

Pengembangan lanjutan (kalau diminta dosen):
- Ganti data/db.json dengan database sungguhan (SQLite/MySQL/PostgreSQL)
- Login/register & akun pengguna, riwayat pesanan per akun
- Admin dashboard untuk kelola produk & stok
- Payment gateway asli
- Upload gambar produk asli (bukan emoji)
- API ongkir

DEPLOY VERCEL
=============
Project ini sudah disesuaikan agar Express dapat dijalankan di Vercel.
Vercel dapat mendeteksi aplikasi Express/Node.js tanpa konfigurasi khusus.

Catatan penting:
- Di komputer lokal, database tetap menggunakan data/db.json dan tetap persisten.
- Di Vercel, data db.json hanya dimuat ke memory instance untuk kebutuhan demo.
- Perubahan order/stok di Vercel TIDAK dijamin persisten setelah instance baru/cold start.
- Untuk tugas/demo ini cukup, tetapi untuk aplikasi production sebaiknya gunakan database
  sungguhan seperti PostgreSQL/Supabase/MySQL.
