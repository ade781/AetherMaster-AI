# PANDUAN TUGAS AGENT 1: GAME STATE ENGINE, DATABASE & REWIND PERSISTENCE

**Role:** Senior Backend & Database Architect  
**Fokus Utama:** Menjadikan backend sebagai satu-satunya *Single Source of Truth* untuk game state, membangun Game State Engine terpusat, mengelola database models, item master data, quest & objective engine, structured world ledger, serta menjamin keutuhan dan atomisitas Save/Load dan Rewind.  
**Target Eksekusi:** Berjalan paralel bersamaan dengan Agent 2 dan Agent 3 tanpa tabrakan file (*zero merge conflicts*).

---

## 1. BATASAN KEPEMILIKAN FILE (STRICT FILE BOUNDARIES)

Untuk mencegah tabrakan dengan Agent 2 dan Agent 3 yang berjalan bersamaan, patuhi aturan kepemilikan file berikut:

### File & Folder Milik Agent 1 (Boleh Dibuat & Dimodifikasi):
- `backend/src/engine/gameStateEngine.js` *(Baru)*
- `backend/src/engine/itemMaster.js` *(Baru)*
- `backend/src/engine/questEngine.js` *(Baru)*
- `backend/src/engine/worldLedgerService.js` *(Baru)*
- `backend/src/engine/index.js` *(Baru - entry point export modul engine)*
- `backend/src/models/StoryNode.js`
- `backend/src/models/Character.js`
- `backend/src/models/GameSession.js`
- `backend/src/models/Campaign.js`
- `backend/src/models/index.js`
- `backend/src/models/seeders/campaignSeeder.js`
- `backend/src/controllers/saveLoadController.js`
- `backend/src/config/database.js`

### DILARANG KERAS Disentuh Oleh Agent 1 (Dikelola Agent Lain):
- ❌ `backend/src/services/geminiService.js` *(Milik Agent 2)*
- ❌ `backend/src/services/narrative/*` *(Milik Agent 2)*
- ❌ `backend/src/controllers/storyController.js` *(Milik Agent 3)*
- ❌ `backend/src/routes/storyRoutes.js` *(Milik Agent 3)*
- ❌ `backend/src/engine/combatEngine.js` *(Milik Agent 3)*
- ❌ Seluruh folder `frontend/` *(Milik Agent 3)*

---

## 2. KONTRAK INTERFACE (EXPORTS UNTUK AGENT LAIN)

Agent 1 harus mengekspor modul engine melalui `backend/src/engine/index.js` sehingga Agent 3 dapat langsung menggunakannya di `storyController.js` tanpa perlu mengubah kode internal engine Agent 1:

```javascript
// backend/src/engine/index.js
module.exports = {
  gameStateEngine: require('./gameStateEngine'),
  itemMaster: require('./itemMaster'),
  questEngine: require('./questEngine'),
  worldLedgerService: require('./worldLedgerService'),
};
```

### Spesifikasi Kontrak Fungsi:

1. **`gameStateEngine.resolveAction(session, character, currentNode, actionIntent, aiStateUpdates)`**
   - Menghitung mutasi HP, Mana, Gold, Inventory, dan Status Effects secara deterministik.
   - Tidak pernah mempercayai angka mentah dari AI tanpa clamp/validasi.
   - Mengembalikan: `{ validatedUpdates: { hpChange, manaChange, goldChange, addedItems, removedItems }, updatedCharacterState, isGameOver, gameOverReason }`.

2. **`gameStateEngine.createSnapshot(character, session, currentNode)`**
   - Menghasilkan object snapshot lengkap untuk disimpan di `StoryNode.gameStateSnapshot`:
     `{ hp, maxHp, mana, maxMana, gold, inventory, equippedItems, statusEffects, worldLedger, missionLog, combatState, turnCount, isGameOver }`.

3. **`gameStateEngine.restoreSnapshot(targetNode, session, character, transaction)`**
   - Mengembalikan seluruh character & session state ke snapshot target secara atomik.
   - Jangan pernah mengembalikan HP ke 50% secara otomatis jika target snapshot menunjukkan nilai lain.

4. **`itemMaster.getItem(itemId)`** dan **`itemMaster.applyItem(character, itemId)`**
   - Mengembalikan metadata item resmi dan kalkulasi efek consumable (HP/mana restoration) tanpa bergantung pada pencocokan string nama item.

5. **`questEngine.evaluateObjectives(session, campaign, worldLedger, actionContext)`**
   - Mengevaluasi apakah objective selesai dan apakah kondisi ending tercapai (BUKAN berdasarkan `turnCount >= 11`).

6. **`worldLedgerService.addFact(worldLedger, factObject)`** dan **`worldLedgerService.getRelevantFacts(worldLedger, queryContext)`**
   - Mengelola fakta dunia terstruktur `{ id, type, target, turn, timestamp, data }`.

---

## 3. TUGAS DETAIL AGENT 1

### Tugas 1: Deterministic Game State Engine (`backend/src/engine/gameStateEngine.js`)
- Pindahkan logika penentuan HP, mana, dan gold dari Gemini ke backend engine.
- Pastikan HP tidak pernah melampaui `maxHp` dan tidak negatif.
- Pastikan Mana tidak melebihi `maxMana` dan tidak negatif.
- Pastikan Gold tidak negatif.
- Tangani kondisi kematian: jika `hp <= 0`, set `isGameOver = true`.

### Tugas 2: Item Master Data & Konsistensi ID (`backend/src/engine/itemMaster.js`)
- Buat katalog konstan master data item (`ITEMS = { ... }`).
- Hilangkan pengecekan string manual seperti `item.id.includes('potion')`. Efek item harus didefinisikan secara eksplisit:
  ```javascript
  {
    id: "item_01_health_potion",
    name: "Potion of Healing",
    category: "consumable",
    effect: { hp: 25, mana: 0 },
    icon: "potion_heal"
  }
  ```
- Normalisasi ID item lama jika ada perbedaan (misal `item_01_potion_heal` vs `item_01_health_potion`) dengan alias map.

### Tugas 3: Quest & Objective Engine (`backend/src/engine/questEngine.js`)
- Hapus ketergantungan ending pada `turnCount >= 11` atau `turnCount >= 12`.
- Ending kemenangan hanya boleh terpicu jika:
  - `mainQuestCompleted === true` ATAU
  - Seluruh *required objectives* pada campaign telah tervalidasi selesai.
- Sinkronisasi `missionLog` agar selalu mencerminkan state quest aktif.

### Tugas 4: Structured World Ledger (`backend/src/engine/worldLedgerService.js`)
- Ubah `worldLedger` dari kumpulan string narasi arbitrer menjadi struktur fakta terindeks:
  ```javascript
  {
    facts: [
      { id: "fact_001", type: "NPC_MET", target: "barkeep", turn: 1 },
      { id: "fact_002", type: "ITEM_ACQUIRED", target: "skeleton_key", turn: 3 }
    ],
    flags: { crypt_unlocked: true },
    reputation: { goblin_faction: 2 }
  }
  ```
- Dukung de-duplikasi fakta dan query fakta relevan untuk context rolling history.

### Tugas 5: Rewind Snapshot & Atomic Restore (`StoryNode.js` & `saveLoadController.js`)
- Perbarui model `StoryNode.js` agar memiliki field `gameStateSnapshot` bertipe `JSON`/`JSONB`.
- Perbaiki logika rewind pada `saveLoadController.js` (dan helper restore):
  - Ambil snapshot dari node tujuan.
  - Pulihkan seluruh status: `hp`, `mana`, `gold`, `inventory`, `equippedItems`, `statusEffects`, `worldLedger`, `missionLog`, `combatState`.
  - Jalankan operasi restore dalam database transaction (`sequelize.transaction`).
  - Tolak rewind jika node bukan milik session aktif.

### Tugas 6: Database Transactions & Production Safety
- Perbaiki `saveLoadController.js` pada operasi cloning save slot (2-stage node cloning dengan mapping `parentNodeId` dalam satu transaksi database).
- Audit `backend/src/config/database.js`:
  - Hindari `sequelize.sync({ alter: true })` otomatis di lingkungan production.
  - Sediakan mekanisme safe sync atau migration readiness.

---

## 4. DEFINITION OF DONE UNTUK AGENT 1

- [ ] Modul `backend/src/engine/` (`gameStateEngine.js`, `itemMaster.js`, `questEngine.js`, `worldLedgerService.js`, `index.js`) selesai dan lulus sintaks Node.js.
- [ ] Database model `StoryNode.js` memiliki `gameStateSnapshot`.
- [ ] Logika rewind mampu mengembalikan HP, inventory, worldLedger, dan quest flags secara utuh dari snapshot.
- [ ] Penentuan ending tidak lagi menggunakan perbandingan `turnCount >= 11`.
- [ ] Item catalog memiliki ID konsisten dan kalkulasi efek eksplisit.
- [ ] Seluruh operasi multi-tabel pada save/load dan rewind menggunakan database transaction.
- [ ] Tidak ada file milik Agent 2 atau Agent 3 yang dimodifikasi.
