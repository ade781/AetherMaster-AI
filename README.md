# ⚔️ AetherMaster VTT Platform

> **D&D 5E Virtual Tabletop Engine & Non-Linear Interactive Visual Novel RPG**  
> Menggabungkan ketegasan mekanik *tabletop* D&D 5th Edition klasik dengan kedalaman narasi adaptif, simulasi dadu D20 3D Three.js, sintesis audio prosedural, dan pohon percabangan berbasis *Directed Acyclic Graph* (DAG).

---

## 🌟 Pilar Fitur Utama

### 1. 🎲 Mesin Audit D&D 5E Server-Authoritative
* **Validasi Aksi**: Seluruh kalkulasi lemparan dadu (*attack rolls*, *ability checks*, *saving throws*) divalidasi di sisi server (Node.js/Express) untuk mencegah manipulasi klien.
* **Mekanik Klasik D&D**:
  * 6 Skor Atribut dasar (`STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`) beserta formula modifier standar $\lfloor(\text{Score}-10)/2\rfloor$.
  * Skala *Difficulty Class* (DC 10–25).
  * Sistem *Armor Class* (AC), HP, Mana, dan *Inventory Item Bonus*.
  * Deteksi *Critical Success* (Natural 20) dan *Critical Failure* (Natural 1).

### 2. 🧊 Lemparan Dadu 3D Fisika (Three.js)
* Visualisasi lemparan dadu *icosahedron* 20 sisi interaktif dengan tekstur kustom (*diffuse map*, *normal bump map*, dan *specular roughness map*).
* Menampilkan trayektori acak realistis dengan animasi putaran sudut sebelum mendarat tepat pada angka hasil audit backend.

### 3. 🌿 Pohon Narasi Bercabang & Mekanisme Kilas Balik (*Rewind DAG*)
* Setiap keputusan pemain mencabangkan alur cerita baru (*StoryNode*) yang tersimpan dalam relasi *Directed Acyclic Graph* (DAG).
* **Modal Story Tree**: Pemain dapat membuka diagram jejak adegan kapan saja untuk meninjau riwayat dan melakukan *Rewind* ke titik persimpangan sebelumnya lengkap dengan pemulihan *snapshot* status karakter (HP, Mana, Emas, dan Inventaris).

### 4. 🔊 Sintesis Audio Prosedural 100% Lokal (Web Audio API)
* **Zero External MP3**: Seluruh efek suara (*sound effect*) dibangkitkan secara prosedural (*real-time wave synthesis*) di browser menggunakan Web Audio API:
  * Suara denting gulingan dadu kayu (*dice roll*).
  * Efek benturan senjata (*sword clash*).
  * Detak jantung darurat (*critical HP heartbeat*).
  * Tiga variasi *soundscape ambient background* (Kedai Oakhaven, Puncak Badai Salju, Palung Laut Kuno).
* Didukung *text-to-speech* narasi suara otomatis via Web Speech API.

### 5. 💾 Multi-Slot Save & Load Terenkripsi
* Tiga slot penyimpanan mandiri dengan *timestamp*, cuplikan adegan, dan *stat preview*.
* Fitur **Ekspor / Impor JSON** yang memungkinkan pemain memindahkan progres petualangan ke perangkat lain.

---

## 🏗️ Arsitektur Teknologi

```
AetherMaster AI/
├── backend/                  # Server Node.js & REST API
│   ├── src/
│   │   ├── config/           # Konfigurasi SQLite & Sequelize ORM
│   │   ├── controllers/      # Logika alur cerita, aksi D20, & save/load
│   │   ├── models/           # Skema Campaign, Character, GameSession, StoryNode
│   │   ├── routes/           # Endpoint API RESTful
│   │   ├── services/         # Integrasi LLM & Fallback Engine
│   │   └── utils/            # Kalkulator mekanik D&D 5E & audit dadu
├── frontend/                 # Web Client SPA (React 18 + Vite)
│   ├── src/
│   │   ├── components/       # Komponen VN Stage, Combat, HUD, Modals
│   │   ├── services/         # Web Audio API procedural synthesizer
│   │   ├── store/            # GameContext (State Management)
│   │   └── utils/            # Helper matematika RPG
│   └── public/assets/        # Aset visual (portraits, backgrounds, 3d maps)
├── docs/                     # Dokumentasi perencanaan & Laporan Tugas Akhir
└── scripts/                  # Skrip utilitas & tools developer
```

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
* **Node.js**: Versi `18.x` atau lebih baru
* **NPM**: Versi `9.x` atau lebih baru

### 1. Clone Repositori
```bash
git clone https://github.com/ade781/AetherMaster-AI.git
cd AetherMaster-AI
```

### 2. Pasang Seluruh Dependensi
Jalankan satu perintah berikut di root folder untuk memasang dependensi root, backend, dan frontend secara otomatis:
```bash
npm run install:all
```

### 3. Konfigurasi Environment Variable Backend
Salin berkas contoh konfigurasi di folder `backend/`:
```bash
cp backend/.env.example backend/.env
```
Isi konfigurasi di `backend/.env` (opsional jika ingin menggunakan LLM live):
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Catatan: Jika `GEMINI_API_KEY` tidak diisi, sistem secara otomatis beralih ke **Deterministic Fallback Engine** berkecepatan tinggi tanpa error.*

### 4. Jalankan Aplikasi
Jalankan backend dan frontend serentak dengan satu perintah:
```bash
npm run dev
```

* **Frontend Client**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## ⌨️ Kontrol & Tombol Pintas (*Hotkeys*)

| Tombol | Fungsi |
| :---: | :--- |
| <kbd>Spasi</kbd> / <kbd>Enter</kbd> | Mempercepat efek ketik dialog narasi (*Typewriter Skip*) |
| <kbd>I</kbd> | Membuka / Menutup Tas Inventaris (*Backpack*) |
| <kbd>M</kbd> | Membuka Peta Percabangan Takdir (*Story Tree DAG & Rewind*) |
| <kbd>L</kbd> | Membuka Catatan Riwayat Dialog (*Backlog Log*) |

---

## 👥 Pengembang & Hak Cipta

* **Penulis**: ADE7 (Ade Kurniawan)
* **Lisensi**: Proyek Tugas Akhir / Penelitian Terbuka — Bebas dikembangkan untuk keperluan akademik dan portofolio.
