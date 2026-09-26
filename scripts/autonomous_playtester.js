/**
 * Autonomous Playtester & QA Engine untuk AetherMaster AI
 * Mensimulasikan ratusan playthrough otonom dengan berbagai persona pemain
 * untuk mendeteksi: Softlock, Kematian Tak Adil, Bug Inventaris, dan Keseimbangan Babak 1-12.
 */

const { getEffectiveStats } = require('../backend/src/utils/statEngine');
const geminiService = require('../backend/src/services/geminiService');

// 1. Definisi 3 Persona Pemain Otomatis
const PERSONAS = {
  RECKLESS_BERSERKER: {
    name: 'Grom sang Berserker',
    class: 'Warrior',
    strategy: 'bold', // Mengutamakan pilihan 'bold', agresif, menerobos bahaya
    stats: { hp: 120, maxHp: 120, mana: 20, maxMana: 20, strength: 16, agility: 10, intelligence: 8 }
  },
  CAUTIOUS_TACTICIAN: {
    name: 'Lyra sang Penyelidik',
    class: 'Rogue',
    strategy: 'cautious', // Mengutamakan pilihan 'cautious', bertahan, menghindari bahaya
    stats: { hp: 90, maxHp: 90, mana: 40, maxMana: 40, strength: 10, agility: 16, intelligence: 12 }
  },
  CHAOS_MAGE: {
    name: 'Zarek sang Eksperimenter',
    class: 'Mage',
    strategy: 'curious', // Mengutamakan pilihan acak/aneh untuk menguji batas engine
    stats: { hp: 75, maxHp: 75, mana: 100, maxMana: 100, strength: 8, agility: 10, intelligence: 18 }
  }
};

// 2. Simulasi 1 Playthrough Penuh (Hingga Babak 12 atau Game Over)
async function simulatePlaythrough(personaKey, runIndex) {
  const persona = PERSONAS[personaKey];
  const charState = {
    name: persona.name,
    characterClass: persona.class,
    ...persona.stats,
    gold: 25,
    inventory: []
  };

  const logs = [];
  let turn = 1;
  let isGameOver = false;
  let gameOverReason = '';
  let fullInventoryDrops = 0;
  let lethalHazardHits = 0;

  // Opening scene simulasi
  let currentScene = await geminiService.generateOpeningScene(
    { title: 'Whispering Woods', defaultBackgroundId: 'bg_02_forest', defaultNpcId: 'char_npc_02_ranger' },
    charState
  );

  logs.push(`[Babak 1] ${currentScene.chapterTitle} | HP: ${charState.hp}/${charState.maxHp}`);

  while (turn <= 12 && !isGameOver) {
    // Evaluasi pilihan berdasarkan persona
    const choices = currentScene.choices || [];
    if (choices.length === 0) {
      isGameOver = true;
      gameOverReason = 'SOFTLOCK: Tidak ada pilihan yang tersedia di babak ini!';
      break;
    }

    // Pilih opsi sesuai strategi persona
    let selectedChoice = choices.find(c => c.tone === persona.strategy);
    if (!selectedChoice) {
      selectedChoice = choices[Math.floor(Math.random() * choices.length)];
    }

    // Cek apakah memilih opsi akhir di babak 12
    if (selectedChoice.id === 'finish_game' || turn === 12) {
      isGameOver = true;
      gameOverReason = 'VICTORY: Berhasil menuntaskan seluruh 12 Babak Petualangan!';
      break;
    }

    // Cek hazard lethal
    const lethalWords = ['lahar', 'magma', 'kawah', 'racun maut', 'jurang', 'bunuh diri'];
    const actText = (selectedChoice.text || '').toLowerCase();
    const isLethal = lethalWords.some(w => actText.includes(w));
    if (isLethal) lethalHazardHits++;

    // Generate adegan berikutnya
    const nextScene = await geminiService.generateNextScene({
      session: { turnCount: turn, Campaign: { defaultBackgroundId: 'bg_02_forest' }, worldLedger: {} },
      character: charState,
      previousNode: currentScene,
      actionTaken: selectedChoice,
      recentHistory: []
    });

    // Terapkan state updates
    const updates = nextScene.stateUpdates || {};
    charState.hp = Math.max(0, Math.min(charState.maxHp, charState.hp + (updates.hpChange || 0)));
    charState.mana = Math.max(0, Math.min(charState.maxMana, charState.mana + (updates.manaChange || 0)));
    charState.gold = Math.max(0, charState.gold + (updates.goldChange || 0));

    // Inventaris
    if (updates.receivedItem) {
      if (charState.inventory.length < 6) {
        charState.inventory.push(updates.receivedItem);
      } else {
        fullInventoryDrops++;
      }
    }

    turn++;
    currentScene = nextScene;

    // Cek Kematian
    if (charState.hp <= 0) {
      isGameOver = true;
      gameOverReason = `DEATH: Gugur di Babak ${turn} (HP mencapai 0)`;
      break;
    }

    logs.push(`[Babak ${turn}] ${currentScene.chapterTitle} | Pilihan: "${selectedChoice.text.slice(0, 30)}..." | Sisa HP: ${charState.hp}`);
  }

  return {
    runIndex,
    persona: persona.name,
    finalTurn: turn,
    survived: charState.hp > 0 && turn >= 12,
    gameOverReason,
    fullInventoryDrops,
    lethalHazardHits,
    finalHp: charState.hp,
    finalGold: charState.gold,
    itemsCollected: charState.inventory.length
  };
}

// 3. Runner Utama: Menjalankan Playtest Massal
async function runAutonomousQA(iterationsPerPersona = 5) {
  console.log('===============================================================');
  console.log('       AETHERMASTER AI - AUTONOMOUS PLAYTESTER & QA AUDITOR     ');
  console.log('===============================================================\n');

  const allReports = [];
  const startTime = Date.now();

  for (const personaKey of Object.keys(PERSONAS)) {
    console.log(`▶ Menguji Persona: ${PERSONAS[personaKey].name} (${PERSONAS[personaKey].class})...`);
    for (let i = 1; i <= iterationsPerPersona; i++) {
      const result = await simulatePlaythrough(personaKey, i);
      allReports.push(result);
    }
  }

  const durationMs = Date.now() - startTime;
  const totalRuns = allReports.length;
  const victories = allReports.filter(r => r.survived).length;
  const deaths = allReports.filter(r => r.finalHp <= 0).length;
  const softlocks = allReports.filter(r => r.gameOverReason.includes('SOFTLOCK')).length;
  const avgFinalTurn = (allReports.reduce((acc, r) => acc + r.finalTurn, 0) / totalRuns).toFixed(1);
  const totalInventoryOverlaps = allReports.reduce((acc, r) => acc + r.fullInventoryDrops, 0);

  console.log('\n===============================================================');
  console.log('                    RINGKASAN AUDIT & QA                        ');
  console.log('===============================================================');
  console.log(`• Total Playthrough Otomatis : ${totalRuns} sesi (${durationMs}ms)`);
  console.log(`• Rasio Kemenangan (Babak 12): ${victories}/${totalRuns} (${((victories/totalRuns)*100).toFixed(0)}%)`);
  console.log(`• Total Kematian Player      : ${deaths}`);
  console.log(`• Terdeteksi Alur Buntu     : ${softlocks === 0 ? '0 (AMAN - Tidak ada softlock)' : `${softlocks} TERDETEKSI!`}`);
  console.log(`• Rata-rata Babak Tercapai   : ${avgFinalTurn} dari 12 Babak`);
  console.log(`• Drop Item karena Tas Penuh : ${totalInventoryOverlaps} kali`);

  console.log('\n--- DETAIL PER PERSONA ---');
  for (const personaKey of Object.keys(PERSONAS)) {
    const pName = PERSONAS[personaKey].name;
    const pRuns = allReports.filter(r => r.persona === pName);
    const pVic = pRuns.filter(r => r.survived).length;
    const pAvgHp = (pRuns.reduce((acc, r) => acc + r.finalHp, 0) / pRuns.length).toFixed(0);
    console.log(`* ${pName}: Win Rate ${((pVic/pRuns.length)*100).toFixed(0)}% | Rata-rata HP Akhir: ${pAvgHp}`);
  }

  console.log('\n===============================================================');
  console.log('KESIMPULAN AUDITOR:');
  if (softlocks > 0) {
    console.log('⚠️ PERINGATAN: Ditemukan cabang cerita yang tidak memiliki pilihan!');
  } else if (victories === totalRuns) {
    console.log('ℹ️ BALANCING NOTE: Game terasa agak terlalu mudah, semua persona selamat hingga Babak 12.');
  } else {
    console.log('✅ STATUS SEHAT: Mekanik permainan seimbang, ada variasi kemenangan sesuai gaya main.');
  }
  console.log('===============================================================\n');
}

runAutonomousQA(10);
