-- =====================================================================
-- Mengatur KODE AKSES 6 digit (disimpan sebagai hash, bukan teks biasa).
-- 1. Ganti GANTI_DENGAN_6_ANGKA di bawah (biarkan tanda kutip) dengan kode pilihan Anda (6 angka).
-- 2. Jalankan di SQL Editor. Untuk mengganti kode nanti, jalankan lagi.
-- 3. Setelah itu, hapus kode dari editor/riwayat query. Jangan dibagikan di chat.
-- =====================================================================
insert into public.access_config (id, code_hash)
values (1, extensions.crypt('290303', extensions.gen_salt('bf')))
on conflict (id) do update set code_hash = excluded.code_hash;
