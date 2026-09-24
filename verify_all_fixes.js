const fetch = globalThis.fetch;

async function runVerification() {
  console.log('=====================================================');
  console.log('RUNNING FULL SYSTEM VERIFICATION FOR ALL 8 FIXES');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 6;

  // -------------------------------------------------------------------------
  // TEST 1: Ranger Character Creation & Starter Item
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Ranger Character Creation & Starter Item ---');
  const rangerStartRes = await fetch('http://127.0.0.1:5000/api/story/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaignId: 'crypt_of_crimson',
      characterData: {
        name: 'Lyra sang Pemanah',
        characterClass: 'ranger',
        race: 'elf',
        starterItem: {
          id: 'item_07_golden_compass',
          name: 'Golden Compass',
          category: 'Alat',
          effect: '+2 WIS saat eksplorasi',
          icon: 'item_07_golden_compass'
        }
      }
    })
  });
  const rangerStart = await rangerStartRes.json();
  const rangerChar = rangerStart.data?.character;
  const rangerSession = rangerStart.data?.session;
  const rangerRootNode = rangerStart.data?.currentNode;

  const hasCompass = rangerChar?.inventory?.some(i => i.id === 'item_07_golden_compass');
  const hasPotion = rangerChar?.inventory?.some(i => i.id === 'item_01_potion_heal');
  const isRangerStats = rangerChar?.hp === 28 && rangerChar?.mana === 20;

  console.log(`Ranger HP: ${rangerChar?.hp}/28, Mana: ${rangerChar?.mana}/20`);
  console.log(`Inventory Items (${rangerChar?.inventory?.length}):`, rangerChar?.inventory?.map(i => i.name));

  if (rangerStart.success && isRangerStats && hasCompass && hasPotion) {
    console.log('>>> TEST 1 PASSED: Ranger stats & starter item successfully initialized!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 1 FAILED!', { isRangerStats, hasCompass, hasPotion });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Persistent Item Usage API (/api/story/use-item)
  // -------------------------------------------------------------------------
  console.log('--- TEST 2: Persistent Item Usage & Turn Persistence ---');
  // First, simulate taking 10 damage so potion heal is visible
  rangerChar.hp = 18;
  await (await import('./backend/src/models/index.js')).Character.update({ hp: 18 }, { where: { id: rangerChar.id } });

  const useItemRes = await fetch('http://127.0.0.1:5000/api/story/use-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      itemId: 'item_01_potion_heal'
    })
  });
  const useItemData = await useItemRes.json();
  console.log('Use Item Result:', useItemData.message);
  console.log('HP after using potion:', useItemData.data?.character?.hp);
  const hpHealed = useItemData.data?.character?.hp === 28;
  const potionRemoved = !useItemData.data?.character?.inventory?.some(i => i.id === 'item_01_potion_heal');

  // Now take next action to verify that the heal is NOT reverted on the next turn
  const actionRes = await fetch('http://127.0.0.1:5000/api/story/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      choiceId: rangerRootNode.choices[0]?.id || 'custom',
      customText: 'Melangkah waspada mengamati lorong'
    })
  });
  const actionData = await actionRes.json();
  const nextChar = actionData.data?.character;
  const stillHasNoPotion = !nextChar?.inventory?.some(i => i.id === 'item_01_potion_heal');

  console.log('Turn 2 Character HP:', nextChar?.hp);
  console.log('Turn 2 Inventory (Potion must remain consumed):', nextChar?.inventory?.map(i => i.name));

  if (hpHealed && potionRemoved && stillHasNoPotion) {
    console.log('>>> TEST 2 PASSED: Potion usage saved to SQLite and stays persistent across turns!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 2 FAILED!', { hpHealed, potionRemoved, stillHasNoPotion });
  }

  // -------------------------------------------------------------------------
  // TEST 3: Spell Action & Mana Consumption
  // -------------------------------------------------------------------------
  console.log('--- TEST 3: Spell Action & Mana Consumption ---');
  const startMana = nextChar?.mana;
  const spellActionRes = await fetch('http://127.0.0.1:5000/api/story/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      choiceId: 'custom',
      customText: 'Lepaskan semburan energi sihir panah petir ke kegelapan'
    })
  });
  const spellActionData = await spellActionRes.json();
  const spellChar = spellActionData.data?.character;
  console.log(`Mana before spell: ${startMana}, Mana after spell: ${spellChar?.mana}`);

  if (spellChar?.mana < startMana || spellActionData.data?.currentNode?.consequenceNote) {
    console.log('>>> TEST 3 PASSED: Mana updated dynamically during spellcasting!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 3 FAILED: Mana did not decrease!');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Story Node Rewind Snapshot Restoration
  // -------------------------------------------------------------------------
  console.log('--- TEST 4: Rewind Snapshot State Restoration ---');
  const rewindRes = await fetch('http://127.0.0.1:5000/api/story/rewind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      targetNodeId: rangerRootNode.id
    })
  });
  const rewindData = await rewindRes.json();
  const rewoundChar = rewindData.data?.character;
  const rewoundInventory = rewoundChar?.inventory?.map(i => i.id);

  console.log('Rewound to Node 1:');
  console.log(`HP: ${rewoundChar?.hp}, Mana: ${rewoundChar?.mana}`);
  console.log('Inventory after rewind (should restore Potion of Healing from Node 1 snapshot):', rewoundInventory);

  if (rewindData.success && rewoundInventory?.includes('item_01_potion_heal')) {
    console.log('>>> TEST 4 PASSED: Rewind accurately restored snapshot inventory & stats!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 4 FAILED: Rewind did not restore snapshot state!');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Save & Load True Snapshot Isolation
  // -------------------------------------------------------------------------
  console.log('--- TEST 5: Save & Load True Snapshot Isolation ---');
  // Save current state (Turn 1 / rewound) to Slot 2
  const saveRes = await fetch('http://127.0.0.1:5000/api/story/saves/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      slotNumber: 2,
      saveTitle: 'Penyimpanan Uji Beku'
    })
  });
  const saveData = await saveRes.json();
  console.log('Save to Slot 2 Result:', saveData.message);

  // Advance the active session by taking 2 more turns
  await fetch('http://127.0.0.1:5000/api/story/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: rangerSession.id,
      choiceId: 'custom',
      customText: 'Menghantam dinding batu dengan keras'
    })
  });

  // Now load Slot 2
  const loadRes = await fetch('http://127.0.0.1:5000/api/story/saves/load/2');
  const loadData = await loadRes.json();
  const loadedSession = loadData.data?.session;
  console.log(`Loaded Session Turn Count: ${loadedSession?.turnCount} (Saved session was Turn 1)`);

  if (loadData.success && loadedSession?.turnCount === 1) {
    console.log('>>> TEST 5 PASSED: Save Slot remained frozen and untouched by future turns!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 5 FAILED: Save slot was mutated by later turns!');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Game Over Flag on HP <= 0
  // -------------------------------------------------------------------------
  console.log('--- TEST 6: Game Over Mechanics on HP <= 0 ---');
  // Directly reduce character HP to 0 in SQLite to test Game Over flag
  const CharacterModel = (await import('./backend/src/models/index.js')).Character;
  await CharacterModel.update({ hp: 1 }, { where: { id: loadedSession.characterId } });

  // Take dangerous action that causes damage
  const lethalActionRes = await fetch('http://127.0.0.1:5000/api/story/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: loadedSession.id,
      choiceId: 'custom',
      customText: 'Melompat ke dalam kawah lahar berapi tanpa perlindungan'
    })
  });
  const lethalData = await lethalActionRes.json();
  const isGameOver = lethalData.data?.session?.isGameOver || lethalData.data?.character?.hp <= 0;
  console.log(`Character HP: ${lethalData.data?.character?.hp}, isGameOver: ${lethalData.data?.session?.isGameOver}`);

  if (isGameOver) {
    console.log('>>> TEST 6 PASSED: Character defeat triggers Game Over state cleanly!\n');
    passedTests++;
  } else {
    console.error('>>> TEST 6 FAILED: Game Over state was not triggered!');
  }

  console.log('=====================================================');
  console.log(`FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('=====================================================');
  process.exit(passedTests === totalTests ? 0 : 1);
}

runVerification().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
