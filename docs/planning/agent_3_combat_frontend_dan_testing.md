# PANDUAN TUGAS AGENT 3: COMBAT ENGINE, ORKESTRASI CONTROLLER, FRONTEND STATE & TESTING

**Role:** Senior Full-Stack Orchestrator, Combat Systems & QA Integration Engineer  
**Fokus Utama:** Mengorkestrasikan alur game di `storyController.js` dengan menghubungkan Game State Engine (milik Agent 1) dan Gemini Service (milik Agent 2), membangun Combat Engine yang valid dan deterministik, membersihkan frontend agar tidak memanipulasi game state secara langsung, serta menyusun rangkaian automated test terpadu.  
**Target Eksekusi:** Berjalan paralel bersamaan dengan Agent 1 dan Agent 2 tanpa tabrakan file (*zero merge conflicts*).

---

## 1. BATASAN KEPEMILIKAN FILE (STRICT FILE BOUNDARIES)

Untuk mencegah tabrakan dengan Agent 1 dan Agent 2 yang berjalan bersamaan, patuhi aturan kepemilikan file berikut:

### File & Folder Milik Agent 3 (Boleh Dibuat & Dimodifikasi):
- `backend/src/controllers/storyController.js` *(Main Orchestration)*
- `backend/src/routes/storyRoutes.js`
- `backend/src/engine/combatEngine.js` *(Baru - Server-side combat rules)*
- `backend/src/utils/logger.js` *(Baru - Structured Logging)*
- `backend/tests/` *(Baru - Seluruh file unit & integration test)*
- `frontend/src/store/GameContext.jsx`
- `frontend/src/components/CombatStage.jsx`
- `frontend/src/components/VisualNovelStage.jsx`
- `frontend/src/components/SaveLoadModal.jsx`
- `frontend/src/services/` *(Jika ada adaptasi endpoint API story/combat)*

### DILARANG KERAS Disentuh Oleh Agent 3 (Dikelola Agent Lain):
- ❌ `backend/src/models/*` *(Milik Agent 1)*
- ❌ `backend/src/engine/gameStateEngine.js`, `itemMaster.js`, `questEngine.js`, `worldLedgerService.js` *(Milik Agent 1)*
- ❌ `backend/src/controllers/saveLoadController.js` *(Milik Agent 1)*
- ❌ `backend/src/config/database.js` *(Milik Agent 1)*
- ❌ `backend/src/services/geminiService.js` *(Milik Agent 2)*
- ❌ `backend/src/services/narrative/*` *(Milik Agent 2)*

---

## 2. CARA AGENT 3 MENGHUBUNGKAN HASIL AGENT 1 & AGENT 2

Agent 3 bertindak sebagai jembatan integrasi utama di `backend/src/controllers/storyController.js`:

```javascript
// Di dalam backend/src/controllers/storyController.js
const { gameStateEngine, itemMaster, questEngine, worldLedgerService } = require('../engine');
const geminiService = require('../services/geminiService');
const combatEngine = require('../engine/combatEngine');
```

### Flow Eksekusi `submitAction`:
1. Terima aksi pemain (`choiceId` atau `customText`).
2. Minta AI narrative & intent dari Agent 2: `geminiService.generateNextScene(...)`.
3. Validasi & hitung state deterministik menggunakan modul Agent 1: `gameStateEngine.resolveAction(...)`.
4. Periksa objective & ending dari Agent 1: `questEngine.evaluateObjectives(...)`.
5. Catat fakta dunia ke ledger Agent 1: `worldLedgerService.addFact(...)`.
6. Simpan node baru dengan snapshot lengkap Agent 1: `gameStateEngine.createSnapshot(...)`.
7. Kirimkan respon bersih ke frontend (status tervalidasi, tanpa kebocoran internal stack).

---

## 3. TUGAS DETAIL AGENT 3

### Tugas 1: Server-Side Combat Engine (`backend/src/engine/combatEngine.js`)
- **Tolak Combat Siluman:** Endpoint combat (`/combat/action`) HANYA boleh berjalan jika `currentNode` memiliki `combatEncounter` yang valid. Jika tidak ada encounter, return **HTTP 400 Bad Request**. Jangan membuat enemy default secara diam-diam!
- **Kalkulasi Damage di Server:** Frontend dilarang mengirimkan hasil damage atau sisa HP enemy. Backend menghitung akurasi, attack, defense, damage dealt, dan damage received berdasarkan formula RPG.
- **Combat State Lifecycle:** Kelola state pertarungan:
  - `ACTIVE` -> kalkulasi giliran (player turn -> enemy turn).
  - `VICTORY` -> update encounter selesai, berikan exp/loot yang tervalidasi, simpan ke database.
  - `DEFEAT` -> set `character.hp = 0`, trigger game over state.

### Tugas 2: Pembersihan State Frontend (`frontend/src/`)
- Audit `frontend/src/store/GameContext.jsx` dan `CombatStage.jsx`:
  - Hapus kode di mana client memanipulasi HP, Mana, Gold, atau Inventory secara lokal tanpa konfirmasi backend.
  - Pastikan client hanya bertindak sebagai:
    1. Pengirim aksi (`dispatchAction`).
    2. Penampil indikator loading dan animasi aksi.
    3. Perender state yang dikembalikan secara resmi oleh server.
- Pastikan `CombatStage.jsx` mengonsumsi state dari endpoint `/combat/action` yang terverifikasi.

### Tugas 3: Refactor & Pengamanan `storyController.js`
- Bersihkan fungsi `advanceStoryState`, `submitAction`, dan `combatAction` agar tidak mengubah properti model secara tersebar (`character.hp += ...` secara acak). Seluruh perubahan harus lewat `gameStateEngine`.
- Wrap operasi mutasi multi-tabel dalam transaksi database `sequelize.transaction`.
- Format pesan error: Di mode production, jangan pernah mengembalikan stack trace atau detail query SQL ke client. Cukup `{ success: false, error: "Internal server error" }`.

### Tugas 4: Structured Logging System (`backend/src/utils/logger.js`)
- Buat logger terstruktur yang mencatat:
  - `TURN`, `SESSION_ID`, `PLAYER_ACTION`, `RESOLVED_INTENT`, `HP_BEFORE/AFTER`, `NARRATIVE_RESULT`.
- **KEAMANAN:** Filter dan sembunyikan semua data sensitif (API key, token otentikasi, credentials).

### Tugas 5: Comprehensive Automated Testing (`backend/tests/`)
Buat test suite menggunakan runner yang tersedia (seperti Jest / Mocha / Node test runner) untuk memverifikasi fungsionalitas inti:
1. **Normal Action Test:** Aksi petualangan standar menghasilkan scene baru yang valid.
2. **Invalid / Modern Action Test:** Aksi out-of-context (misal: "buka smartphone") ditangani secara diegetik tanpa crash dan tanpa pengurangan HP arbitrer.
3. **Item Consumption Test:** Pemain tidak dapat menggunakan potion jika inventory kosong; pemakaian item menambah HP secara benar.
4. **Combat Validation Test:** Memanggil endpoint combat tanpa encounter aktif langsung ditolak (HTTP 400).
5. **Combat Damage Calculation Test:** Damage enemy dan player dihitung akurat di server.
6. **State Boundary Test:** HP tidak dapat melebihi `maxHp` dan tidak bisa di bawah 0; Gold tidak bisa negatif.
7. **Rewind State Test:** Memanggil rewind mengembalikan status HP, inventory, dan world ledger ke kondisi node tujuan.
8. **Objective-Based Ending Test:** Skenario turn ke-12 tidak langsung memicu kemenangan jika quest belum selesai.

---

## 4. DEFINITION OF DONE UNTUK AGENT 3

- [ ] Endpoint combat menolak aksi jika node tidak memiliki combat encounter valid (HTTP 400).
- [ ] Damage dan giliran combat dihitung sepenuhnya di backend (`combatEngine.js`).
- [ ] Frontend (`GameContext.jsx`, `CombatStage.jsx`) tidak memiliki state bypass atau manipulasi stats lokal.
- [ ] `storyController.js` bersih, mengorkestrasikan engine Agent 1 dan service Agent 2 secara modular.
- [ ] Logger terstruktur aktif tanpa mengekspos API key atau stack trace internal di response API.
- [ ] Test suite di `backend/tests/` berhasil dijalankan dan memverifikasi skenario-skenario kritis.
- [ ] Tidak ada file milik Agent 1 atau Agent 2 yang disentuh.
