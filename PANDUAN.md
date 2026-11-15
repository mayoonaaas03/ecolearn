# Panduan Pasang EconView + Supabase

Isi folder ini: `index.html`, `style.css`, `script.js`, `supabase.js`, `1-setup-database.sql`, `2-kode-akses.sql`.

## A. Buat project Supabase
1. Buka supabase.com, daftar, lalu **New project**. Catat password database (simpan sendiri).
2. Tunggu project selesai dibuat.

## B. Matikan pendaftaran publik dan buat akun bersama
1. **Authentication > Sign In / Providers** (atau **Providers > Email**): matikan **Allow new users to sign up**. Pastikan **Confirm email** boleh aktif atau nonaktif, keduanya aman karena akun dibuat manual.
2. **Authentication > Users > Add user > Create new user**: isi email dan password yang KUAT, centang **Auto Confirm User**.

## C. Jalankan SQL
1. **SQL Editor > New query**: tempel seluruh isi `1-setup-database.sql`, klik **Run**.
2. Buka `2-kode-akses.sql`, ganti `GANTI_DENGAN_6_ANGKA` dengan kode 6 angka pilihan Anda, lalu **Run**.

## D. Isi kunci di `supabase.js`
1. **Project Settings > API** (atau tombol **Connect**): salin **Project URL** dan **Publishable key** (awalan `sb_publishable_`).
2. Tempel ke `SUPABASE_URL` dan `SUPABASE_KEY` di bagian atas `supabase.js`.
3. Jangan pernah memakai Secret key / service_role di file ini.

## E. Uji
Buka `index.html` lewat server lokal (contoh: ekstensi Live Server di VS Code, jangan klik dua kali file-nya), lalu coba:
- Login dengan data salah: harus ditolak.
- Login benar: masuk ke beranda dengan 7 materi dan 6 soal.
- Tambah materi, buka di perangkat/browser lain: harus muncul (maks. sekitar 20 detik tanpa refresh).
- Upload PDF di Modul/RPP, lalu buka dan hapus.
- Klik Keluar: kembali ke layar login.

## F. Publikasi (GitHub + Vercel)
1. Unggah keempat file web ke repository GitHub (jangan unggah file `.sql`).
2. vercel.com > **Add New > Project** > pilih repository > **Deploy** (tanpa pengaturan tambahan).
3. Di Supabase **Authentication > URL Configuration**, isi **Site URL** dengan alamat Vercel Anda.

## Catatan keamanan
- Layar login hanya pintu depan. Yang benar-benar menjaga data adalah aturan RLS di database: tanpa login dan kode akses yang benar, data tidak bisa dibaca atau diubah.
- Kode akses disimpan sebagai hash. Salah 5 kali, akun ditahan 15 menit. Verifikasi berlaku 12 jam per perangkat.
- Karena akun dipakai bertiga, siapa pun yang punya email, password, dan kode dapat mengubah atau menghapus data. Tombol "Pulihkan bawaan" menimpa data untuk semua orang.
- Ganti email, password, dan kode contoh dari prompt awal dengan yang baru.
