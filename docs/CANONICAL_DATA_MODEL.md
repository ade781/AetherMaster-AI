# AetherMaster Canonical Data Model & Architecture Specification

## 1. Core Architectural Principles (Single Source of Truth)

AetherMaster enforces strict authority boundaries across all subsystems:

1. **Database as World Data Authority**:
   All static and master world definitions (Campaigns, Locations, NPCs, Items, Quests, QuestObjectives) are stored and maintained solely in the database. In-memory catalogs and hardcoded arrays (`ITEM_CATALOG`, `DEFAULT_ITEM_CATALOG`, `CAMPAIGN_OBJECTIVES`) are deprecated and removed.

2. **GameStateEngine as Game State Authority**:
   Only `GameStateEngine` evaluates, mutates, and enforces rules on Character stats (HP, Mana, Gold), Inventory operations, and Game Over conditions. No controller or narrative service may bypass `GameStateEngine`.

3. **QuestEngine as Quest Progression Authority**:
   Quest progression is evaluated deterministically against database-defined Quests and QuestObjectives based on validated Game Events. Finishing the game (`finish_game`) or completing quests requires explicit satisfaction of objective criteria.

4. **WorldFact as Historical Truth**:
   The `WorldFact` table is the definitive record of chronological events, discoveries, and world modifications. The legacy `worldLedger` serves only as a transient derived cache for quick prompt construction and faction reputation tracking.

5. **StorySnapshot as Restore Authority**:
   The `StorySnapshot` table is the single source of truth for time rewinds and state restoration. Every `StoryNode` links directly to a `StorySnapshot` containing exact copies of character attributes, canonical inventory, quest state, and active flags.

6. **Gemini as Narrative Engine (Not Authority)**:
   LLM integrations (Gemini / Fallback Generator) provide atmospheric descriptions, character dialogue, and proposed actions. LLM output NEVER directly creates items, triggers game over, or bypasses state boundaries without backend validation.

7. **Frontend as Pure Renderer**:
   The client application never calculates game mechanics, inventory manipulation, or quest completion. It renders hydrated data provided by backend APIs.

---

## 2. Canonical Data Models

### 2.1 Item Definition & Inventory

#### Item Model (`Item` Table)
```typescript
interface ItemDefinition {
  id: string;               // Primary Key (e.g. "item_01_potion_heal")
  name: string;             // Display name (e.g. "Potion of Healing")
  description: string;      // Diegetic lore description
  category: string;         // "consumable" | "weapon" | "shield" | "relic" | "key" | "tool" | "misc"
  rarity: string;           // "common" | "uncommon" | "rare" | "epic" | "legendary"
  icon: string;             // Asset key
  maxStack: number;         // Maximum stack size (default: 10)
  isConsumable: boolean;    // Whether consumed upon use
  isUsable: boolean;        // Whether usable from inventory
  effectType: string;       // "HEAL_HP" | "RESTORE_MANA" | "ADD_GOLD" | "BUFF_AC" | etc.
  effectValue: number;      // Numeric magnitude of effect
  metadata: object;         // Additional parameters (e.g. { hp: 25, mana: 0, sellPrice: 15 })
}
```

#### Canonical Inventory Representation
Characters store inventory strictly as referenced items with counts:
```json
[
  { "itemId": "item_01_potion_heal", "quantity": 2 },
  { "itemId": "item_06_skeleton_key", "quantity": 1 }
]
```
When dispatched to frontend or AI context, the backend hydrates these references with full metadata from the `Item` database.

---

### 2.2 Quest & QuestObjective

#### Quest Model (`Quest` Table)
```typescript
interface Quest {
  id: string;               // e.g. "quest_whispering_tavern_main"
  campaignId: string;       // Foreign Key -> Campaign.id
  title: string;
  description: string;
  type: string;             // "main" | "side"
  status: string;           // "active" | "completed" | "failed"
  priority: number;
  targetLocationId?: string;// Foreign Key -> Location.id
  metadata: object;
}
```

#### QuestObjective Model (`QuestObjective` Table)
```typescript
interface QuestObjective {
  id: string;               // e.g. "obj_tavern_investigate"
  questId: string;          // Foreign Key -> Quest.id
  description: string;
  objectiveType: string;    // "INVESTIGATE" | "EXPLORE" | "TALK" | "DEFEAT" | "USE_ITEM"
  targetId?: string;        // ID of NPC, Location, Item, or Enemy
  requiredCount: number;    // e.g. 1
  sequence: number;         // Ordering (1, 2, 3...)
  isOptional: boolean;
  metadata: object;
}
```

#### Runtime Quest State
Stored in `GameSession.questState`:
```json
{
  "activeQuestId": "quest_whispering_tavern_main",
  "objectives": {
    "obj_tavern_investigate": { "currentCount": 1, "requiredCount": 1, "completed": true },
    "obj_tavern_find_catacomb": { "currentCount": 0, "requiredCount": 1, "completed": false },
    "obj_tavern_resolve_threat": { "currentCount": 0, "requiredCount": 1, "completed": false }
  },
  "completedQuestIds": [],
  "isMainQuestCompleted": false
}
```

---

### 2.3 Story Graph, Branching & Timeline

#### StoryNode Model (`StoryNode` Table)
```typescript
interface StoryNode {
  id: string;               // UUID Primary Key
  sessionId: string;        // UUID Foreign Key -> GameSession.id
  parentNodeId?: string;    // UUID Self-reference to previous node
  branchId: string;         // Branch identifier (default: "main")
  status: string;           // "ACTIVE" | "ABANDONED"
  chapterTitle: string;
  location: string;
  locationId?: string;      // Canonical location ID
  backgroundId: string;
  speaker: string;
  speakerId?: string;       // Canonical NPC ID
  characterId?: string;
  turnNumber: number;
  mood: string;
  dialogueText: string;
  consequenceNote?: string;
  combatEncounter?: object;
}
```

#### StoryChoice Model (`StoryChoice` Table)
Choices are stored as first-class relational entities:
```typescript
interface StoryChoice {
  id: string;               // UUID Primary Key
  storyNodeId: string;      // Foreign Key -> StoryNode.id
  choiceKey: string;        // Identifier within node (e.g. "choice_1")
  text: string;             // Choice display label
  actionType: string;       // "TALK" | "INVESTIGATE" | "COMBAT" | "NAVIGATE" | "USE_ITEM"
  tone: string;             // "cautious" | "diplomatic" | "aggressive" | "inquisitive"
  requiredItemId?: string;  // Item prerequisite
  sequence: number;         // Display ordering (1, 2, 3...)
}
```

#### StorySnapshot Model (`StorySnapshot` Table)
Official snapshot entity for deterministic rewind:
```typescript
interface StorySnapshot {
  id: string;               // UUID Primary Key
  storyNodeId: string;      // Foreign Key -> StoryNode.id
  characterState: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    gold: number;
    inventory: Array<{ itemId: string; quantity: number }>;
    equippedItems: Array<any>;
    statusEffects: Array<any>;
  };
  questState: object;       // Copy of runtime quest state
  worldState: {
    flags: Record<string, any>;
    reputation: Record<string, number>;
  };
}
```

#### WorldFact Model (`WorldFact` Table)
Official event log of the world:
```typescript
interface WorldFact {
  id: string;               // UUID Primary Key
  sessionId: string;        // Foreign Key -> GameSession.id
  sourceNodeId?: string;    // StoryNode where fact originated
  branchId: string;         // Branch ID (main, branch_xyz)
  subjectType: string;      // "NPC" | "LOCATION" | "ITEM" | "QUEST" | "WORLD_EVENT"
  subjectId?: string;
  factType: string;         // "ACQUISITION" | "DISCOVERY" | "DIALOGUE" | "DEFEAT"
  fact: string;             // Human-readable narrative fact
  importance: string;       // "critical" | "high" | "normal" | "low"
  turn: number;
  metadata: object;
}
```

---

## 3. Game Event & Action Pipeline

Every player interaction flows through an explicit deterministic lifecycle:

```
[Player Action] (Choice or Free Text)
       │
       ▼
[Action Validation] (Verify choice exists, item requirements met, session active)
       │
       ▼
[AI / Narrative Service] (Produces dialogue, scene context, proposed updates)
       │
       ▼
[AI Output Validation] (Verify receivedItemId, locationId, speakerId exist in DB)
       │
       ▼
[Internal Game Event Pipeline] (e.g. ITEM_ACQUIRED, NPC_TALKED, LOCATION_ENTERED)
       │
       ▼
[GameStateEngine] (Deterministically mutate HP/Mana/Gold, Inventory itemId+qty)
       │
       ▼
[QuestEngine] (Evaluate game events against DB QuestObjectives, update questState)
       │
       ▼
[WorldFact Creation] (Insert chronological facts linked to sessionId & active branch)
       │
       ▼
[StoryNode & StoryChoice Creation] (Save node and choices to database)
       │
       ▼
[StorySnapshot Creation] (Save snapshot of character, quest, and world state)
       │
       ▼
[Response to Client] (Hydrated character, node, choices, and runtime quest progress)
```

---

## 4. Branching & Rewind Policy (Approach B)

When a player rewinds to past Node `B` from current Node `D`:
1. The session's `currentSceneId` updates to Node `B`.
2. State is restored using `targetNode.snapshot` (`StorySnapshot`).
3. If the player makes a choice from Node `B` that creates a new successor Node `E`:
   - Future nodes that were downstream from `B` on the previous path (`C`, `D`) have their status updated to `ABANDONED`.
   - A new `branchId` is assigned to `E` (or marked as the active branch).
   - Only nodes with `status = 'ACTIVE'` (along the path to root) are included in Backlog, Journal, and AI Prompt Context.
   - World facts belonging to abandoned nodes are excluded from active story queries.
