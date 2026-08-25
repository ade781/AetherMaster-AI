# ⚔️ AetherMaster AI — AI Dungeon Master & Virtual Tabletop RPG

> Engine Virtual Tabletop (VTT) D&D 5E modern yang ditenagai AI Dungeon Master dengan simulasi dadu 3D berbasis WebGL fisik dan pengelolaan karakter real-time.

---

## 🌟 Fitur Utama
- **🧙‍♂️ Studio Pembuatan Karakter D&D 5E**: Kalkulator otomatis Ability Scores (Kekuatan, Kelincahan, Daya Tahan, Kecerdasan, Kebijaksanaan, Kharisma), Hit Points (Hit Die + CON mod), Armor Class, Speed, Ras, dan Kelas resmi D&D 5E.
- **🎲 Kotak Dadu 3D Fisik (Three.js WebGL)**: Lemparan dadu D4, D6, D8, D10, D12, D20, D100 dengan fisika rotasi realistis, deteksi *Natural 20 (Kritikal)* dan *Natural 1 (Gagal Total)*.
- **📜 Lembar Karakter Interaktif (Live Sheet)**: Tracking HP real-time (Damage, Heal), Naik Tingkat (Level-Up), dan klik ability score untuk cek dadu instan.
- **📖 Modul Pilihan Cerita Awal**: Pilihan skenario petualangan siap main dalam Bahasa Indonesia dengan pengantar cerita dan opsi aksi cepat.
- **🎨 Dark Fantasy Design System**: Antarmuka tema fantasi gelap dengan Tailwind CSS v3, Glassmorphism, dan Google Fonts (*Cinzel*, *Outfit*).
- **🗄️ Database Terintegrasi**: Sequelize ORM dengan dukungan MySQL (`ai_dungeon_vtt`) dan auto fallback SQLite lokal.

---

## 🚀 Cara Menjalankan Proyek

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18+)
- MySQL Database Server (opsional, database `ai_dungeon_vtt`)

### 2. Instalasi Dependensi
```bash
# Install seluruh dependensi server dan client
npm run install:all
```

### 3. Menjalankan Server Backend
```bash
cd server
npm run dev
# Server aktif di http://localhost:5000
```

### 4. Menjalankan Frontend Web
```bash
cd client
npm run dev
# Web app aktif di http://localhost:5173
```

---

## 📂 Struktur Proyek
```
AetherMaster AI/
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS + Three.js)
│   ├── src/
│   │   ├── components/
│   │   │   ├── character/     # Character Creator & Live Sheet
│   │   │   ├── dice/          # 3D Physical Dice Box
│   │   │   └── story/         # Story Selector & Playground
│   │   ├── data/              # stories.js (Dataset Cerita Awal)
│   │   ├── pages/             # DashboardPage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend (Node.js + Express + Sequelize ORM)
│   ├── src/
│   │   ├── config/            # database.js
│   │   ├── controllers/       # characterController.js
│   │   ├── models/            # Character.js
│   │   ├── routes/            # characterRoutes.js
│   │   └── server.js          # Express entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json
└── ROADMAP_AI_DUNGEON_MASTER_50_TAHAP.txt
```

---

## 📜 Lisensi
MIT License.
