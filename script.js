/* ==========================================================
   QUANTA — script.js
   1) Isi firebaseConfig di bawah dengan konfigurasi proyekmu.
   2) Selama masih "ISI_...", aplikasi jalan dalam MODE LOKAL
      (data tersimpan di browser) supaya bisa dicoba dulu.
   ========================================================== */
// Konfigurasi dibaca dari index.html (window.QUANTA_FIREBASE). Isi di bawah hanya cadangan.
const firebaseConfig = window.QUANTA_FIREBASE || {
  apiKey: "AIzaSyDBn66TK0XMwxwi7BwVa0BN-Xbc0BKMZvk",
  authDomain: "website-quanta.firebaseapp.com",
  databaseURL: "https://website-quanta-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "website-quanta",
  storageBucket: "website-quanta.firebasestorage.app",
  messagingSenderId: "287216993859",
  appId: "1:287216993859:web:ecd1164115a98b41e836f6",
  measurementId: "G-WVZ9FMZME8"
};
const FB_VER = "10.12.2";
const APP_VERSION = "2026.10.26-a";
window.QUANTA_VERSION = APP_VERSION;
// Akun peran di Firebase Authentication (dibuat sekali di Firebase Console).
// Kode admin dan kode guru = password akun ini.
const ADMIN_EMAIL = "admin@quanta.app";
const GURU_EMAIL = "guru@quanta.app";

// Kode disimpan sebagai hash SHA-256, bukan teks asli.
const ADMIN_HASH = "45c2851252a865f0bfd2858b50663cb64215f3ab7345687e69b7a653209ff9b7";
// Kode guru awal = GURU-QUANTA (admin bisa menggantinya di Panel Admin).
const DEFAULT_TEACHER_HASH = "115bbefe79e909685a6b6f0d4b7436b1e1c888f2de7ef591bb47d8706962d444";

let DEMO = !firebaseConfig.apiKey || String(firebaseConfig.apiKey).startsWith("ISI_");

// Bila ada galat tak terduga, tampilkan di layar (bukan halaman kosong).
window.addEventListener("error", e => {
  const v = document.getElementById("view");
  if (v && !v.dataset.err && /Memuat QUANTA/.test(v.textContent)) {
    v.dataset.err = "1";
    v.innerHTML = '<section class="card"><h2>Ups, QUANTA belum bisa dimuat</h2><p>Pesan galat: <code>' + String(e.message).replace(/</g, "&lt;") + '</code></p></section>';
  }
});

/* ---------- Utilitas ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// SHA-256: pakai crypto.subtle bila ada; bila tidak (mis. http biasa), pakai versi manual.
function sha256Manual(msg) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b = [...new TextEncoder().encode(msg)], l = b.length * 8;
  b.push(0x80);
  while (b.length % 64 !== 56) b.push(0);
  for (let i = 7; i >= 0; i--) b.push(i > 3 ? 0 : (l >>> (i * 8)) & 255);
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const R = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < b.length; o += 64) {
    const w = [];
    for (let i = 0; i < 16; i++) w[i] = (b[o+4*i] << 24) | (b[o+4*i+1] << 16) | (b[o+4*i+2] << 8) | b[o+4*i+3];
    for (let i = 16; i < 64; i++) {
      const s0 = R(w[i-15],7) ^ R(w[i-15],18) ^ (w[i-15] >>> 3), s1 = R(w[i-2],17) ^ R(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    let [a,bb,c,d,e,f,g,h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (R(e,6) ^ R(e,11) ^ R(e,25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((R(a,2) ^ R(a,13) ^ R(a,22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H = H.map((x, i) => (x + [a,bb,c,d,e,f,g,h][i]) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
const sha = async t => {
  if (globalThis.crypto?.subtle) {
    try { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join(""); } catch { /* pakai versi manual */ }
  }
  return sha256Manual(t);
};
const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let lastWarn = 0;
function warnLocal() {
  if (Date.now() - lastWarn > 15000) {
    lastWarn = Date.now();
    toast("⚠️ Perubahan hanya tersimpan di perangkat ini karena Firebase belum terhubung.", "err");
  }
}
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms))]);

function toast(msg, type = "ok") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3400);
}

/* Teks kaya: "## Judul", "- daftar", "**tebal**", "> pertanyaan berpikir kritis" */
function rich(t = "") {
  const out = [];
  let ul = false;
  const close = () => { if (ul) { out.push("</ul>"); ul = false; } };
  for (const raw of esc(t).split("\n")) {
    const l = raw.trim();
    if (!l) { close(); continue; }
    const b = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (l.startsWith("## ")) { close(); out.push(`<h3>${b.slice(3)}</h3>`); }
    else if (l.startsWith("- ")) { if (!ul) { out.push("<ul>"); ul = true; } out.push(`<li>${b.slice(2)}</li>`); }
    else if (l.startsWith("&gt; ")) { close(); out.push(`<div class="think"><span>🧠 Pikirkan</span>${b.slice(5)}</div>`); }
    else { close(); out.push(`<p>${b}</p>`); }
  }
  close();
  return out.join("");
}

/* ---------- Database (Firebase Realtime DB / mode lokal) ---------- */
let fb = null, rdb = null, fbA = null, auth = null, authBusy = Promise.resolve(), FB_PROBLEM = null;
const local = {
  read() { try { return JSON.parse(localStorage.getItem("quanta_db")) || {}; } catch { return {}; } },
  write(o) { localStorage.setItem("quanta_db", JSON.stringify(o)); }
};
const parts = p => p.split("/").filter(Boolean);
const db = {
  async init() {
    if (DEMO) return;
    const app = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`);
    fb = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`);
    fbA = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth.js`);
    const a = app.initializeApp(firebaseConfig);
    rdb = fb.getDatabase(a);
    auth = fbA.getAuth(a);
    await fbA.setPersistence(auth, fbA.browserSessionPersistence); // login Firebase hilang saat tab ditutup
    if (auth.authStateReady) await auth.authStateReady();
  },
  async check() {
    if (DEMO) return;
    await fb.get(fb.ref(rdb, "quanta/ping"));
  },
  async signInRole(role, code) {
    await authBusy;
    await fbA.signInWithEmailAndPassword(auth, role === "admin" ? ADMIN_EMAIL : GURU_EMAIL, code);
    const key = `roles/${auth.currentUser.uid}`;
    if ((await this.get(key)) !== role) await this.set(key, role);
  },
  signOutAll() {
    if (DEMO) return Promise.resolve();
    authBusy = (async () => { try { await fbA.signOut(auth); } catch (e) { console.error(e); } })();
    return authBusy;
  },
  async changePassword(code) { await fbA.updatePassword(auth.currentUser, code); },
  listen(path, cb) {
    if (DEMO || !fb?.onValue) return;
    fb.onValue(fb.ref(rdb, "quanta/" + path), snap => cb(snap.exists() ? snap.val() : null), e => console.error("listen", e));
  },
  async get(path) {
    path = "quanta/" + path;
    if (DEMO) {
      let c = local.read();
      for (const k of parts(path)) { if (c == null || typeof c !== "object") return null; c = c[k]; }
      return c ?? null;
    }
    const s = await fb.get(fb.ref(rdb, path));
    return s.exists() ? s.val() : null;
  },
  async set(path, val) {
    path = "quanta/" + path;
    if (path.startsWith("quanta/content")) lastOwnWrite = Date.now();
    if (DEMO && session && session.role !== "siswa") warnLocal();
    if (DEMO) {
      const root = local.read(), p = parts(path);
      let c = root;
      p.slice(0, -1).forEach(k => { if (typeof c[k] !== "object" || c[k] === null) c[k] = {}; c = c[k]; });
      c[p.at(-1)] = val;
      local.write(root);
      return;
    }
    await fb.set(fb.ref(rdb, path), val);
  },
  async remove(path) {
    path = "quanta/" + path;
    if (DEMO) {
      const root = local.read(), p = parts(path);
      let c = root;
      for (const k of p.slice(0, -1)) { c = c?.[k]; if (!c) return; }
      delete c[p.at(-1)];
      local.write(root);
      return;
    }
    await fb.remove(fb.ref(rdb, path));
  }
};

/* ---------- Konten bawaan (bisa diedit admin) ---------- */
const DEFAULTS = {
  links: {
    youtube: "https://youtube.com/@idayya671?si=BsPD_Qdo2UlqSOBt",
    tiktok: "https://tiktok.com/@mathclassbimbel",
    eksplor: "https://idayaa671.github.io/EKSPLOR-QUANTA/",
    questika: "https://idayaa671.github.io/QUESTIKA--QUANTA/",
    absensi: "https://idayaa671.github.io/ABSENSI/"
  },
  beranda: {
    lead: "Parabola ada di mana-mana: lintasan bola, jembatan, sampai air mancur. Di sini kamu tidak diberi rumus jadi — kamu yang menemukannya sendiri.",
    tentang: "QUANTA mengajakmu belajar persamaan dan fungsi kuadrat lewat enam langkah **discovery learning**: mengamati, bertanya, mengumpulkan data, mencari pola, menguji, lalu menyimpulkan. Di setiap langkah ada pertanyaan berpikir kritis. Jawabanmu tidak harus langsung benar — yang penting kamu bisa menjelaskan alasannya."
  },
  cp: "## Capaian Pembelajaran\n(Contoh — ganti dengan CP dari modul.)\nDi akhir fase, peserta didik dapat menyelesaikan masalah yang berkaitan dengan persamaan dan fungsi kuadrat, serta menjelaskan alasan penyelesaiannya secara logis.\n- Menalar hubungan antara grafik parabola dan akar persamaan kuadrat\n- Memilih dan menggunakan strategi penyelesaian yang tepat\n- Mengomunikasikan dan mengevaluasi argumen matematis",
  tp: "## Tujuan Pembelajaran\n(Contoh — ganti dengan TP dari modul.)\n- Menjelaskan bentuk umum persamaan kuadrat melalui eksplorasi pola grafik\n- Menemukan hubungan antara nilai diskriminan dan banyaknya akar\n- Menentukan akar dengan faktorisasi, melengkapkan kuadrat, dan rumus abc\n- Mengevaluasi kebenaran suatu pernyataan dan menyelesaikan masalah kontekstual dengan argumen",
  atp: "## Alur Tujuan Pembelajaran\n(Contoh — ganti dengan ATP dari modul.)\n- Pertemuan 1: Pre test (asesmen diagnostik) dan stimulasi parabola\n- Pertemuan 2: Mengamati pengaruh a, b, c pada grafik (eksplorasi)\n- Pertemuan 3: Diskriminan dan banyaknya akar\n- Pertemuan 4: Faktorisasi, melengkapkan kuadrat, rumus abc\n- Pertemuan 5: Tantangan Questika dan penarikan kesimpulan\n- Pertemuan 6: Post test (asesmen sumatif) dan refleksi",
  materi: [
    { judul: "Amati", fase: "Stimulasi", ikon: "🎢", aksi: "", widget: true,
      isi: "Pernahkah kamu melihat bola ditendang tinggi lalu jatuh lagi? Lintasannya melengkung. Bentuk itu disebut **parabola**.\nGeser tiga penggeser a, b, c pada grafik di bawah. Amati dulu, jangan buru-buru mencari rumus.\n> Apa yang berubah pada kurva saat a dibuat negatif? Dan apa yang terjadi saat c digeser?" },
    { judul: "Bertanya", fase: "Identifikasi Masalah", ikon: "🔍", aksi: "", widget: false,
      isi: "## Dari pengamatanmu, pertanyaan apa yang muncul?\n- Kapan kurva memotong sumbu-x, dan apa artinya bagi persamaan ax² + bx + c = 0?\n- Mengapa kadang kurva memotong di dua titik, kadang menyentuh satu titik, kadang tidak sama sekali?\n- Adakah cara menemukan titik potong tanpa menggambar?\n> Tulis dugaanmu (hipotesis) di buku catatan: faktor apa yang menentukan banyaknya titik potong?" },
    { judul: "Kumpulkan Data", fase: "Pengumpulan Data", ikon: "📊", aksi: "eksplor", widget: true,
      isi: "Saatnya mengumpulkan bukti. Coba minimal 6 kombinasi a, b, c dengan penggeser di bawah atau di Mode Eksplorasi.\n- Catat nilai a, b, c\n- Hitung b² − 4ac (disebut diskriminan, D)\n- Catat banyaknya titik potong dengan sumbu-x\n> Data seperti apa yang paling berguna untuk menguji dugaanmu? Mengapa?" },
    { judul: "Cari Pola", fase: "Pengolahan Data", ikon: "🧩", aksi: "", widget: false,
      isi: "## Cari pola dari datamu\n- Bandingkan nilai D dengan banyaknya titik potong. Apakah hubungannya konsisten?\n- Coba tiga cara mencari akar: **faktorisasi**, **melengkapkan kuadrat**, dan **rumus abc**.\nRumus abc: x = (−b ± √(b² − 4ac)) / 2a\n> Mengapa tanda ± menghasilkan dua akar? Apa yang terjadi bila D = 0?" },
    { judul: "Uji Dugaan", fase: "Pembuktian", ikon: "✅", aksi: "", widget: false,
      isi: "Ujilah dugaanmu — jangan hanya mencari contoh yang mendukungnya.\n- Substitusikan akar yang kamu temukan ke persamaan. Apakah hasilnya 0?\n- Cari satu contoh yang bisa membantah dugaanmu. Jika ketemu, perbaiki dugaannya.\n> Jika semua contohmu mendukung, apakah itu cukup untuk menyatakan dugaanmu pasti benar?" },
    { judul: "Simpulkan", fase: "Generalisasi", ikon: "💡", aksi: "questika", widget: false,
      isi: "## Kesimpulanmu\nTuliskan dengan kalimatmu sendiri hubungan D dengan akar persamaan kuadrat:\n- D > 0 → (lengkapi sendiri)\n- D = 0 → (lengkapi sendiri)\n- D < 0 → (lengkapi sendiri)\nSetelah itu, uji pemahamanmu di Questika, lalu kerjakan Post Test." }
  ],
  dev: {
    utama: { nama: "Ida Yanti", peran: "Pengembang QUANTA", foto: "",
      deskripsi: "Mahasiswa Pendidikan Matematika yang percaya bahwa belajar matematika paling melekat saat siswa menemukan sendiri konsepnya. QUANTA dibuat agar belajar persamaan kuadrat terasa seru dan menantang." },
    dpa: [
      { nama: "Nama DPA 1", peran: "Dosen Pembimbing Akademik", foto: "", deskripsi: "Tulis deskripsi singkat DPA 1 di sini (admin bisa mengedit)." },
      { nama: "Nama DPA 2", peran: "Dosen Pembimbing Akademik", foto: "", deskripsi: "Tulis deskripsi singkat DPA 2 di sini (admin bisa mengedit)." }
    ]
  }
};

const DEFAULT_Q = {
  latihan: [],
  remedia: [
    { tingkat: "Mengingat", teks: "Bentuk umum persamaan kuadrat ax² + bx + c = 0 mensyaratkan …", opsi: ["a ≠ 0", "b ≠ 0", "c ≠ 0", "a = b = c"], kunci: 0, bahas: "Jika a = 0, suku x² hilang dan persamaannya menjadi linear, bukan kuadrat." },
    { tingkat: "Memahami", teks: "Akar-akar dari x² − 4 = 0 adalah …", opsi: ["2 dan −2", "4 dan −4", "2 saja", "16"], kunci: 0, bahas: "x² = 4, sehingga x = 2 atau x = −2." }
  ],
  pengayaan: [
    { tingkat: "Menganalisis", teks: "Agar x² + 6x + k = 0 mempunyai akar kembar, nilai k adalah …", opsi: ["6", "9", "12", "36"], kunci: 1, bahas: "Akar kembar jika D = 0: 36 − 4k = 0, sehingga k = 9." },
    { tingkat: "Mengevaluasi", teks: "Parabola y = x² − 2x − 3 memotong sumbu-x di titik …", opsi: ["(3, 0) dan (−1, 0)", "(−3, 0) dan (1, 0)", "(3, 0) dan (1, 0)", "(−3, 0) dan (−1, 0)"], kunci: 0, bahas: "x² − 2x − 3 = (x − 3)(x + 1) = 0, sehingga x = 3 atau x = −1." }
  ],
  pre: [
    { tingkat: "Mengingat", teks: "Hasil dari (x + 3)(x − 2) adalah …", opsi: ["x² + x − 6", "x² − x − 6", "x² + 5x − 6", "x² + x + 6"], kunci: 0, bahas: "(x + 3)(x − 2) = x² − 2x + 3x − 6 = x² + x − 6." },
    { tingkat: "Mengingat", teks: "Bentuk umum persamaan kuadrat adalah …", opsi: ["ax² + bx + c = 0 dengan a ≠ 0", "ax + b = 0 dengan a ≠ 0", "ax³ + bx² + c = 0", "ax² + bx + c = 0 dengan a = 0"], kunci: 0, bahas: "Syarat a ≠ 0 menjaga suku x² tetap ada, sehingga derajatnya 2." },
    { tingkat: "Memahami", teks: "Nilai x yang memenuhi x² − 9 = 0 adalah …", opsi: ["x = 3 saja", "x = −3 saja", "x = 3 atau x = −3", "x = 9"], kunci: 2, bahas: "x² = 9, sehingga x = 3 atau x = −3. Keduanya jika dikuadratkan menghasilkan 9." },
    { tingkat: "Memahami", teks: "Grafik y = x² berbentuk …", opsi: ["garis lurus", "parabola terbuka ke atas", "parabola terbuka ke bawah", "lingkaran"], kunci: 1, bahas: "Koefisien x² bernilai positif (1), sehingga parabola terbuka ke atas." },
    { tingkat: "Menerapkan", teks: "Jika a = 2, b = 3, dan c = −5, nilai b² − 4ac adalah …", opsi: ["−31", "49", "29", "31"], kunci: 1, bahas: "b² − 4ac = 9 − 4(2)(−5) = 9 + 40 = 49." }
  ],
  post: [
    { tingkat: "Menerapkan", teks: "Akar-akar dari x² − 5x + 6 = 0 adalah …", opsi: ["2 dan 3", "−2 dan −3", "1 dan 6", "−1 dan −6"], kunci: 0, bahas: "x² − 5x + 6 = (x − 2)(x − 3) = 0, sehingga x = 2 atau x = 3." },
    { tingkat: "Menganalisis", teks: "Persamaan x² + 4x + 5 = 0 memiliki …", opsi: ["dua akar real berbeda", "dua akar real kembar", "tidak ada akar real", "tiga akar real"], kunci: 2, bahas: "D = 16 − 20 = −4 < 0, sehingga parabola tidak memotong sumbu-x." },
    { tingkat: "Menerapkan", teks: "Akar-akar dari 2x² − 3x − 2 = 0 adalah …", opsi: ["2 dan −1/2", "−2 dan 1/2", "1 dan −2", "3 dan −2"], kunci: 0, bahas: "D = 9 + 16 = 25, x = (3 ± 5)/4, sehingga x = 2 atau x = −1/2." },
    { tingkat: "Menganalisis", teks: "Sumbu simetri grafik f(x) = x² − 4x + 3 adalah …", opsi: ["x = −2", "x = 2", "x = 4", "x = 3"], kunci: 1, bahas: "Sumbu simetri x = −b/(2a) = 4/2 = 2." },
    { tingkat: "Mengevaluasi", teks: "Dino berkata: \"Persamaan kuadrat selalu punya dua akar real yang berbeda.\" Pernyataan Dino …", opsi: ["benar, karena berderajat 2 pasti punya dua akar real berbeda", "salah, karena bila D = 0 akarnya kembar dan bila D < 0 tidak ada akar real", "benar, asalkan a bernilai positif", "salah, karena persamaan kuadrat selalu hanya punya satu akar"], kunci: 1, bahas: "Banyaknya akar real bergantung pada D. Satu contoh pembantah (misalnya x² + 1 = 0) sudah cukup untuk menggugurkan pernyataan itu." }
  ]
};

function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) {
    const res = base.map((b, i) => (over[i] !== undefined && over[i] !== null ? deepMerge(b, over[i]) : b));
    Object.keys(over).forEach(k => { const i = Number(k); if (Number.isInteger(i) && i >= base.length) res[i] = over[k]; });
    return res;
  }
  if (typeof base === "object" && base !== null) {
    const o = { ...base };
    for (const k of Object.keys(over)) o[k] = deepMerge(base[k], over[k]);
    return o;
  }
  return over;
}

/* ---------- Status aplikasi ---------- */
let C = DEFAULTS;
let session = null;
localStorage.removeItem("quanta_session"); // sesi lama (versi sebelumnya) tidak boleh terbawa
try { session = JSON.parse(sessionStorage.getItem("quanta_session")); } catch { session = null; }
const isAdmin = () => session?.role === "admin";
const isTeacher = () => ["guru", "admin"].includes(session?.role);
const TABMEM = {};

function buildMateri(sm) {
  const base = DEFAULTS.materi.map((m, i) => ({ ...m, id: "m" + (i + 1), urut: i }));
  if (!sm) return base;
  const ent = Object.entries(sm).filter(([, m]) => m);
  if (!ent.length) return base;
  if (ent.every(([, m]) => !m.id)) return base.map((m, i) => (sm[i] ? { ...m, ...sm[i] } : m)); // format lama
  return ent.map(([k, m]) => ({ ...m, id: m.id || k })).sort((a, b) => (a.urut ?? 0) - (b.urut ?? 0));
}
async function seedMateri() {
  const raw = await db.get("content/materi");
  if (raw && Object.values(raw).every(m => m && m.id)) return;
  const list = buildMateri(raw);
  await db.set("content/materi", Object.fromEntries(list.map(m => [m.id, m])));
}
let lastContentJson = null, lastOwnWrite = 0;
const FOTO_CACHE = {};
async function loadFotos() {
  const list = [["utama", C.dev.utama], ...C.dev.dpa.map((p, i) => [`dpa${i}`, p])];
  await Promise.all(list.map(async ([id, p]) => {
    if (p.foto || !p.fotoV) return; // foto lama tersimpan langsung di konten, atau belum ada foto
    const c = FOTO_CACHE[id];
    if (c && c.v === p.fotoV) { p.foto = c.data; return; }
    try {
      const data = await withTimeout(db.get(`foto/${id}`), 20000, "timeout foto");
      if (data) { FOTO_CACHE[id] = { v: p.fotoV, data }; p.foto = data; } else p.fotoErr = true;
    } catch (e) { console.error("foto", id, e); p.fotoErr = true; }
  }));
}
function applyContent(raw) {
  const saved = { ...(raw || {}) };
  const sm = saved.materi;
  delete saved.materi;
  C = deepMerge(DEFAULTS, saved);
  C.materi = buildMateri(sm);
}
async function loadContent() {
  const raw = (await db.get("content")) || {};
  lastContentJson = JSON.stringify(raw);
  applyContent(raw);
  await loadFotos();
}
async function publicRead(path) {
  // Baca langsung dari server lewat REST tanpa login: persis yang dilihat perangkat lain.
  const r = await withTimeout(fetch(`${firebaseConfig.databaseURL}/quanta/${path}.json?cb=${Date.now()}`, { cache: "no-store" }), 15000, "timeout");
  if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.code = r.status; throw e; }
  return r.json();
}
async function refresh() { await loadContent(); await route(); }

/* ---------- Modal formulir ---------- */
function resizeImage(file, max = 360) {
  // Foto disimpan di dalam konten, jadi dibuat kecil: sisi terpanjang <= 360 px, ukuran <= ~40 KB.
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        let side = max, out = "";
        for (let round = 0; round < 4; round++) {
          const k = Math.min(1, side / Math.max(im.width, im.height));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(im.width * k));
          c.height = Math.max(1, Math.round(im.height * k));
          const g = c.getContext("2d");
          g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // PNG transparan -> latar putih
          g.drawImage(im, 0, 0, c.width, c.height);
          for (const q of [0.82, 0.72, 0.62, 0.5]) {
            out = c.toDataURL("image/jpeg", q);
            if (out.length <= 55000) return res(out); // ~40 KB biner
          }
          side = Math.round(side * 0.8);
        }
        res(out);
      };
      im.onerror = rej;
      im.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

/* ---------- Rumus matematika (MathJax untuk tampil, MathLive untuk mengedit) ---------- */
const MATH_RE = /\$|\\\(|\\\[/;
let mjTimer = 0;
function typesetSoon() {
  clearTimeout(mjTimer);
  mjTimer = setTimeout(async () => {
    if (!window.MathJax || !MathJax.typesetPromise) return; // MathJax belum selesai dimuat
    const els = ["#view", "#modalRoot"].map(x => $(x)).filter(e => e && MATH_RE.test(e.textContent));
    if (!els.length) return;
    try { await MathJax.typesetPromise(els); } catch (e) { console.error("MathJax", e); }
  }, 120);
}
window.quantaTypeset = typesetSoon;
new MutationObserver(typesetSoon).observe(document.body, { childList: true, subtree: true, characterData: true });

const MATHLIVE_URL = "https://cdn.jsdelivr.net/npm/mathlive@0.110.0/";
let mlPromise = null;
function loadMathLive() {
  if (!mlPromise) {
    mlPromise = new Promise((res, rej) => {
      if (customElements.get("math-field")) return res();
      const sc = document.createElement("script");
      sc.src = MATHLIVE_URL + "mathlive.min.js";
      sc.onload = () => {
        try { if (window.MathfieldElement) { MathfieldElement.fontsDirectory = MATHLIVE_URL + "fonts"; MathfieldElement.soundsDirectory = null; } } catch { /* abaikan */ }
        customElements.whenDefined("math-field").then(res, rej);
      };
      sc.onerror = () => { mlPromise = null; rej(new Error("MathLive tidak termuat")); };
      document.head.append(sc);
    });
  }
  return withTimeout(mlPromise, 15000, "timeout MathLive");
}

/* Dialog editor rumus. initial: LaTeX awal ("" bila baru). onOk(latex, display). */
async function openMathEditor(initial, display, onOk) {
  const box = document.createElement("div");
  box.className = "overlay math-overlay";
  box.innerHTML = `<div class="modal math-modal" role="dialog" aria-modal="true" aria-label="Editor rumus">
    <h2>∑ Editor rumus</h2>
    <p class="muted" id="mlHint">Memuat editor rumus…</p>
    <div id="mlHost" class="ml-host"></div>
    <label class="field"><span>Kode LaTeX (boleh diedit langsung)</span><textarea id="mlTex" rows="2" spellcheck="false"></textarea></label>
    <label class="check"><input type="checkbox" id="mlDisp" ${display ? "checked" : ""}> Tampilkan di baris sendiri (rumus besar, di tengah)</label>
    <div class="row end"><button class="btn ghost" type="button" data-x>Batal</button><button class="btn" type="button" data-ok>Sisipkan</button></div>
  </div>`;
  document.body.append(box);
  const tex = $("#mlTex", box), hint = $("#mlHint", box), host = $("#mlHost", box);
  tex.value = initial || "";
  const close = () => { box.remove(); try { window.mathVirtualKeyboard?.hide(); } catch { /* abaikan */ } };
  box.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
  box.onclick = e => { if (e.target === box) close(); };
  $("[data-x]", box).onclick = close;
  $("[data-ok]", box).onclick = () => {
    const latex = tex.value.trim();
    if (!latex) { toast("Rumus masih kosong.", "err"); return; }
    onOk(latex, $("#mlDisp", box).checked);
    close();
  };
  try {
    await loadMathLive();
    const mf = document.createElement("math-field");
    mf.setAttribute("aria-label", "Kolom rumus");
    mf.value = initial || "";
    host.append(mf);
    hint.textContent = "Ketik rumus seperti di Equation Word. Ketik / untuk pecahan, ^ untuk pangkat, sqrt untuk akar. Di HP, tombol ⌨️ membuka papan ketik rumus.";
    mf.addEventListener("input", () => { tex.value = mf.value; });
    tex.addEventListener("input", () => { mf.value = tex.value; });
    setTimeout(() => mf.focus(), 50);
  } catch (e) {
    console.error(e);
    hint.textContent = "Editor visual tidak bisa dimuat (periksa internet). Tulis kode LaTeX di bawah; pratinjau muncul otomatis.";
    host.innerHTML = '<div class="mathprev" id="mlPrev"></div>';
    const upd = () => { const p = $("#mlPrev", box); p.textContent = tex.value.trim() ? "$" + tex.value + "$" : ""; typesetSoon(); };
    tex.addEventListener("input", upd); upd();
    tex.focus();
  }
}

/* Cari rumus $...$ atau $$...$$ yang mengapit posisi kursor. */
function mathAt(text, pos) {
  const re = /\$\$([^$]+?)\$\$|\$([^$\n]+?)\$/g;
  let m;
  while ((m = re.exec(text))) {
    if (pos >= m.index && pos <= m.index + m[0].length) return { start: m.index, end: m.index + m[0].length, latex: (m[1] ?? m[2]).trim(), display: m[1] !== undefined };
  }
  return null;
}

const hasMath = f => f.math === true || (f.math !== false && f.type === "textarea");
function fieldHTML(f) {
  const id = `f_${f.key}`, v = f.value ?? "";
  let input;
  if (f.type === "textarea") input = `<textarea id="${id}" rows="${f.rows || 5}">${esc(v)}</textarea>`;
  else if (f.type === "select") input = `<select id="${id}">${f.options.map(([val, lab]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select>`;
  else if (f.type === "image") input = `<div class="imgpick"><img id="${id}_p" alt="Pratinjau foto" ${v ? `src="${esc(v)}"` : "hidden"}><input type="file" accept="image/*" id="${id}"></div>`;
  else input = `<input id="${id}" type="${f.type || "text"}" value="${esc(v)}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}>`;
  const mathUI = hasMath(f) ? `<span class="mathbar"><button class="btn sm sky" type="button" data-math="${f.key}">∑ Rumus</button><small>Klik untuk menyisipkan rumus. Letakkan kursor di dalam rumus $...$ lalu klik lagi untuk mengubahnya.</small></span><div class="mathprev" id="${id}_v" hidden></div>` : "";
  return `<div class="field"><label for="${id}">${esc(f.label)}</label>${input}${mathUI}${f.hint ? `<small>${esc(f.hint)}</small>` : ""}</div>`;
}

function closeModal() { $("#modalRoot").innerHTML = ""; }

function openForm({ title, intro = "", fields, onSave, saveLabel = "Simpan" }) {
  const root = $("#modalRoot");
  const imgs = {};
  root.innerHTML = `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <h2>${esc(title)}</h2>${intro ? `<p class="muted">${esc(intro)}</p>` : ""}
    <div>${fields.map(fieldHTML).join("")}</div>
    <div class="row end"><button class="btn ghost" data-x type="button">Batal</button><button class="btn" data-save type="button">${esc(saveLabel)}</button></div>
  </div></div>`;
  const pending = new Set();
  fields.filter(f => f.type === "image").forEach(f => {
    imgs[f.key] = f.value || "";
    $(`#f_${f.key}`).onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      const btn = $("[data-save]", root);
      btn.disabled = true;
      btn.textContent = "Memproses foto…";
      const job = (async () => {
        try {
          imgs[f.key] = await resizeImage(file);
          const p = $(`#f_${f.key}_p`);
          p.src = imgs[f.key];
          p.hidden = false;
        } catch { toast("Foto tidak bisa dibaca. Gunakan file JPG atau PNG (bukan HEIC).", "err"); }
      })();
      pending.add(job);
      await job;
      pending.delete(job);
      if (!pending.size) { btn.disabled = false; btn.textContent = saveLabel; }
    };
  });
  fields.filter(hasMath).forEach(f => {
    const el = $(`#f_${f.key}`, root), prev = $(`#f_${f.key}_v`, root), btn = $(`[data-math="${f.key}"]`, root);
    if (!el || !prev || !btn) return;
    let t = 0;
    const upd = () => {
      const val = el.value;
      if (!MATH_RE.test(val)) { prev.hidden = true; prev.innerHTML = ""; return; }
      prev.hidden = false;
      prev.innerHTML = el.tagName === "TEXTAREA" ? rich(val) : `<p>${esc(val)}</p>`;
      typesetSoon();
    };
    el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(upd, 250); });
    upd();
    btn.onclick = () => {
      const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
      const hit = mathAt(el.value, a);
      openMathEditor(hit ? hit.latex : "", hit ? hit.display : false, (latex, display) => {
        const wrap = display ? "$$" : "$", piece = wrap + latex + wrap;
        const from = hit ? hit.start : a, to = hit ? hit.end : b;
        el.value = el.value.slice(0, from) + piece + el.value.slice(to);
        const caret = from + piece.length;
        el.focus(); el.setSelectionRange(caret, caret);
        upd();
      });
    };
  });
  $("[data-x]", root).onclick = closeModal;
  $(".overlay", root).onclick = e => { if (e.target.classList.contains("overlay")) closeModal(); };
  $("[data-save]", root).onclick = async () => {
    await Promise.all([...pending]);
    const vals = {};
    fields.forEach(f => { vals[f.key] = f.type === "image" ? imgs[f.key] : $(`#f_${f.key}`).value.trim(); });
    try { await onSave(vals); closeModal(); }
    catch (err) { console.error(err); toast("Gagal menyimpan. Periksa koneksi atau aturan database.", "err"); }
  };
  const first = $("input:not([type=file]),textarea,select", root);
  if (first) first.focus();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ---------- Komponen tampilan ---------- */
const pageHead = (ico, title, sub, extra = "") =>
  `<div class="page-head"><div class="ico" aria-hidden="true">${ico}</div><div class="grow"><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${extra}</div>`;
const editBtn = (act, data = "", label = "✏️ Edit") =>
  isAdmin() ? `<button class="edit" type="button" data-act="${act}" ${data}>${label}</button>` : "";

function tabs(host, key, list) {
  host.innerHTML = `<div class="tabs" role="tablist">${list.map((t, i) => `<button role="tab" type="button" data-i="${i}" class="${t.done ? "done" : ""}">${t.label}</button>`).join("")}</div><div class="tabpane"></div>`;
  const pane = $(".tabpane", host);
  const show = async i => {
    TABMEM[key] = i;
    $$(".tabs button", host).forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", String(k === i)); });
    pane.innerHTML = '<p class="muted">Memuat…</p>';
    await list[i].render(pane);
  };
  $$(".tabs button", host).forEach(b => { b.onclick = () => show(Number(b.dataset.i)); });
  show(Math.min(TABMEM[key] || 0, list.length - 1));
}

/* ---------- Widget parabola ---------- */
function parabolaHTML(id) {
  const sl = [["a", 1, -3, 3], ["b", 0, -6, 6], ["c", -2, -5, 5]];
  return `<div class="para" id="${id}">
    <canvas width="600" height="400" role="img" aria-label="Grafik y = ax² + bx + c yang bisa digeser"></canvas>
    <div class="sliders">${sl.map(([k, v, mn, mx]) => `<label>${k} = <output>${v}</output><input type="range" min="${mn}" max="${mx}" step="0.5" value="${v}" data-k="${k}" aria-label="Nilai ${k}"></label>`).join("")}</div>
    <p class="para-info" aria-live="polite"></p></div>`;
}

function initParabola(id) {
  const root = document.getElementById(id);
  if (!root) return;
  const cv = $("canvas", root), ctx = cv.getContext("2d"), info = $(".para-info", root);
  const css = getComputedStyle(document.documentElement);
  const col = n => css.getPropertyValue(n).trim();
  const W = cv.width, H = cv.height, XR = 7.5, YR = 5;
  const X = x => W / 2 + x * W / (2 * XR), Y = y => H / 2 - y * H / (2 * YR);
  const fmt = n => String(Math.round(n * 100) / 100).replace(".", ",");
  const v = { a: 1, b: 0, c: -2 };

  function draw() {
    const { a, b, c } = v, D = b * b - 4 * a * c;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.strokeStyle = col("--grid");
    for (let x = -7; x <= 7; x++) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); }
    for (let y = -5; y <= 5; y++) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); }
    ctx.strokeStyle = col("--ink");
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    ctx.strokeStyle = col("--coral");
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let px = 0; px <= W; px += 3) {
      const x = (px - W / 2) * 2 * XR / W, y = a * x * x + b * x + c;
      px === 0 ? ctx.moveTo(px, Y(y)) : ctx.lineTo(px, Y(y));
    }
    ctx.stroke();
    const dot = (x, y, color) => {
      ctx.beginPath(); ctx.arc(X(x), Y(y), 8, 0, 7); ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = col("--ink"); ctx.stroke();
    };
    let msg;
    if (a === 0) {
      msg = "Karena a = 0, kurvanya menjadi garis lurus. Apakah ini masih persamaan kuadrat? Pikirkan alasannya!";
    } else {
      const xp = -b / (2 * a), yp = a * xp * xp + b * xp + c;
      dot(xp, yp, col("--sun"));
      let akar;
      if (D > 0) {
        const r1 = (-b - Math.sqrt(D)) / (2 * a), r2 = (-b + Math.sqrt(D)) / (2 * a);
        dot(r1, 0, col("--mint")); dot(r2, 0, col("--mint"));
        akar = `D = ${fmt(D)} > 0 → dua titik potong, x ≈ ${fmt(Math.min(r1, r2))} dan ${fmt(Math.max(r1, r2))}.`;
      } else if (D === 0) {
        dot(xp, 0, col("--mint"));
        akar = `D = 0 → menyentuh sumbu-x di satu titik, x = ${fmt(xp)}.`;
      } else {
        akar = `D = ${fmt(D)} < 0 → tidak memotong sumbu-x.`;
      }
      msg = `Terbuka ke ${a > 0 ? "atas" : "bawah"}. ${akar} Puncak (${fmt(xp)}, ${fmt(yp)}).`;
    }
    info.textContent = msg;
  }
  $$("input[type=range]", root).forEach(r => {
    r.oninput = () => { v[r.dataset.k] = Number(r.value); $("output", r.parentElement).textContent = r.value; draw(); };
  });
  draw();
}

/* ---------- Login ---------- */
async function verifyRole(role, code) {
  if (DEMO) {
    if (role === "admin") return (await sha(code)) === ADMIN_HASH;
    return (await sha(code)) === ((await db.get("settings/teacherHash")) || DEFAULT_TEACHER_HASH);
  }
  try { await db.signInRole(role, code); return true; }
  catch (e) {
    if (/invalid-credential|wrong-password|user-not-found|invalid-login|invalid-email/.test(String(e?.code))) return false;
    throw e;
  }
}
function authMessage(e) {
  const c = String(e?.code || e?.message || "");
  if (/too-many-requests/.test(c)) return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (/operation-not-allowed/.test(c)) return "Metode masuk belum diaktifkan di Firebase Authentication.";
  if (/PERMISSION_DENIED/i.test(c)) return "Akses ditolak oleh Rules database. Pastikan Rules terbaru sudah di-Publish.";
  if (/network/.test(c)) return "Tidak ada koneksi internet.";
  return "Gagal masuk. Cek koneksi internetmu.";
}

function showLogin() {
  $("#top").hidden = true;
  $("#nav").hidden = true;
  const v = $("#view");
  v.innerHTML = `<section class="login">
    <h1>QUANTA</h1>
    <p class="hero-sub" style="font-family:var(--font-d);font-size:1.3rem;color:var(--coral);font-weight:600">Quadratic Learning Platform</p>
    <h2 style="margin:.2em 0 .1em">Pilih peran</h2>
    <p class="muted">Jelajahi QUANTA dengan menyenangkan.</p>
    <div class="roles">
      <button class="role-card" type="button" data-role="siswa"><i>🎒</i><b>Siswa</b><span>Belajar, tes, dan lihat nilaimu sendiri</span></button>
      <button class="role-card" type="button" data-role="guru"><i>🧑‍🏫</i><b>Guru</b><span>Tambah soal dan pantau nilai siswa</span></button>
      <button class="role-card" type="button" data-role="admin"><i>🛠️</i><b>Admin</b><span>Kelola seluruh isi QUANTA</span></button>
    </div>
    <div class="card login-form" id="loginForm" hidden></div>
    <p class="muted"><a href="#/cek">Firebase belum terhubung? Cek koneksi</a></p></section>`;
  $$(".role-card", v).forEach(b => {
    b.onclick = () => {
      $$(".role-card", v).forEach(x => x.classList.toggle("on", x === b));
      renderLoginForm(b.dataset.role);
    };
  });
}

function renderLoginForm(role) {
  const f = $("#loginForm");
  f.hidden = false;
  const nama = `<label class="field"><span>Nama lengkap</span><input id="lgNama" type="text" autocomplete="name"></label>`;
  const kelas = `<label class="field"><span>Kelas</span><input id="lgKelas" type="text" placeholder="contoh: X-1"></label>`;
  const kode = lbl => `<label class="field"><span>${lbl}</span><input id="lgKode" type="password" autocomplete="off"></label>`;
  const seg = `<div class="seg" role="group" aria-label="Cara belajar"><button type="button" class="on" data-mode="individu">🧍 Individu</button><button type="button" data-mode="kelompok">👥 Kelompok</button></div><div id="modeFields"></div>`;
  f.innerHTML = (role === "siswa" ? seg : role === "guru" ? nama + kode("Kode guru") : kode("Kode admin")) +
    `<button class="btn" id="lgGo" type="button" style="width:100%">Masuk</button>`;
  let mode = "individu";
  const memRow = (n, v = "") => `<div class="mem-row"><b>${n}</b><input class="mem" type="text" value="${esc(v)}" placeholder="Nama anggota ${n}" aria-label="Nama anggota ${n}"></div>`;
  const renderMode = () => {
    const box = $("#modeFields");
    if (!box) return;
    box.innerHTML = mode === "individu" ? nama + kelas :
      `<label class="field"><span>Nama kelompok</span><input id="lgNama" type="text" placeholder="contoh: Kelompok 1"></label>${kelas}
       <div class="field"><span>Anggota kelompok (tulis berurutan ke bawah)</span><div id="memList">${memRow(1)}${memRow(2)}${memRow(3)}</div>
       <div class="row"><button class="btn sm ghost" type="button" id="memAdd">+ Tambah anggota</button><button class="btn sm ghost" type="button" id="memDel">− Kurangi</button></div></div>`;
    $$(".seg button", f).forEach(x => x.classList.toggle("on", x.dataset.mode === mode));
    if (mode === "kelompok") {
      $("#memAdd").onclick = () => { const l = $("#memList"); l.insertAdjacentHTML("beforeend", memRow($$(".mem-row", l).length + 1)); $$(".mem", l).at(-1).focus(); };
      $("#memDel").onclick = () => { const rows = $$(".mem-row", $("#memList")); if (rows.length > 2) rows.at(-1).remove(); };
    }
  };
  if (role === "siswa") {
    $$(".seg button", f).forEach(x => { x.onclick = () => { mode = x.dataset.mode; renderMode(); }; });
    renderMode();
  }
  const go = async () => {
    try {
      if (role === "siswa") {
        const n = $("#lgNama").value.trim(), k = $("#lgKelas").value.trim();
        if (!n || !k) return toast(mode === "kelompok" ? "Isi nama kelompok dan kelas dulu ya." : "Isi nama dan kelas dulu ya.", "err");
        let extra = { mode };
        if (mode === "kelompok") {
          const anggota = $$(".mem").map(i => i.value.trim()).filter(Boolean);
          if (anggota.length < 2) return toast("Tulis minimal 2 nama anggota kelompok.", "err");
          extra = { mode, anggota };
        }
        const uid = slug(`${mode === "kelompok" ? "kelompok-" : ""}${n}-${k}`);
        const old = await db.get(`users/${uid}`);
        if (!old || mode === "kelompok") await db.set(`users/${uid}`, { nama: n, kelas: k, ...extra, dibuat: old?.dibuat || new Date().toISOString() });
        session = { role, name: n, kelas: k, uid, ...extra };
      } else if (role === "guru") {
        const n = $("#lgNama").value.trim(), kd = $("#lgKode").value;
        if (!n || !kd) return toast("Isi nama dan kode guru.", "err");
        if (!(await verifyRole("guru", kd))) return toast("Kode guru salah.", "err");
        session = { role, name: n, kelas: "", uid: "guru-" + slug(n) };
      } else {
        const kd = $("#lgKode").value;
        if (!kd) return toast("Isi kode admin.", "err");
        if (!(await verifyRole("admin", kd))) return toast("Kode admin salah.", "err");
        session = { role, name: "Admin", kelas: "", uid: "admin" };
      }
      sessionStorage.setItem("quanta_session", JSON.stringify(session));
      touch();
      location.hash = "#/beranda";
      await route();
    } catch (e) { console.error(e); toast(authMessage(e), "err"); }
  };
  $("#lgGo").onclick = go;
  f.onkeydown = e => {
    if (e.key !== "Enter") return;
    if (e.target.classList?.contains("mem")) {
      e.preventDefault();
      const all = $$(".mem", f), i = all.indexOf(e.target);
      if (i < all.length - 1) all[i + 1].focus(); else $("#memAdd").click();
      return;
    }
    go();
  };
  const first = $("input", f);
  if (first) first.focus();
}

const IDLE_MS = 15 * 60 * 1000; // 15 menit tanpa aktivitas
function touch() { if (session) sessionStorage.setItem("quanta_last", String(Date.now())); }
function checkIdle() {
  if (!session) return;
  const last = Number(sessionStorage.getItem("quanta_last") || Date.now());
  if (Date.now() - last > IDLE_MS) {
    logout();
    toast("Kamu keluar otomatis karena lama tidak aktif. Silakan masuk lagi.", "err");
  }
}
["click", "keydown", "touchstart", "pointerdown"].forEach(ev => addEventListener(ev, touch, { passive: true }));
setInterval(checkIdle, 30000);
addEventListener("pageshow", checkIdle);
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkIdle(); });

function logout() {
  db.signOutAll();
  sessionStorage.removeItem("quanta_session");
  sessionStorage.removeItem("quanta_last");
  localStorage.removeItem("quanta_session");
  session = null;
  location.hash = "";
  route();
}

/* ---------- Halaman ---------- */
async function vBeranda(v) {
  const b = C.beranda;
  const steps = [
    ["pretest", "Pre Test", "Cek titik awalmu. Tidak ada yang salah di sini."],
    ["materi", "Materi", "Enam langkah menemukan konsep sendiri."],
    ["eksplorasi", "Mode Eksplorasi", "Utak-atik dan kumpulkan datamu."],
    ["questika", "Questika", "Tantangan bertingkat yang menguji nalarmu."],
    ["video", "Video Belajar", "Tonton ulang bila ada yang masih membingungkan."],
    ["posttest", "Post Test", "Buktikan apa yang sudah kamu temukan."]
  ];
  v.innerHTML = `<section class="hero">
    <div class="hero-copy">
      <h1>QUANTA</h1>
      <div class="sub">Quadratic Learning Platform</div>
      <p class="lead">${esc(b.lead)}</p>
      <div class="row"><a class="btn" href="#/pretest">Mulai petualangan</a><a class="btn ghost" href="#/materi">Langsung ke materi</a>${editBtn("edit-beranda")}</div>
    </div>
    <div>${parabolaHTML("heroPara")}</div></section>
    <h2>Alur belajarmu</h2>
    <ol class="path">${steps.map(([k, t, d]) => `<li><a href="#/${k}"><b>${t}</b><span>${d}</span></a></li>`).join("")}</ol>
    <section class="card rich"><div class="row between"><h2>Tentang QUANTA</h2></div>${rich(b.tentang)}</section>`;
  initParabola("heroPara");
}

function vDoc(key, ico, title, sub) {
  return async v => {
    v.innerHTML = pageHead(ico, title, sub, editBtn("edit-doc", `data-key="${key}"`)) + `<section class="card rich">${rich(C[key])}</section>`;
  };
}

async function vMateri(v) {
  const prog = JSON.parse(localStorage.getItem(`quanta_prog_${session.uid}`) || "[]");
  v.innerHTML = pageHead("📚", "Materi", "Belajar dengan menemukan: Discovery Learning", editBtn("add-materi", "", "➕ Tambah langkah")) + `<div id="materiHost"></div>`;
  tabs($("#materiHost"), "materi", C.materi.map((m, i) => ({
    label: `${m.ikon} ${i + 1}. ${esc(m.judul)}`,
    done: prog.includes(m.id),
    render: async pane => {
      const wid = `para_${i}`;
      pane.innerHTML = `<section class="card in-card">
        <div class="row between"><span class="stage-phase">${esc(m.fase)}</span><span class="row" style="gap:6px">${editBtn("move-materi", `data-id="${m.id}" data-d="-1"`, "⬆️")}${editBtn("move-materi", `data-id="${m.id}" data-d="1"`, "⬇️")}${editBtn("edit-materi", `data-i="${i}"`)}${editBtn("del-materi", `data-id="${m.id}"`, "🗑️ Hapus")}</span></div>
        <h2>${esc(m.judul)}</h2><div class="rich">${rich(m.isi)}</div>
        ${m.widget ? parabolaHTML(wid) : ""}
        <div class="row" style="margin-top:14px">
          ${m.aksi === "eksplor" ? `<a class="btn sky" href="#/eksplorasi">Buka Mode Eksplorasi</a>` : ""}
          ${m.aksi === "questika" ? `<a class="btn mint" href="#/questika">Coba Tantangan Questika</a>` : ""}
          <button class="btn sun" type="button" data-act="mark-done" data-i="${i}" data-id="${m.id}">${prog.includes(m.id) ? "Sudah selesai ✓" : "Tandai selesai"}</button>
        </div></section>`;
      if (m.widget) initParabola(wid);
    }
  })));
}

function vEmbed(key, ico, title, sub, desc) {
  return async v => {
    const url = C.links[key];
    v.innerHTML = pageHead(ico, title, sub) + `<section class="card"><p>${desc}</p>
      <div class="row"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Buka di tab baru</a></div></section>
      <div class="frame"><iframe src="${esc(url)}" title="${esc(title)}" loading="lazy" allowfullscreen></iframe></div>`;
  };
}

async function vVideo(v) {
  v.innerHTML = pageHead("🎬", "Video Belajar", "Tonton, jeda, lalu coba sendiri") + `<div class="grid2">
    <a class="card link-card" href="${esc(C.links.youtube)}" target="_blank" rel="noopener"><div class="big">▶️</div><div><h2>YouTube</h2><p>Video penjelasan lengkap. Jeda di tengah video dan coba tebak langkah berikutnya sebelum melanjutkan.</p><span class="chip">Buka kanal</span></div></a>
    <a class="card link-card" href="${esc(C.links.tiktok)}" target="_blank" rel="noopener"><div class="big">🎵</div><div><h2>TikTok</h2><p>Potongan singkat untuk mengulang konsep dalam hitungan detik.</p><span class="chip">Buka akun</span></div></a></div>`;
}

async function vDev(v) {
  const d = C.dev;
  const photo = p => p.foto ? `<img class="photo" src="${esc(p.foto)}" alt="Foto ${esc(p.nama)}">` : p.fotoErr ? `<div class="photo ph" title="Foto gagal dimuat. Muat ulang halaman.">⚠️</div>` : `<div class="photo ph" aria-hidden="true">${esc((p.nama || "?").trim().charAt(0).toUpperCase())}</div>`;
  v.innerHTML = pageHead("👩‍💻", "Pengembang", "Orang-orang di balik QUANTA") + `
    <section class="card dev-main">${photo(d.utama)}<div><h2>${esc(d.utama.nama)}</h2><p class="role">${esc(d.utama.peran)}</p><div class="rich">${rich(d.utama.deskripsi)}</div>${editBtn("edit-dev", `data-t="utama"`)}</div></section>
    <h2>Dosen Pembimbing Akademik (DPA)</h2>
    <div class="dpa-grid">${d.dpa.map((p, i) => `<section class="card dpa">${photo(p)}<h3>${esc(p.nama)}</h3><p class="role">${esc(p.peran)}</p><div class="rich">${rich(p.deskripsi)}</div>${editBtn("edit-dev", `data-t="${i}"`)}</section>`).join("")}</div>`;
}

/* ---------- Tes ---------- */
/* ---------- Tingkat berpikir C1–C6 (bisa diatur guru/admin) ---------- */
const DEFAULT_LEVELS = [["C1", "Mengingat"], ["C2", "Memahami"], ["C3", "Menerapkan"], ["C4", "Menganalisis"], ["C5", "Mengevaluasi"], ["C6", "Mencipta"]].map(([kode, nama]) => ({ kode, nama }));
const LEGACY_LEVEL = { Mengingat: "C1", Memahami: "C2", Menerapkan: "C3", Menganalisis: "C4", Mengevaluasi: "C5", Mencipta: "C6" };
let LEVELS = DEFAULT_LEVELS;
async function loadLevels() {
  try {
    const o = await db.get("questions/_tingkat");
    const arr = o ? (Array.isArray(o) ? o : Object.values(o)).filter(x => x && x.kode && x.nama) : [];
    LEVELS = arr.length ? arr : DEFAULT_LEVELS;
  } catch { LEVELS = DEFAULT_LEVELS; }
  return LEVELS;
}
function levelOf(t) {
  if (!t) return null;
  return LEVELS.find(l => l.kode === t) || LEVELS.find(l => l.kode === LEGACY_LEVEL[t]) || LEVELS.find(l => l.nama === t) || null;
}
const levelCode = t => levelOf(t)?.kode || t || "";
const levelLabel = t => { const l = levelOf(t); return l ? `${l.kode} ${l.nama}` : (t || ""); };

/* ---------- Peserta pada mode kelompok: tiap anggota mengerjakan tes atas namanya sendiri ---------- */
const isKel = () => !!session && session.role === "siswa" && session.mode === "kelompok";
const rid = () => (isKel() ? slug(`${session.peserta}-${session.kelas}`) : session.uid);
const whoName = () => (isKel() ? session.peserta : session.name);
function saveSession() { try { sessionStorage.setItem("quanta_session", JSON.stringify(session)); } catch { /* abaikan */ } }
function renderPesertaPicker(v, title, onPick) {
  v.innerHTML = title + `<section class="card" id="pesertaBox">
    <h2>Siapa yang mengerjakan?</h2>
    <p>Kamu masuk sebagai <b>${esc(session.name)}</b>. Pilih atau tulis namamu sendiri supaya nilainya tercatat atas namamu, bukan nama kelompok.</p>
    <div class="row" style="margin-bottom:12px">${(session.anggota || []).map(n => `<button class="btn sm sky" type="button" data-pn="${esc(n)}">${esc(n)}</button>`).join("")}</div>
    <label class="field"><span>Atau tulis namamu</span><input id="pnInput" type="text" autocomplete="off" placeholder="Nama lengkap"></label>
    <button class="btn" type="button" id="pnGo">Lanjut</button></section>`;
  const pick = n => {
    n = String(n || "").trim().slice(0, 100);
    if (!n) return toast("Isi atau pilih namamu dulu ya.", "err");
    session.peserta = n; saveSession(); onPick();
  };
  $$("[data-pn]", v).forEach(b => { b.onclick = () => pick(b.dataset.pn); });
  $("#pnGo", v).onclick = () => pick($("#pnInput", v).value);
  $("#pnInput", v).onkeydown = e => { if (e.key === "Enter") pick(e.target.value); };
}

const KIND_LABEL = { pre: "Pre Test", post: "Post Test", remedia: "Remedia", pengayaan: "Pengayaan", latihan: "Soal Lain" };
const META = {
  pre: ["🧭", "Pre Test", "Asesmen Diagnostik"], post: ["🏆", "Post Test", "Asesmen Sumatif"],
  remedia: ["🩹", "Remedia", "Perbaiki pemahamanmu langkah demi langkah"], pengayaan: ["🚀", "Pengayaan", "Tantangan lebih tinggi untuk memperdalam nalarmu"],
  latihan: ["✍️", "Latihan Soal", "Soal tambahan untuk melatih nalarmu"]
};
const INTRO = {
  latihan: "Latihan ini boleh diulang sebanyak yang kamu mau. Gunakan untuk menguji nalarmu sebelum Post Test.",
  remedia: "Remedia membantu memperbaiki bagian yang belum kuat. Kerjakan pelan-pelan dan baca pembahasan setiap soal.",
  pengayaan: "Pengayaan berisi soal yang lebih menantang. Cobalah menjelaskan alasan jawabanmu sebelum memilih."
};
async function getQuestions(kind) {
  const o = await db.get(`questions/${kind}`);
  const arr = o ? Object.values(o) : DEFAULT_Q[kind].map((q, i) => ({ id: `d${i + 1}`, urut: i, oleh: "Bawaan", ...q }));
  return arr.sort((a, b) => (a.urut ?? 0) - (b.urut ?? 0));
}
async function ensureSeed(kind) {
  if (await db.get(`questions/${kind}`)) return;
  await Promise.all(DEFAULT_Q[kind].map((q, i) => db.set(`questions/${kind}/d${i + 1}`, { id: `d${i + 1}`, urut: i, oleh: "Bawaan", ...q })));
}

function vTest(kind) {
  const self = async v => {
    const pre = kind === "pre", student = session.role === "siswa";
    if (isKel() && !session.peserta) { renderPesertaPicker(v, pageHead(...META[kind]), () => self(v)); return; }
    await loadLevels();
    const qs = await getQuestions(kind);
    const prev = student ? await db.get(`results/${rid()}/${kind}`) : null;
    const preDone = (!student || kind !== "post") ? true : !!(await db.get(`results/${rid()}/pre`));
    const locked = student && pre && prev;
    const postRes = student && (kind === "remedia" || kind === "pengayaan") ? await db.get(`results/${rid()}/post`) : null;
    const saran = !student || !(kind === "remedia" || kind === "pengayaan") ? "" : !postRes ? "Disarankan mengerjakan Post Test lebih dulu."
      : kind === "remedia" ? (postRes.skor >= 75 ? "Nilai Post Test-mu sudah baik, remedia ini bersifat opsional." : "Nilai Post Test-mu masih di bawah 75, remedia ini sangat disarankan.")
      : (postRes.skor >= 75 ? "Nilai Post Test-mu sudah baik, pengayaan ini cocok untukmu." : "Sebaiknya selesaikan remedia dulu sebelum pengayaan.");
    v.innerHTML = pageHead(...META[kind]) + `<section class="card" id="testBox">
      <p>${INTRO[kind] ? INTRO[kind] : pre ? "Ini bukan ujian untuk menghakimi. Pre test membantu kita tahu dari mana kamu mulai. Jawab sejujurnya — menebak dengan berani pun tidak apa-apa." : "Saatnya membuktikan hasil penemuanmu. Baca pelan-pelan, dan tanyakan \"kenapa jawabannya begitu?\" sebelum memilih."}</p>
      ${!qs.length ? '<p class="muted">Belum ada soal di bagian ini. Guru atau admin dapat menambahkannya.</p>' : ""}${isKel() ? `<p>Mengerjakan sebagai: <b>${esc(session.peserta)}</b> <button class="btn sm ghost" type="button" id="pnChange">Ganti nama</button></p>` : ""}<p><span class="chip">${qs.length} soal</span> ${!student ? '<span class="chip">Mode pratinjau: nilai tidak disimpan</span>' : ""}</p>
      ${prev ? `<p>Nilai terakhirmu: <b>${prev.skor}</b> (percobaan ke-${prev.percobaan}).</p>` : ""}
      ${!preDone ? `<p class="think"><span>Saran</span>Kamu belum mengerjakan Pre Test. Disarankan mengerjakannya lebih dulu agar kemajuanmu terlihat.</p>` : ""}
      ${saran ? `<p class="think"><span>Saran</span>${saran}</p>` : ""}
      ${locked ? `<p class="muted">Pre test hanya bisa dikerjakan sekali. Minta guru untuk mengulang bila perlu.</p>` : ""}
      <button class="btn" id="startTest" type="button" ${locked || !qs.length ? "disabled" : ""}>${prev && !locked ? "Kerjakan lagi" : "Mulai"}</button></section>`;
    $("#startTest").onclick = () => runTest(qs, kind, student);
    if ($("#pnChange")) $("#pnChange").onclick = () => { session.peserta = null; saveSession(); self(v); };
  };
  // Setiap kali halaman tes dibuka, anggota kelompok wajib memilih/mengetik namanya lagi.
  return async v => { if (isKel()) { session.peserta = null; saveSession(); } return self(v); };
}

function runTest(qs, kind, student) {
  const box = $("#testBox");
  let i = 0;
  const ans = Array(qs.length).fill(null);
  const draw = () => {
    const q = qs[i];
    box.innerHTML = `<div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div>
      <p class="muted">Soal ${i + 1} dari ${qs.length} ${q.tingkat ? `<span class="chip">${esc(levelLabel(q.tingkat))}</span>` : ""}</p>
      <h2 class="qtext">${esc(q.teks)}</h2>
      <div class="opts">${q.opsi.map((o, k) => `<button class="opt ${ans[i] === k ? "sel" : ""}" type="button" data-k="${k}"><b>${"ABCD"[k]}</b><span>${esc(o)}</span></button>`).join("")}</div>
      <div class="row between"><button class="btn ghost" type="button" data-prev ${i ? "" : "disabled"}>Sebelumnya</button>
      <button class="btn" type="button" data-next ${ans[i] === null ? "disabled" : ""}>${i === qs.length - 1 ? "Selesai" : "Lanjut"}</button></div>`;
    $$(".opt", box).forEach(b => { b.onclick = () => { ans[i] = Number(b.dataset.k); draw(); }; });
    $("[data-prev]", box).onclick = () => { i--; draw(); };
    $("[data-next]", box).onclick = () => { if (i === qs.length - 1) finish(); else { i++; draw(); } };
  };
  const finish = async () => {
    const benar = qs.filter((q, k) => ans[k] === Number(q.kunci)).length;
    const skor = Math.round((benar / qs.length) * 100);
    const atasNama = student ? whoName() : "";
    if (student) {
      try {
        const id = rid(), kel = isKel();
        if (!(await db.get(`users/${id}`))) {
          await db.set(`users/${id}`, kel
            ? { nama: session.peserta, kelas: session.kelas, mode: "anggota", kelompok: session.name, dibuat: new Date().toISOString() }
            : { nama: session.name, kelas: session.kelas, mode: session.mode || "individu", ...(session.anggota ? { anggota: session.anggota } : {}), dibuat: new Date().toISOString() });
        }
        const old = await db.get(`results/${id}/${kind}`);
        await db.set(`results/${id}/${kind}`, { nama: atasNama, ...(kel ? { kelompok: session.name } : {}), kelas: session.kelas, skor, benar, total: qs.length, tanggal: new Date().toISOString(), percobaan: (old?.percobaan || 0) + 1 });
        if (kel) { session.peserta = null; saveSession(); } // anggota berikutnya wajib memasukkan namanya sendiri
      } catch (e) { console.error(e); toast("Nilai gagal tersimpan. Beri tahu gurumu.", "err"); }
    }
    const msg = skor >= 80 ? "Luar biasa! Penemuanmu kuat." : skor >= 60 ? "Bagus! Tinggal sedikit lagi." : "Tidak apa-apa. Baca pembahasan di bawah, lalu ulangi materi bagian yang belum kuat.";
    box.innerHTML = `<div class="row"><div class="score"><big>${skor}</big><small>${benar} dari ${qs.length} benar</small></div><p style="flex:1;min-width:200px"><b>${msg}</b><br>${student ? `Nilaimu sudah tersimpan atas nama <b>${esc(atasNama)}</b>.` : "Mode pratinjau: nilai tidak disimpan."}</p></div>
      <h2 style="margin-top:22px">Pembahasan</h2>
      ${qs.map((q, k) => {
        const ok = ans[k] === Number(q.kunci);
        return `<div class="review"><p><b>${k + 1}. ${esc(q.teks)}</b></p>
          <p class="ans ${ok ? "ok-t" : "bad-t"}">${ok ? "Benar" : "Belum tepat"} — jawabanmu: ${esc(q.opsi[ans[k]] ?? "-")}</p>
          ${ok ? "" : `<p class="ans">Jawaban benar: ${esc(q.opsi[q.kunci])}</p>`}
          <p class="muted">${esc(q.bahas || "")}</p></div>`;
      }).join("")}`;
  };
  draw();
}

/* ---------- Nilai siswa ---------- */
async function vNilai(v) {
  if (isKel()) { session.peserta = null; saveSession(); } // nama wajib diisi lagi tiap membuka halaman
  return nilaiView(v);
}
async function nilaiView(v) {
  if (isKel() && !session.peserta) { renderPesertaPicker(v, pageHead("🏅", "Nilaiku", "Pilih namamu untuk melihat nilaimu sendiri."), () => nilaiView(v)); return; }
  const [pre, post, lat, rem, pen] = await Promise.all(["pre", "post", "latihan", "remedia", "pengayaan"].map(k => db.get(`results/${rid()}/${k}`)));
  const badges = [
    ["🧭", "Penjelajah Awal", !!pre], ["🏁", "Sampai Garis Akhir", !!post],
    ["⭐", "Bintang (≥ 80)", !!post && post.skor >= 80], ["📈", "Naik Level", !!pre && !!post && post.skor > pre.skor]
  ];
  const sc = (x, lbl, c) => x ? `<div class="score ${c}"><big>${x.skor}</big><small>${lbl}</small></div>` : `<div class="score empty"><big>–</big><small>${lbl}: belum</small></div>`;
  const delta = pre && post ? post.skor - pre.skor : null;
  v.innerHTML = pageHead("🏅", "Nilaiku", `Halo, ${whoName()}${isKel() ? " (" + session.name + ")" : ""}. Halaman ini hanya bisa dilihat olehmu.`) + `${isKel() ? '<p><button class="btn sm ghost" type="button" id="pnChange">Ganti nama</button></p>' : ""}
    <section class="card"><div class="row" style="gap:28px">${sc(pre, "Pre Test", "")}${sc(post, "Post Test", "mint")}${lat ? sc(lat, "Latihan", "") : ""}${rem ? sc(rem, "Remedia", "") : ""}${pen ? sc(pen, "Pengayaan", "mint") : ""}</div>
    ${delta !== null ? `<p style="margin-top:20px"><b>Perubahanmu: <span class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : ""}${delta}</span></b> ${delta > 0 ? "— kamu berkembang!" : delta === 0 ? "— bertahan. Coba ulangi materi yang masih ragu." : "— tidak apa-apa, cek pembahasan dan coba lagi."}</p>` : `<p style="margin-top:20px" class="muted">Selesaikan Pre Test dan Post Test untuk melihat perkembanganmu.</p>`}</section>
    <h2>Lencanamu</h2><div class="badges">${badges.map(([i, t, on]) => `<div class="badge ${on ? "" : "off"}"><i>${i}</i>${t}</div>`).join("")}</div>`;
  if ($("#pnChange")) $("#pnChange").onclick = () => { session.peserta = null; saveSession(); nilaiView(v); };
}

/* ---------- Rekap nilai (guru & admin) ---------- */
async function loadRekap() {
  const [users, results] = await Promise.all([db.get("users"), db.get("results")]);
  return Object.entries(users || {}).map(([uid, u]) => ({ uid, nama: u.nama, kelas: u.kelas, pre: results?.[uid]?.pre, post: results?.[uid]?.post, lat: results?.[uid]?.latihan, rem: results?.[uid]?.remedia, pen: results?.[uid]?.pengayaan, mode: u.mode, anggota: u.anggota, kelompok: u.kelompok }))
    .sort((a, b) => (a.kelas || "").localeCompare(b.kelas || "") || (a.nama || "").localeCompare(b.nama || ""));
}

async function renderRekap(pane, canReset) {
  const rows = await loadRekap();
  const avg = k => { const a = rows.filter(r => r[k]).map(r => r[k].skor); return a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : "–"; };
  pane.innerHTML = `<div class="stat"><div><b>${rows.filter(r => r.mode !== "kelompok").length}</b>siswa terdaftar</div><div><b>${avg("pre")}</b>rata-rata pre test</div><div><b>${avg("post")}</b>rata-rata post test</div></div>
    <div class="row" style="margin-bottom:14px"><input type="search" id="rkFilter" placeholder="Cari nama atau kelas…" style="max-width:320px"><button class="btn sm sun" type="button" data-act="export-csv">Unduh CSV</button>${canReset ? '<button class="btn sm ghost" type="button" data-act="del-all-students">🗑️ Hapus semua data siswa</button>' : ""}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Nama</th><th>Kelas</th><th>Pre</th><th>Post</th><th>Latihan</th><th>Remedia</th><th>Pengayaan</th><th>Selisih</th>${canReset ? "<th>Aksi</th>" : ""}</tr></thead>
    <tbody>${rows.map(r => {
      const d = r.pre && r.post ? r.post.skor - r.pre.skor : null;
      return `<tr data-q="${esc((r.nama + " " + r.kelas + " " + (r.anggota || []).join(" ") + " " + (r.kelompok || "")).toLowerCase())}"><td>${esc(r.nama)}${r.kelompok ? `<br><small class="muted">Kelompok: ${esc(r.kelompok)}</small>` : ""}${r.anggota?.length ? `<ol class="anggota">${r.anggota.map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}</td><td>${esc(r.kelas)}</td><td class="num">${r.pre ? r.pre.skor : "–"}</td><td class="num">${r.post ? r.post.skor : "–"}</td><td class="num">${r.lat ? r.lat.skor : "–"}</td><td class="num">${r.rem ? r.rem.skor : "–"}</td><td class="num">${r.pen ? r.pen.skor : "–"}</td>
        <td class="${d === null ? "" : d >= 0 ? "up" : "down"}">${d === null ? "–" : (d >= 0 ? "+" : "") + d}</td>
        ${canReset ? `<td>${r.pre ? `<button class="edit danger" type="button" data-act="reset-result" data-uid="${esc(r.uid)}" data-k="pre">Reset Pre</button> ` : ""}${r.post ? `<button class="edit danger" type="button" data-act="reset-result" data-uid="${esc(r.uid)}" data-k="post">Reset Post</button> ` : ""}<button class="edit danger" type="button" data-act="del-student" data-uid="${esc(r.uid)}">🗑️ Hapus data</button></td>` : ""}</tr>`;
    }).join("") || `<tr><td colspan="9" class="muted">Belum ada siswa yang masuk.</td></tr>`}</tbody></table></div>`;
  pane._rows = rows;
  $("#rkFilter", pane).oninput = e => { const q = e.target.value.toLowerCase(); $$("tbody tr[data-q]", pane).forEach(tr => { tr.hidden = !tr.dataset.q.includes(q); }); };
  window.__rekapRows = rows;
}

/* ---------- Daftar soal ---------- */
async function renderQList(pane, canEdit, kinds = ["pre", "post", "remedia", "pengayaan", "latihan"]) {
  await loadLevels();
  const lists = await Promise.all(kinds.map(k => getQuestions(k)));
  const count = {};
  lists.flat().forEach(q => { const c = levelCode(q.tingkat) || "-"; count[c] = (count[c] || 0) + 1; });
  const block = (kind, title, arr) => `<h2>${title} <span class="chip">${arr.length} soal</span></h2>
    <div class="row" style="margin-bottom:12px"><button class="btn sm mint" type="button" data-act="add-q" data-kind="${kind}">+ Tambah soal ${KIND_LABEL[kind]}</button></div>
    ${arr.map((q, n) => `<div class="card flat" data-tk="${esc(levelCode(q.tingkat))}" style="padding:14px 18px;margin-bottom:12px"><div class="row between"><b>${n + 1}. ${esc(q.teks)}</b>
      ${canEdit ? `<span class="row"><button class="edit" type="button" data-act="edit-q" data-kind="${kind}" data-id="${esc(q.id)}">✏️</button><button class="edit danger" type="button" data-act="del-q" data-kind="${kind}" data-id="${esc(q.id)}">🗑️</button></span>` : ""}</div>
      <p style="margin:6px 0 0">${q.tingkat ? `<span class="chip">${esc(levelLabel(q.tingkat))}</span>` : ""}</p>
      <p class="muted" style="margin:6px 0 0">${q.opsi.map((o, k) => `${"ABCD"[k]}. ${esc(o)}`).join(" · ")} — kunci: <b>${"ABCD"[q.kunci]}</b> · oleh ${esc(q.oleh || "-")}</p></div>`).join("")}`;
  const head = `<section class="card" style="margin-bottom:18px"><h2>Tingkat berpikir</h2>
    <p class="muted">Jumlah soal per tingkat (semua jenis tes):</p>
    <div class="row" style="margin-bottom:12px">${LEVELS.map(l => `<span class="chip">${esc(l.kode)} ${esc(l.nama)}: <b>${count[l.kode] || 0}</b></span>`).join("")}</div>
    <div class="row"><label class="field" style="max-width:280px;margin:0"><span>Tampilkan tingkat</span><select id="qlvFilter"><option value="">Semua tingkat</option>${LEVELS.map(l => `<option value="${esc(l.kode)}">${esc(l.kode)} — ${esc(l.nama)}</option>`).join("")}</select></label>
    ${canEdit ? '<button class="btn sm sun" type="button" data-act="edit-levels">⚙️ Atur tingkat (C1–C6)</button>' : ""}</div></section>`;
  pane.innerHTML = head + kinds.map((k, i) => block(k, { pre: "Pre Test (diagnostik)", post: "Post Test (sumatif)", remedia: "Remedia", pengayaan: "Pengayaan", latihan: "Soal Lain (latihan)" }[k], lists[i])).join("");
  $("#qlvFilter", pane).onchange = e => { const f = e.target.value; $$("[data-tk]", pane).forEach(c => { c.hidden = !!f && c.dataset.tk !== f; }); };
}

function levelsForm() {
  openForm({
    title: "Atur tingkat berpikir",
    intro: "Satu baris satu tingkat, format: KODE | Nama. Contoh: C1 | Mengingat. Boleh mengganti nama, menambah, atau menghapus baris. Soal menyimpan KODE-nya, jadi mengganti nama tidak merusak soal yang sudah ada.",
    fields: [{ key: "daftar", label: "Daftar tingkat", type: "textarea", rows: 8, math: false, value: LEVELS.map(l => `${l.kode} | ${l.nama}`).join("\n"), hint: "Kosongkan semua baris lalu simpan untuk kembali ke bawaan C1–C6." }],
    onSave: async v => {
      const lines = String(v.daftar || "").split("\n").map(x => x.trim()).filter(Boolean);
      if (!lines.length) { await db.remove("questions/_tingkat"); toast("Dikembalikan ke bawaan C1–C6."); await route(); return; }
      const out = [], seen = new Set();
      for (const ln of lines) {
        const m = ln.match(/^([^|]{1,8})\|(.{1,40})$/);
        if (!m) throw new Error("Format salah: " + ln);
        const kode = m[1].trim().toUpperCase(), nama = m[2].trim();
        if (!kode || !nama || seen.has(kode)) throw new Error("Kode kosong atau ganda: " + ln);
        seen.add(kode); out.push({ kode, nama });
      }
      await db.set("questions/_tingkat", out);
      toast("Tingkat diperbarui.");
      await route();
    }
  });
}

async function questionForm(kind, q) {
  const edit = !!q;
  await loadLevels();
  openForm({
    title: edit ? "Edit soal" : `Tambah soal ${KIND_LABEL[kind]}`,
    intro: "Soal langsung muncul di halaman tes siswa.",
    fields: [
      { key: "tingkat", label: "Tingkat berpikir", type: "select", value: levelCode(q?.tingkat) || (LEVELS.find(l => l.kode === "C3") ? "C3" : LEVELS[0].kode), options: LEVELS.map(l => [l.kode, `${l.kode} — ${l.nama}`]) },
      { key: "teks", label: "Pertanyaan", type: "textarea", rows: 3, value: q?.teks },
      ...["A", "B", "C", "D"].map((L, k) => ({ key: `o${k}`, label: `Pilihan ${L}`, value: q?.opsi?.[k], math: true })),
      { key: "kunci", label: "Jawaban benar", type: "select", value: q?.kunci ?? 0, options: [[0, "A"], [1, "B"], [2, "C"], [3, "D"]] },
      { key: "bahas", label: "Pembahasan (muncul setelah tes selesai)", type: "textarea", rows: 3, value: q?.bahas }
    ],
    onSave: async v => {
      const opsi = [v.o0, v.o1, v.o2, v.o3];
      if (!v.teks || opsi.some(o => !o)) throw new Error("kosong");
      await ensureSeed(kind);
      const id = q?.id || newId();
      await db.set(`questions/${kind}/${id}`, { id, urut: q?.urut ?? Date.now(), oleh: q?.oleh || session.name, tingkat: v.tingkat, teks: v.teks, opsi, kunci: Number(v.kunci), bahas: v.bahas });
      toast(edit ? "Soal diperbarui." : "Soal ditambahkan.");
      await route();
    }
  });
}

/* ---------- Panel guru & admin ---------- */
async function vGuru(v) {
  v.innerHTML = pageHead("🧑‍🏫", "Panel Guru", "Pantau nilai, tambah soal, dan buka absensi") + `<div id="gHost"></div>`;
  tabs($("#gHost"), "guru", [
    { label: "📋 Rekap Nilai", render: p => renderRekap(p, true) },
    { label: "❓ Bank Soal", render: p => renderQList(p, true) },
    { label: "🗓️ Absensi", render: p => renderAbsensi(p) }
  ]);
}

async function vAdmin(v) {
  v.innerHTML = pageHead("🛠️", "Panel Admin", "Kendali penuh atas isi QUANTA") + `<div id="aHost"></div>`;
  tabs($("#aHost"), "admin", [
    { label: "📝 Konten", render: async p => {
      p.innerHTML = `<section class="card"><p>Tombol <b>✏️ Edit</b> muncul di setiap halaman saat kamu masuk sebagai admin. Pilih bagian yang ingin diubah:</p>
        <div class="row"><button class="btn sm" type="button" data-act="edit-beranda">Beranda</button>
        <a class="btn sm sky" href="#/cp">CP</a><a class="btn sm sky" href="#/tp">TP</a><a class="btn sm sky" href="#/atp">ATP</a>
        <a class="btn sm mint" href="#/materi">Materi</a><a class="btn sm sun" href="#/pengembang">Pengembang & DPA</a></div></section>`;
    } },
    { label: "❓ Bank Soal", render: p => renderQList(p, true) },
    { label: "🔗 Tautan", render: async p => {
      p.innerHTML = `<section class="card"><div class="stat" style="display:block">${Object.entries(C.links).map(([k, u]) => `<p><b>${esc(k)}</b>: <span class="muted">${esc(u)}</span></p>`).join("")}</div>
        <button class="btn" type="button" data-act="edit-links">Ubah tautan</button></section>`;
    } },
    { label: "📋 Nilai Siswa", render: p => renderRekap(p, true) },
    { label: "🔄 Sinkron", render: async p => {
      const L = local.read(), src = L.quanta || L;
      const ada = ["content", "foto", "questions", "absensi", "settings"].filter(k => src[k]);
      p.innerHTML = `<section class="card"><h2>${DEMO ? "🟠 Mode lokal" : "🟢 Terhubung ke Firebase"}</h2>
        <p>${DEMO ? "Firebase belum terhubung. Semua perubahan hanya tersimpan di perangkat ini dan tidak terlihat di perangkat lain. Perbaiki koneksi (lihat spanduk kuning di atas), lalu muat ulang." : "Perubahan konten, soal, dan absensi langsung terlihat di semua perangkat yang sedang membuka QUANTA."}</p>
        ${!DEMO && ada.length ? `<p class="think"><span>Data lama di perangkat ini</span>Ada data yang tersimpan lokal (${ada.join(", ")}), misalnya teks atau foto yang kamu edit sebelum Firebase terhubung. Kirim ke Firebase agar tampil di semua perangkat. Data dengan nama yang sama di Firebase akan ditimpa.</p><button class="btn" type="button" data-act="sync-local">Kirim data perangkat ini ke Firebase</button>` : ""}
        <p style="margin-top:14px"><button class="btn sky" type="button" data-act="diag">Uji koneksi dan foto</button></p><pre id="diagOut" class="diag"></pre></section>`;
    } },
    { label: "🗓️ Absensi", render: p => renderAbsensi(p) },
    { label: "🔑 Kode Guru", render: async p => {
      p.innerHTML = DEMO
        ? `<section class="card"><p>Ganti kode yang dipakai guru untuk masuk. Kode disimpan sebagai hash, bukan teks asli.</p><button class="btn" type="button" data-act="set-teacher-code">Ganti kode guru</button></section>`
        : `<section class="card"><p><b>Kode admin</b> dan <b>kode guru</b> adalah password akun Firebase (${esc(ADMIN_EMAIL)} dan ${esc(GURU_EMAIL)}).</p>
          <p><button class="btn" type="button" data-act="change-admin-code">Ganti kode admin</button></p>
          <p class="muted">Untuk mengganti kode guru: Firebase Console → Authentication → Users → hapus akun ${esc(GURU_EMAIL)}, lalu Add user dengan password baru.</p></section>`;
    } }
  ]);
}

function materiForm(m) {
  const edit = !!m;
  openForm({
    title: edit ? `Edit langkah: ${m.judul}` : "Tambah langkah materi",
    fields: [
      { key: "ikon", label: "Ikon (emoji)", value: m?.ikon || "📘" },
      { key: "judul", label: "Judul", value: m?.judul },
      { key: "fase", label: "Fase discovery learning", value: m?.fase, placeholder: "mis. Stimulasi, Pembuktian, Generalisasi" },
      { key: "isi", label: "Isi", type: "textarea", rows: 12, value: m?.isi, hint: "## judul, - daftar, **tebal**, dan \"> \" di awal baris untuk pertanyaan berpikir kritis." },
      { key: "aksi", label: "Tombol tambahan", type: "select", value: m?.aksi || "", options: [["", "Tidak ada"], ["eksplor", "Mode Eksplorasi"], ["questika", "Questika"]] },
      { key: "widget", label: "Tampilkan grafik parabola interaktif?", type: "select", value: m?.widget ? "1" : "0", options: [["1", "Ya"], ["0", "Tidak"]] }
    ],
    onSave: async v => {
      if (!v.judul || !v.isi) { toast("Judul dan isi wajib diisi.", "err"); throw new Error("kosong"); }
      await seedMateri();
      const id = m?.id || newId();
      const urut = m?.urut ?? (Math.max(-1, ...C.materi.map(x => x.urut ?? 0)) + 1);
      await db.set(`content/materi/${id}`, { id, urut, ikon: v.ikon || "📘", judul: v.judul, fase: v.fase, isi: v.isi, aksi: v.aksi, widget: v.widget === "1" });
      if (!edit) TABMEM.materi = C.materi.length;
      toast(edit ? "Materi diperbarui." : "Langkah materi ditambahkan.");
      await refresh();
    }
  });
}

/* ---------- Absensi ---------- */
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const ABS = { kelas: null, tgl: todayStr(), pane: null };
const ABS_LABEL = { masuk: "Masuk", alfa: "Alfa", izin: "Izin" };
const absTotal = (catatan, id) => {
  const t = { masuk: 0, alfa: 0, izin: 0 };
  Object.values(catatan).forEach(d => { const v = d?.[id]; if (t[v] !== undefined) t[v]++; });
  return t;
};
async function absData() {
  const kelas = (await db.get("absensi/kelas")) || {};
  const ids = Object.keys(kelas).sort((a, b) => (kelas[a].nama || "").localeCompare(kelas[b].nama || ""));
  if (!ids.includes(ABS.kelas)) ABS.kelas = ids[0] || null;
  const k = ABS.kelas ? kelas[ABS.kelas] : null;
  const catatan = k ? (await db.get(`absensi/catatan/${ABS.kelas}`)) || {} : {};
  const siswa = k ? Object.entries(k.siswa || {}).map(([id, x]) => ({ id, ...x })).sort((a, b) => (a.urut ?? 0) - (b.urut ?? 0)) : [];
  return { kelas, ids, k, catatan, siswa };
}
async function renderAbsensi(pane) {
  ABS.pane = pane;
  const { kelas, ids, k, catatan, siswa } = await absData();
  const hari = catatan[ABS.tgl] || {};
  const sum = () => {
    const c = { masuk: 0, alfa: 0, izin: 0 };
    siswa.forEach(s => { if (c[hari[s.id]] !== undefined) c[hari[s.id]]++; });
    return `Masuk ${c.masuk} · Alfa ${c.alfa} · Izin ${c.izin} · Belum diisi ${siswa.length - c.masuk - c.alfa - c.izin}`;
  };
  const rows = siswa.map((s, n) => {
    const v = hari[s.id], t = absTotal(catatan, s.id);
    const opts = ["masuk", "alfa", "izin"].map(o => `<label class="abs ${o[0]}"><input type="radio" name="r_${esc(s.id)}" value="${o}" ${v === o ? "checked" : ""}><span>${ABS_LABEL[o]}</span></label>`).join("");
    return `<tr data-id="${esc(s.id)}"><td>${n + 1}. ${esc(s.nama)}</td><td><div class="abs-opts">${opts}</div></td><td class="num" data-tot>${t.masuk}/${t.alfa}/${t.izin}</td><td><button class="edit danger" type="button" data-act="abs-hapus-siswa" data-id="${esc(s.id)}" aria-label="Hapus ${esc(s.nama)}">🗑️</button></td></tr>`;
  }).join("") || `<tr><td colspan="4" class="muted">Belum ada siswa. Klik "+ Tambah nama siswa".</td></tr>`;
  pane.innerHTML = `<section class="card"><div class="row">
      <label class="field" style="margin:0;min-width:150px"><span>Kelas</span><select id="absKelas">${ids.length ? ids.map(id => `<option value="${esc(id)}" ${id === ABS.kelas ? "selected" : ""}>${esc(kelas[id].nama)}</option>`).join("") : "<option>Belum ada kelas</option>"}</select></label>
      <label class="field" style="margin:0"><span>Tanggal</span><input id="absTgl" type="date" value="${esc(ABS.tgl)}"></label></div>
    <div class="row" style="margin-top:14px"><button class="btn sm mint" type="button" data-act="abs-kelas-baru">+ Kelas baru</button>
      ${k ? `<button class="btn sm sky" type="button" data-act="abs-tambah-siswa">+ Tambah nama siswa</button><button class="btn sm sun" type="button" data-act="abs-semua-masuk">Semua masuk</button><button class="btn sm ghost" type="button" data-act="abs-csv">Unduh rekap CSV</button>` : ""}
      ${k && isAdmin() ? `<button class="btn sm ghost" type="button" data-act="abs-hapus-kelas">🗑️ Hapus kelas</button>` : ""}</div></section>
    ${k ? `<p id="absSum" class="chip" style="margin-bottom:12px">${sum()}</p><div class="tbl-wrap"><table><thead><tr><th>Nama siswa</th><th>Kehadiran</th><th>Total M/A/I</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<section class="card"><p>Buat kelas dulu dengan tombol "+ Kelas baru", lalu masukkan nama-nama siswanya.</p></section>`}`;
  const sel = $("#absKelas", pane);
  sel.onchange = () => { ABS.kelas = sel.value; renderAbsensi(pane); };
  $("#absTgl", pane).onchange = e => { if (e.target.value) { ABS.tgl = e.target.value; renderAbsensi(pane); } };
  $$("input[type=radio]", pane).forEach(r => {
    r.onchange = async () => {
      const tr = r.closest("tr"), id = tr.dataset.id;
      try {
        await db.set(`absensi/catatan/${ABS.kelas}/${ABS.tgl}/${id}`, r.value);
        hari[id] = r.value;
        $("#absSum", pane).textContent = sum();
        const t = absTotal({ ...catatan, [ABS.tgl]: hari }, id);
        $("[data-tot]", tr).textContent = `${t.masuk}/${t.alfa}/${t.izin}`;
      } catch (e) { console.error(e); toast("Gagal menyimpan absensi.", "err"); }
    };
  });
}

/* ---------- Aksi (delegasi klik) ---------- */
const ACTIONS = {
  "edit-beranda": () => openForm({
    title: "Edit Beranda",
    fields: [{ key: "lead", label: "Kalimat sambutan", type: "textarea", rows: 3, value: C.beranda.lead }, { key: "tentang", label: "Tentang QUANTA", type: "textarea", rows: 6, value: C.beranda.tentang, hint: "Format: ## judul, - daftar, **tebal**, > pertanyaan berpikir kritis" }],
    onSave: async v => { await db.set("content/beranda", v); toast("Beranda diperbarui."); await refresh(); }
  }),
  "edit-doc": b => {
    const key = b.dataset.key;
    openForm({
      title: `Edit ${key.toUpperCase()}`,
      fields: [{ key: "t", label: "Isi", type: "textarea", rows: 14, value: C[key], hint: "Format: ## judul, - daftar, **tebal**, > pertanyaan berpikir kritis" }],
      onSave: async v => { await db.set(`content/${key}`, v.t); toast("Tersimpan."); await refresh(); }
    });
  },
  "edit-materi": b => materiForm(C.materi[Number(b.dataset.i)]),
  "add-materi": () => materiForm(null),
  "del-materi": async b => {
    if (C.materi.length <= 1) return toast("Minimal harus ada satu langkah materi.", "err");
    if (!confirm("Hapus langkah materi ini? Tindakan ini tidak bisa dibatalkan.")) return;
    await seedMateri();
    await db.remove(`content/materi/${b.dataset.id}`);
    TABMEM.materi = 0;
    toast("Langkah materi dihapus.");
    await refresh();
  },
  "move-materi": async b => {
    const i = C.materi.findIndex(m => m.id === b.dataset.id), j = i + Number(b.dataset.d);
    if (j < 0 || j >= C.materi.length) return;
    await seedMateri();
    const A = C.materi[i], B = C.materi[j];
    await db.set(`content/materi/${A.id}/urut`, j);
    await db.set(`content/materi/${B.id}/urut`, i);
    TABMEM.materi = j;
    await refresh();
  },
  "edit-dev": b => {
    const t = b.dataset.t, p = t === "utama" ? C.dev.utama : C.dev.dpa[Number(t)];
    const id = t === "utama" ? "utama" : `dpa${t}`;
    openForm({
      title: t === "utama" ? "Edit pengembang" : `Edit DPA ${Number(t) + 1}`,
      fields: [{ key: "nama", label: "Nama", value: p.nama }, { key: "peran", label: "Peran", value: p.peran }, { key: "foto", label: "Foto", type: "image", value: p.foto }, { key: "deskripsi", label: "Deskripsi", type: "textarea", rows: 5, value: p.deskripsi }],
      onSave: async v => {
        const path = t === "utama" ? "content/dev/utama" : `content/dev/dpa/${t}`;
        // Foto disimpan LANGSUNG di dalam konten (satu kali tulis), jadi ikut tersinkron ke semua perangkat.
        const meta = { nama: v.nama, peran: v.peran, deskripsi: v.deskripsi, foto: v.foto || "" };
        if (DEMO) { toast("Firebase belum terhubung (penanda 'Lokal'). Foto TIDAK dikirim ke perangkat lain. Buka #/cek lalu perbaiki koneksi.", "err"); throw new Error("mode lokal"); }
        await withTimeout(db.set(path, meta), 25000, "timeout menyimpan (koneksi lambat atau terputus)");
        if (v.foto) {
          let back;
          try { back = await publicRead(path); }
          catch (e) {
            if (e.code) { toast(`Server menolak dibaca publik (${e.message}). Periksa Rules: quanta/content harus .read true.`, "err"); throw e; }
            back = undefined; // jaringan terputus saat memeriksa: lewati pemeriksaan
          }
          if (back !== undefined && (!back || back.foto !== v.foto)) { toast("Foto belum ada di server. Coba simpan lagi.", "err"); throw new Error("foto tidak tersimpan"); }
        }
        try { await db.remove(`foto/${id}`); } catch { /* data foto lama, boleh dilewati */ }
        toast("Tersimpan dan tersinkron.");
        await refresh();
      }
    });
  },
  "edit-links": () => openForm({
    title: "Ubah tautan",
    fields: Object.entries(C.links).map(([k, u]) => ({ key: k, label: k, type: "url", value: u })),
    onSave: async v => { await db.set("content/links", v); toast("Tautan diperbarui."); await refresh(); }
  }),
  "edit-levels": () => levelsForm(),
  "add-q": b => questionForm(b.dataset.kind),
  "edit-q": async b => { const qs = await getQuestions(b.dataset.kind); questionForm(b.dataset.kind, qs.find(q => q.id === b.dataset.id)); },
  "del-q": async b => {
    if (!confirm("Hapus soal ini? Tindakan ini tidak bisa dibatalkan.")) return;
    await ensureSeed(b.dataset.kind);
    await db.remove(`questions/${b.dataset.kind}/${b.dataset.id}`);
    toast("Soal dihapus.");
    await route();
  },
  "reset-result": async b => {
    if (!confirm("Hapus nilai ini agar siswa bisa mengerjakan ulang?")) return;
    await db.remove(`results/${b.dataset.uid}/${b.dataset.k}`);
    toast("Nilai dihapus.");
    await route();
  },
  "del-student": async b => {
    if (!confirm("Hapus seluruh data siswa ini (profil dan semua nilainya)? Siswa perlu mendaftar lagi untuk masuk.")) return;
    await db.remove(`users/${b.dataset.uid}`);
    await db.remove(`results/${b.dataset.uid}`);
    toast("Data siswa dihapus.");
    await route();
  },
  "del-all-students": async () => {
    if (!confirm("Hapus SEMUA data siswa beserta nilainya? Tindakan ini tidak bisa dibatalkan.")) return;
    if (prompt("Ketik HAPUS (huruf besar) untuk melanjutkan:") !== "HAPUS") return toast("Dibatalkan.");
    await db.remove("users");
    await db.remove("results");
    toast("Semua data siswa dihapus.");
    await route();
  },
  "abs-kelas-baru": () => openForm({
    title: "Kelas baru",
    fields: [{ key: "nama", label: "Nama kelas", placeholder: "contoh: X-1" }],
    onSave: async v => {
      if (!v.nama) { toast("Isi nama kelas.", "err"); throw new Error("kosong"); }
      const id = slug(v.nama) || newId();
      if (await db.get(`absensi/kelas/${id}`)) { toast("Kelas itu sudah ada.", "err"); throw new Error("ada"); }
      await db.set(`absensi/kelas/${id}`, { nama: v.nama, dibuat: new Date().toISOString() });
      ABS.kelas = id;
      await renderAbsensi(ABS.pane);
    }
  }),
  "abs-tambah-siswa": async () => {
    const { siswa } = await absData();
    openForm({
      title: "Tambah nama siswa",
      intro: "Tulis satu nama per baris. Boleh juga tempel (paste) daftar dari Excel atau Word.",
      fields: [{ key: "daftar", label: "Daftar nama", type: "textarea", rows: 10 }],
      onSave: async v => {
        const ada = new Set(siswa.map(x => x.nama.toLowerCase()));
        const names = [...new Set(v.daftar.split("\n").map(x => x.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean))].filter(n => !ada.has(n.toLowerCase()));
        if (!names.length) { toast("Tidak ada nama baru untuk ditambahkan.", "err"); throw new Error("kosong"); }
        let urut = Math.max(-1, ...siswa.map(x => x.urut ?? 0)) + 1;
        for (const nama of names) await db.set(`absensi/kelas/${ABS.kelas}/siswa/${newId()}`, { nama, urut: urut++ });
        toast(`${names.length} nama ditambahkan.`);
        await renderAbsensi(ABS.pane);
      }
    });
  },
  "abs-hapus-siswa": async b => {
    if (!confirm("Hapus siswa ini dari daftar kelas?")) return;
    await db.remove(`absensi/kelas/${ABS.kelas}/siswa/${b.dataset.id}`);
    await renderAbsensi(ABS.pane);
  },
  "abs-semua-masuk": async () => {
    const { siswa } = await absData();
    if (!siswa.length) return;
    await db.set(`absensi/catatan/${ABS.kelas}/${ABS.tgl}`, Object.fromEntries(siswa.map(x => [x.id, "masuk"])));
    toast("Semua siswa ditandai masuk.");
    await renderAbsensi(ABS.pane);
  },
  "abs-hapus-kelas": async () => {
    if (!confirm("Hapus kelas ini beserta daftar siswa dan seluruh catatan absensinya?")) return;
    await db.remove(`absensi/kelas/${ABS.kelas}`);
    await db.remove(`absensi/catatan/${ABS.kelas}`);
    ABS.kelas = null;
    toast("Kelas dihapus.");
    await renderAbsensi(ABS.pane);
  },
  "abs-csv": async () => {
    const { catatan, siswa } = await absData();
    const dates = Object.keys(catatan).sort();
    const rows = siswa.map(x => { const t = absTotal(catatan, x.id), tot = t.masuk + t.alfa + t.izin; return [x.nama, t.masuk, t.alfa, t.izin, tot ? Math.round(t.masuk / tot * 100) + "%" : "", ...dates.map(d => ABS_LABEL[catatan[d]?.[x.id]] || "")]; });
    const csv = [["Nama", "Masuk", "Alfa", "Izin", "Kehadiran", ...dates], ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "absensi-quanta.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  },
  "sync-local": async () => {
    if (DEMO) return toast("Firebase belum terhubung.", "err");
    const L = local.read(), src = L.quanta || L;
    const keys = ["content", "foto", "questions", "absensi", "settings"].filter(k => src[k]);
    if (!keys.length) return toast("Tidak ada data lokal di perangkat ini.", "err");
    if (!confirm(`Kirim ${keys.join(", ")} dari perangkat ini ke Firebase? Data dengan nama yang sama di Firebase akan ditimpa.`)) return;
    for (const k of keys) await db.set(k, src[k]);
    toast("Data perangkat ini sudah dikirim ke Firebase.");
    await refresh();
  },
  "change-admin-code": () => openForm({
    title: "Ganti kode admin",
    fields: [{ key: "k", label: "Kode admin baru", type: "password", hint: "Minimal 8 karakter, sebaiknya campuran huruf dan angka." }],
    onSave: async v => {
      if (v.k.length < 8) { toast("Kode minimal 8 karakter.", "err"); throw new Error("pendek"); }
      await db.changePassword(v.k);
      toast("Kode admin diganti. Pakai kode baru saat masuk berikutnya.");
    }
  }),
  "diag": async () => {
    const out = $("#diagOut"), lines = [];
    const log = (ok, t) => { lines.push(`${ok ? "✅" : "❌"} ${t}`); out.textContent = lines.join("\n"); };
    out.textContent = "Menguji…";
    log(true, `Versi aplikasi: ${APP_VERSION}`);
    log(true, `Alamat halaman: ${location.origin}${location.pathname}`);
    if (DEMO) return log(false, `Mode LOKAL, Firebase tidak terhubung. ${FB_PROBLEM || ""}`);
    log(true, `Database: ${firebaseConfig.databaseURL}`);
    log(!!auth.currentUser, `Akun Firebase: ${auth.currentUser?.email || "tidak login (bukan admin)"}`);
    try { log((await db.get(`roles/${auth.currentUser.uid}`)) === "admin", "Peran admin tercatat di database"); } catch (e) { log(false, `Baca peran gagal: ${e.code || e.message}`); }
    try { await db.set("_uji/teks", "ok"); log((await db.get("_uji/teks")) === "ok", "Tulis dan baca teks kecil"); } catch (e) { return log(false, `Tulis teks gagal: ${e.code || e.message}`); }
    try {
      const big = "data:image/jpeg;base64," + "A".repeat(80000), t0 = Date.now();
      await db.set("_uji/foto", big);
      log((await db.get("_uji/foto")) === big, `Tulis dan baca data sebesar foto (80 KB), ${Date.now() - t0} md`);
    } catch (e) { log(false, `Tulis data besar gagal: ${e.code || e.message}`); }
    try { await db.remove("_uji"); log(true, "Bersihkan data uji"); } catch (e) { log(false, `Hapus gagal: ${e.code || e.message}`); }
    for (const [id, p, path] of [["utama", C.dev.utama, "content/dev/utama"], ["dpa0", C.dev.dpa[0], "content/dev/dpa/0"], ["dpa1", C.dev.dpa[1], "content/dev/dpa/1"]]) {
      try {
        const d = await publicRead(path);
        log(true, `Foto ${id} (dibaca publik seperti perangkat lain): ${d?.foto ? Math.round(d.foto.length / 1024) + " KB tersimpan di konten (tersinkron)" : p.foto ? "ada, tetapi masih di data lama (simpan ulang lewat Edit agar tersinkron)" : "belum ada"}`);
      } catch (e) { log(false, `Foto ${id}: gagal dibaca (${e.code || e.message})`); }
    }
  },
  "set-teacher-code": () => openForm({
    title: "Ganti kode guru",
    fields: [{ key: "k", label: "Kode guru baru", type: "text", hint: "Minimal 6 karakter. Bagikan hanya kepada guru." }],
    onSave: async v => {
      if (v.k.length < 6) { toast("Kode minimal 6 karakter.", "err"); throw new Error("pendek"); }
      await db.set("settings/teacherHash", await sha(v.k));
      toast("Kode guru diganti.");
    }
  }),
  "mark-done": async b => {
    const key = `quanta_prog_${session.uid}`;
    const prog = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    prog.add(b.dataset.id);
    localStorage.setItem(key, JSON.stringify([...prog]));
    b.textContent = "Sudah selesai ✓";
    const t = $$("#materiHost .tabs button")[Number(b.dataset.i)];
    if (t) t.classList.add("done");
    toast("Langkah ditandai selesai.");
  },
  "export-csv": () => {
    const rows = window.__rekapRows || [];
    const csv = ["Nama,Kelas,Anggota,Pre,Post,Latihan,Remedia,Pengayaan,Selisih", ...rows.map(r => [r.nama, r.kelas, (r.anggota || []).join("; "), r.pre?.skor ?? "", r.post?.skor ?? "", r.lat?.skor ?? "", r.rem?.skor ?? "", r.pen?.skor ?? "", r.pre && r.post ? r.post.skor - r.pre.skor : ""].map(x => `"${String(x).replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "nilai-quanta.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b || !ACTIONS[b.dataset.act]) return;
  // Penjagaan sisi tampilan; keamanan sebenarnya ada di aturan database.
  const adminOnly = ["edit-beranda", "edit-doc", "edit-materi", "edit-dev", "edit-links", "set-teacher-code", "add-materi", "del-materi", "move-materi", "sync-local", "diag", "change-admin-code"];
  if (adminOnly.includes(b.dataset.act) && !isAdmin()) return;
  const teacherActs = ["add-q", "edit-q", "del-q", "export-csv", "reset-result", "del-student", "del-all-students"];
  if ((teacherActs.includes(b.dataset.act) || b.dataset.act.startsWith("abs-")) && !isTeacher()) return;
  if (b.dataset.act === "abs-hapus-kelas" && !isAdmin()) return;
  ACTIONS[b.dataset.act](b, e);
});

/* ---------- Router ---------- */
const ROUTES = {
  beranda: { t: "Beranda", i: "🏠", r: vBeranda },
  cp: { t: "CP", i: "🎯", r: vDoc("cp", "🎯", "Capaian Pembelajaran", "Arah besar yang ingin kita capai bersama") },
  tp: { t: "TP", i: "📌", r: vDoc("tp", "📌", "Tujuan Pembelajaran", "Apa yang akan bisa kamu lakukan") },
  atp: { t: "ATP", i: "🗺️", r: vDoc("atp", "🗺️", "Alur Tujuan Pembelajaran", "Peta perjalanan belajarmu") },
  pretest: { t: "Pre Test", i: "🧭", r: vTest("pre") },
  materi: { t: "Materi", i: "📚", r: vMateri },
  video: { t: "Video", i: "🎬", r: vVideo },
  eksplorasi: { t: "Eksplorasi", i: "🔭", r: vEmbed("eksplor", "🔭", "Mode Eksplorasi", "Utak-atik, amati, kumpulkan datamu", "Ubah-ubah nilainya, amati apa yang berubah, lalu catat polanya. Jangan lupa tulis dugaanmu sebelum mencoba.") },
  questika: { t: "Questika", i: "⚔️", r: vEmbed("questika", "⚔️", "Questika", "Tantangan untuk menguji nalarmu", "Selesaikan tantangan, dan di setiap jawaban coba jelaskan alasanmu dengan kata-katamu sendiri.") },
  latihan: { t: "Latihan", i: "✍️", r: vTest("latihan") },
  posttest: { t: "Post Test", i: "🏆", r: vTest("post") },
  remedia: { t: "Remedia", i: "🩹", r: vTest("remedia") },
  pengayaan: { t: "Pengayaan", i: "🚀", r: vTest("pengayaan") },
  nilai: { t: "Nilaiku", i: "🏅", r: vNilai, role: ["siswa"] },
  pengembang: { t: "Pengembang", i: "👩‍💻", r: vDev },
  guru: { t: "Panel Guru", i: "🧑‍🏫", r: vGuru, role: ["guru", "admin"] },
  admin: { t: "Panel Admin", i: "🛠️", r: vAdmin, role: ["admin"] }
};

function renderChrome(active) {
  $("#top").hidden = false;
  const nav = $("#nav");
  nav.hidden = false;
  nav.innerHTML = Object.entries(ROUTES).filter(([, r]) => !r.role || r.role.includes(session.role))
    .map(([k, r]) => `<a href="#/${k}" class="${k === active ? "on" : ""}" ${k === active ? 'aria-current="page"' : ""}><span aria-hidden="true">${r.i}</span>${r.t}</a>`).join("");
  const sc = $("#syncChip");
  sc.className = "chip " + (DEMO ? "sync-off" : "sync-on");
  sc.innerHTML = (DEMO ? "🟠" : "🟢") + `<span class="lbl"> ${DEMO ? "Lokal" : "Tersinkron"}</span>`;
  sc.title = DEMO ? "Firebase belum terhubung: perubahan hanya tersimpan di perangkat ini." : "Terhubung ke Firebase: perubahan terlihat di semua perangkat.";
  const label = { siswa: session.mode === "kelompok" ? "Kelompok" : "Siswa", guru: "Guru", admin: "Admin" }[session.role];
  $("#whoChip").textContent = `${label}: ${session.name}${session.kelas ? " · " + session.kelas : ""}`;
}

let routing = false;
async function route() {
  if (/^#\/?cek$/.test(location.hash)) return vCek($("#view"));
  if (!session) return showLogin();
  if (routing) return;
  routing = true;
  try {
    let key = location.hash.replace(/^#\/?/, "").split("?")[0] || "beranda";
    let R = ROUTES[key];
    if (!R || (R.role && !R.role.includes(session.role))) { key = "beranda"; R = ROUTES.beranda; }
    renderChrome(key);
    const v = $("#view");
    v.innerHTML = '<p class="muted">Memuat…</p>';
    await R.r(v);
  } catch (e) {
    console.error(e);
    $("#view").innerHTML = '<section class="card"><h2>Ups, ada yang tidak berjalan</h2><p>Halaman gagal dimuat. Periksa koneksi internet lalu muat ulang.</p></section>';
  } finally { routing = false; }
}

/* ---------- Halaman cek koneksi Firebase ---------- */
async function vCek(v) {
  $("#top").hidden = true;
  $("#nav").hidden = true;
  const cfg = firebaseConfig, lines = [];
  let authM = null, auth2 = null;
  v.innerHTML = `<section class="card"><h1 style="font-size:2rem">Cek koneksi Firebase</h1>
    <p class="muted">Halaman ini menguji tiap langkah dan menampilkan kode galat aslinya. Kalau ada ❌, foto layarnya dan kirim ke Claude.</p>
    <pre id="cekOut" class="diag" style="display:block">Menguji…</pre>
    <div class="row"><button class="btn sm sun" id="cekCopy" type="button">Salin hasil</button><a class="btn sm ghost" href="#/">Kembali ke QUANTA</a></div>
    <h2 style="margin-top:22px">Uji login akun</h2>
    <p class="muted">Isi kodenya, lalu uji, untuk memastikan akun di Authentication → Users sudah dibuat.</p>
    <div class="row"><input id="cekKode" type="password" placeholder="Kode admin atau guru" style="max-width:260px"><button class="btn sm" id="cekAdmin" type="button">Uji login admin</button><button class="btn sm mint" id="cekGuru" type="button">Uji login guru</button></div>
    <pre id="cekLogin" class="diag"></pre></section>`;
  const out = $("#cekOut");
  const log = (ok, t) => { lines.push(`${ok === true ? "✅" : ok === false ? "❌" : "ℹ️"} ${t}`); out.textContent = lines.join("\n"); };
  $("#cekCopy").onclick = async () => { try { await navigator.clipboard.writeText(lines.join("\n")); toast("Hasil disalin."); } catch { toast("Tidak bisa menyalin. Foto layarnya saja.", "err"); } };
  const testLogin = async email => {
    const box = $("#cekLogin");
    box.textContent = "Menguji…";
    try {
      if (!auth2) throw new Error("langkah pengujian di atas belum berhasil");
      await authM.signInWithEmailAndPassword(auth2, email, $("#cekKode").value);
      box.textContent = `✅ Login ${email} berhasil. Akun dan kode benar.`;
      await authM.signOut(auth2);
    } catch (e) {
      const c = String(e.code || e.message);
      const hint = /invalid-credential|wrong-password/.test(c) ? "Kode salah, atau akun belum dibuat di Authentication → Users."
        : /user-not-found/.test(c) ? "Akun belum dibuat di Authentication → Users."
        : /operation-not-allowed/.test(c) ? "Aktifkan Email/Password di Authentication → Sign-in method."
        : /too-many/.test(c) ? "Terlalu banyak percobaan. Tunggu beberapa menit." : "";
      box.textContent = `❌ ${email}: ${c}\n${hint}`;
    }
  };
  $("#cekAdmin").onclick = () => testLogin(ADMIN_EMAIL);
  $("#cekGuru").onclick = () => testLogin(GURU_EMAIL);

  log(null, `Versi: ${APP_VERSION} | Halaman: ${location.origin}${location.pathname}`);
  const keyOk = !!cfg.apiKey && !String(cfg.apiKey).startsWith("ISI_");
  log(keyOk, keyOk ? `Config terbaca: apiKey ${String(cfg.apiKey).slice(0, 8)}…, projectId ${cfg.projectId}` : "Config belum terbaca. Isi blok window.QUANTA_FIREBASE di index.html.");
  log(!!cfg.databaseURL, `databaseURL: ${cfg.databaseURL || "(kosong)"}`);
  if (!keyOk) return;
  const mods = {};
  for (const n of ["app", "auth", "database"]) {
    try { mods[n] = await withTimeout(import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${n}.js`), 15000, "timeout"); log(true, `Memuat pustaka firebase-${n}`); }
    catch (e) { return log(false, `Memuat firebase-${n} gagal (${e.message}). Periksa internet, ekstensi pemblokir iklan, atau coba browser lain.`); }
  }
  let a;
  try { a = mods.app.initializeApp(cfg, "cek-" + Date.now()); log(true, "initializeApp"); }
  catch (e) { return log(false, `initializeApp gagal: ${e.message}. Biasanya ada isi config yang salah ketik.`); }
  authM = mods.auth;
  auth2 = authM.getAuth(a);
  log(null, "Siswa tidak perlu login Firebase. Hanya guru dan admin memakai akun (uji di bawah).");
  const dbi = mods.database.getDatabase(a), M = mods.database;
  try { await withTimeout(M.get(M.ref(dbi, "quanta/ping")), 10000, "timeout"); log(true, "Membaca database (quanta/ping)"); }
  catch (e) { log(false, `Membaca database gagal: ${e.code || e.message}. Timeout berarti databaseURL salah, database belum dibuat, atau internet putus. PERMISSION_DENIED berarti Rules menolak.`); }
  try { await withTimeout(M.set(M.ref(dbi, "quanta/_cek"), Date.now()), 10000, "timeout"); await M.remove(M.ref(dbi, "quanta/_cek")); log(null, "Menulis sebagai siswa diizinkan, artinya Rules masih terbuka untuk semua orang. Pasang aturan-firebase.json."); }
  catch (e) { log(null, `Menulis sebagai siswa ditolak (${e.code || e.message}). Ini normal bila Rules sudah dibatasi.`); }
  log(null, "Selesai. Bila semua ✅ tetapi QUANTA tetap 🟠 Lokal, buka ulang dengan Ctrl+Shift+R.");
}

/* ---------- Mulai ---------- */
$("#btnLogout").onclick = logout;
window.addEventListener("hashchange", route);
const CONTENT_ROUTES = ["beranda", "cp", "tp", "atp", "materi", "video", "eksplorasi", "questika", "pengembang"];

/* Spanduk peringatan bila Firebase gagal terhubung (aplikasi tetap jalan dalam mode lokal) */
function explainFirebase(e) {
  const m = String(e?.code || e?.message || e);
  if (/operation-not-allowed|admin-restricted/i.test(m)) return 'Metode masuk Email/Password belum diaktifkan. Buka Firebase Console → Authentication → Sign-in method, lalu aktifkan "Email/Password".';
  if (/configuration-not-found/i.test(m)) return "Authentication belum diaktifkan. Buka Firebase Console → Authentication → klik Get started.";
  if (/permission/i.test(m)) return "Rules Realtime Database menolak akses. Pastikan isi aturan-firebase.json sudah dipasang dan di-Publish, dan akun admin/guru sudah dibuat di Authentication.";
  if (/timeout|offline/i.test(m)) return "Database tidak merespons dalam beberapa detik. Pastikan internet aktif, Realtime Database sudah dibuat (bukan hanya Firestore), dan databaseURL benar.";
  return "Pustaka Firebase tidak bisa dimuat. Periksa internet atau coba browser lain. (" + m.slice(0, 120) + ")";
}
function showBanner(msg) {
  const d = document.createElement("div");
  d.className = "banner";
  d.setAttribute("role", "alert");
  d.innerHTML = `<b>⚠️ Firebase belum terhubung.</b> Untuk sementara QUANTA memakai penyimpanan lokal (data hanya ada di perangkat ini, tidak dibagikan ke guru atau siswa lain). <span></span> <a class="btn sm sky" href="#/cek">Cek koneksi</a> <button class="btn sm ghost" type="button">Muat ulang</button>`;
  $("span", d).textContent = msg;
  $("button", d).onclick = () => location.reload();
  document.body.prepend(d);
}

(async function init() {
  let fbProblem = DEMO ? "Konfigurasi Firebase belum terbaca. Isi blok window.QUANTA_FIREBASE di index.html (apiKey, databaseURL, dst.) dengan config dari Firebase Console, lalu upload ulang index.html." : null;
  try {
    await withTimeout(db.init(), 12000, "timeout memuat Firebase");
    await withTimeout(db.check(), 9000, "timeout");
  } catch (e) {
    console.error("Firebase:", e);
    DEMO = true;
    fbProblem = explainFirebase(e) + ` [kode: ${String(e?.code || e?.message || e).slice(0, 80)}]`;
  }
  FB_PROBLEM = fbProblem;
  if (fbProblem) showBanner(fbProblem);
  if (!DEMO && session && session.role !== "siswa" && !auth.currentUser) {
    sessionStorage.removeItem("quanta_session"); sessionStorage.removeItem("quanta_last"); session = null; // login Firebase tidak ada lagi
  }
  const ver = $("#ver");
  if (ver) ver.textContent = ` · v${APP_VERSION} · ${DEMO ? "mode lokal" : "Firebase"}`;
  try { await loadContent(); } catch (e) { console.error(e); }
  db.listen("content", async v => {
    const j = JSON.stringify(v || {});
    if (j === lastContentJson) return;
    lastContentJson = j;
    applyContent(v);
    await loadFotos();
    if (Date.now() - lastOwnWrite < 3000) return; // perubahan dari perangkat ini sendiri
    const key = location.hash.replace(/^#\/?/, "").split("?")[0] || "beranda";
    if (session && !$("#modalRoot").innerHTML && CONTENT_ROUTES.includes(key)) { route(); toast("Konten diperbarui oleh admin."); }
  });
  if (session && !sessionStorage.getItem("quanta_last")) touch();
  checkIdle();
  if (DEMO) console.info("QUANTA berjalan dalam MODE LOKAL.");
  route();
})();
typesetSoon();
