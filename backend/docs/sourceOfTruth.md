# AetherMaster Backend: Source of Truth & Domain Architecture

## 1. Domain Entities & State Ownership

| Model / Entity | Source of Truth For | Mutated By | Read Access | Persistence |
|---|---|---|---|---|
| **GameSession** | Active session state (`turnCount`, `currentSceneId`, `activeBranchId`, `combatState`, `worldLedger`, `missionLog`, `isGameOver`, `slotNumber`, `saveTitle`) | `storyActionService`, `gameStateEngine`, `saveLoadService`, `combatEngine` | Controllers, client responses, prompt builders | `game_sessions` table in SQLite/MySQL/PostgreSQL |
| **Character** | RPG core stats (`hp`, `maxHp`, `mana`, `maxMana`, `gold`, `level`, `inventory`, `equippedItems`, `statusEffects`, attributes) | Strict mutator methods in `gameStateEngine.resolveAction` & `combatEngine` (never directly from AI output) | Narrative prompt builder, HUD, inventory queries | `characters` table |
| **StoryNode** | Immutable story graph nodes (dialogue, chapter, location, speaker, choices, scene background) | Created append-only on action dispatch; updated on branch abandonment | Backlog queries, story tree visualizer, rewind resolution | `story_nodes` table |
| **StoryChoice** | Choices offered by each story node | Created alongside `StoryNode` | Action dispatch validator | `story_choices` table |
| **StorySnapshot** | Historical point-in-time state tied to a `StoryNode` | Created once per node in `StoryActionService` | `rewindService` to deterministically restore `Character` and `GameSession` state | `story_snapshots` table |
| **WorldFact** | Diegetic narrative facts and discoveries | `WorldFactRepository.addFact` (filtered by session and branch) | Prompt context builder, ledger exporter | `world_facts` table |

---

## 2. Invariant Guarantees

1. **HP & Mana Bounds**:
   - `0 <= hp <= maxHp`
   - `0 <= mana <= maxMana`
   - Handled exclusively via `gameStateEngine.js` with `Math.min` / `Math.max` clamping.
2. **Gold Bound**:
   - `gold >= 0` (cannot be negative).
3. **Inventory Integrity**:
   - Items can only be added if registered in canonical `itemMaster`.
   - Items can only be consumed if existing in character inventory with `quantity >= 1`.
   - Halucinated item IDs from LLM are ignored and discarded.
4. **Graph Cloning & Save/Load**:
   - Slots are completely isolated: cloning creates new rows in DB with full ID remapping (`parentNodeId`, `sourceNodeId`, `currentSceneId`).
   - JSON export/import strictly validates schema with Zod (`importSchema`) and re-generates all IDs to prevent ID spoofing or collision.
5. **API Error Contract**:
   - All errors return `{ success: false, error: { code: string, message: string } }`.
