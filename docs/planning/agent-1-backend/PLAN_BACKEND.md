# MASTER PLAN: AGENT 1 (BACKEND & ENGINE)
## AetherMaster AI — Rencana Kerja Perbaikan, Hardening, dan Pengembangan AI Director & Dynamic Campaign Builder

---

## 1. Ringkasan Eksekutif & Identitas Agent

* **Identitas Agent**: Agent 1 (Backend & Systems Architect)
* **Domain Kerja**: Node.js, Express.js, Sequelize ORM, D&D 5E Combat Engine, Gemini Narrative Orchestrator, REST API, Database Persistence, dan Backend Automated Testing.
* **Tujuan Utama**:
  1. Melakukan audit menyeluruh dan perbaikan teknis (*hardening*) pada sistem persistensi, D&D 5E combat engine, ketahanan koneksi database saat testing, dan orkestrasi Gemini fallback.
  2. Merancang dan mengimplementasikan mesin backend untuk **AI Director & Dynamic Campaign Builder** (generasi dungeon/campaign kustom, generator NPC dinamis, kontrol pacing & kesulitan adaptif, serta persistensi campaign kustom).
  3. Menyediakan kontrak API terkunci (*Locked Contract First*) yang stabil bagi Agent 2 (Frontend) tanpa ketergantungan runtime langsung.

---

## 2. Boundary & Matriks Kepemilikan File (Zero Collision Protocol)

Untuk menjamin **100% bebas tabrakan (zero collision)** dengan Agent 2, Agent 1 memiliki batas otoritas ketat pada struktur repositori:

### 2.1 File & Direktori Eksklusif Milik Agent 1
```text
backend/
├── src/
│   ├── config/             # database.js, sequelize configuration
│   ├── controllers/        # storyController, combatController, saveLoadController, campaignBuilderController (BARU)
│   ├── engine/             # combatEngine, statCalculator, stateMachine, aiDirectorEngine (BARU)
│   ├── models/             # Campaign, Character, StoryNode, GameSession, CustomCampaign (BARU)
│   ├── repositories/       # ItemRepository, NPCRepository, LocationRepository, CustomCampaignRepository (BARU)
│   ├── routes/             # storyRoutes, combatRoutes, saveLoadRoutes, campaignBuilderRoutes (BARU)
│   ├── services/           # storyService, combatService, saveLoadService, narrativeService, campaignGeneratorService (BARU)
│   └── utils/              # apiResponse, logger, canonicalSchema, campaignSchemas (BARU)
├── tests/                  # Seluruh suite pengujian backend (*.test.js)
└── package.json            # Dependensi backend
api/
└── index.js                # Serverless Vercel handler
```

### 2.2 Larangan Keras (Strict Boundary Rules)
1. **Dilarang memodifikasi file di folder `frontend/**`**: Apabila membutuhkan integrasi UI, Agent 1 hanya mendokumentasikan spesifikasi DTO & endpoint pada Bab 5 dokumen ini.
2. **Git Branching Terisolasi**: Seluruh pengerjaan wajib dilakukan pada branch `feat/backend-agent1`.
3. **Pemberian Mock Data**: Endpoint baru wajib mendukung mode pengujian/dry-run agar Agent 2 dapat menguji UI bahkan saat kuota Gemini atau basis data lokal tidak aktif.

---

## 3. Audit & Perbaikan Teknis (Bug Fixes & Technical Debt Hardening)

### 3.1 Hardening Test Suite: Dukungan In-Memory SQLite untuk Pengujian Otomatis
* **Masalah Saat Ini**: Pada suite pengujian `backend/tests/saveLoadRoundTrip.test.js`, 5 subtest persistent DB diskip (`SKIP Database connection unavailable; skipping persistent DB round-trip test`) jika server PostgreSQL/MySQL lokal tidak aktif.
* **Rencana Perbaikan**:
  * Konfigurasi `backend/src/config/database.js`: Jika `process.env.NODE_ENV === 'test'` dan variabel `DATABASE_URL` tidak diset, gunakan dialek `sqlite` dengan storage `:memory:`.
  * Pastikan dependensi `sqlite3` tersedia di `backend/package.json` sebagai `devDependencies`.
  * Seluruh 6 subtest round-trip slot, graph cloning, dan isolasi slot 0 wajib lulus 100% tanpa prasyarat database eksternal.

### 3.2 Audit Integritas Persistensi & Transaksi Save/Load
* **Masalah Saat Ini**: Operasi `autoSave` dan `saveToSlot` harus menjamin isolasi ACID mutlak saat kloning graph node berskala besar (deep branching) agar tidak terjadi snapshot corrupt saat request concurrency tinggi.
* **Rencana Perbaikan**:
  * Terapkan `sequelize.transaction()` terisolasi pada `slotService.js` dan `graphCloneService.js`.
  * Validasi integritas Foreign Key pada relasi `StoryNode` -> `StoryChoice` saat operasi pemulihan/rewind.
  * Pastikan Slot 0 (Autosave) tidak dapat dimanipulasi oleh payload manual save endpoint.

### 3.3 Resilience Gemini Narrative Orchestrator & Deterministic Fallback
* **Masalah Saat Ini**: Potensi kegagalan narasi saat kuota rate limit Gemini 429 atau token context melampaui batas, serta pencegahan halusinasi format JSON.
* **Rencana Perbaikan**:
  * Perkuat parsing schema Zod pada `narrativeService.js` dengan mekanisme retry bertingkat (exponential backoff max 2x).
  * Jika validasi Zod gagal atau API timeout (>8000ms), otomatis dialihkan ke `deterministicFallbackEngine` dengan menyuntikkan fakta dunia (`worldLedger`) secara koheren.
  * Audit token sanitizer pada `logger.js` untuk memastikan semua secret (Gemini API Key, Session IDs) tidak bocor ke log console.

### 3.4 Penguatan D&D 5E Combat Engine
* **Masalah Saat Ini**: Mekanisme Armor Class (AC), Attack Roll, dan Damage Calculation perlu dilengkapi dengan kalkulasi *Saving Throws* (D20 + attribute modifier vs Spell Save DC) dan *Status Effects* (Stunned, Poisoned, Blessed).
* **Rencana Perbaikan**:
  * Tambahkan modul `savingThrowEvaluator.js` di `backend/src/engine/`.
  * Tambahkan penanganan kondisi status turn-based pada `combatEngine.js`:
    * `poisoned`: damage over time (1d4) pada tiap pergantian giliran.
    * `stunned`: melewatkan giliran aksi.
    * `blessed`: bonus +1d4 pada attack roll dan saving throw.
  * Tambahkan unit test komprehensif di `backend/tests/combatSavingThrows.test.js`.

---

## 4. Pengembangan Fitur Baru: AI Director & Dynamic Campaign Builder

Sistem ini memungkinkan pemain membuat campaign kustom prosedural dengan aturan D&D 5E serta AI Director yang memantau tensi permainan secara dinamis.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI DIRECTOR & CAMPAIGN ARCHITECTURE             │
│                                                                        │
│   [ Player Intent / Prompt ]                                           │
│               │                                                        │
│               ▼                                                        │
│   ┌────────────────────────┐      Validasi Zod      ┌──────────────┐   │
│   │ campaignGeneratorService│ ────────────────────► │ Zod Contract │   │
│   └───────────┬────────────┘                        └──────┬───────┘   │
│               │                                            │ Valid     │
│       Gemini AI / Fallback                                 ▼           │
│               ▼                                     ┌──────────────┐   │
│   ┌────────────────────────┐                        │ CustomCampaign│  │
│   │  Dynamic NPC Generator │                        │  Repository  │   │
│   └───────────┬────────────┘                        └──────┬───────┘   │
│               │                                            │           │
│               ▼                                            ▼           │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     aiDirectorEngine                           │   │
│   │   • Dynamic Difficulty Adjustment (DDA: HP & Turn Monitoring)   │   │
│   │   • Pacing & Narrative Tension Control                         │   │
│   │   • Procedural Mission Log Updater                             │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Modul 1: Campaign Generator Engine (`campaignGeneratorService.js`)
* **Lokasi**: `backend/src/services/campaign/campaignGeneratorService.js`
* **Tanggung Jawab**:
  * Menerima parameter input: `theme` (misal: Gothic Horror, Cyberpunk Dungeon, Forgotten Ruins), `difficulty` (Easy, Normal, Hard, Deadly), `storyPremise`, dan `lengthTier` (Short: 3 nodes, Medium: 7 nodes, Long: 15 nodes).
  * Menyusun prompt terstruktur ke Gemini dengan output format JSON murni.
  * Memvalidasi struktur campaign menggunakan skema Zod:
    * Metadata: `title`, `premise`, `theme`, `startingNodeId`.
    * Nodes: Array dari simpul cerita (narasi, pilihan aksi, konsekuensi stat, probabilitas pertempuran).
    * Preset Musuh: Stat D&D 5E (HP, AC, Attack Bonus, Damage Dice, CR).
  * Menyediakan **Deterministic Fallback Campaign Generator** jika Gemini offline.

### 4.2 Modul 2: Dynamic NPC Generator Service (`npcGeneratorService.js`)
* **Lokasi**: `backend/src/services/narrative/npcGeneratorService.js`
* **Tanggung Jawab**:
  * Menghasilkan karakter non-pemain secara on-the-fly: Nama, Ras, Kelas, Kepribadian (*Traits*, *Ideals*, *Bonds*, *Flaws*), Voice Pitch preset, dan dialog awal.
  * Menyimpan NPC yang dihasilkan ke dalam `NPCRepository` kustom untuk sesi permainan terkait.

### 4.3 Modul 3: AI Director & Pacing Engine (`aiDirectorEngine.js`)
* **Lokasi**: `backend/src/engine/aiDirectorEngine.js`
* **Tanggung Jawab**:
  * Menganalisis kondisi pemain tiap 2 giliran (*turn*):
    * Jika HP Pemain < 25% berturut-turut: Turunkan probabilitas pertempuran, suntikkan opsi eksplorasi rest/potion, dan kendurkan damage musuh.
    * Jika Pemain mendominasi (HP > 90% selama 5 turn tanpa tantangan): Picu *environmental hazard*, ambush musuh bertipe elite, atau plot twist narasi.
  * Menghasilkan metrik `pacingMetrics` yang dikembalikan bersama respons `storyActionService`.

### 4.4 Modul 4: Model Sequelize & Persistence
* Tambahkan file model `backend/src/models/CustomCampaign.js`:
  * Kolom: `id` (UUID), `title` (STRING), `premise` (TEXT), `theme` (STRING), `difficulty` (STRING), `nodesData` (JSON), `npcPool` (JSON), `enemyPool` (JSON), `createdAt`, `updatedAt`.
* Daftarkan model pada `backend/src/models/index.js` dengan relasi ke `GameSession`.

---

## 5. Spesifikasi Kontrak API & DTO (Locked Contract First)

Berikut adalah kontrak API resmi yang dijamin tidak akan berubah secara sepihak, menjadi acuan integrasi bagi Agent 2:

### 5.1 POST `/api/campaigns/generate`
* **Deskripsi**: Menghasilkan draf campaign kustom dari prompt AI/fallback deterministik.
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "theme": "Gothic Dungeon",
  "difficulty": "normal",
  "premise": "Eksplorasi kastil terbengkalai penuh teka-teki kuno.",
  "lengthTier": "medium"
}
```
* **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "generatedCampaign": {
      "id": "camp_custom_8f91a2b",
      "title": "Kastil Bayangan Hitam",
      "premise": "Eksplorasi kastil terbengkalai penuh teka-teki kuno.",
      "theme": "Gothic Dungeon",
      "difficulty": "normal",
      "nodesCount": 7,
      "previewSummary": "Petualangan melintasi gerbang utama hingga ruang takhta terlupakan.",
      "nodes": [
        {
          "nodeId": "node_start",
          "title": "Gerbang Utama Kastil",
          "narrative": "Pintu kayu lapuk berdiri di hadapan Anda...",
          "choices": [
            { "id": "c1", "label": "Dobrak pintu gerbang", "actionType": "strength_check" },
            { "id": "c2", "label": "Cari celah di dinding samping", "actionType": "investigate" }
          ]
        }
      ],
      "presetEnemies": [
        { "name": "Gargoyle Penjaga", "hp": 22, "ac": 13, "attackBonus": 4, "damage": "1d6+2" }
      ]
    }
  }
}
```

### 5.2 POST `/api/campaigns/custom/save`
* **Deskripsi**: Menyimpan campaign kustom yang telah disetujui pemain ke database.
* **Request Body**:
```json
{
  "campaignData": { /* Objek campaign lengkap dari endpoint generate */ }
}
```
* **Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_custom_8f91a2b",
    "savedAt": "2026-10-02T13:30:00.000Z"
  }
}
```

### 5.3 GET `/api/campaigns/custom`
* **Deskripsi**: Mengambil daftar seluruh campaign kustom yang tersimpan.
* **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "camp_custom_8f91a2b",
        "title": "Kastil Bayangan Hitam",
        "theme": "Gothic Dungeon",
        "difficulty": "normal",
        "createdAt": "2026-10-02T13:30:00.000Z"
      }
    ]
  }
}
```

### 5.4 POST `/api/campaigns/npcs/generate`
* **Deskripsi**: Menghasilkan profil NPC dinamis.
* **Request Body**:
```json
{
  "role": "merchant",
  "alignment": "neutral",
  "context": "Di ruang bawah tanah tersembunyi"
}
```
* **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "npc": {
      "id": "npc_gen_44a",
      "name": "Eldrin si Pengembara",
      "race": "Elf",
      "role": "merchant",
      "greeting": "Salam penjelajah, butuh perbekalan langka?",
      "personalityTraits": "Waspada dan menyukai artefak kuno",
      "inventory": [
        { "itemId": "item_01_potion_heal", "price": 25 }
      ]
    }
  }
}
```

### 5.5 Injeksi Pacing Metrics pada Endpoint Story Terlatih (`POST /api/story/action`)
* **Tambahan pada Payload Response `data`**:
```json
{
  "directorPacing": {
    "tensionLevel": "high",
    "dangerScore": 75,
    "recommendedPacing": "offer_rest_or_safe_exploration",
    "adaptiveModifiers": {
      "enemyDamageModifier": 0.85
    }
  }
}
```

---

## 6. Strategi Pengujian & Verifikasi (Testing Strategy)

Agent 1 bertanggung jawab menjalankan seluruh suite backend dan menambahkan tes baru:

1. **Regression Test Suite**:
   ```bash
   npm run test:backend
   ```
   *Target: 100% tes lulus (termasuk 5 persistent DB round-trip tests via in-memory SQLite, 0 skipped).*
2. **Suite Tes Baru yang Wajib Ditulis**:
   * `backend/tests/sqliteInMemoryDatabase.test.js`: Memverifikasi database test otomatis berpindah ke in-memory SQLite saat MySQL/PostgreSQL offline.
   * `backend/tests/campaignGenerator.test.js`: Menguji validasi skema Zod pada output generasi campaign dan verifikasi fallback deterministik saat Gemini gagal.
   * `backend/tests/aiDirectorPacing.test.js`: Menguji logika adaptasi AI Director ketika HP karakter kritis atau pemain mendominasi pertempuran.
   * `backend/tests/npcGenerator.test.js`: Menguji struktur data profil NPC dinamis dan konsistensi relasi dialog.

---

## 7. Tahapan Pengerjaan Agent 1 (Execution Timeline)

| Fase | Durasi Est. | Deskripsi Tugas | Hasil Akhir |
|---|---|---|---|
| **Fase 1: Audit & In-Memory DB** | Hari 1 | Integrasi SQLite in-memory untuk mode `NODE_ENV=test`, perbaiki 5 skipped tests di `saveLoadRoundTrip.test.js`. | Seluruh unit test backend 100% pass tanpa prasyarat DB eksternal. |
| **Fase 2: Combat Engine & Save Transaction** | Hari 2 | Implementasi saving throw, status effects, dan audit `sequelize.transaction()` pada save/load. | Combat engine lebih taktis, ACID save teruji aman. |
| **Fase 3: Generator Engine & Zod Schemas** | Hari 3 | Bangun `campaignGeneratorService`, skema Zod `campaignSchemas.js`, dan fallback engine. | Unit test generator lulus dengan mock & fallback. |
| **Fase 4: Dynamic NPC & AI Director Engine** | Hari 4 | Bangun `npcGeneratorService.js` dan `aiDirectorEngine.js`, suntikkan metrik ke response story. | Metrik pacing dan generator NPC terhubung ke story action. |
| **Fase 5: Routes, Controllers, & E2E Verification** | Hari 5 | Implementasikan route `/api/campaigns/*`, model `CustomCampaign`, dan tes integrasi E2E. | Kontrak API aktif dan siap dikonsumsi Frontend. |

---

## 8. Definition of Done (DoD) Agent 1

Pekerjaan Agent 1 dinyatakan selesai apabila:
* [ ] Seluruh skrip pengujian backend (`npm run test:backend`) lulus 100% tanpa error dan tanpa skipped tests yang disebabkan oleh ketiadaan database eksternal.
* [ ] Endpoint `/api/campaigns/generate`, `/api/campaigns/custom`, `/api/campaigns/custom/save`, dan `/api/campaigns/npcs/generate` aktif dan merespons sesuai kontrak DTO Bab 5.
* [ ] Fallback deterministik berfungsi 100% ketika koneksi internet / kuota Gemini ditiadakan.
* [ ] Log backend tetap bersih dan seluruh token/API keys tersanitasi sempurna.
* [ ] Tidak ada perubahan sekecil apa pun pada folder `frontend/**`.
