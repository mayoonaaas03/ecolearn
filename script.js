'use strict';
/* ===== [1] UTILITAS: fungsi bantu ($, format angka, simpan data) ===== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const nf = n => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 });
const par = n => (n < 0 ? `(${nf(n)})` : nf(n));
const fnStr = f => `${nf(f.a)} ${f.b < 0 ? '-' : '+'} ${nf(Math.abs(f.b))}P`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
/* LS tetap dipakai agar kode lama tidak perlu dirombak, tetapi isinya sekarang
   berasal dari Supabase (lewat DBX di supabase.js), bukan localStorage. */
const LS = {
  get(k, d) { const v = DBX.cache[k]; return v ? v.map(x => ({ ...x })) : d; },
  set(k, v) { DBX.save(k, v); return true; }
};
const MAXFILE = 10 * 1024 * 1024;

/* ===== [2] DATA BAWAAN: materi, soal, platform kuis, skenario ===== */
const MAT_SEED = [
  { id: 'm1', bab: 'Bab 1 Dasar Ilmu Ekonomi', t: 'Konsep Dasar Ilmu Ekonomi', d: 'Ilmu ekonomi mempelajari cara manusia memilih untuk memenuhi kebutuhan yang tidak terbatas dengan sumber daya yang terbatas.', poin: 'Kebutuhan manusia tidak terbatas\nSumber daya terbatas\nSetiap pilihan menuntut pengorbanan', rumus: '', contoh: 'Siswa memilih antara jajan di kantin atau menabung untuk membeli buku.' },
  { id: 'm2', bab: 'Bab 1 Dasar Ilmu Ekonomi', t: 'Kelangkaan dan Kebutuhan', d: 'Kelangkaan muncul ketika sumber daya tidak cukup untuk memenuhi semua keinginan. Kebutuhan perlu diprioritaskan.', poin: 'Kelangkaan berbeda dari kekurangan sesaat\nKebutuhan primer lebih didahulukan', rumus: '', contoh: 'Stok elpiji yang menipis membuat warga memprioritaskan penggunaannya untuk memasak.' },
  { id: 'm3', bab: 'Bab 1 Dasar Ilmu Ekonomi', t: 'Biaya Peluang', d: 'Biaya peluang adalah nilai alternatif terbaik yang dikorbankan ketika kita membuat suatu pilihan.', poin: 'Selalu ada pilihan yang dikorbankan\nTidak selalu berupa uang', rumus: '', contoh: 'Belajar untuk ujian berarti mengorbankan waktu bermain gim.' },
  { id: 'm4', bab: 'Bab 2 Sistem Ekonomi', t: 'Sistem Ekonomi', d: 'Sistem ekonomi adalah cara suatu negara mengatur produksi, distribusi, dan konsumsi. Contohnya sistem tradisional, pasar, komando, dan campuran.', poin: 'Tradisional, pasar, komando, campuran\nIndonesia menganut sistem ekonomi campuran', rumus: '', contoh: 'Harga gula dibentuk pasar, sedangkan BBM bersubsidi diatur pemerintah.' },
  { id: 'm5', bab: 'Bab 3 Pasar', t: 'Permintaan dan Penawaran', sim: 1, d: 'Hukum permintaan menyatakan harga naik membuat jumlah diminta turun. Hukum penawaran menyatakan harga naik membuat jumlah ditawarkan naik, dengan anggapan faktor lain tetap.', poin: 'Kurva permintaan miring ke bawah\nKurva penawaran miring ke atas\nPerubahan harga menggerakkan titik sepanjang kurva\nFaktor lain menggeser kurva', rumus: 'Qd = a - bP dan Qs = c + dP', contoh: 'Harga cabai naik saat panen gagal karena penawaran berkurang.' },
  { id: 'm6', bab: 'Bab 3 Pasar', t: 'Harga Keseimbangan Pasar', sim: 1, d: 'Harga keseimbangan terjadi ketika jumlah diminta sama dengan jumlah ditawarkan. Di atasnya terjadi kelebihan penawaran, di bawahnya terjadi kekurangan penawaran.', poin: 'Syarat: Qd = Qs\nHarga di atas keseimbangan menimbulkan surplus\nHarga di bawah keseimbangan menimbulkan kekurangan', rumus: 'Qd = Qs', contoh: 'Tiket konser dijual di bawah harga keseimbangan sehingga habis dalam hitungan menit.' },
  { id: 'm7', bab: 'Bab 3 Pasar', t: 'Pasar dan Struktur Pasar', d: 'Struktur pasar dibedakan menurut jumlah penjual, jenis barang, dan kemudahan keluar masuk pasar.', poin: 'Persaingan sempurna\nMonopoli\nOligopoli\nPersaingan monopolistik', rumus: '', contoh: 'Layanan listrik rumah tangga di suatu wilayah dekat dengan monopoli.' }
];
const SOAL_SEED = [
  { id: 's1', bab: 'Permintaan dan Penawaran', jenis: 'pg', q: 'Menurut hukum permintaan, jika harga naik dan faktor lain tetap, maka...', opts: 'Jumlah diminta naik\nJumlah diminta turun\nKurva permintaan bergeser ke kanan\nJumlah ditawarkan turun', key: 'B. Harga naik menggerakkan titik sepanjang kurva permintaan sehingga jumlah diminta turun.' },
  { id: 's2', bab: 'Permintaan dan Penawaran', jenis: 'pg', q: 'Pendapatan konsumen naik untuk barang normal. Dampaknya pada pasar adalah...', opts: 'Kurva penawaran bergeser ke kiri\nKurva permintaan bergeser ke kanan\nKurva permintaan bergeser ke kiri\nHarga keseimbangan turun', key: 'B. Daya beli naik sehingga permintaan bertambah pada setiap harga.' },
  { id: 's3', bab: 'Permintaan dan Penawaran', jenis: 'esai', q: 'Jelaskan perbedaan pergerakan sepanjang kurva dan pergeseran kurva, disertai satu contoh masing-masing.', opts: '', key: 'Pergerakan terjadi karena perubahan harga barang itu sendiri. Pergeseran terjadi karena faktor lain seperti pendapatan, selera, jumlah konsumen, atau biaya produksi.' },
  { id: 's4', bab: 'Harga Keseimbangan', jenis: 'hitung', q: 'Diketahui Qd = 120 - 2P dan Qs = 20 + 2P. Tentukan harga dan jumlah keseimbangan.', opts: '', key: '', qd: '120 - 2P', qs: '20 + 2P' },
  { id: 's5', bab: 'Harga Keseimbangan', jenis: 'hitung', q: 'Diketahui Qd = 200 - 4P dan Qs = 40 + 4P. Tentukan titik keseimbangan pasar.', opts: '', key: '', qd: '200 - 4P', qs: '40 + 4P' },
  { id: 's6', bab: 'Biaya Peluang', jenis: 'esai', q: 'Seorang siswa memilih mengikuti les sore dan tidak ikut ekstrakurikuler. Apa biaya peluangnya?', opts: '', key: 'Biaya peluangnya adalah manfaat dari kegiatan ekstrakurikuler yang tidak jadi diikuti.' }
];
const MODUL_SEED = { t: 'Contoh Modul Ajar: Permintaan dan Penawaran', d: 'Contoh ringkas perangkat ajar kelas 10.', body: '<h4>Tujuan pembelajaran</h4><p>Siswa mampu menjelaskan hukum permintaan dan penawaran serta menentukan keseimbangan pasar dari data atau persamaan sederhana.</p><h4>Alur kegiatan</h4><ul><li>Pemantik: mengapa harga cabai berubah-ubah</li><li>Eksplorasi kurva lewat simulasi EconView</li><li>Latihan menghitung keseimbangan pasar</li><li>Refleksi dan kuis singkat</li></ul><p class="muted">Isi bagian Capaian Pembelajaran sesuai kurikulum yang dipakai sekolah.</p>' };
const PLATFORMS = [
  { n: 'Quizizz', c: '#8854c0', u: 'https://quizizz.com', d: 'Kuis interaktif dengan skor dan laporan hasil belajar.' },
  { n: 'Kahoot!', c: '#46178f', u: 'https://kahoot.com', d: 'Kuis kompetitif yang seru dimainkan bersama di kelas.' },
  { n: 'Google Forms', c: '#673ab7', u: 'https://forms.google.com', d: 'Formulir untuk kuis, tugas, dan evaluasi sederhana.' }
];
const SC = {
  none: null,
  price: { type: 'move', title: 'Perubahan harga barang', text: 'Perubahan harga barang itu sendiri tidak menggeser kurva. Titik hanya bergerak sepanjang kurva permintaan dan penawaran yang sama. Atur harga uji pada Mode 2 untuk melihat akibatnya.' },
  income: { type: 'shift', curve: 'd', dir: 1, title: 'Pendapatan konsumen meningkat', text: 'Untuk barang normal, daya beli naik sehingga konsumen membeli lebih banyak pada setiap harga. Kurva permintaan bergeser ke kanan.' },
  cost: { type: 'shift', curve: 's', dir: -1, title: 'Biaya produksi meningkat', text: 'Produsen menawarkan lebih sedikit pada setiap harga karena biaya naik. Kurva penawaran bergeser ke kiri.' },
  consumers: { type: 'shift', curve: 'd', dir: 1, title: 'Jumlah konsumen bertambah', text: 'Lebih banyak pembeli membuat permintaan pasar bertambah pada setiap harga. Kurva permintaan bergeser ke kanan.' },
  taste: { type: 'shift', curve: 'd', dir: -1, title: 'Selera konsumen berubah (kurang diminati)', text: 'Konsumen membeli lebih sedikit pada setiap harga. Kurva permintaan bergeser ke kiri.' }
};

/* ===== [3] MESIN HITUNG: baca fungsi Qd/Qs, cari keseimbangan, skenario What If ===== */
function parseFn(str) {
  const s = String(str).replace(/\s/g, '').toUpperCase().replace(/^Q[DS]?=/, '').replace(/,/g, '.').replace(/\*/g, '');
  if (!s || /[^0-9P+\-.]/.test(s)) return null;
  let b = 0;
  const rest = s.replace(/([+-]?)(\d*\.?\d*)P/g, (m, sg, n) => { b += (sg === '-' ? -1 : 1) * (n === '' ? 1 : parseFloat(n)); return ''; });
  const terms = rest.match(/[+-]?\d*\.?\d+/g) || [];
  if (rest !== terms.join('')) return null;
  return { a: terms.reduce((t, x) => t + parseFloat(x), 0), b };
}
function solve(d, s) {
  if (d.b >= 0 || s.b <= 0) return { err: 'Fungsi permintaan harus miring negatif dan fungsi penawaran miring positif, misalnya Qd = 120 - 2P dan Qs = 20 + 2P.' };
  const P = (d.a - s.a) / (s.b - d.b), Q = d.a + d.b * P;
  if (P <= 0 || Q <= 0) return { err: 'Kedua kurva tidak berpotongan pada nilai positif. Ubah posisi atau konstanta kurva.' };
  return { P, Q };
}
function scenarioModel(d, s, eq, sc) {
  const S = SC[sc];
  if (!S || S.type !== 'shift') return null;
  const k = Math.round(eq.Q * 0.2), nd = { ...d }, ns = { ...s };
  if (S.curve === 'd') nd.a += S.dir * k; else ns.a += S.dir * k;
  return { nd, ns, k, eq: solve(nd, ns) };
}
function buildModel(qd, qs, price, sc) {
  const d = parseFn(qd), s = parseFn(qs);
  if (!d || !s) return { err: 'Format fungsi belum sesuai. Gunakan bentuk seperti 120 - 2P atau 20 + 2P.' };
  const eq = solve(d, s);
  if (eq.err) return eq;
  const p = parseFloat(price);
  return { d, s, eq, sc, price: p > 0 ? p : null, scen: scenarioModel(d, s, eq, sc) };
}

/* ===== [4] GRAFIK: data garis/titik + penggambar Chart.js ===== */
const charts = {};
const notePlugin = { id: 'note', afterDraw(c) { if (!c.$note) return; const x = c.ctx; x.save(); x.font = '600 14px sans-serif'; x.fillStyle = '#1b2a5c'; x.fillText(c.$note, c.chartArea.left + 12, c.chartArea.top + 20); x.restore(); } };
const ptsLine = (f, Pmax) => { const o = []; for (let i = 0; i <= 80; i++) { const P = Pmax * i / 80, Q = f.a + f.b * P; if (Q >= 0) o.push({ x: +Q.toFixed(3), y: +P.toFixed(3) }); } return o; };
function chartData(m, show) {
  const { d, s, eq } = m, sc = m.scen;
  const Pmax = Math.ceil(Math.max(-d.a / d.b, sc ? -sc.nd.a / sc.nd.b : 0, eq.P * 1.4, m.price || 0) / 5) * 5;
  const L = { d: ptsLine(d, Pmax), s: ptsLine(s, Pmax) };
  const xs = [...L.d, ...L.s].map(p => p.x);
  if (sc) xs.push(...ptsLine(sc.nd, Pmax).map(p => p.x), ...ptsLine(sc.ns, Pmax).map(p => p.x));
  const xmax = Math.ceil(Math.max(...xs) * 1.05 / 10) * 10;
  const ln = (label, data, color, extra = {}) => ({ label, data, borderColor: color, backgroundColor: color, showLine: true, pointRadius: 0, borderWidth: 3.5, tension: 0, ...extra });
  const on = (c, v) => (c ? v : []);
  const E = { x: eq.Q, y: eq.P };
  const hasNew = show.scen && sc && sc.eq && !sc.eq.err;
  const sets = [
    ln('Permintaan (Qd)', on(show.d, L.d), '#3b6fe0'),
    ln('Penawaran (Qs)', on(show.s, L.s), '#f08a24'),
    ln('Garis bantu', on(show.helper && show.d && show.s, [{ x: 0, y: E.y }, E, { x: E.x, y: 0 }]), '#7b86ad', { borderWidth: 1.8, borderDash: [6, 5] }),
    { label: `Keseimbangan E (Q=${nf(eq.Q)}, P=${nf(eq.P)})`, data: on(show.eq && show.d && show.s, [E]), showLine: false, pointRadius: show.hl ? 13 : 8, backgroundColor: '#1b2a5c', borderColor: show.hl ? '#ffd34d' : '#fff', borderWidth: show.hl ? 5 : 2 },
    ln('Permintaan baru', on(hasNew && sc.nd.a !== d.a, sc ? ptsLine(sc.nd, Pmax) : []), '#7aa0f0', { borderDash: [10, 6] }),
    ln('Penawaran baru', on(hasNew && sc.ns.a !== s.a, sc ? ptsLine(sc.ns, Pmax) : []), '#f5b36e', { borderDash: [10, 6] }),
    { label: hasNew ? `E baru (Q=${nf(sc.eq.Q)}, P=${nf(sc.eq.P)})` : 'E baru', data: on(hasNew, hasNew ? [{ x: sc.eq.Q, y: sc.eq.P }] : []), showLine: false, pointRadius: 8, backgroundColor: '#7c5cff', borderColor: '#fff', borderWidth: 2 },
    ln(`Harga uji P = ${nf(m.price || 0)}`, on(show.price && m.price, [{ x: 0, y: m.price }, { x: xmax, y: m.price }]), '#8a6df0', { borderWidth: 1.8, borderDash: [3, 4] }),
    { label: 'Qd dan Qs pada harga uji', data: on(show.price && m.price, [{ x: d.a + d.b * m.price, y: m.price }, { x: s.a + s.b * m.price, y: m.price }].filter(p => p.x >= 0)), showLine: false, pointRadius: 5, backgroundColor: '#8a6df0' }
  ];
  return { sets, xmax, Pmax };
}
/* Penggambar cadangan: dipakai otomatis jika Chart.js gagal dimuat dari CDN */
const plainCache = {};
function plain(id, sets, xmax, Pmax, lb, fs, sz) {
  if (!sz) plainCache[id] = [id, sets, xmax, Pmax, lb, fs];
  const cv = sz ? id : $('#' + id), dpr = sz ? 1 : (window.devicePixelRatio || 1);
  const W = sz ? sz.w : cv.parentElement.clientWidth, H = sz ? sz.h : cv.parentElement.clientHeight;
  if (!W || !H) return;
  if (!sz) { cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
  if (sz) { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); }
  const act = sets.filter(s => s.data.length);
  x.font = `${fs}px sans-serif`;
  let rows = 1, cx = 0;
  const items = act.map(s => ({ s, w: x.measureText(s.label).width + 30 }));
  items.forEach(i => { if (cx + i.w > W - 20) { rows++; cx = 0; } i.r = rows - 1; i.x = cx; cx += i.w + 8; });
  const lh = fs + 10, L = 56, R = 20, T = 20, B = 52 + rows * lh;
  const px = v => L + v / xmax * (W - L - R), py = v => H - B - v / Pmax * (H - B - T);
  x.strokeStyle = '#e8eefc'; x.fillStyle = '#1b2a5c'; x.lineWidth = 1; x.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const gx = xmax * i / 5, gy = Pmax * i / 5;
    x.beginPath(); x.moveTo(px(gx), T); x.lineTo(px(gx), H - B); x.moveTo(L, py(gy)); x.lineTo(W - R, py(gy)); x.stroke();
    x.fillText(nf(gx), px(gx), H - B + fs + 4);
    x.textAlign = 'right'; x.fillText(nf(gy), L - 6, py(gy) + 4); x.textAlign = 'center';
  }
  x.strokeStyle = '#1b2a5c'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(L, T); x.lineTo(L, H - B); x.lineTo(W - R, H - B); x.stroke();
  x.font = `700 ${fs + 1}px sans-serif`;
  x.fillText(lb.x || 'Jumlah barang (Q)', L + (W - L - R) / 2, H - B + fs * 2 + 10);
  x.save(); x.translate(14, T + (H - B - T) / 2); x.rotate(-Math.PI / 2); x.fillText(lb.y || 'Harga (P)', 0, 0); x.restore();
  x.font = `${fs}px sans-serif`;
  act.forEach(s => {
    const c = s.borderColor || s.backgroundColor;
    if (s.showLine) {
      x.strokeStyle = c; x.lineWidth = s.borderWidth || 3; x.setLineDash(s.borderDash || []); x.beginPath();
      s.data.forEach((p, i) => (i ? x.lineTo(px(p.x), py(p.y)) : x.moveTo(px(p.x), py(p.y)))); x.stroke(); x.setLineDash([]);
    } else {
      s.data.forEach(p => { x.beginPath(); x.arc(px(p.x), py(p.y), s.pointRadius || 6, 0, 7); x.fillStyle = s.backgroundColor; x.fill(); x.strokeStyle = s.borderColor || '#fff'; x.lineWidth = s.borderWidth || 2; x.stroke(); });
    }
  });
  x.textAlign = 'left'; x.fillStyle = '#1b2a5c';
  if (lb.note) { x.font = `600 ${fs + 1}px sans-serif`; x.fillText(lb.note, L + 12, T + fs + 4); x.font = `${fs}px sans-serif`; }
  items.forEach(i => {
    const ly = H - rows * lh + i.r * lh + fs * 0.5, lx = 14 + i.x, c = i.s.borderColor || i.s.backgroundColor;
    x.fillStyle = c; x.strokeStyle = c; x.lineWidth = 3;
    if (i.s.showLine) { x.setLineDash(i.s.borderDash ? [4, 3] : []); x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + 18, ly); x.stroke(); x.setLineDash([]); }
    else { x.beginPath(); x.arc(lx + 9, ly, 5, 0, 7); x.fill(); }
    x.fillStyle = '#1b2a5c'; x.fillText(i.s.label, lx + 24, ly + 4);
  });
}
window.addEventListener('resize', () => Object.values(plainCache).forEach(a => plain(...a)));

/* ----------------------------------------------------------------------
   draw(): menggambar grafik di canvas.
   PERBAIKAN: grafik lama sering "kosong" di Teaching Mode karena dibuat saat
   halaman masih tersembunyi (ukuran canvas = 0). Sekarang:
   1. grafik lama dihancurkan jika ukurannya 0 atau canvas berganti,
   2. dibuat ulang setelah halaman tampil (requestAnimationFrame),
   3. jika Chart.js error, otomatis pakai penggambar cadangan plain().
   ---------------------------------------------------------------------- */
function draw(key, canvasId, m, show, fs) {
  const { sets, xmax, Pmax } = m.custom || chartData(m, show), lb = m.lbl || {};
  const cv = $('#' + canvasId);
  const box = cv.parentElement;
  // Halaman belum tampil: tunda satu frame lalu coba lagi
  if (!box.clientWidth || !box.clientHeight) { requestAnimationFrame(() => draw(key, canvasId, m, show, fs)); return; }
  // Chart.js gagal dimuat -> pakai penggambar cadangan
  if (typeof Chart === 'undefined') return plain(canvasId, sets, xmax, Pmax, lb, fs);
  try {
    // Hapus gaya ukuran sisa dari penggambar cadangan
    cv.style.width = ''; cv.style.height = '';
    // Hancurkan grafik lama bila canvas-nya sudah tidak sama / ukuran 0
    let c = charts[key];
    if (c && (c.canvas !== cv || !c.width || !c.height)) { c.destroy(); c = charts[key] = null; }
    // Pengaturan sumbu X dan Y
    const axis = (text, max) => ({ type: 'linear', min: 0, max, title: { display: true, text, font: { size: fs + 1, weight: '700' }, color: '#1b2a5c' }, ticks: { font: { size: fs } }, grid: { color: '#e8eefc' } });
    const sx = axis(lb.x || 'Jumlah barang (Q)', xmax), sy = axis(lb.y || 'Harga (P)', Pmax);
    if (c) { // grafik sudah ada: cukup perbarui data
      c.data.datasets = sets; c.options.scales.x = sx; c.options.scales.y = sy;
    } else { // grafik baru
      c = charts[key] = new Chart(cv, {
        type: 'scatter', data: { datasets: sets }, plugins: [notePlugin],
        options: {
          responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
          scales: { x: sx, y: sy },
          plugins: { legend: { position: 'bottom', labels: { font: { size: fs }, usePointStyle: true, boxWidth: 10, filter: (i, cd) => cd.datasets[i.datasetIndex].data.length > 0 } } }
        }
      });
    }
    c.$note = lb.note || '';
    c.update();
  } catch (err) { // Chart.js bermasalah -> jangan biarkan kosong
    console.warn('Chart.js error, pakai penggambar cadangan:', err);
    if (charts[key]) { try { charts[key].destroy(); } catch (e) { /* abaikan */ } charts[key] = null; }
    plain(canvasId, sets, xmax, Pmax, lb, fs);
  }
}

/* ===== [5] SIMULATOR GURU: Mode 1 (slider) & Mode 2 (persamaan) ===== */
const SIM = { mode: 'manual' };
const SIM_IDS = ['rA', 'rB', 'rC', 'rD', 'inQd', 'inQs', 'inP', 'inSc', 'lbX', 'lbY', 'note'];
function simModel() {
  const sc = $('#inSc').value;
  const m = SIM.mode === 'manual'
    ? buildModel(`${$('#rA').value}-${$('#rB').value}P`, `${$('#rC').value}+${$('#rD').value}P`, 0, sc)
    : buildModel($('#inQd').value, $('#inQs').value, $('#inP').value, sc);
  if (!m.err) m.lbl = { x: $('#lbX').value, y: $('#lbY').value, note: $('#note').value };
  return m;
}
function renderSim() {
  ['A', 'B', 'C', 'D'].forEach(k => { $('#o' + k).textContent = nf($('#r' + k).value); });
  const m = simModel(), err = $('#err');
  err.hidden = true;
  if (m.err) { err.textContent = m.err; err.hidden = false; $('#explain').innerHTML = `<p class="err">${m.err}</p>`; return; }
  const show = { d: $('#cD').checked, s: $('#cS').checked, helper: $('#cH').checked, eq: $('#cE').checked, price: 1, scen: 1 };
  draw('sim', 'chart', m, show, 12);
  renderChips(m);
  $('#stepsCard').hidden = SIM.mode !== 'eq';
  if (SIM.mode === 'eq') renderSteps(m);
  renderExplain(m);
  const o = {}; SIM_IDS.forEach(i => { o[i] = $('#' + i).value; }); o.mode = SIM.mode;
  try { sessionStorage.setItem('ev_sim', JSON.stringify(o)); } catch (e) { /* abaikan */ }
}
function setMode(mode) {
  SIM.mode = mode;
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.mode === mode));
  $('#mManual').hidden = mode !== 'manual'; $('#mEq').hidden = mode !== 'eq';
  renderSim();
}
function renderChips(m) {
  const { d, s, eq } = m;
  let h = `<div class="chip"><small>Harga keseimbangan (P)</small><b>${nf(eq.P)}</b></div><div class="chip"><small>Jumlah keseimbangan (Q)</small><b>${nf(eq.Q)}</b></div><div class="chip"><small>Koordinat E (Q, P)</small><b>(${nf(eq.Q)}, ${nf(eq.P)})</b></div>`;
  if (m.price) {
    const qd = Math.max(0, d.a + d.b * m.price), qs = Math.max(0, s.a + s.b * m.price), g = qs - qd;
    h += `<div class="chip"><small>Pada P = ${nf(m.price)}</small><b>Qd ${nf(qd)} | Qs ${nf(qs)}</b></div><div class="chip ${g === 0 ? 'ok' : 'bad'}"><small>Kondisi pasar</small><b>${g === 0 ? 'Seimbang' : g > 0 ? 'Kelebihan penawaran ' + nf(g) : 'Kekurangan penawaran ' + nf(-g)}</b></div>`;
  }
  $('#chips').innerHTML = h;
}
function renderSteps(m) {
  const { d, s, eq } = m, dif = d.a - s.a, sl = s.b - d.b;
  const st = [
    ['Samakan fungsi permintaan dan penawaran', `Qd = Qs<br>${fnStr(d)} = ${fnStr(s)}`],
    ['Cari harga keseimbangan', `${nf(d.a)} - ${par(s.a)} = ${nf(s.b)}P - ${par(d.b)}P<br>${nf(dif)} = ${nf(sl)}P<br>P = ${nf(dif)} / ${nf(sl)}<br><b>P = ${nf(eq.P)}</b>`],
    ['Cari jumlah keseimbangan', `Substitusikan P = ${nf(eq.P)} ke fungsi permintaan:<br>Q = ${nf(d.a)} + ${par(d.b)}(${nf(eq.P)})<br><b>Q = ${nf(eq.Q)}</b>`],
    ['Hasil', `Harga keseimbangan = <b>${nf(eq.P)}</b><br>Jumlah keseimbangan = <b>${nf(eq.Q)}</b>`]
  ];
  if (m.price) { const qd = d.a + d.b * m.price, qs = s.a + s.b * m.price; st.push([`Uji pada harga P = ${nf(m.price)}`, `Qd = ${nf(qd)}<br>Qs = ${nf(qs)}<br>Selisih Qs - Qd = <b>${nf(qs - qd)}</b>`]); }
  const sc = m.scen;
  if (sc && sc.eq && !sc.eq.err) { const S = SC[m.sc], o = S.curve === 'd' ? sc.nd : sc.ns; st.push([`Setelah skenario: ${S.title}`, `${S.curve === 'd' ? 'Qd' : 'Qs'} baru = ${fnStr(o)}<br>P baru = <b>${nf(sc.eq.P)}</b><br>Q baru = <b>${nf(sc.eq.Q)}</b>`]); }
  $('#steps').innerHTML = st.map(([t, b]) => `<li><b>${t}</b><div class="eq">${b}</div></li>`).join('');
}
function renderExplain(m) {
  const S = SC[m.sc], box = $('#explain');
  if (!S) { box.innerHTML = '<h3>Pilih skenario What If</h3><p>Penjelasan konsep dan perubahan titik keseimbangan akan muncul di sini.</p>'; return; }
  let out;
  if (S.type === 'move') out = m.price ? `Pada harga uji ${nf(m.price)}, Qd = ${nf(Math.max(0, m.d.a + m.d.b * m.price))} dan Qs = ${nf(Math.max(0, m.s.a + m.s.b * m.price))}. Kurva tetap pada posisinya.` : 'Gunakan Mode 2 dan isi harga uji untuk melihat pergerakan sepanjang kurva.';
  else if (m.scen.eq.err) out = m.scen.eq.err;
  else { const a = m.eq, b = m.scen.eq; out = `Titik keseimbangan berpindah dari (Q=${nf(a.Q)}, P=${nf(a.P)}) ke (Q=${nf(b.Q)}, P=${nf(b.P)}). Harga ${b.P > a.P ? 'naik' : 'turun'} dan jumlah ${b.Q > a.Q ? 'naik' : 'turun'}.`; }
  box.innerHTML = `<span class="badge ${S.type}">${S.type === 'shift' ? 'Pergeseran kurva' : 'Pergerakan sepanjang kurva'}</span><h3>${S.title}</h3><p>${S.text}</p><p><b>${out}</b></p>`;
}
function resetSim() {
  const d = { rA: 120, rB: 2, rC: 20, rD: 2, inQd: '120 - 2P', inQs: '20 + 2P', inP: 30, inSc: 'none', lbX: 'Jumlah barang (Q)', lbY: 'Harga (P)', note: '' };
  Object.entries(d).forEach(([k, v]) => { $('#' + k).value = v; });
  ['cD', 'cS', 'cH', 'cE'].forEach(i => { $('#' + i).checked = true; });
  renderSim();
}
function restoreSim() {
  try { const o = JSON.parse(sessionStorage.getItem('ev_sim')); if (o) { SIM_IDS.forEach(i => { if (o[i] !== undefined) $('#' + i).value = o[i]; }); SIM.mode = o.mode || 'manual'; } } catch (e) { /* abaikan */ }
}

/* ===== Dialog, form, berkas ===== */
const showDlg = html => { $('#dlgBody').innerHTML = html + '<div class="row" style="margin-top:14px"><button class="btn" data-act="close">Tutup</button></div>'; $('#dlg').showModal(); };
function openForm(title, fields, vals, save) {
  const inp = x => x.type === 'area' ? `<textarea name="${x.k}" rows="4">${esc(vals[x.k])}</textarea>`
    : x.type === 'select' ? `<select name="${x.k}">${x.o.map(o => `<option value="${o[0]}"${vals[x.k] === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>`
    : x.type === 'file' ? `<input type="file" name="${x.k}" accept="${x.acc}" required>`
    : `<input name="${x.k}" value="${esc(vals[x.k])}"${x.req ? ' required' : ''}>`;
  $('#dlgBody').innerHTML = `<h3>${title}</h3><form id="frm">${fields.map(x => `<label>${x.l}${inp(x)}</label>`).join('')}<p class="err" id="frmErr" hidden></p><div class="row"><button class="btn primary">Simpan</button><button type="button" class="btn" data-act="close">Batal</button></div></form>`;
  $('#dlg').showModal();
  $('#frm').onsubmit = e => {
    e.preventDefault();
    const o = Object.fromEntries(new FormData(e.target));
    save(o, () => { $('#dlg').close(); renderAll(); }, msg => { $('#frmErr').textContent = msg; $('#frmErr').hidden = false; });
  };
}
function checkFile(file, exts) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!exts.includes(ext)) return 'Format berkas harus ' + exts.join(', ').toUpperCase() + '.';
  if (file.size > MAXFILE) return 'Ukuran berkas maksimal 10 MB.';
  return '';
}
async function viewFile(it) {
  if (!it) return;
  try {
    const url = it.file_path ? await DBX.signedUrl(it.file_path) : it.url;
    const b = await (await fetch(url)).blob(), obj = URL.createObjectURL(b);
    if (/\.pdf$/i.test(it.name)) { $('#vFrame').src = obj; $('#vTitle').textContent = it.t; $('#viewer').hidden = false; }
    else { const a = document.createElement('a'); a.href = obj; a.download = it.name; a.click(); }
  } catch (e) { alert('Berkas tidak dapat dibuka: ' + (e.message || e)); }
}

/* ===== Halaman konten ===== */
const matList = () => LS.get('ev_materi', null) || MAT_SEED.map(x => ({ ...x }));
const soalList = () => LS.get('ev_soal', null) || SOAL_SEED.map(x => ({ ...x }));
const JENIS = { pg: 'Pilihan ganda', esai: 'Esai', hitung: 'Perhitungan' };
function renderAll() { renderHome(); renderIsi(); renderModul(); renderPpt(); renderSoal(); renderQuiz(); }
function renderHome() { $('#homeList').innerHTML = matList().map(x => `<button class="topic" data-act="open-m" data-id="${x.id}">${esc(x.t)}${x.sim ? '<br><span class="tag">Ada simulasi</span>' : ''}</button>`).join(''); }
function renderIsi() {
  const g = {}; matList().forEach(x => { (g[x.bab || 'Lainnya'] = g[x.bab || 'Lainnya'] || []).push(x); });
  $('#isiList').innerHTML = Object.entries(g).map(([b, a]) => `<h3 class="grp">${esc(b)}</h3><div class="stack">${a.map(x => `<div class="row-card"><div><b>${esc(x.t)}</b><small>${esc(x.d).slice(0, 110)}...</small></div><div class="row"><button class="btn primary" data-act="open-m" data-id="${x.id}">Buka</button><button class="btn" data-act="ppt-m" data-id="${x.id}">Buat PPT</button><button class="btn" data-act="edit-m" data-id="${x.id}">Edit</button><button class="btn" data-act="del-m" data-id="${x.id}">Hapus</button></div></div>`).join('')}</div>`).join('') || '<p class="empty">Belum ada materi. Klik Tambah Materi.</p>';
}
function showMateri(id) {
  const x = matList().find(m => m.id === id); if (!x) return;
  const pts = String(x.poin || '').split('\n').filter(Boolean);
  $('#detail').innerHTML = `<div class="card detail"><span class="tag">${esc(x.bab)}</span><h2 style="margin:10px 0">${esc(x.t)}</h2><p>${esc(x.d)}</p>${pts.length ? `<h3>Poin penting</h3><ul>${pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}${x.rumus ? `<h3>Rumus</h3><span class="formula">${esc(x.rumus)}</span>` : ''}${x.contoh ? `<h3 style="margin-top:14px">Contoh sehari-hari</h3><p>${esc(x.contoh)}</p>` : ''}<div class="row"><button class="btn primary" data-act="ppt-m" data-id="${x.id}">Buat Presentasi</button>${x.sim ? '<button class="btn" data-go="sim">Buka simulasi kurva</button>' : ''}</div></div>`;
  go('detail');
}
const MAT_FIELDS = [{ k: 'bab', l: 'Bab', req: 1 }, { k: 't', l: 'Judul materi', req: 1 }, { k: 'd', l: 'Pengertian dan penjelasan', type: 'area' }, { k: 'poin', l: 'Poin penting (satu per baris)', type: 'area' }, { k: 'rumus', l: 'Rumus (jika ada)' }, { k: 'contoh', l: 'Contoh penerapan sehari-hari', type: 'area' }];
function editMateri(id) {
  const L = matList(), cur = L.find(m => m.id === id) || {};
  openForm(id ? 'Edit materi' : 'Tambah materi', MAT_FIELDS, cur, (o, ok) => { if (id) Object.assign(cur, o); else L.push({ id: uid(), ...o }); if (LS.set('ev_materi', L)) ok(); });
}
/* Modul / RPP */
function renderModul() {
  const L = LS.get('ev_modul', []);
  $('#modulList').innerHTML = `<div class="row-card"><div><b>${MODUL_SEED.t}</b><small>${MODUL_SEED.d}</small></div><div class="row"><span class="tag">Contoh</span><button class="btn primary" data-act="view-seed">Lihat</button></div></div>` +
    L.map(x => `<div class="row-card"><div><b>${esc(x.t)}</b><small>${esc(x.d)} (${esc(x.name)})</small></div><div class="row"><button class="btn primary" data-act="view-modul" data-id="${x.id}">${/\.pdf$/i.test(x.name) ? 'Lihat' : 'Unduh'}</button><button class="btn" data-act="del-modul" data-id="${x.id}">Hapus</button></div></div>`).join('');
}
function addFile(key, title, exts) {
  openForm(title, [{ k: 't', l: 'Judul', req: 1 }, { k: 'd', l: 'Deskripsi singkat' }, { k: 'f', l: 'Berkas (' + exts.join(', ').toUpperCase() + ', maks. 10 MB)', type: 'file', acc: exts.map(e => '.' + e).join(',') }], {}, (o, ok, fail) => {
    const f = o.f, bad = checkFile(f, exts);
    if (bad) return fail(bad);
    const btn = $('#frm button.primary'); btn.disabled = true; btn.textContent = 'Mengunggah...';
    DBX.uploadFile(key, f)
      .then(path => { const L = LS.get(key, []); L.push({ id: uid(), t: o.t, d: o.d || '', name: f.name, file_path: path }); LS.set(key, L); ok(); })
      .catch(e => { btn.disabled = false; btn.textContent = 'Simpan'; fail('Gagal mengunggah: ' + (e.message || e)); });
  });
}
function renderPpt() {
  const L = LS.get('ev_ppt', []);
  $('#pptList').innerHTML = L.map(x => `<div class="row-card"><div><b>${esc(x.t)}</b><small>${esc(x.name)}</small></div><div class="row"><button class="btn primary" data-act="view-ppt" data-id="${x.id}">${/\.pdf$/i.test(x.name) ? 'Buka' : 'Unduh'}</button><button class="btn" data-act="del-ppt" data-id="${x.id}">Hapus</button></div></div>`).join('') || '<p class="empty">Belum ada presentasi yang diunggah.</p>';
}
/* Bank soal */
function renderSoal() {
  const L = soalList(), sel = $('#fBab'), keep = sel.value;
  sel.innerHTML = '<option value="">Semua materi</option>' + [...new Set(L.map(x => x.bab))].map(b => `<option>${esc(b)}</option>`).join('');
  sel.value = keep;
  const q = $('#fQ').value.toLowerCase(), j = $('#fJenis').value;
  const out = L.filter(x => (!sel.value || x.bab === sel.value) && (!j || x.jenis === j) && (!q || x.q.toLowerCase().includes(q)));
  $('#soalList').innerHTML = out.map(x => {
    let key = esc(x.key);
    if (x.jenis === 'hitung') { const m = buildModel(x.qd, x.qs, 0, 'none'); key = m.err ? esc(m.err) : `Harga keseimbangan P = <b>${nf(m.eq.P)}</b>, jumlah keseimbangan Q = <b>${nf(m.eq.Q)}</b>` + (x.key ? '<br>' + esc(x.key) : ''); }
    const opts = x.jenis === 'pg' ? `<ol type="A">${String(x.opts).split('\n').filter(Boolean).map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : '';
    return `<details class="item"><summary>${esc(x.q.slice(0, 90))}${x.q.length > 90 ? '...' : ''}</summary><div class="body"><p><span class="tag">${JENIS[x.jenis]}</span> <span class="tag">${esc(x.bab)}</span>${x.ai ? ' <span class="tag">Dibuat AI, periksa kembali</span>' : ''}</p><p>${esc(x.q)}</p>${opts}<details class="key"><summary>Lihat kunci dan pembahasan</summary><p>${key || 'Belum ada kunci.'}</p></details><div class="row">${x.jenis === 'hitung' ? `<button class="btn primary" data-act="load-s" data-id="${x.id}">Muat ke simulator</button>` : ''}<button class="btn" data-act="edit-s" data-id="${x.id}">Edit</button><button class="btn" data-act="del-s" data-id="${x.id}">Hapus</button></div></div></details>`;
  }).join('') || '<p class="empty">Tidak ada soal yang cocok dengan filter.</p>';
}
function editSoal(id) {
  const L = soalList(), cur = L.find(s => s.id === id) || { jenis: 'pg' };
  openForm(id ? 'Edit soal' : 'Tambah soal', [
    { k: 'jenis', l: 'Jenis soal', type: 'select', o: [['pg', 'Pilihan ganda'], ['esai', 'Esai'], ['hitung', 'Perhitungan']] },
    { k: 'bab', l: 'Materi atau bab', req: 1 }, { k: 'q', l: 'Pertanyaan', type: 'area' },
    { k: 'opts', l: 'Pilihan jawaban (satu per baris, untuk pilihan ganda)', type: 'area' },
    { k: 'key', l: 'Kunci jawaban atau pembahasan', type: 'area' },
    { k: 'qd', l: 'Fungsi Qd (untuk perhitungan, contoh 120 - 2P)' }, { k: 'qs', l: 'Fungsi Qs (untuk perhitungan, contoh 20 + 2P)' }
  ], cur, (o, ok, fail) => {
    if (!o.q.trim()) return fail('Pertanyaan wajib diisi.');
    if (o.jenis === 'hitung' && buildModel(o.qd, o.qs, 0, 'none').err) return fail('Fungsi Qd dan Qs belum valid untuk soal perhitungan.');
    if (id) Object.assign(cur, o); else L.push({ id: uid(), ...o });
    if (LS.set('ev_soal', L)) ok();
  });
}
function renderQuiz() {
  const custom = LS.get('ev_links', []);
  $('#quizList').innerHTML = PLATFORMS.map(p => card(p, false)).concat(custom.map(p => card({ n: p.n, c: '#3b6fe0', u: p.u, d: 'Tautan kuis milikmu.', id: p.id }, true))).join('');
  function card(p, own) { return `<div class="card"><div class="brandlogo" style="background:${p.c}">${esc(p.n[0])}</div><h3>${esc(p.n)}</h3><p class="muted">${esc(p.d)}</p><div class="row" style="margin-top:12px"><a class="btn primary" href="${esc(p.u)}" target="_blank" rel="noopener">Buka Platform</a>${own ? `<button class="btn" data-act="del-link" data-id="${p.id}">Hapus</button>` : ''}</div></div>`; }
}
/* PPT interaktif bawaan */
const SLIDES_DEFAULT = [
  { t: 'Permintaan dan Penawaran', x: 'Media pembelajaran ekonomi kelas 10. Gunakan tombol atau panah keyboard untuk melanjutkan.' },
  { t: 'Pertanyaan pemantik', x: 'Mengapa harga cabai naik saat musim hujan? Mengapa harga tiket konser bisa melonjak dalam sekejap?' },
  { t: 'Hukum permintaan', x: 'Semakin tinggi harga, semakin sedikit jumlah yang diminta. Kurvanya miring ke bawah.', s: { d: 1 } },
  { t: 'Hukum penawaran', x: 'Semakin tinggi harga, semakin banyak jumlah yang ditawarkan. Kurvanya miring ke atas.', s: { d: 1, s: 1 } },
  { t: 'Keseimbangan pasar', x: 'Titik pertemuan kedua kurva menunjukkan harga dan jumlah ketika Qd sama dengan Qs.', s: { d: 1, s: 1, helper: 1, eq: 1, hl: 1 } },
  { t: 'Pergeseran kurva', x: 'Pendapatan konsumen naik. Seluruh kurva permintaan bergeser ke kanan dan keseimbangan berpindah.', s: { d: 1, s: 1, helper: 1, eq: 1, scen: 1 }, sc: 'income' },
  { t: 'Pergerakan sepanjang kurva', x: 'Jika harga dipatok di atas keseimbangan, titik bergerak sepanjang kurva dan muncul kelebihan penawaran.', s: { d: 1, s: 1, eq: 1, price: 1 }, price: 30 },
  { t: 'Rangkuman', x: 'Harga memindahkan titik sepanjang kurva. Faktor lain menggeser kurva. Keseimbangan terjadi saat Qd sama dengan Qs.' }
];
const SL = { i: 0, deck: SLIDES_DEFAULT, name: 'Permintaan dan Penawaran' };
/* ===== [6b] PRESENTASI (slide) & ekspor PPTX ===== */
function slideRender() {
  const st = SL.deck[SL.i], last = SL.i === SL.deck.length - 1;
  $('#sNo').textContent = `Tahap ${SL.i + 1} dari ${SL.deck.length}`;
  $('#sTitle').textContent = st.t; $('#sText').textContent = st.s ? st.x : '';
  $('#sPrev').disabled = SL.i === 0; $('#sNext').disabled = last;
  const stage = $('#sStage'); stage.classList.toggle('text', !st.s);
  stage.firstElementChild.style.display = st.s ? '' : 'none';
  let ph = $('#sPh'); if (!ph) { ph = document.createElement('div'); ph.id = 'sPh'; stage.appendChild(ph); }
  ph.textContent = st.s ? '' : st.x; ph.style.display = st.s ? 'none' : ''; ph.style.fontSize = st.x.length > 260 ? '1.3rem' : st.x.length > 140 ? '1.6rem' : '2rem';
  if (st.s) draw('slide', 'sChart', buildModel('120 - 2P', '20 + 2P', st.price || 0, st.sc || 'none'), st.s, 17);
}
function slideOpen(deck, name) { SL.deck = deck || SLIDES_DEFAULT; SL.name = name || 'Presentasi'; SL.i = 0; $('#slides').hidden = false; slideRender(); if ($('#slides').requestFullscreen) $('#slides').requestFullscreen().catch(() => {}); }
function slideClose() { $('#slides').hidden = true; if (document.fullscreenElement) document.exitFullscreen(); }
const slideGo = d => { SL.i = Math.min(SL.deck.length - 1, Math.max(0, SL.i + d)); slideRender(); };

/* Presentasi otomatis dari isian materi guru */
function splitText(text, max) {
  const out = [];
  String(text || '').split(/\n\s*\n|\n?---\n?/).map(t => t.trim()).filter(Boolean).forEach(par => {
    let cur = '';
    (par.match(/[^.!?]+[.!?]*\s*/g) || [par]).forEach(sn => {
      if (cur && (cur + sn).length > max) { out.push(cur.trim()); cur = ''; }
      cur += sn;
    });
    if (cur.trim()) out.push(cur.trim());
  });
  return out;
}
function deckFrom(x, max = 320) {
  const pts = String(x.poin || '').split('\n').filter(Boolean);
  const d = [{ t: x.t, x: x.bab || 'Materi ekonomi kelas 10' }];
  const add = (title, parts) => parts.forEach((p, i) => d.push({ t: parts.length > 1 ? `${title} (${i + 1}/${parts.length})` : title, x: p }));
  add('Pengertian', splitText(x.d, max));
  const n = Math.ceil(pts.length / 4);
  for (let i = 0; i < pts.length; i += 4) { const g = pts.slice(i, i + 4); d.push({ t: n > 1 ? `Poin penting (${i / 4 + 1}/${n})` : 'Poin penting', x: g.map(q => '- ' + q).join('\n'), list: g }); }
  if (x.rumus) d.push({ t: 'Rumus', x: x.rumus });
  add('Contoh sehari-hari', splitText(x.contoh, max));
  if (x.sim) {
    d.push({ t: 'Visualisasi kurva', x: 'Ilustrasi: titik keseimbangan terjadi ketika kurva permintaan dan penawaran bertemu.', s: { d: 1, s: 1, helper: 1, eq: 1, hl: 1 } });
    d.push({ t: 'Jika pendapatan konsumen naik', x: 'Kurva permintaan bergeser ke kanan sehingga keseimbangan berpindah.', s: { d: 1, s: 1, helper: 1, eq: 1, scen: 1 }, sc: 'income' });
  }
  if (pts.length) d.push({ t: 'Rangkuman', x: pts.slice(0, 3).join('. ') + '.' });
  return d;
}
function loadPptx(ok, fail) {
  if (window.PptxGenJS) return ok();
  const sc = document.createElement('script');
  sc.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  sc.onload = ok; sc.onerror = fail; document.head.appendChild(sc);
}
function exportPptx(deck, name) {
  loadPptx(() => {
    const p = new PptxGenJS(); p.layout = 'LAYOUT_WIDE';
    deck.forEach(st => {
      const s = p.addSlide(); s.background = { color: 'F3F6FF' };
      s.addText(st.t, { x: 0.6, y: 0.4, w: 12, h: 0.9, fontSize: 30, bold: true, color: '1B2A5C' });
      if (st.s) {
        const cv = document.createElement('canvas'), m = buildModel('120 - 2P', '20 + 2P', st.price || 0, st.sc || 'none'), cd = chartData(m, st.s);
        plain(cv, cd.sets, cd.xmax, cd.Pmax, {}, 15, { w: 1000, h: 520 });
        s.addImage({ data: cv.toDataURL('image/png'), x: 1.65, y: 1.4, w: 10, h: 5.2 });
        s.addText(st.x, { x: 0.8, y: 6.7, w: 11.7, h: 0.6, fontSize: 14, color: '38426B' });
      } else if (st.list) s.addText(st.list.map(t => ({ text: t, options: { bullet: true, breakLine: true } })), { x: 0.8, y: 1.6, w: 11.5, h: 5, fontSize: 22, color: '1A2240', valign: 'top', fit: 'shrink' });
      else s.addText(st.x, { x: 0.8, y: 1.7, w: 11.5, h: 4.8, fontSize: st.x.length > 300 ? 18 : st.x.length > 200 ? 20 : st.x.length > 120 ? 24 : 28, color: '1A2240', valign: 'top', fit: 'shrink' });
    });
    p.writeFile({ fileName: (String(name).replace(/[^\w\- ]+/g, '').trim() || 'EconView') + '.pptx' });
  }, () => alert('Unduhan .pptx butuh koneksi internet untuk memuat pustaka PptxGenJS. Presentasi tetap dapat dipakai di layar.'));
}

/* ===== [7] TEACHING MODE: simulasi kurva untuk siswa (kembar Mode 1) =====
   Sama seperti Mode 1: 4 slider -> grafik -> kotak angka.
   Bedanya: titik keseimbangan DISEMBUNYIKAN sampai siswa menebak benar / klik "Tampilkan jawaban". */
const STU = { reveal: false };
const STU_IDS = ['sA', 'sB', 'sC', 'sD'];
function stuModel() { // bangun model dari 4 slider siswa
  const m = buildModel(`${$('#sA').value}-${$('#sB').value}P`, `${$('#sC').value}+${$('#sD').value}P`, 0, 'none');
  if (!m.err) m.lbl = { x: 'Jumlah barang (Q)', y: 'Harga (P)', note: '' };
  return m;
}
function stuRender() {
  ['A', 'B', 'C', 'D'].forEach(k => { $('#so' + k).textContent = nf($('#s' + k).value); }); // angka di samping slider
  const m = stuModel(), err = $('#stErr');
  err.hidden = true;
  if (m.err) { err.textContent = m.err; err.hidden = false; return; }
  const r = STU.reveal;
  draw('stu', 'stChart', m, { d: $('#scD').checked, s: $('#scS').checked, helper: r, eq: r, price: 0, scen: 0 }, 12);
  $('#stChips').innerHTML = r
    ? `<div class="chip"><small>Harga keseimbangan (P)</small><b>${nf(m.eq.P)}</b></div><div class="chip"><small>Jumlah keseimbangan (Q)</small><b>${nf(m.eq.Q)}</b></div><div class="chip"><small>Koordinat E (Q, P)</small><b>(${nf(m.eq.Q)}, ${nf(m.eq.P)})</b></div>`
    : '<div class="chip"><small>Titik keseimbangan</small><b>? (tebak dulu)</b></div>';
}
function stuCheck() { // periksa tebakan siswa
  const m = stuModel(), num = v => parseFloat(String(v).replace(',', '.')), f = $('#stFeed');
  if (m.err) { f.textContent = m.err; return; }
  const p = num($('#gP').value), q = num($('#gQ').value);
  if (isNaN(p) || isNaN(q)) { f.textContent = 'Isi harga (P) dan jumlah (Q) dulu.'; return; }
  const ok = Math.abs(p - m.eq.P) < 0.5 && Math.abs(q - m.eq.Q) < 1;
  f.textContent = ok ? 'Tepat! Titik keseimbangan ditampilkan di grafik.' : 'Belum tepat. Lihat di mana kedua kurva bertemu, lalu coba lagi.';
  if (ok) { STU.reveal = true; stuRender(); }
}
function stuReset() {
  Object.entries({ sA: 120, sB: 2, sC: 20, sD: 2, gP: '', gQ: '' }).forEach(([k, v]) => { $('#' + k).value = v; });
  STU.reveal = false; $('#stFeed').textContent = ''; stuRender();
}

/* ===== [8] PEMBUAT SOAL: AI & generator hitungan tanpa AI ===== */
let aiPending = [];
function aiMateri(q) {
  q = q.toLowerCase();
  return matList().filter(x => x.t.toLowerCase().includes(q) || q.includes(x.t.toLowerCase()) || (x.bab || '').toLowerCase().includes(q))
    .map(x => `${x.t}. ${x.d} Poin: ${String(x.poin || '').replace(/\n/g, '; ')}. Rumus: ${x.rumus || '-'}. Contoh: ${x.contoh || '-'}`).join('\n').slice(0, 3000);
}
let aiBab = '', aiLast = '';
const copyText = t => { try { navigator.clipboard.writeText(t).catch(() => {}); } catch (e) { /* abaikan */ } };
function aiOpen() {
  $('#dlgBody').innerHTML = `<h3>Buat soal dengan ChatGPT</h3><p class="muted">Isi form ini. EconView menyusun permintaannya, lalu membuka ChatGPT dengan teks yang sudah terisi.</p><form id="aiF">
    <label>Bab atau materi<input name="bab" list="aiBab" required placeholder="Contoh: Permintaan dan Penawaran"><datalist id="aiBab">${matList().map(m => `<option value="${esc(m.t)}">`).join('')}</datalist></label>
    <label>Jumlah soal (1 sampai 10)<input name="jumlah" type="number" min="1" max="10" value="5" required></label>
    <label>Jenis soal<select name="jenis"><option value="campuran">Campuran</option><option value="pg">Pilihan ganda</option><option value="esai">Esai</option><option value="hitung">Perhitungan</option></select></label>
    <label>Tingkat kesulitan<select name="tingkat"><option value="mudah">Mudah</option><option value="sedang" selected>Sedang</option><option value="sulit">Sulit</option></select></label>
    <label>Catatan tambahan (opsional)<textarea name="catatan" rows="2" placeholder="Contoh: gunakan konteks pasar tradisional"></textarea></label>
    <label>Format hasil<select name="format"><option value="impor">Siap diimpor ke Bank Soal (JSON)</option><option value="baca">Soal biasa untuk dibaca</option></select></label>
    <label class="chk"><input type="checkbox" name="pakaimateri" checked> Sertakan isi materi dari menu Isi Materi sebagai acuan</label>
    <div class="row"><button class="btn primary">Buka ChatGPT</button><button type="button" class="btn" data-act="ai-local">Soal hitungan tanpa AI</button><button type="button" class="btn" data-act="close">Tutup</button></div></form><div id="aiOut"></div>`;
  $('#dlg').showModal();
  $('#aiF').onsubmit = aiGo;
}
function aiPrompt(o) {
  const n = Math.min(10, Math.max(1, +o.jumlah || 5));
  const jn = { campuran: 'campuran pilihan ganda, esai, dan perhitungan', pg: 'pilihan ganda', esai: 'esai', hitung: 'perhitungan' }[o.jenis] || 'campuran';
  const mat = o.pakaimateri ? aiMateri(o.bab).slice(0, 700) : '';
  let p = `Buatkan ${n} soal ekonomi kelas 10 SMA (Kurikulum Merdeka) tentang "${o.bab}". Jenis soal: ${jn}. Tingkat kesulitan: ${o.tingkat}.`;
  if (mat) p += `\n\nAcuan materi dari guru: ${mat}`;
  if (o.catatan && o.catatan.trim()) p += `\n\nCatatan guru: ${o.catatan.trim()}`;
  p += '\n\nAturan: gunakan bahasa Indonesia yang jelas, jangan mengarang data statistik atau fakta, dan pakai soal perhitungan hanya jika materinya tentang permintaan, penawaran, atau keseimbangan pasar.';
  p += o.format === 'baca'
    ? ' Tulis soal bernomor beserta kunci jawaban dan pembahasan singkat.'
    : '\n\nTulis hasilnya HANYA sebagai satu blok kode JSON berisi array dengan format ini (pilihan ganda tepat 4 pilihan tanpa awalan huruf):\n[{"jenis":"pg","q":"...","opts":["...","...","...","..."],"key":"Huruf. alasan singkat"},{"jenis":"esai","q":"...","key":"pedoman jawaban"},{"jenis":"hitung","q":"soal tanpa jawabannya","qd":"120 - 2P","qs":"20 + 2P"}]';
  return p;
}
function aiGo(e) {
  e.preventDefault();
  const o = Object.fromEntries(new FormData(e.target)), prompt = aiPrompt(o), short = prompt.length <= 2000;
  aiBab = o.bab; aiLast = prompt;
  copyText(prompt);
  window.open('https://chatgpt.com/' + (short ? '?q=' + encodeURIComponent(prompt) : ''), '_blank', 'noopener');
  $('#aiOut').innerHTML = `<h3 style="margin-top:16px">Langkah berikutnya</h3>
    <p class="muted">ChatGPT dibuka di tab baru${short ? ' dengan teks yang sudah terisi. Jika kotak pesan masih kosong atau belum terkirim, tekan Ctrl+V lalu Enter, karena teksnya juga sudah disalin.' : '. Teksnya cukup panjang sehingga sudah disalin otomatis. Tekan Ctrl+V di kotak pesan ChatGPT.'} Jika tab tidak terbuka, izinkan pop-up untuk halaman ini.</p>
    <details class="key"><summary>Lihat teks yang dikirim</summary><textarea readonly rows="8" style="width:100%;margin:8px 0">${esc(prompt)}</textarea><button type="button" class="btn small" data-act="ai-copy">Salin teks</button></details>
    ${o.format === 'baca' ? '<p class="muted">Format biasa tidak bisa diimpor otomatis. Salin soal yang kamu pilih lewat tombol Tambah Soal.</p>' : '<label>Tempel hasil dari ChatGPT<textarea id="aiPaste" rows="5" placeholder="Salin blok kode JSON dari ChatGPT, lalu tempel di sini"></textarea></label><button type="button" class="btn primary" data-act="ai-import">Impor soal</button><div id="aiImp"></div>'}`;
}
function aiImport() {
  const list = aiParse($('#aiPaste').value, { bab: aiBab, jumlah: 10 });
  if (!list.length) { $('#aiImp').innerHTML = '<p class="err">Format belum terbaca. Pastikan yang ditempel adalah blok JSON dari ChatGPT dan setiap pilihan ganda punya 4 pilihan.</p>'; return; }
  aiShow(list);
}
function aiParse(text, o) {
  let arr;
  try { const t = String(text || ''); arr = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1)); } catch (e) { return []; }
  return (Array.isArray(arr) ? arr : []).map(x => {
    if (!x || !['pg', 'esai', 'hitung'].includes(x.jenis) || !x.q) return null;
    const it = { id: uid(), bab: o.bab, jenis: x.jenis, q: String(x.q).trim(), opts: '', key: String(x.key || ''), ai: 1 };
    if (x.jenis === 'pg') { const op = Array.isArray(x.opts) ? x.opts.map(String) : []; if (op.length !== 4 || !x.key) return null; it.opts = op.join('\n'); }
    if (x.jenis === 'hitung') { if (buildModel(x.qd, x.qs, 0, 'none').err) return null; it.qd = String(x.qd); it.qs = String(x.qs); it.key = ''; }
    return it;
  }).filter(Boolean).slice(0, +o.jumlah || 10);
}
const BARANG = ['beras', 'gula pasir', 'telur ayam', 'cabai rawit', 'minyak goreng', 'buku tulis'];
function aiLocal() {
  const f = $('#aiF'), o = Object.fromEntries(new FormData(f)), n = Math.min(10, Math.max(1, +o.jumlah || 5)), out = [];
  const fmt = (a, b) => (a < 0 ? `${b}P - ${-a}` : `${a} + ${b}P`);
  let guard = 0;
  while (out.length < n && guard++ < 500) {
    const P = 5 * (2 + Math.floor(Math.random() * 9)), Q = 10 * (4 + Math.floor(Math.random() * 9)), bd = 1 + Math.floor(Math.random() * 5), bs = 1 + Math.floor(Math.random() * 5);
    if (bs * P >= Q) continue;
    const a1 = Q + bd * P, a2 = Q - bs * P, qd = `${a1} - ${bd}P`, qs = fmt(a2, bs), m = buildModel(qd, qs, 0, 'none');
    if (m.err || Math.abs(m.eq.P - P) > 1e-9) continue;
    let q = `Pada pasar ${BARANG[out.length % BARANG.length]}, fungsi permintaan Qd = ${qd} dan fungsi penawaran Qs = ${qs}. Tentukan harga dan jumlah keseimbangan pasar.`, key = '';
    if (o.tingkat === 'sedang') { q += ` Berapa kelebihan penawaran jika harga ditetapkan sebesar ${P + 10}?`; key = `Pada P = ${P + 10}, kelebihan penawaran = ${nf((bs + bd) * 10)}`; }
    if (o.tingkat === 'sulit') { const m2 = solve({ a: a1 + 20, b: -bd }, { a: a2, b: bs }); q += ' Jika permintaan bertambah 20 satuan pada setiap harga, tentukan keseimbangan yang baru.'; key = `Keseimbangan baru: P = ${nf(m2.P)}, Q = ${nf(m2.Q)}`; }
    out.push({ id: uid(), bab: o.bab || 'Harga Keseimbangan', jenis: 'hitung', q, opts: '', key, qd, qs });
  }
  aiShow(out);
}
function aiShow(list) {
  aiPending = list;
  $('#aiOut').innerHTML = `<h3 style="margin-top:16px">Hasil (${list.length} soal)</h3><p class="muted">Periksa setiap soal sebelum dipakai. Centang yang ingin disimpan.</p>${list.map((x, i) => {
    let key = esc(x.key);
    if (x.jenis === 'hitung') { const m = buildModel(x.qd, x.qs, 0, 'none'); key = `P = ${nf(m.eq.P)}, Q = ${nf(m.eq.Q)}` + (x.key ? '<br>' + esc(x.key) : ''); }
    const op = x.jenis === 'pg' ? `<ol type="A" style="margin:4px 0">${x.opts.split('\n').map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : '';
    return `<label class="aiq"><input type="checkbox" data-ai="${i}" checked><span><span class="tag">${JENIS[x.jenis]}</span>${x.ai ? ' <span class="tag">AI</span>' : ''}<br>${esc(x.q)}${op}<br><small>Kunci: ${key}</small></span></label>`;
  }).join('')}<div class="row"><button type="button" class="btn primary" data-act="ai-save">Simpan terpilih ke Bank Soal</button></div>`;
}
function aiSave() {
  const sel = $$('[data-ai]').filter(c => c.checked).map(c => aiPending[+c.dataset.ai]);
  if (!sel.length) return;
  const L = soalList().concat(sel);
  if (LS.set('ev_soal', L)) { $('#dlg').close(); renderAll(); go('soal'); }
}

/* ===== [9] NAVIGASI & EVENT: pindah halaman, klik tombol, inisialisasi ===== */
const SEC = { home: 'home', materi: 'materi', modul: 'materi', isi: 'materi', detail: 'materi', sim: 'materi', teach: 'teach', ppt: 'teach', bank: 'bank', soal: 'bank', quiz: 'bank', hasil: 'home', siswa: 'teach' };
const HIST = []; let cur = 'home';
function go(page, back) {
  if (!back && page !== cur) HIST.push(cur);
  cur = page;
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'p-' + page));
  $$('.nav').forEach(n => n.classList.toggle('active', n.dataset.sec === SEC[page]));
  $('#back').hidden = page === 'home';
  $('#sidebar').classList.remove('open');
  if (page === 'sim') setMode(SIM.mode);
  if (page === 'siswa') stuRender();
  window.scrollTo(0, 0);
  // Gambar ulang setelah halaman benar-benar tampil, agar ukuran canvas terbaca
  requestAnimationFrame(() => Object.values(charts).forEach(c => c && c.resize()));
}
function search(q) {
  q = q.trim().toLowerCase(); if (!q) return;
  const m = matList().filter(x => (x.t + x.d).toLowerCase().includes(q)), s = soalList().filter(x => x.q.toLowerCase().includes(q));
  $('#hasil').innerHTML = m.map(x => `<div class="row-card"><div><span class="tag">Materi</span> <b>${esc(x.t)}</b></div><button class="btn primary" data-act="open-m" data-id="${x.id}">Buka</button></div>`).join('') +
    s.map(x => `<div class="row-card"><div><span class="tag">Soal</span> ${esc(x.q.slice(0, 100))}</div><button class="btn primary" data-go="soal">Ke Bank Soal</button></div>`).join('') || '<p class="empty">Tidak ada hasil.</p>';
  go('hasil');
}
const HELP = '<h3>Panduan singkat simulasi</h3><p><b>Mode 1 (manual):</b> geser slider untuk memindahkan dan memiringkan kurva. Tidak perlu persamaan.</p><p><b>Mode 2 (persamaan):</b> ketik fungsi seperti 120 - 2P lalu klik Tampilkan grafik. Langkah hitung muncul otomatis.</p><p><b>What If:</b> pilih skenario untuk melihat pergeseran kurva dan titik keseimbangan baru.</p><p>Pengaturan simulasi tersimpan selama sesi browser.</p>';
const find = (L, id) => L.find(x => x.id === id);
const del = (key, L, id) => { if (confirm('Hapus item ini?')) { LS.set(key, L.filter(x => x.id !== id)); renderAll(); } };

document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.go) return go(t.dataset.go);
  if (t.dataset.mode) return setMode(t.dataset.mode);
  const id = t.dataset.id;
  switch (t.dataset.act) {
    case 'close': $('#dlg').close(); break;
    case 'help': showDlg(HELP); break;
    case 'open-m': showMateri(id); break;
    case 'add-m': editMateri(); break;
    case 'edit-m': editMateri(id); break;
    case 'del-m': del('ev_materi', matList(), id); break;
    case 'reset-m': if (confirm('Pulihkan materi bawaan? Semua materi yang kalian tambahkan atau ubah akan hilang untuk semua pengguna.')) { LS.set('ev_materi', MAT_SEED.map(x => ({ ...x }))); renderAll(); } break;
    case 'add-modul': addFile('ev_modul', 'Upload modul atau RPP', ['pdf', 'docx']); break;
    case 'view-seed': showDlg(`<h3>${MODUL_SEED.t}</h3>${MODUL_SEED.body}`); break;
    case 'view-modul': viewFile(find(LS.get('ev_modul', []), id)); break;
    case 'del-modul': del('ev_modul', LS.get('ev_modul', []), id); break;
    case 'start-ppt': slideOpen(); break;
    case 'ppt-m': { const x = find(matList(), id); if (x) openForm('Pengaturan presentasi: ' + esc(x.t), [{ k: 'len', l: 'Panjang teks per slide', type: 'select', o: [['200', 'Ringkas (teks dipecah ke lebih banyak slide)'], ['320', 'Sedang'], ['500', 'Panjang (lebih sedikit slide)']] }], { len: '320' }, (o, ok) => { ok(); slideOpen(deckFrom(x, +o.len), x.t); }); break; }
    case 'ai-soal': aiOpen(); break;
    case 'ai-local': aiLocal(); break;
    case 'ai-save': aiSave(); break;
    case 'ai-import': aiImport(); break;
    case 'ai-copy': copyText(aiLast); break;
    case 'add-ppt': addFile('ev_ppt', 'Upload presentasi', ['pdf', 'ppt', 'pptx']); break;
    case 'view-ppt': viewFile(find(LS.get('ev_ppt', []), id)); break;
    case 'del-ppt': del('ev_ppt', LS.get('ev_ppt', []), id); break;
    case 'add-s': editSoal(); break;
    case 'edit-s': editSoal(id); break;
    case 'del-s': del('ev_soal', soalList(), id); break;
    case 'reset-s': if (confirm('Pulihkan soal bawaan? Semua soal yang kalian tambahkan atau ubah akan hilang untuk semua pengguna.')) { LS.set('ev_soal', SOAL_SEED.map(x => ({ ...x }))); renderAll(); } break;
    case 'load-s': { const s = find(soalList(), id); $('#inQd').value = s.qd; $('#inQs').value = s.qs; $('#inSc').value = 'none'; SIM.mode = 'eq'; go('sim'); break; }
    case 'add-link': openForm('Tambah tautan kuis', [{ k: 'n', l: 'Nama kuis', req: 1 }, { k: 'u', l: 'Tautan (https://...)', req: 1 }], {}, (o, ok, fail) => { if (!/^https?:\/\//i.test(o.u)) return fail('Tautan harus diawali http:// atau https://'); const L = LS.get('ev_links', []); L.push({ id: uid(), n: o.n, u: o.u }); if (LS.set('ev_links', L)) ok(); }); break;
    case 'del-link': del('ev_links', LS.get('ev_links', []), id); break;
  }
});
$('#back').onclick = () => go(HIST.pop() || 'home', true);
$('#burger').onclick = () => $('#sidebar').classList.toggle('open');
$('#search').onkeydown = e => { if (e.key === 'Enter') search(e.target.value); };
$('#btnShow').onclick = renderSim; $('#btnReset').onclick = resetSim;
// Teaching Mode siswa: slider, centang, tombol
STU_IDS.concat(['scD', 'scS']).forEach(i => $('#' + i).addEventListener('input', stuRender));
$('#stCheck').onclick = stuCheck; $('#stReset').onclick = stuReset;
$('#stReveal').onclick = () => { STU.reveal = true; stuRender(); };
SIM_IDS.concat(['cD', 'cS', 'cH', 'cE']).forEach(i => $('#' + i).addEventListener('input', renderSim));
['fBab', 'fJenis', 'fQ'].forEach(i => $('#' + i).addEventListener('input', renderSoal));
$('#vClose').onclick = () => { $('#viewer').hidden = true; $('#vFrame').src = 'about:blank'; };
$('#sPrev').onclick = () => slideGo(-1); $('#sNext').onclick = () => slideGo(1); $('#sExit').onclick = slideClose; $('#sDl').onclick = () => exportPptx(SL.deck, SL.name);
$('#sFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else $('#slides').requestFullscreen?.(); };
document.addEventListener('keydown', e => {
  if ($('#slides').hidden) return;
  if (e.key === 'ArrowRight') slideGo(1); else if (e.key === 'ArrowLeft') slideGo(-1); else if (e.key === 'Escape') slideClose();
});

/* ===== [10] LOGIN, SESI, DAN SINKRONISASI ===== */
let pendingRender = false, pollTimer = null, started = false;
function lockApp(msg) {
  clearInterval(pollTimer); pollTimer = null;
  document.body.classList.add('locked'); document.body.classList.remove('checking');
  $('#slides').hidden = true; $('#viewer').hidden = true; if ($('#dlg').open) $('#dlg').close();
  $('#lgPass').value = ''; $('#lgCode').value = '';
  const e = $('#lgErr'); if (msg) { e.textContent = msg; e.hidden = false; } else e.hidden = true;
}
function softRefresh() { if ($('#dlg').open) pendingRender = true; else renderAll(); }
async function syncNow() {
  if (document.hidden || DBX.pending > 0 || document.body.classList.contains('locked')) return;
  try { if (await DBX.loadAll()) softRefresh(); } catch (e) { /* jaringan putus: coba lagi nanti */ }
}
async function enterApp() {
  try { await DBX.loadAll(); }
  catch (e) { lockApp('Data tidak dapat dimuat: ' + (e.message || e)); return; }
  document.body.classList.remove('locked', 'checking');
  $('#lgErr').hidden = true;
  renderAll(); go('home');
  if (!started) { started = true; document.addEventListener('visibilitychange', syncNow); }
  DBX.subscribe(syncNow);
  clearInterval(pollTimer); pollTimer = setInterval(syncNow, 20000);
}
DBX.hooks.error = msg => alert(msg);
DBX.hooks.lock = lockApp;
DBX.hooks.refresh = softRefresh;
$('#dlg').addEventListener('close', () => { if (pendingRender) { pendingRender = false; renderAll(); } });

$('#lgToggle').onclick = () => {
  const p = $('#lgPass'), show = p.type === 'password';
  p.type = show ? 'text' : 'password'; $('#lgToggle').textContent = show ? 'Sembunyikan' : 'Tampilkan';
  $('#lgToggle').setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
};
$('#lgCode').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  const err = $('#lgErr'), btn = $('#lgBtn'), code = $('#lgCode').value;
  err.hidden = true;
  if (!/^\d{6}$/.test(code)) { err.textContent = 'Kode akses harus tepat 6 digit angka.'; err.hidden = false; return; }
  btn.disabled = true; $('#lgSpin').hidden = false; $('#lgTxt').textContent = 'Memeriksa...';
  const r = await DBX.login($('#lgEmail').value, $('#lgPass').value, code);
  btn.disabled = false; $('#lgSpin').hidden = true; $('#lgTxt').textContent = 'Masuk';
  if (!r.ok) { err.textContent = r.msg; err.hidden = false; $('#lgCode').value = ''; return; }
  $('#lgPass').value = ''; $('#lgCode').value = '';
  enterApp();
};
$('#logout').onclick = async () => { await DBX.logout(); lockApp(''); };

restoreSim();
DBX.hasAccess().then(ok => { if (ok) enterApp(); else lockApp(''); });
