'use strict';
/* =====================================================================
   supabase.js : semua urusan dengan Supabase ada di file ini.
   - Koneksi (URL project + Publishable Key)
   - Login, kode akses 6 digit, logout
   - Baca dan tulis data (materi, soal, modul, ppt, tautan kuis)
   - Unggah dan buka berkas lewat Supabase Storage

   PENTING: isi dua baris di bawah ini dengan milik project Anda.
   Gunakan Publishable Key (awalan sb_publishable_...) atau anon key.
   JANGAN PERNAH menaruh Secret Key / service_role di file ini.
   ===================================================================== */
const SUPABASE_URL = 'https://fwjrdchwesofzmyclwos.supabase.co';
const SUPABASE_KEY = 'sb_publishable_F7dqKHcLRDLV69T34sWaig_iQ-rgi9n';
const BUCKET = 'econview-files';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

/* Pemetaan: kunci lama di script.js -> tabel Supabase + kolom beserta nilai bawaannya */
const FILE_COLS = { id: '', t: '', d: '', name: '', file_path: '' };
const TABLES = {
  ev_materi: { table: 'materi', cols: { id: '', bab: '', t: '', d: '', poin: '', rumus: '', contoh: '', sim: 0 } },
  ev_soal: { table: 'soal', cols: { id: '', bab: '', jenis: 'pg', q: '', opts: '', key: '', qd: '', qs: '', ai: 0 } },
  ev_modul: { table: 'modul', cols: FILE_COLS },
  ev_ppt: { table: 'ppt', cols: FILE_COLS },
  ev_links: { table: 'links', cols: { id: '', n: '', u: '' } }
};

const DBX = {
  cache: { ev_materi: [], ev_soal: [], ev_modul: [], ev_ppt: [], ev_links: [] },
  pending: 0, // jumlah penyimpanan yang masih berjalan
  hooks: { error: () => {}, lock: () => {} },

  /* Rapikan satu baris data agar hanya berisi kolom yang dikenal tabel */
  norm(k, row) {
    const out = {};
    Object.entries(TABLES[k].cols).forEach(([c, def]) => {
      let v = row[c];
      if (v === undefined || v === null) v = def;
      out[c] = typeof def === 'number' ? Number(v) || 0 : String(v);
    });
    return out;
  },

  /* ---------- LOGIN ---------- */
  async login(email, password, kode) {
    const generic = 'Email, password, atau kode akses salah.';
    let r;
    try { r = await sb.auth.signInWithPassword({ email: email.trim(), password }); }
    catch (e) { return { ok: false, msg: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' }; }
    if (r.error) {
      if (r.error.name === 'AuthRetryableFetchError') return { ok: false, msg: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' };
      return { ok: false, msg: generic };
    }
    const v = await sb.rpc('verify_access_code', { kode: String(kode) });
    if (v.error) {
      await sb.auth.signOut();
      const m = String(v.error.message || '');
      return { ok: false, msg: m.includes('Terlalu banyak') ? 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' : generic };
    }
    if (v.data !== true) { await sb.auth.signOut(); return { ok: false, msg: generic }; }
    return { ok: true };
  },
  /* Ada sesi login DAN kode akses sudah lolos untuk sesi ini? */
  async hasAccess() {
    try {
      const { data } = await sb.auth.getSession();
      if (!data.session) return false;
      const v = await sb.rpc('is_verified');
      if (v.error || v.data !== true) { await sb.auth.signOut(); return false; }
      return true;
    } catch (e) { return false; }
  },
  async logout() {
    try { await sb.removeAllChannels(); } catch (e) { /* abaikan */ }
    try { await sb.auth.signOut(); } catch (e) { /* abaikan */ }
    Object.keys(this.cache).forEach(k => { this.cache[k] = []; });
  },

  /* ---------- BACA DATA ---------- */
  /* Mengembalikan true jika ada data yang berubah dibanding sebelumnya */
  async loadAll() {
    if (!(await this.hasAccess())) { this.hooks.lock('Sesi berakhir. Silakan masuk lagi.'); return false; }
    let changed = false;
    const res = await Promise.all(Object.entries(TABLES).map(async ([k, T]) => {
      const { data, error } = await sb.from(T.table).select('*').order('seq', { ascending: true });
      if (error) throw error;
      return [k, data.map(r => this.norm(k, r))];
    }));
    res.forEach(([k, rows]) => {
      if (JSON.stringify(rows) !== JSON.stringify(this.cache[k])) { this.cache[k] = rows; changed = true; }
    });
    return changed;
  },

  /* ---------- TULIS DATA ----------
     save(kunci, daftarBaru): membandingkan daftar baru dengan cache,
     lalu mengirim baris yang baru/berubah (upsert) dan menghapus yang hilang. */
  save(k, next) {
    const T = TABLES[k], old = this.cache[k];
    const oldMap = new Map(old.map(r => [r.id, r]));
    const nextN = next.map(r => this.norm(k, r));
    const ids = new Set(nextN.map(r => r.id));
    const up = nextN.filter(r => { const o = oldMap.get(r.id); return !o || JSON.stringify(o) !== JSON.stringify(r); });
    const gone = old.filter(r => !ids.has(r.id));
    this.cache[k] = nextN; // tampil langsung, lalu disimpan di latar belakang
    this.pending++;
    return (async () => {
      try {
        if (up.length) { const { error } = await sb.from(T.table).upsert(up); if (error) throw error; }
        if (gone.length) {
          const { error } = await sb.from(T.table).delete().in('id', gone.map(r => r.id)); if (error) throw error;
          const files = gone.map(r => r.file_path).filter(Boolean);
          if (files.length) await sb.storage.from(BUCKET).remove(files);
        }
      } catch (e) {
        const denied = e && (e.code === '42501' || /row-level security|JWT/i.test(e.message || ''));
        this.hooks.error(denied ? 'Sesi berakhir atau akses ditolak. Silakan masuk lagi.' : 'Perubahan gagal disimpan: ' + (e.message || e));
        if (denied) this.hooks.lock('Sesi berakhir. Silakan masuk lagi.');
        else { try { await this.loadAll(); this.hooks.refresh && this.hooks.refresh(); } catch (e2) { /* abaikan */ } }
      } finally { this.pending--; }
    })();
  },

  /* ---------- BERKAS (Supabase Storage) ---------- */
  async uploadFile(k, file) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${k}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw error;
    return path;
  },
  async signedUrl(path) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  },

  /* ---------- SINKRONISASI antarperangkat ---------- */
  subscribe(onChange) {
    try {
      sb.channel('econview-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => onChange()).subscribe();
    } catch (e) { /* jika Realtime tidak aktif, pemeriksaan berkala tetap berjalan */ }
  }
};
