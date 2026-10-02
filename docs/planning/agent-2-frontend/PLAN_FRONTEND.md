# MASTER PLAN: AGENT 2 (FRONTEND & CLIENT EXPERIENCE)
## AetherMaster AI — Rencana Kerja Perbaikan, Polish UI/UX, dan Pengembangan Dynamic Campaign Builder Studio & Tactical Stage

---

## 1. Ringkasan Eksekutif & Identitas Agent

* **Identitas Agent**: Agent 2 (Frontend Architect & Visual/Audio Experience Engineer)
* **Domain Kerja**: React 18, Vite, Tailwind CSS, Web Audio API Synthesizer, React Context (`GameContext`), Visual Novel Stage, Combat Stage, dan Frontend Automated Testing.
* **Tujuan Utama**:
  1. Melakukan perbaikan teknis (*client hardening*) pada kestabilan `GameContext` autosave queue, penanganan typewriter visual novel pada perangkat mobile, stabilitas AudioContext Web Audio API, dan polishing modal Save/Load & Story Tree.
  2. Merancang dan mengimplementasikan antarmuka interaktif **Dynamic Campaign Builder Studio** (wizard pembuatan cerita prosedural, preview deck NPC dinamis, seleksi preset dunia kustom).
  3. Meningkatkan imersi visual D&D 5E Combat Stage dengan animasi lemparan dadu D20 (Critical Hit/Miss), status effect badges turn-based, dan indikator tensi AI Director pada HUD.
  4. Mengonsumsi kontrak API resmi secara modular melalui adaptor layanan klien dengan lapisan mock terisolasi (*Zero Collision*).

---

## 2. Boundary & Matriks Kepemilikan File (Zero Collision Protocol)

Untuk menjamin **100% bebas tabrakan (zero collision)** dengan Agent 1, Agent 2 memiliki batas wilayah kerja eksklusif pada struktur repositori:

### 2.1 File & Direktori Eksklusif Milik Agent 2
```text
frontend/
├── src/
│   ├── components/
│   │   ├── campaign-builder/   # Wizard, NpcGeneratorCard, CampaignPresetSelector (BARU)
│   │   ├── combat/             # CombatStage, DiceRoller, TurnOrderBar, StatusEffectBadge (POLISH)
│   │   ├── hud/                # TopNavBar, StatusBars, DirectorTensionBadge (UPDATE)
│   │   ├── modals/             # SaveLoadModal, StoryTreeModal, DynamicNpcModal (UPDATE/BARU)
│   │   └── visual-novel/       # DialogueBox, SceneActionDeck, StageBackground (POLISH)
│   ├── services/
│   │   ├── api.js              # Integrasi storyApi, saveLoadApi, dan campaignApi (BARU)
│   │   ├── campaignMockApi.js  # Mock payload adapter independen (BARU)
│   │   └── audioSynthesizer.js # Web Audio API procedural sound engine (UPDATE)
│   ├── store/
│   │   ├── GameContext.jsx     # Autosave debounce, audio trigger, campaign state
│   │   └── CampaignContext.jsx # State management khusus Campaign Builder (BARU)
│   └── utils/                  # rpgMath, errorHandler, soundCatalog
├── tests/                      # Seluruh suite pengujian frontend (*.test.js)
└── package.json                # Dependensi frontend
```

### 2.2 Larangan Keras (Strict Boundary Rules)
1. **Dilarang memodifikasi file di folder `backend/**` dan `api/**`**: Agent 2 tidak boleh mengedit controller, model, route, atau test backend.
2. **Git Branching Terisolasi**: Seluruh pengerjaan wajib dilakukan pada branch `feat/frontend-agent2`.
3. **Pemanfaatan Mock Payload**: Selama Agent 1 sedang memvalidasi endpoint baru di backend, Agent 2 wajib menggunakan `campaignMockApi.js` untuk rendering dan pengujian komponen UI tanpa menunggu ketersediaan live server backend.

---

## 3. Audit & Perbaikan Teknis (Bug Fixes & UI/UX Hardening)

### 3.1 Resilience Autosave Scheduler & Lifecycle Guard di GameContext
* **Masalah Saat Ini**: Transisi adegan yang sangat cepat atau perpindahan tab browser berpotensi memicu race condition debounce autosave dan memory leak jika komponen visual novel unmount sebelum promise request HTTP terselesaikan.
* **Rencana Perbaikan**:
  * Implementasikan cleanup callback `AbortController` di `GameContext.jsx` untuk membatalkan pending autosave request saat unmount.
  * Tambahkan indikator status autosave visual yang halus pada HUD (`Menyimpan...` -> `Tersimpan ✓` -> fade out 2 detik) tanpa memblokir input interaksi pemain.
  * Verifikasi bahwa tidak ada autosave yang dipicu saat pemain hanya membuka modal UI (Inventory, Character Sheet, Settings).

### 3.2 Polishing DialogueBox & Typewriter Responsif Mobile
* **Masalah Saat Ini**: Teks dialog narasi panjang pada layar ponsel (viewport < 640px) terkadang mengalami pemotongan teks (*text clipping*) atau auto-scroll jumping yang mengganggu kenyamanan membaca.
* **Rencana Perbaikan**:
  * Buat komponen `DialogueBox.jsx` menggunakan dynamic flex auto-grow dengan `overflow-y-auto` halus dan styled custom scrollbar.
  * Tambahkan tombol akselerasi typewriter: Tap sekali untuk instan melengkapi paragraf, tap kedua untuk melangkah ke aksi pilihan berikutnya.
  * Pastikan kontras teks dialog terhadap background memenuhi standar WCAG AAA (rasio kontras > 7:1) dengan dukungan bayangan teks halus (*subtle text drop-shadow*).

### 3.3 Peningkatan UX Modal Save/Load & Story Tree
* **Masalah Saat Ini**: Konfirmasi penimpaan slot simpanan (*overwrite*) masih menggunakan modal sederhana dan Story Tree membutuhkan navigasi visual yang lebih intuitif pada branching kompleks.
* **Rencana Perbaikan**:
  * Terapkan kartu konfirmasi diegetik pada `SaveLoadModal.jsx` dengan ringkasan perbandingan: level lama vs level baru, timestamp simpanan, dan lokasi petualangan.
  * Pada `StoryTreeModal.jsx`, tambahkan fitur mini-minimap atau visual dragging untuk menelusuri simpul cerita yang bercabang panjang, serta warna pembeda simpul masa lalu, simpul saat ini, dan simpul rewind.

### 3.4 Stabilitas Web Audio API & AudioContext Unlock
* **Masalah Saat Ini**: Kebijakan browser modern (Autoplay Policy) membekukan `AudioContext` ke status `suspended` sampai pemain berinteraksi dengan DOM, yang terkadang menyebabkan efek suara awal tidak berbunyi.
* **Rencana Perbaikan**:
  * Pasang *listener* global interaksi pertama (click/keydown) di `audioSynthesizer.js` untuk memanggil `audioContext.resume()` secara transparan.
  * Bersihkan instance oscillator dan gain nodes secara deterministik (`disconnect()`) setelah selesai memutar nada untuk mencegah akumulasi konsumsi memori browser.

---

## 4. Pengembangan Fitur Baru: Dynamic Campaign Builder Studio & Tactical Stage

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND COMPONENT ARCHITECTURE                      │
│                                                                        │
│   [ TopNavBar / Menu ] ──► [ Tombol "Buat Petualangan Baru" ]          │
│                                       │                                │
│                                       ▼                                │
│                      ┌─────────────────────────────────┐               │
│                      │   CampaignBuilderStudio.jsx     │               │
│                      │  (Multi-Step Stepper Wizard)    │               │
│                      └────────────────┬────────────────┘               │
│                                       │                                │
│          ┌────────────────────────────┼───────────────────────────┐    │
│          ▼                            ▼                           ▼    │
│  [ Step 1: Premis & Tema ]    [ Step 2: Tingkat Bahaya ]   [ Step 3: AI ]│
│  • Pilihan preset tema        • Slider Easy - Deadly       • Input prompt│
│  • Visual preview badge       • Kalkulasi CR Modifier      • Generator btn│
│          │                            │                           │    │
│          └────────────────────────────┼───────────────────────────┘    │
│                                       ▼                                │
│                      ┌─────────────────────────────────┐               │
│                      │    CampaignLivePreviewCard      │               │
│                      │  • Preview Story Nodes          │               │
│                      │  • Dynamic NPC Deck Card        │               │
│                      │  • Preset Enemy D&D 5E Badges   │               │
│                      └────────────────┬────────────────┘               │
│                                       │ [ Setujui & Mulai Petualangan ]│
│                                       ▼                                │
│                      ┌─────────────────────────────────┐               │
│                      │     Visual Novel / Combat Stage │               │
│                      │  • Live Tension HUD Indicator   │               │
│                      │  • 3D Animated Dice Roller      │               │
│                      └─────────────────────────────────┘               │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Modul 1: Campaign Builder Studio (`CampaignBuilderStudio.jsx`)
* **Lokasi**: `frontend/src/components/campaign-builder/CampaignBuilderStudio.jsx`
* **Desain & Interaksi**:
  * Tampilan stepper 3 langkah yang elegan bernuansa dark fantasy:
    * **Langkah 1 (Tema & Setting)**: Pemilihan kartu tema interaktif (misal: *Gothic Dungeon*, *Sunken Citadel*, *Eldritch Forest*, *Arcane Laboratory*).
    * **Langkah 2 (Tingkat Kesulitan & Panjang Cerita)**: Pilihan slider kesulitan D&D (*Casual*, *Balanced*, *Hardcore*, *Permadeath Warning*) dan panjang petualangan (3, 7, atau 15 simpul cerita).
    * **Langkah 3 (Panduan Narasi AI)**: Input teks bebas untuk pemain menentukan premis awal (contoh: *"Mencari pedang suci yang dicuri kultus bayangan"*), dilengkapi tombol **"Bangkitkan Petualangan dengan AI"**.
  * Dilengkapi tombol beralih ke mode offline/mock saat tidak ada koneksi backend.

### 4.2 Modul 2: Dynamic NPC Generator & Preview Deck (`DynamicNpcModal.jsx`)
* **Lokasi**: `frontend/src/components/campaign-builder/DynamicNpcModal.jsx`
* **Desain & Interaksi**:
  * Kartu NPC modular menampilkan potret ilustrasi sesuai ras dan kelas, badge peran (*Merchant*, *Quest Giver*, *Rival*, *Ally*), dan kutipan dialog awal.
  * Fitur interaktif **"Dengarkan Suara"**: Menggunakan Web Audio API / Speech Synthesis untuk memutar sampel sapaan suara NPC dengan modulasi pitch sesuai kepribadiannya.
  * Kemampuan pemain untuk melakukan *reroll* satu NPC tanpa harus mengulang seluruh campaign.

### 4.3 Modul 3: Peningkatan Tactical Combat Stage (D&D 5E)
* **Lokasi**: `frontend/src/components/combat/DiceRoller.jsx` & `CombatStage.jsx`
* **Fitur Interaktif**:
  * **Animated D20 Roller**: Visual animasi rotasi dadu saat pemain melancarkan aksi pertempuran:
    * Angka 20: Efek getar layar ringan (*screen shake*), kilau emas, dan SFX sihir kemenangan (*Natural 20 - Critical Hit!*).
    * Angka 1: Efek warna merah menyala dan SFX benturan logam tumpul (*Natural 1 - Critical Miss!*).
  * **Turn Order Tracker**: Strip avatar horizontal di bagian atas stage yang mengindikasikan giliran pemain, rekan tim, atau monster.
  * **Floating Status Effect Badges**: Ikon status visual dengan tooltip (*Stunned*, *Poisoned*, *Blessed*) di samping bilah HP target.

### 4.4 Modul 4: AI Director Live Tension HUD
* **Lokasi**: `frontend/src/components/hud/DirectorTensionBadge.jsx`
* **Fitur**:
  * Indikator tensi permainan dinamis di bilah atas HUD yang merefleksikan suasana narasi dari `pacingMetrics`:
    * *Hijau Tenang*: Eksplorasi aman.
    * *Kuning Waspada*: Tensi meningkat, ancaman mendekat.
    * *Merah Membara*: Pertempuran genting / titik balik cerita.

---

## 5. Pemetaan Kontrak API & Konsumsi Frontend (Locked Contract First)

Untuk menjaga isolasi independen dari Agent 1, Agent 2 mengimplementasikan modul layanan di `frontend/src/services/api.js`:

```javascript
// frontend/src/services/api.js (Tambahan spesifikasi campaignApi)
export const campaignApi = {
  generateCampaign: async (payload) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      // Fallback ke mock payload lokal jika backend belum online
      return import('./campaignMockApi.js').then(m => m.mockGenerateCampaign(payload));
    }
  },

  saveCustomCampaign: async (campaignData) => {
    // Implementasi simpan campaign
  },

  getCustomCampaigns: async () => {
    // Ambil daftar campaign
  },

  generateDynamicNpc: async (criteria) => {
    // Generasi profil NPC dinamis
  }
};
```

---

## 6. Strategi Pengujian Klien (Frontend Testing Strategy)

Agent 2 bertanggung jawab menjaga seluruh suite pengujian frontend dan menambahkan pengujian baru:

1. **Jalankan Pengujian Otomatis Saat Ini**:
   ```bash
   npm run test:frontend
   ```
   *Target: Seluruh 15 pengujian (API contract, Autosave Scheduler, RPG Math, Error Handler) lulus 100%.*
2. **Suite Tes Baru yang Wajib Ditulis**:
   * `frontend/tests/campaignBuilderWizard.test.js`: Memverifikasi validasi input step-by-step, kalkulasi difficulty slider, dan sanitasi payload premis.
   * `frontend/tests/combatDiceRoller.test.js`: Memverifikasi event trigger roll dadu, kalkulasi Natural 20 / Natural 1, dan pemetaan status effects D&D 5E.
   * `frontend/tests/campaignMockFallback.test.js`: Memastikan `campaignApi` otomatis beralih ke mock lokal tanpa crash ketika jaringan backend tidak aktif.

---

## 7. Tahapan Pengerjaan Agent 2 (Execution Timeline)

| Fase | Durasi Est. | Deskripsi Tugas | Hasil Akhir |
|---|---|---|---|
| **Fase 1: Audit & Polish Bugfix** | Hari 1 | Perbaiki lifecycle autosave `GameContext`, mobile clipping `DialogueBox`, dan AudioContext unlock. | Pengalaman visual novel bebas glitch di mobile & audio stabil. |
| **Fase 2: Mock Adapter & Campaign Context** | Hari 2 | Bangun `campaignMockApi.js` dan `CampaignContext.jsx` untuk menampung draf campaign. | Fondasi state manajemen campaign builder siap tanpa backend. |
| **Fase 3: Campaign Builder Studio UI** | Hari 3 | Bangun komponen wizard 3 langkah (`CampaignBuilderStudio.jsx`) dan preview card. | Antarmuka pembuatan petualangan kustom berfungsi penuh. |
| **Fase 4: Dynamic NPC Modal & Voice Test** | Hari 4 | Bangun kartu profil NPC dengan modulasi suara Web Audio API dan tombol reroll. | Fitur pratinjau NPC kustom interaktif. |
| **Fase 5: Combat Stage Visual Polish & Tension HUD** | Hari 5 | Implementasikan D20 animated dice roller, status badges, dan indikator tensi AI Director. | Stage pertarungan D&D dan HUD terasa sangat responsif dan hidup. |

---

## 8. Definition of Done (DoD) Agent 2

Pekerjaan Agent 2 dinyatakan selesai apabila:
* [ ] Seluruh skrip pengujian frontend (`npm run test:frontend`) lulus 100% tanpa error.
* [ ] Antarmuka Campaign Builder Studio dapat diakses dari menu utama dan berfungsi mulus baik dengan backend asli maupun mock fallback.
* [ ] Komponen DialogueBox responsif di layar mobile tanpa ada teks narasi yang terpotong.
* [ ] Animasi dadu D20 dan efek Natural 20/Natural 1 berjalan lancar tanpa frame drop.
* [ ] Web Audio API tidak memunculkan console warning audio context suspended.
* [ ] Tidak ada perubahan sekecil apa pun pada folder `backend/**` atau `api/**`.
