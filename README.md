# AetherMaster AI

> Visual novel RPG berbasis web dengan cerita bercabang, pertarungan taktis bergaya D&D 5E, narasi berbantuan Google Gemini, dan fallback deterministik.

AetherMaster AI adalah proyek visual novel interaktif yang menggabungkan narasi bercabang dengan sistem RPG. Setiap keputusan pemain memengaruhi keadaan karakter, fakta dunia, relasi NPC, reputasi faksi, serta jalur cerita berikutnya.

Sistem dirancang untuk tetap dapat dimainkan tanpa layanan AI eksternal. Ketika `GEMINI_API_KEY` tersedia, Google Gemini membantu menghasilkan kelanjutan narasi dan konsekuensi aksi. Jika API tidak tersedia, gagal, atau mencapai batas kuota, engine menggunakan resolusi aksi dan narasi fallback yang deterministik.

## Fitur Utama

- **Cerita bercabang berbasis Story DAG** — pilihan pemain membentuk simpul dan cabang cerita baru.
- **Narasi adaptif** — mempertimbangkan atribut karakter, riwayat adegan, dan fakta dunia.
- **Fallback deterministik** — permainan tetap berjalan tanpa API Gemini.
- **Pertarungan taktis** — resolusi aksi menggunakan aturan dan modifier bergaya D&D 5E.
- **Memori dunia persisten** — pilihan moral, rahasia, relasi NPC, dan reputasi dapat digunakan kembali oleh narator.
- **Visual novel stage** — latar modular, potret ekspresi NPC, dialog typewriter, objektif misi, dan dek pilihan aksi.
- **Story Tree dan rewind** — melihat peta keputusan serta kembali ke titik cerita sebelumnya.
- **Audio prosedural** — efek suara dihasilkan melalui Web Audio API tanpa file audio eksternal.
- **Narasi suara** — dukungan sintesis suara melalui backend dan fallback Web Speech API.
- **Multi-slot save/load** — satu slot autosave, tiga slot manual, serta ekspor/impor progres JSON.
- **Validasi dan keamanan** — payload divalidasi dengan Zod; backend menggunakan Helmet, CORS, rate limiting, dan redaksi kredensial pada logger.

## Arsitektur

### Backend

- Node.js dan Express.js
- Sequelize ORM
- MySQL atau PostgreSQL
- Zod untuk validasi kontrak data
- `@google/genai` untuk orkestrasi narasi AI
- `msedge-tts` untuk sintesis suara
- Engine state, combat, save/load, story, dan narrative service

### Frontend

- React 18 dan Vite
- Tailwind CSS
- React Context melalui `GameContext` sebagai sumber state utama
- Framer Motion dan Lucide React untuk interaksi visual
- Web Audio API untuk synthesizer suara prosedural
- Web Speech API sebagai fallback pembacaan dialog

### Deployment

Root project menyediakan konfigurasi build untuk frontend dan deployment SPA/serverless melalui Vercel. Endpoint serverless tersedia melalui `api/index.js`.

## Struktur Repositori

```text
AetherMaster-AI/
├── api/                      # Entry point serverless untuk deployment Vercel
├── backend/                  # Server Express.js dan REST API
│   ├── src/
│   │   ├── config/           # Konfigurasi database dan Sequelize
│   │   ├── controllers/      # Controller HTTP
│   │   ├── engine/           # State machine, combat engine, dan kalkulator stat
│   │   ├── models/           # Model Campaign, Character, StoryNode, dan lainnya
│   │   ├── repositories/     # Abstraksi akses data domain
│   │   ├── routes/            # Endpoint REST API dan rate limiter
│   │   ├── services/          # Story, combat, save/load, dan narrative service
│   │   └── utils/             # Logger, schema, dan helper umum
│   └── tests/                # Pengujian otomatis backend
├── frontend/                 # Aplikasi React + Vite
│   ├── src/
│   │   ├── components/       # Visual novel stage, combat stage, HUD, dan modal
│   │   ├── services/         # API client dan audio synthesizer
│   │   ├── store/             # GameContext dan orkestrasi state
│   │   └── utils/             # Helper RPG dan penanganan error
│   ├── tests/                # Pengujian otomatis frontend
│   └── public/               # Aset statis
├── docs/                     # Dokumentasi dan arsip perencanaan
└── package.json              # Skrip orkestrasi monorepo
```

## Persyaratan

- Node.js 18 atau lebih baru
- npm 9 atau lebih baru
- MySQL atau PostgreSQL untuk persistensi data
- API key Google Gemini (opsional; tanpa key, fallback deterministik tetap digunakan)

## Instalasi

### 1. Pasang seluruh dependensi

Dari direktori root repository:

```bash
npm run install:all
```

### 2. Konfigurasi environment

Salin contoh konfigurasi backend:

```bash
cp backend/.env.example backend/.env
```

Sesuaikan nilai di `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Konfigurasi MySQL
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=ai_dungeon_vtt

# Opsional: aktifkan narasi berbantuan Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

Pastikan database pada `DB_NAME` sudah tersedia sebelum menjalankan backend. Jika menggunakan PostgreSQL, sesuaikan dialect, driver, dan parameter koneksi berdasarkan konfigurasi Sequelize di repository.

### 3. Jalankan mode pengembangan

Menjalankan backend dan frontend secara bersamaan:

```bash
npm run dev
```

Alamat default:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

Menjalankan service secara terpisah:

```bash
npm run dev:backend
npm run dev:frontend
```

## Skrip NPM

| Perintah | Keterangan |
| --- | --- |
| `npm run install:all` | Memasang dependensi root, backend, dan frontend |
| `npm run dev` | Menjalankan backend dan frontend bersamaan |
| `npm run dev:backend` | Menjalankan backend dalam mode watch |
| `npm run dev:frontend` | Menjalankan Vite development server |
| `npm test` | Menjalankan seluruh pengujian |
| `npm run test:backend` | Menjalankan pengujian backend |
| `npm run test:frontend` | Menjalankan pengujian frontend |
| `npm run build` | Membuat production build frontend |
| `npm run vercel-build` | Build yang digunakan oleh Vercel |
| `npm run world:architect` | Menjalankan utilitas World Architect |

## Pengujian

Pengujian menggunakan test runner bawaan Node.js sehingga tidak memerlukan framework pengujian eksternal. Untuk menjalankan seluruh suite:

```bash
npm test
```

Pengujian mencakup area berikut:

- Resolusi aksi dan snapshot state
- Invariant HP, mana, reputasi, dan level
- Validasi kontrak save/load dan isolasi slot
- Autosave, debounce, serta pencegahan konkurensi
- Redaksi kredensial rahasia pada logger
- Penanganan aksi di luar konteks
- Perhitungan modifier D&D 5E
- Integrasi controller, narrative service, dan game state

Backend juga menyediakan perintah tambahan:

```bash
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix backend run lint
```

## Kontrol Antarmuka

- **Audio** — mengatur efek suara dan suasana.
- **Narator** — mengaktifkan pembacaan dialog secara bersuara.
- **Inventaris** — melihat item dan menggunakan ramuan.
- **Story Tree** — melihat cabang keputusan dan melakukan rewind.
- **Simpan/Muat** — mengelola autosave, manual save, dan cadangan JSON.
- **Skip Dialog** — melewati animasi typewriter dan menampilkan dialog secara penuh.

## Model Fallback dan Keamanan

API Gemini bersifat opsional. Aplikasi tidak boleh menganggap respons AI selalu tersedia atau valid; hasil narasi dan perubahan state harus melewati validasi kontrak sebelum diterapkan. Jika terjadi error jaringan, kuota habis, atau output tidak sesuai skema, sistem menggunakan jalur fallback deterministik.

Jangan commit file `.env` atau kredensial API ke repository. Gunakan environment variable pada lingkungan lokal dan deployment.

## Lisensi dan Pengembang

- **Pengembang**: Ade Saputra (`@ade781`) dan Tim AetherMaster AI
- **Lisensi**: Proyek riset terbuka dan tugas akhir untuk keperluan akademik serta portofolio.
