# PANDUAN TUGAS AGENT 2: AI NARRATIVE, GEMINI SERVICE & STRUCTURED SCHEMAS

**Role:** Senior AI Narrative Architect & LLM Engineer  
**Fokus Utama:** Merefaktor service AI Dungeon Master/Gemini agar menghasilkan narasi taktis berkualitas tinggi, memvalidasi output melalui Zod schema yang ketat (tanpa `z.any()`), menerapkan Structured JSON Output dan retry terkontrol, membangun modul Intent Classification, merapikan struktur prompt, serta menghapus template fallback yang memberikan reward/damage arbitrer.  
**Target Eksekusi:** Berjalan paralel bersamaan dengan Agent 1 dan Agent 3 tanpa tabrakan file (*zero merge conflicts*).

---

## 1. BATASAN KEPEMILIKAN FILE (STRICT FILE BOUNDARIES)

Untuk mencegah tabrakan dengan Agent 1 dan Agent 3 yang berjalan bersamaan, patuhi aturan kepemilikan file berikut:

### File & Folder Milik Agent 2 (Boleh Dibuat & Dimodifikasi):
- `backend/src/services/geminiService.js` *(Main export adapter)*
- `backend/src/services/narrative/sceneSchema.js` *(Baru - Strict Zod Schemas)*
- `backend/src/services/narrative/promptBuilder.js` *(Baru - Modular System Prompts)*
- `backend/src/services/narrative/intentResolver.js` *(Baru - Intent Classification & Diegetic Checking)*
- `backend/src/services/narrative/geminiClient.js` *(Baru - SDK Caller, Retry, Error Handling)*
- `backend/src/services/narrative/fallbackGenerator.js` *(Baru - Contextual Safe Fallback)*
- `backend/src/services/narrative/index.js` *(Baru)*

### DILARANG KERAS Disentuh Oleh Agent 2 (Dikelola Agent Lain):
- ❌ `backend/src/models/*` *(Milik Agent 1)*
- ❌ `backend/src/engine/gameStateEngine.js`, `itemMaster.js`, `questEngine.js` *(Milik Agent 1)*
- ❌ `backend/src/controllers/saveLoadController.js` *(Milik Agent 1)*
- ❌ `backend/src/controllers/storyController.js` *(Milik Agent 3)*
- ❌ `backend/src/routes/storyRoutes.js` *(Milik Agent 3)*
- ❌ `backend/src/engine/combatEngine.js` *(Milik Agent 3)*
- ❌ Seluruh folder `frontend/` *(Milik Agent 3)*

---

## 2. KONTRAK INTERFACE (EXPORTS UNTUK AGENT LAIN)

Agent 2 wajib mempertahankan interface publik dari `backend/src/services/geminiService.js` agar Agent 3 di `storyController.js` dapat memanggilnya secara *backward-compatible*:

```javascript
// backend/src/services/geminiService.js
module.exports = {
  generateOpeningScene: async ({ campaign, character }) => { ... },
  generateNextScene: async ({
    previousNode,
    actionTaken,
    character,
    session,
    worldLedger,
    recentHistory,
    questState
  }) => { ... },
  resolvePlayerIntent: (actionText, context) => { ... },
  sceneSchema,
  choiceSchema
};
```

### Spesifikasi Output `generateNextScene` & `generateOpeningScene`:
Output JSON harus tervalidasi dan memiliki struktur standar yang diharapkan frontend dan backend:
```json
{
  "chapterTitle": "string",
  "location": "string",
  "backgroundId": "string",
  "speaker": "string",
  "characterId": "string",
  "mood": "neutral | tense | heroic | mysterious | danger | victory",
  "dialogue": "string",
  "consequenceNote": "string (opsional)",
  "stateUpdates": {
    "proposedHpChange": 0,
    "proposedManaChange": 0,
    "proposedGoldChange": 0,
    "receivedItemId": "string | null",
    "consumedItemId": "string | null",
    "reputationChange": { "factionId": "number" },
    "factDiscovered": "string | null"
  },
  "choices": [
    {
      "id": "choice_1",
      "text": "string",
      "tone": "cautious | aggressive | diplomatic | inquisitive",
      "actionType": "INVESTIGATE | ATTACK | TALK | MOVE | USE_ITEM"
    }
  ],
  "combatEncounter": null | {
    "encounterId": "string",
    "enemyId": "string",
    "enemyName": "string",
    "enemyHp": "number",
    "enemyMaxHp": "number",
    "enemyAttack": "number",
    "enemyDefense": "number"
  },
  "missionLog": {
    "title": "string",
    "objective": "string",
    "status": "active | completed | failed"
  }
}
```

---

## 3. TUGAS DETAIL AGENT 2

### Tugas 1: Strict Zod Data Schemas (`backend/src/services/narrative/sceneSchema.js`)
- Hapus semua penggunaan `z.any()`:
  - `receivedItem: z.any()` ➔ Ganti dengan schema terstruktur atau ID item yang valid.
  - `consumedItem: z.any()` ➔ Ganti dengan schema terstruktur atau ID item yang valid.
  - `combatEncounter: z.any()` ➔ Ganti dengan schema eksplisit (`enemyId`, `enemyName`, `enemyHp`, dll.).
- Validasi enum `mood`, `tone`, serta batas panjang string narasi agar tidak menghasilkan teks kosong atau rusak.

### Tugas 2: Reliable JSON Parsing & Structured Output (`geminiClient.js`)
- Jangan mengandalkan regex mentah `rawText.match(/\{[\s\S]*\}/)` sebagai parser utama yang rapuh.
- Manfaatkan response schema / structured JSON output dari Google GenAI SDK (`@google/genai`).
- Buat mekanisme pembersihan dan parsing bertingkat:
  1. Parsing via SDK / native JSON.
  2. Zod schema validation.
  3. Pembersihan markdown ticks (````json ... ````) jika model mengembalikan format markdown.
  4. Jika JSON rusak, lakukan perbaikan parsing ringan (JSON-repair) sebelum mengaktifkan fallback.

### Tugas 3: Intent Classification & Out-of-Context Handling (`intentResolver.js`)
- Bangun klasifikasi intent aksi pemain:
  `TALK`, `INVESTIGATE`, `MOVE`, `ATTACK`, `MAGIC`, `STEALTH`, `USE_ITEM`, `OBSERVE`, `INTERACT`, `UNKNOWN`.
- Deteksi aksi non-diegetik / modern (seperti "membuka smartphone", "menembak dengan AK-47"):
  - **ATURAN:** Jangan langsung menghukum pemain dengan pengurangan HP!
  - Berikan respons diegetik yang masuk akal di dunia fantasi: NPC bingung, mantra gagal terwujud, atau aksi tidak mungkin dilakukan, tanpa merusak game state.

### Tugas 4: Contextual Fallback Generator (`fallbackGenerator.js`)
- Hapus ketergantungan fallback pada rangkaian panjang `if/else` keyword hardcoded.
- Hapus kebiasaan fallback memberikan reward cuma-cuma:
  - ❌ DILARANG memberikan `goldDelta = 15; receivedItem = ...` hanya karena pemain bertanya ke NPC.
  - ❌ DILARANG memaksakan kemenangan pada `turnCount >= 11`.
- Fallback harus mempertahankan:
  - Lokasi saat ini (`location`)
  - Karakter dan NPC yang relevan (`speaker`, `characterId`)
  - Konteks aksi pemain
  - Pilihan kelanjutan yang masuk akal dan tetap mengikuti `sceneSchema`.

### Tugas 5: Modular Prompt Engineering (`promptBuilder.js`)
- Pecah monolithic prompt menjadi blok-blok modular:
  1. `ROLE`: Peran sebagai Game Master adaptif, taktis, dan konsisten.
  2. `WORLD_RULES`: Setting fantasi, aturan dunia, larangan hal modern/anachronistic.
  3. `CURRENT_STATE`: Lokasi, status karakter, item di inventory, fakta penting dari World Ledger.
  4. `RECENT_EVENTS`: Ringkasan aksi dan konsekuensi turn sebelumnya (rolling window terfokus).
  5. `PLAYER_ACTION`: Aksi pemain saat ini beserta intent yang telah dipetakan.
  6. `OUTPUT_CONTRACT`: Instruksi skema JSON yang wajib ditaati.
- Pertahankan panduan narasi: Bahasa Indonesia, taktis, no em-dash, no dice roll di narasi, deskripsi visual yang tajam.

### Tugas 6: Error Handling & Resilience (`geminiClient.js`)
- Klasifikasikan jenis error Gemini:
  - *Authentication / API Key Error* (hentikan retry, log peringatan tanpa membocorkan key).
  - *Rate Limit (429)* (exponential backoff terbatas).
  - *Timeout* (retry maksimal 1x sebelum fallback).
  - *Schema / Malformed Output* (retry dengan koreksi prompt atau aktifkan fallback).
- **KEAMANAN:** Pastikan API key TIDAK PERNAH dicetak ke console atau log file.

---

## 4. DEFINITION OF DONE UNTUK AGENT 2

- [ ] Tidak ada lagi `z.any()` pada skema scene, choice, item, atau combat encounter.
- [ ] Parsing output JSON tidak lagi crash ketika menerima formatting markdown atau karakter khusus.
- [ ] Deteksi aksi modern/invalid merespons secara diegetik tanpa memberi penalti HP arbitrer.
- [ ] Fallback generator tidak memberikan gold/item gratis tanpa alasan mekanis.
- [ ] Retry error terklasifikasi dan tidak membocorkan credential di log.
- [ ] `geminiService.js` tetap mengekspor fungsi yang kompatibel dengan kontrak Agent 3.
- [ ] Tidak ada file milik Agent 1 atau Agent 3 yang disentuh.
