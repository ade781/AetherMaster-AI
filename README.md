# ⚔️ AetherMaster AI

> **Interactive Visual Novel RPG & Adaptive Narrative Engine**  
> Menggabungkan pengalaman visual novel fantasi interaktif dengan kecerdasan narasi bertenaga AI (Google Gemini), graf percabangan skenario terarah (*Directed Acyclic Graph*), persistensi dunia, dan sintesis audio real-time.

---

## 🌟 Fitur Utama

### 1. 📖 AI Narrative Dungeon Master
* Alur cerita dan konsekuensi tindakan dianalisis secara dinamis oleh AI (Google Gemini) dengan mempertimbangkan atribut karakter, riwayat adegan, dan fakta dunia (*WorldFacts*).
* Dilengkapi **Deterministic Fallback Engine** berkecepatan tinggi yang menjamin alur permainan tetap berjalan mulus meskipun tanpa koneksi API eksternal.

### 2. 🎭 Visual Novel Stage & Turn-Based Encounters
* Antarmuka panggung visual novel dengan potret karakter beresolusi tinggi, latar lokasi tematik, kotak dialog sastrawi berkecepatan dinamis (*typewriter*), dan efek transisi sinematik.
* Interaksi pertemuan taktis berbasis aturan RPG (D20 skill checks, perhitungan stat STR/DEX/CON/INT/WIS/CHA, serta sistem HP & Mana).

### 3. 🌿 Pohon Narasi Bercabang (*Story DAG*) & Fitur Rewind
* Setiap pilihan pemain membentuk simpul baru (*StoryNode*) dalam struktur *Directed Acyclic Graph* (DAG).
* **Story Tree Modal**: Pemain dapat meninjau peta keputusan kapan saja dan melakukan *Rewind* ke persimpangan sebelumnya lengkap dengan pemulihan *snapshot* kondisi karakter (HP, Mana, Emas, dan Inventaris).

### 4. 🧠 Persistent World State (*World Facts*)
* Sistem memori jangka panjang yang mencatat pilihan moral, rahasia yang terungkap, status reputasi faksi, dan relasi NPC sepanjang petualangan.

### 5. 🔊 Hybrid Audio System
* **Procedural Web Audio SFX**: Seluruh efek suara benturan senjata, pulsa detak jantung darurat, klik antarmuka, dan sihir dibangkitkan secara prosedural langsung via Web Audio API browser (0ms latency, zero extra bandwidth).
* **Ambient Soundscapes**: Lapisan audio suasana dinamis yang menyesuaikan latar panggung aktif.
* **Neural Voice Narration**: Pembacaan dialog ekspresif dengan Microsoft Edge Neural TTS dan fallback otomatis ke browser Web Speech API.

### 6. 💾 Multi-Slot Save & Load (4 Slot)
* **Slot 0 (Auto Save)**: Tersimpan otomatis pada setiap transisi babak dan persimpangan adegan penting.
* **Slot 1–3 (Manual Saves)**: Tiga slot penyimpanan mandiri dengan cuplikan adegan, timestamp, dan pratinjau status karakter.
* **Ekspor & Impor JSON**: Kemampuan mencadangkan dan memindahkan progres permainan antarperangkat secara aman.

---

## 🏗️ Struktur Repositori

```
AetherMaster AI/
├── backend/                  # Server Node.js & REST API
│   ├── src/
│   │   ├── config/           # Konfigurasi Database (PostgreSQL / MySQL) & Sequelize ORM
│   │   ├── controllers/      # REST API handler (Story, Character, Campaign, Save/Load)
│   │   ├── engine/           # State engine, D20 check, & rule resolver
│   │   ├── models/           # Skema Sequelize (Campaign, Character, GameSession, StoryNode, dll)
│   │   ├── repositories/     # Abstraksi akses basis data
│   │   └── services/         # Integrasi LLM (Gemini 2.5 Flash), Edge TTS, & Fallback Engine
│   └── tests/                # Automated integration tests
├── frontend/                 # Web Client SPA (React 18 + Vite)
│   ├── src/
│   │   ├── components/       # VN Stage, HUD, Modals, Audio Controls, Story Tree
│   │   ├── services/         # Web Audio API Synthesizer & Speech synthesis
│   │   └── store/            # GameContext (State Management)
│   └── public/assets/        # Aset visual latar panggung, potret NPC, dan ikon item
└── docs/                     # Dokumentasi arsitektur dan laporan akademik
    └── ARCHITECTURE.md       # Spesifikasi arsitektur teknis lengkap
```

Untuk rincian arsitektur mendalam, silakan baca [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
* **Node.js**: Versi `18.x` atau lebih baru
* **NPM**: Versi `9.x` atau lebih baru
* Basis data PostgreSQL (disarankan untuk cloud) atau MySQL (lokal)

### 1. Pasang Seluruh Dependensi
Jalankan satu perintah berikut di root folder untuk memasang seluruh dependensi (root, backend, frontend):
```bash
npm run install:all
```

### 2. Konfigurasi Environment Variable
Salin contoh berkas konfigurasi di folder `backend/`:
```bash
cp backend/.env.example backend/.env
```

Atur konfigurasi pada `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# Database Configuration (pilih salah satu)
# Opsi 1: PostgreSQL Connection URL (Supabase, Neon, Render)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Opsi 2: Local MySQL / Postgres via parameter terpisah
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASS=
# DB_NAME=ai_dungeon_vtt

# AI Narrative Provider (Opsional - jika kosong, sistem menggunakan Fallback Engine)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Jalankan Aplikasi
Jalankan backend dan frontend secara bersamaan dengan satu perintah:
```bash
npm run dev
```

* **Frontend Client**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## ⌨️ Pintasan Papan Ketik (*Hotkeys*)

| Tombol | Fungsi |
| :---: | :--- |
| <kbd>Spasi</kbd> / <kbd>Enter</kbd> | Mempercepat efek ketik dialog narasi (*Typewriter Skip*) |
| <kbd>I</kbd> | Membuka / Menutup Tas Inventaris (*Backpack*) |
| <kbd>M</kbd> | Membuka Peta Percabangan Takdir (*Story Tree DAG & Rewind*) |
| <kbd>L</kbd> | Membuka Catatan Riwayat Dialog (*Backlog Log*) |
| <kbd>Esc</kbd> | Menutup Modal Aktif |

---

## 👥 Pengembang & Hak Cipta

* **Pengembang**: Tim AetherMaster AI
* **Lisensi**: Proyek Tugas Akhir / Riset Terbuka — Bebas dikembangkan untuk keperluan akademik dan portofolio.
