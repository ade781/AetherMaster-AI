const { getJson, postJson } = require('./test_story_controller_api');

async function runSaveLoadTests() {
  console.log('=== [PHASE 1.4] Testing Multi-Slot Local Save/Load & JSON Porter ===');

  // Step 1: Start a temporary game to get a session
  const campRes = await getJson('/api/story/campaigns');
  const campaign = campRes.data[0];

  const startRes = await postJson('/api/story/start', {
    campaignId: campaign.id,
    characterData: {
      name: 'SaveLoad Hero',
      race: 'elf',
      characterClass: 'mage'
    }
  });
  const session = startRes.data.session;
  const character = startRes.data.character;

  // Step 2: Test saving to Manual Slot 1
  const saveRes = await postJson('/api/story/saves/save', {
    sessionId: session.id,
    slotNumber: 1,
    saveTitle: 'Manual Slot 1 - Test Save'
  });
  if (!saveRes.success) throw new Error('Save to slot 1 failed: ' + JSON.stringify(saveRes));
  console.log('✓ POST /api/story/saves/save: Saved session to Slot 1 (OK)');

  // Step 3: Test reading all slots
  const slotsRes = await getJson('/api/story/saves');
  if (!slotsRes.success || !slotsRes.data['1'] || slotsRes.data['1'].characterName !== character.name) {
    throw new Error('GET /api/story/saves did not return slot 1 correctly: ' + JSON.stringify(slotsRes));
  }
  console.log(`✓ GET /api/story/saves: Found Slot 1 with character "${slotsRes.data['1'].characterName}" (OK)`);

  // Step 4: Test loading from Slot 1
  const loadRes = await getJson('/api/story/saves/load/1');
  if (!loadRes.success || loadRes.data.session.id !== session.id) {
    throw new Error('GET /api/story/saves/load/1 failed: ' + JSON.stringify(loadRes));
  }
  console.log('✓ GET /api/story/saves/load/1: Loaded session data matches saved record (OK)');

  // Step 5: Test JSON export
  const exportRes = await getJson(`/api/story/saves/export/${session.id}`);
  if (!exportRes.exportVersion || !exportRes.character || !Array.isArray(exportRes.nodes)) {
    throw new Error('GET /api/story/saves/export/:sessionId invalid format: ' + JSON.stringify(exportRes));
  }
  console.log(`✓ GET /api/story/saves/export/:sessionId: Exported JSON with ${exportRes.nodes.length} nodes (OK)`);

  // Step 6: Test JSON import
  const importRes = await postJson('/api/story/saves/import', {
    sessionData: exportRes
  });
  if (!importRes.success || !importRes.data.session || !importRes.data.character) {
    throw new Error('POST /api/story/saves/import failed: ' + JSON.stringify(importRes));
  }
  console.log(`✓ POST /api/story/saves/import: Imported new cloned session ${importRes.data.session.id} successfully (OK)`);

  console.log('✓ [PHASE 1.4 PASSED] All Multi-Slot Save/Load & JSON Porter tests succeeded!\n');
}

module.exports = { runSaveLoadTests };
