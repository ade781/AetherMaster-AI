# AetherMaster AI

> Platform RPG visual novel berbasis web dengan graf cerita bercabang (DAG), sistem pertarungan taktis berbasis aturan D&D 5E, orkestrasi narasi Google Gemini beserta fallback deterministik, dan sintesis audio prosedural.

---

## Ringkasan Proyek

AetherMaster AI menggabungkan narasi cerita interaktif dengan mekanisme role-playing game (RPG) berbasis web. Alur cerita dikelola menggunakan graf terarah (*Directed Acyclic Graph* atau DAG), sehingga setiap pilihan yang diambil pemain membentuk cabang petualangan yang dapat ditinjau kembali atau diputar balik (*rewind*).

Sistem ini dirancang untuk bekerja secara adaptif: saat kunci API Google Gemini tersedia, kelanjutan cerita dan konsekuensi tindakan dianalisis secara dinamis. Jika koneksi atau kuota API tidak tersedia, sistem secara otomatis mengalihkan alur ke *deterministic fallback engine* tanpa memutus jalannya permainan.

---

## Arsitektur dan Teknologi

### Backend
* **Runtime**: Node.js dengan framework Express.js
* **Basis Data & ORM**: PostgreSQL dan MySQL melalui Sequelize ORM
* **Validasi Skema**: Zod untuk verifikasi integritas data dan payload naratif
* **AI & Suara**: SDK `@google/genai` untuk penalaran narasi dan `msedge-tts` untuk sintesis vokal
* **Keamanan**: Helmet, CORS, Express Rate Limit, serta redaksi otomatis token pada logger

### Frontend
* **Framework**: React 18 dengan Vite dan Tailwind CSS
* **Audio Engine**: Prosedural Web Audio API synthesizer (tanpa file audio eksternal) dan Web Speech API fallback
* **State Management**: React Context (`GameContext`) tipis berbasis *single source of truth*

### Deployment
* Dukungan konfigurasi Vercel untuk aplikasi satu halaman (SPA) dan serverless endpoint (`api/index.js`).

---

## Fitur Utama

### Narasi Bercabang dan Fallback Deterministik
Alur cerita dan konsekuensi tindakan dianalisis oleh AI dengan memperhitungkan atribut karakter, riwayat adegan, dan fakta dunia (*world facts*). Skema data kanonikal memastikan perubahan status (`hpChange`, `manaChange`, `goldChange`, `receivedItemId`, `consumedItemId`) selalu terikat pada batasan numerik yang valid. Jika panggilan API eksternal gagal, sistem fallback lokal memastikan adegan berikutnya tetap terbentuk secara konsisten.

### Panggung Visual Novel dan Pertarungan Taktis D&D 5E
Antarmuka visual novel menyajikan latar panggung modular, potret ekspresi NPC, teks dialog dengan efek *typewriter*, objektif misi (*SceneMissionCodex*), dan dek pilihan aksi. Modul pertempuran mengevaluasi kalkulasi Armor Class (AC), modifier atribut, lemparan dadu D20, serta penggunaan aksi dan sihir di sisi server (*server-authoritative*) untuk mencegah manipulasi status.

### Graf Cerita Bercabang (Story DAG) dan Fitur Rewind
Setiap pilihan pemain menghasilkan simpul baru (*StoryNode*) di dalam graf cerita. Melalui modal *Story Tree*, pemain dapat melihat peta keputusan dan melakukan *rewind* ke titik persimpangan sebelumnya. Seluruh data kondisi karakter (HP, mana, emas, dan inventaris) akan dipulihkan sesuai *snapshot* simpul yang dipilih.

### Memori Dunia Persisten (World Facts)
Sistem mencatat fakta dunia sepanjang petualangan, mencakup pilihan moral, rahasia yang ditemukan, relasi NPC, dan reputasi faksi. Catatan ini tersimpan di basis data dan digunakan kembali oleh narator untuk menentukan cabang cerita di babak berikutnya.

### Sintesis Audio Prosedural dan Narasi Suara
Efek suara (benturan senjata, sihir, interaksi tombol, dan detak jantung saat HP kritis di bawah 20%) dibangkitkan secara prosedural lewat Web Audio API browser. Pendekatan ini menghilangkan kebutuhan unduhan aset suara dan meminimalkan latensi. Dialog narasi dibacakan menggunakan Microsoft Edge Neural TTS dengan fallback otomatis ke Web Speech API bawaan peramban.

### Penyimpanan Multi-Slot dan Cadangan JSON
Tersedia empat slot penyimpanan:
* Slot 0: Penyimpanan otomatis (*auto save*) pada setiap pergantian babak atau persimpangan penting.
* Slot 1 sampai 3: Penyimpanan mandiri (*manual save*) yang mencatat ringkasan level, lokasi, waktu simpan, dan status HP.
* Ekspor dan Impor JSON: Pemain dapat mengunduh berkas progres permainan ke komputer lokal atau memulihkannya kembali dengan validasi skema sebelum data dimuat ke memori.

---

## Struktur Repositori

```
AetherMaster AI/
├── api/                      # Entry point serverless untuk deployment Vercel
├── backend/                  # Server Express.js dan REST API
│   ├── src/
│   │   ├── config/           # Konfigurasi database dan Sequelize ORM
│   │   ├── controllers/      # Controller tipis untuk routing HTTP
│   │   ├── engine/           # State machine, combat engine D&D 5E, stat calculator
│   │   ├── models/           # Definisi model Sequelize (Campaign, Character, StoryNode, dll.)
│   │   ├── repositories/     # Abstraksi akses data (Item, NPC, Location, WorldFact)
│   │   ├── routes/           # Endpoint REST API dan rate limiter
│   │   ├── services/         # Layanan domain (story, combat, saveLoad, narrative)
│   │   └── utils/            # Helper logger dan skema kanonikal
│   └── tests/                # 51 skrip pengujian otomatis backend
├── frontend/                 # Aplikasi web klien (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Komponen Visual Novel Stage, Combat Stage, HUD, dan Modal
│   │   ├── services/         # Klien API terpusat dan synthesizer Web Audio
│   │   ├── store/            # GameContext untuk orkestrasi status klien
│   │   └── utils/            # Helper kalkulasi RPG dan penanganan error terstandar
│   ├── tests/                # 11 skrip pengujian otomatis frontend
│   └── public/               # Aset statis visual latar dan potret karakter
├── docs/                     # Arsip laporan tugas akhir dan dokumen perencanaan
└── package.json              # Skrip orkestrasi monorepo
```

---

## Panduan Instalasi dan Penggunaan

### Prasyarat Sistem
* Node.js versi 18.x atau versi yang lebih baru
* npm versi 9.x atau versi yang lebih baru
* Basis data PostgreSQL atau MySQL (opsional jika menguji alur fallback tanpa persistensi lokal)

### 1. Pemasangan Dependensi
Jalankan perintah berikut di direktori utama untuk memasang dependensi root, backend, dan frontend secara bersamaan:

```bash
npm run install:all
```

### 2. Pengaturan Variabel Lingkungan
Salin berkas contoh konfigurasi di folder `backend/`:

```bash
cp backend/.env.example backend/.env
```

Sesuaikan nilai di dalam `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Konfigurasi Basis Data (opsi URL untuk PostgreSQL cloud)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Atau opsi parameter terpisah (contoh MySQL lokal)
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASS=
# DB_NAME=ai_dungeon_vtt

# Kunci API Google Gemini (opsional, sistem menggunakan fallback jika dikosongkan)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Menjalankan Server Pengembangan
Jalankan backend dan frontend secara bersamaan:

```bash
npm run dev
```

* Klien Frontend: http://localhost:5173
* API Backend: http://localhost:5000

Jika ingin menjalankan secara terpisah:
* Backend saja: `npm run dev:backend`
* Frontend saja: `npm run dev:frontend`

---

## Pengujian Otomatis

Repositori ini menyertakan 69 pengujian otomatis (54 pada backend dan 15 pada frontend) yang menggunakan test runner bawaan Node.js tanpa dependensi pengujian eksternal:

```bash
# Menjalankan seluruh pengujian (backend dan frontend)
npm test

# Menjalankan pengujian backend saja
npm run test:backend

# Menjalankan pengujian frontend saja
npm run test:frontend
```

Cakupan pengujian mencakup:
* Logika resolusi aksi dan snapshot state
* Batasan invarian status (HP, mana, reputasi, level)
* Validasi kontrak skema kanonikal save/load dan isolasi slot
* Orkestrasi autosave, pencegahan konkurensi, dan penjadwalan debounce
* Redaksi kredensial rahasia pada logger backend
* Penanganan aksi di luar konteks (*out-of-context action handling*)
* Perhitungan modifier D&D 5E dan penanganan error di frontend

---

## Kontrol Antarmuka

* **Audio**: Tombol di pojok antarmuka untuk mengatur suara efek dan latar suasana.
* **Narator**: Tombol vokal untuk mengaktifkan pembacaan teks dialog secara bersuara.
* **Inventaris (Backpack)**: Membuka laci item untuk melihat deskripsi dan menggunakan ramuan.
* **Pohon Cerita (Story Tree)**: Membuka visualisasi cabang keputusan dan memicu proses rewind ke titik cerita sebelumnya.
* **Simpan / Muat**: Mengakses slot 0 (autosave), slot 1 sampai 3 (manual save), serta menu ekspor/impor berkas JSON.
* **Skip Dialog**: Mengklik kotak teks cerita atau tombol terkait untuk menampilkan dialog secara instan tanpa menunggu animasi ketikan.

---

## Lisensi dan Pengembang

* **Pengembang**: Ade Saputra (@ade781) dan Tim AetherMaster AI
* **Lisensi**: Proyek riset terbuka dan tugas akhir, terbuka untuk keperluan akademik dan portofolio.
