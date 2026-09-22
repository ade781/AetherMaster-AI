const geminiService = require('../backend/src/services/geminiService');

async function runGeminiAndFallbackTests() {
  console.log('=== [PHASE 1.5] Testing Gemini AI Service & Deterministic Fallback ===');

  const dummyCampaign = {
    id: 'whispering_tavern',
    title: 'Misteri Kedai Whispering Tavern',
    genre: 'dark_fantasy',
    premise: 'Sebuah desas-desus kelam menyebar dari ruang bawah tanah kedai tua.'
  };

  const dummyCharacter = {
    name: 'Gareth the Bold',
    characterClass: 'warrior',
    race: 'human',
    level: 1,
    hp: 35,
    maxHp: 35,
    gold: 40
  };

  // Test 1: Generate Opening Scene (Gemini or Offline Fallback)
  const opening = await geminiService.generateOpeningScene(dummyCampaign, dummyCharacter);

  if (!opening.chapterTitle || !opening.location || !opening.dialogue || !Array.isArray(opening.choices)) {
    throw new Error('Invalid opening scene structure: ' + JSON.stringify(opening));
  }
  if (opening.choices.length === 0) {
    throw new Error('Opening scene must provide at least 1 choice');
  }
  for (const c of opening.choices) {
    if (!c.id || !c.text || !c.statType || typeof c.dc !== 'number') {
      throw new Error('Choice item missing mandatory fields (id, text, statType, dc): ' + JSON.stringify(c));
    }
  }
  console.log(`✓ Opening Scene Generation: Chapter "${opening.chapterTitle}" with ${opening.choices.length} DC choices (OK)`);

  // Test 2: Next Scene Generation
  const dummyNode = {
    id: 'node_test_root',
    chapterTitle: opening.chapterTitle,
    location: opening.location,
    dialogueText: opening.dialogue
  };

  const next = await geminiService.generateNextScene({
    session: { turnCount: 1, worldLedger: {} },
    character: dummyCharacter,
    previousNode: dummyNode,
    actionTaken: opening.choices[0],
    checkResult: { roll: 14, modifier: 3, total: 17, isSuccess: true, isNat20: false, isNat1: false }
  });

  if (!next.chapterTitle || !next.dialogue || !Array.isArray(next.choices)) {
    throw new Error('Invalid next scene structure: ' + JSON.stringify(next));
  }
  console.log(`✓ Next Scene Generation: Consequence note: "${next.consequenceNote || 'None'}" (OK)`);

  console.log('✓ [PHASE 1.5 PASSED] Gemini AI & Deterministic Fallback tests succeeded!\n');
}

module.exports = { runGeminiAndFallbackTests };
