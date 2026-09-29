# ⚔️ AetherMaster AI

> **Interactive Visual Novel RPG & Adaptive Narrative Engine**  
> Menggabungkan pengalaman visual novel fantasi interaktif dengan kecerdasan narasi bertenaga AI (Google Gemini), graf percabangan skenario terarah (*Directed Acyclic Graph*), evaluasi taktis server-authoritative D&D 5E, persistensi multi-slot, dan sintesis audio real-time.

---

## 🌟 Fitur Utama

### 1. 📖 AI Narrative Dungeon Master & Fallback Engine
* Alur cerita dan konsekuensi tindakan dianalisis secara dinamis oleh AI (Google Gemini) dengan mempertimbangkan atribut karakter, riwayat adegan, dan fakta dunia (*WorldFacts*).
* Dilengkapi **Deterministic Fallback Engine** berkecepatan tinggi yang menjamin alur permainan tetap berjalan mulus tanpa ketergantungan wajib pada API eksternal.
* Skema data kanonikal (`hpChange`, `manaChange`, `goldChange`, `receivedItemId`, `consumedItemId`, `missionLog.objective`).

### 2. 🎭 Visual Novel Stage & Tactical Turn-Based Encounters
* Antarmuka panggung visual novel modular: latar belakang tematik dinamis, potret karakter ekspresif, ringkasan objektif misi (*SceneMissionCodex*), dialog sastrawi berkecepatan dinamis (*typewriter*), dan dek pilihan tindakan.
* Pertarungan taktis D&D 5E server-authoritative yang memvalidasi setiap lemparan dadu, aksi serang, sihir, item, serta status HP & Mana di server (menolak phantom encounters).

### 3. 🌿 Pohon Narasi Bercabang (*Story DAG*) & Fitur Rewind
* Setiap keputusan pemain membentuk simpul baru (*StoryNode*) dalam struktur *Directed Acyclic Graph* (DAG).
* **Story Tree Modal**: Pemain dapat meninjau peta keputusan kapan saja dan melakukan *Rewind* ke persimpangan sebelumnya lengkap dengan pemulihan *snapshot* kondisi karakter (HP, Mana, Emas, dan Inventaris).

### 4. 🧠 Persistent World State (*World Facts*)
* Sistem memori jangka panjang yang mencatat pilihan moral, rahasia yang terungkap, status reputasi faksi, dan relasi NPC sepanjang petualangan.

### 5. 🔊 Hybrid Audio System
* **Procedural Web Audio SFX**: Seluruh efek suara benturan pedang, detak jantung kritis (HP <= 20%), klik antarmuka, dan sihir disintesis secara prosedural langsung via Web Audio API browser (0ms latency, zero extra bandwidth).
* **Ambient Soundscapes**: Lapisan audio suasana dinamis yang menyesuaikan latar panggung aktif secara otomatis.
* **Neural Voice Narration**: Pembacaan dialog ekspresif dengan Microsoft Edge Neural TTS dan fallback otomatis ke browser Web Speech API.

### 6. 💾 Multi-Slot Save & Load (4 Slot) & Cadangan JSON
* **Slot 0 (Auto Save)**: Tersimpan otomatis pada setiap transisi babak dan persimpangan adegan penting.
* **Slot 1–3 (Manual Saves)**: Tiga slot penyimpanan mandiri dengan cuplikan lokasi, babak, timestamp, dan pratinjau status karakter kanonikal (`hp`, `maxHp`, `characterLevel`, `location`).
* **Ekspor & Impor JSON**: Kemampuan mencadangkan dan memindahkan progres permainan antarperangkat secara aman dengan validasi integritas data.

---

## 🏗️ Struktur Repositori

```
AetherMaster AI/
├── backend/                  # Server Express.js, Domain Services & REST API
│   ├── src/
│   │   ├── config/           # Konfigurasi Database (PostgreSQL / MySQL) & Sequelize ORM
│   │   ├── controllers/      # REST API handler tipis (Story, SaveLoad, TTS)
│   │   ├── engine/           # State engine, Combat engine D&D 5E, & stat calculator
│   │   ├── models/           # Skema Sequelize (Campaign, Character, GameSession, StoryNode, dll)
│   │   ├── repositories/     # Abstraksi akses basis data (Item, NPC, Location, WorldFact)
│   │   ├── routes/           # REST endpoints dengan rate limiting
│   │   └── services/         # Domain services modular:
│   │       ├── story/        # Story start, action, query, rewind, item services
│   │       ├── combat/       # Tactical combat service
│   │       ├── saveLoad/     # Save slots, JSON export/import, graph cloning
│   │       └── narrative/    # Gemini LLM, Edge TTS, Fallback Engine, Canonical Schema
│   └── tests/                # 50 Automated unit & integration tests (Node native test runner)
├── frontend/                 # Web Client SPA (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Visual Novel Stage, Combat Stage, CharacterHUD, Modals
│   │   │   ├── visual-novel/ # Modular VN Stage (Background, Header, Codex, Portrait, Dialogue, ActionDeck)
│   │   │   ├── landing/      # Campaign selection grid & cards
│   │   │   └── common/       # FantasyAvatar, ItemSlot
│   │   ├── services/         # Centralized API client & Procedural Web Audio Synth
│   │   ├── store/            # GameContext (Thin state orchestration)
│   │   └── utils/            # Standardized error handler & RPG math
│   ├── tests/                # Automated frontend unit tests (Error handling, Math, Contracts)
│   └── public/assets/        # Aset visual latar panggung, potret NPC, dan monster
└── docs/                     # Dokumentasi arsitektur dan perencanaan
    ├── ARCHITECTURE.md       # Spesifikasi arsitektur teknis lengkap
    └── planning/             # Arsip rencana implementasi bertahap
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
* **Node.js**: Versi `18.x` atau lebih baru
* **NPM**: Versi `9.x` atau lebih baru
* Basis data PostgreSQL (disarankan untuk cloud) atau MySQL (lokal)

### 1. Pasang Seluruh Dependensi
Jalankan satu perintah berikut di root folder untuk memasang seluruh dependensi:
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

# AI Narrative Provider (Opsional - jika kosong, sistem otomatis menggunakan Fallback Engine)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Menjalankan Aplikasi
Jalankan backend dan frontend secara bersamaan dengan satu perintah:
```bash
npm run dev
```

* **Frontend Client**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Pengujian Otomatis (*Automated Testing*)

Proyek ini dilengkapi pengujian otomatis menyeluruh untuk backend dan frontend tanpa dependensi eksternal berat (menggunakan Node.js native test runner):

```bash
# Menjalankan seluruh pengujian (Backend + Frontend)
npm test

# Menjalankan pengujian backend saja
npm run test:backend

# Menjalankan pengujian frontend saja
npm run test:frontend
```

---

## 🎮 Kontrol & Navigasi Permainan

* **Tombol Audio**: Mengaktifkan / membisukan efek suara prosedural dan ambient soundscape.
* **Tombol Narator (Suara)**: Menghidupkan sintesis vokal narator (Neural TTS / Web Speech).
* **Tas Petualang (Backpack)**: Membuka drawer inventaris 6 slot untuk melihat detail dan mengonsumsi obat/potion.
* **Pohon Percabangan (Story Tree)**: Membuka graf jejak keputusan dan melakukan Rewind ke adegan sebelumnya.
* **Simpan & Muat (Save/Load)**: Menyimpan ke Slot 1-3, memuat autosave/manual, atau melakukan ekspor/impor berkas JSON.
* **Typewriter Skip**: Klik pada kotak dialog atau tombol skip untuk langsung menampilkan seluruh teks narasi.

---

## 👥 Pengembang & Hak Cipta

* **Pengembang**: Ade Saputra (@ade781) & Tim AetherMaster AI
* **Lisensi**: Proyek Tugas Akhir / Riset Terbuka — Bebas dikembangkan untuk keperluan akademik dan portofolio.
