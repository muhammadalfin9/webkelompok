Mantap! Berikut ringkasan **alur kerja** dan **fitur utama** web “pembuat kelompok” (HTML–CSS–JS) dengan **fitur spin**.

# Alur Kerja (Workflow)

1. **Input data**

* Textarea “Nama anggota” → 1 nama per baris (bisa paste massal).
* Pilih mode: **Jumlah Kelompok** *atau* **Ukuran Kelompok**.
* Opsi: hapus duplikat, buang baris kosong, pakai **seed** acak (hasil bisa direplikasi).

2. **Validasi cepat**

* Minimal 1 anggota, dan parameter pembagian valid.
* Tampilkan error inline (ARIA live) tanpa pop-up.

3. **Proses & Distribusi**

* Normal mode: Fisher–Yates **shuffle** (jangan `sort(Math.random)`).
* **Distribusi seimbang** (round-robin) → selisih ukuran antarkelompok ≤ 1.
* Simpan state hasil ke `localStorage` (untuk Undo/riwayat).

4. **Render hasil**

* Kartu “Kelompok 1, 2, …” dalam grid responsif.
* Aksi cepat: **Copy**, **Download CSV/JSON**, **Print**, **Re-shuffle**, **Undo/Redo**.

5. **Spin Mode (opsional, interaktif)**

* Aktifkan tombol **SPIN** untuk mengundi penempatan satu per satu:

  * Putar roda (roulette) berisi **nama yang belum ditempatkan**.
  * Hasil spin → **ditempatkan** ke kelompok berikutnya (round-robin) atau ke kelompok dengan anggota paling sedikit (balance).
  * Animasi + suara klik; highlight kartu kelompok yang menerima anggota.
* Bisa **Auto-Spin** sampai selesai atau manual satu per satu.

6. **Berbagi**

* **Share link** via `URLSearchParams` (termasuk seed & opsi). Buka link → form auto-terisi → hasil sama jika seed sama.

---

# Fitur Utama

* **Form pintar**: jumlah kelompok/ukuran kelompok (toggle), seed, hapus duplikat, trim baris kosong.
* **Algoritma acak tepercaya**: Fisher–Yates + **seeded RNG** untuk hasil konsisten.
* **Distribusi adil**: round-robin + penanganan sisa.
* **Spin Mode**:

  * Roda nama (canvas/SVG) + easing + indikator jatuh.
  * **Auto-Spin** & **Manual Spin**.
  * Opsi target: round-robin / kelompok terkecil / kelompok tertentu (dropdown).
* **Aksi hasil**: Copy, CSV/JSON, Print stylesheet.
* **Riwayat & Undo/Redo** via `localStorage`.
* **Share link tanpa backend**.
* **Aksesibilitas & UX**: keyboard-friendly, ARIA live, dark mode (CSS variables), performa cepat untuk ratusan nama.

---

# Alur “Spin Mode” (detail singkat)

1. Kumpulkan `pool = namaBelumTerpasang`.
2. Tekan **Spin** → kunci tombol, jalankan animasi roda (durasi 3–5s).
3. Tentukan pemenang via RNG **sebelum animasi berakhir** (agar sinkron).
4. Tempatkan pemenang ke kelompok (round-robin atau “kelompok terkecil”).
5. Update UI: hapus pemenang dari roda, highlight kartu kelompok, bunyi “ding”.
6. Jika **Auto-Spin**: lanjut ke langkah 2 sampai pool kosong.

---

# Arsitektur Sederhana

* **HTML**: textarea nama, input angka, toggle mode, seed, tombol Generate/Reshuffle/Spin/Auto-Spin/Undo/Redo/Copy/CSV/JSON/Print, kanvas/SVG untuk roda.
* **CSS**: grid kartu, transisi halus, dark mode via `data-theme`.
* **JS (modular)**:

  * `parseNames()`, `validate(opts)`, `shuffle(arr, rng)`, `distribute(arr, opts)`.
  * `renderGroups(groups)`, `renderWheel(pool)`.
  * `spinOnce()`, `autoSpinLoop()`.
  * `saveState()`, `loadState()`, `undo()`, `redo()`.
  * `encodeToURL()/decodeFromURL()`.

---

# Pseudocode Inti

```js
function generate() {
  let names = parseNames(textarea.value);       // trim, filter kosong
  if (opts.removeDup) names = [...new Set(names)];
  validate(names, opts);

  const rng = opts.seed ? seededRNG(opts.seed) : Math.random;
  const shuffled = fisherYates(names, rng);

  state.groups = distribute(shuffled, opts);    // round-robin/balance
  state.pool = [];                              // kosongkan pool (non-spin)
  renderGroups(state.groups);
  saveState();
}

function startSpinMode() {
  let names = parseNames(textarea.value);
  if (opts.removeDup) names = [...new Set(names)];
  validate(names, opts);

  state.groups = makeEmptyGroups(opts);
  state.pool = names.slice();                   // semua nama ke roda
  renderGroups(state.groups);
  renderWheel(state.pool);
  saveState();
}

async function spinOnce() {
  if (state.pool.length === 0) return;

  const rng = opts.seed ? seededRNG(nextSeed()) : Math.random;
  const winnerIdx = Math.floor(rng() * state.pool.length);
  const winner = state.pool[winnerIdx];

  await animateWheelSelect(winner);             // sinkron dgn pemenang

  const target = pickTargetGroup(state.groups, opts); // rr / smallest
  state.groups[target].push(winner);
  state.pool.splice(winnerIdx, 1);

  renderGroups(state.groups);
  renderWheel(state.pool);
  saveState();
}
```

