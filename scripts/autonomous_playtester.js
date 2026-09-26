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

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOGS_DIR, 'playtester.log');
const REPORT_MD = path.join(LOGS_DIR, 'latest_qa_report.md');

// Pastikan direktori logs tersedia
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}\n`;
  process.stdout.write(formatted);
  try {
    fs.appendFileSync(LOG_FILE, formatted, 'utf8');
  } catch (err) {
    console.error('Gagal menulis log ke file:', err.message);
  }
}

// 3. Runner Utama: Menjalankan Playtest Massal
async function runAutonomousQA(iterationsPerPersona = 5) {
  const runTimestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  writeLog('===============================================================');
  writeLog('       AETHERMASTER AI - AUTONOMOUS PLAYTESTER & QA AUDITOR     ');
  writeLog(`             WAKTU PENGUJIAN: ${runTimestamp}                 `);
  writeLog('===============================================================');

  const allReports = [];
  const startTime = Date.now();

  for (const personaKey of Object.keys(PERSONAS)) {
    writeLog(`▶ Menguji Persona: ${PERSONAS[personaKey].name} (${PERSONAS[personaKey].class})...`);
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

  writeLog('===============================================================');
  writeLog('                    RINGKASAN AUDIT & QA                        ');
  writeLog('===============================================================');
  writeLog(`• Total Playthrough Otomatis : ${totalRuns} sesi (${durationMs}ms)`);
  writeLog(`• Rasio Kemenangan (Babak 12): ${victories}/${totalRuns} (${((victories/totalRuns)*100).toFixed(0)}%)`);
  writeLog(`• Total Kematian Player      : ${deaths}`);
  writeLog(`• Terdeteksi Alur Buntu     : ${softlocks === 0 ? '0 (AMAN - Tidak ada softlock)' : `${softlocks} TERDETEKSI!`}`);
  writeLog(`• Rata-rata Babak Tercapai   : ${avgFinalTurn} dari 12 Babak`);
  writeLog(`• Drop Item karena Tas Penuh : ${totalInventoryOverlaps} kali`);

  writeLog('\n--- DETAIL PER PERSONA ---');
  const personaDetails = [];
  for (const personaKey of Object.keys(PERSONAS)) {
    const pName = PERSONAS[personaKey].name;
    const pRuns = allReports.filter(r => r.persona === pName);
    const pVic = pRuns.filter(r => r.survived).length;
    const pAvgHp = (pRuns.reduce((acc, r) => acc + r.finalHp, 0) / pRuns.length).toFixed(0);
    const line = `* ${pName}: Win Rate ${((pVic/pRuns.length)*100).toFixed(0)}% | Rata-rata HP Akhir: ${pAvgHp}`;
    writeLog(line);
    personaDetails.push({ name: pName, winRate: ((pVic/pRuns.length)*100).toFixed(0), avgHp: pAvgHp });
  }

  writeLog('\n===============================================================');
  writeLog('KESIMPULAN AUDITOR:');
  let conclusion = '';
  if (softlocks > 0) {
    conclusion = '⚠️ PERINGATAN: Ditemukan cabang cerita yang tidak memiliki pilihan!';
  } else if (victories === totalRuns) {
    conclusion = 'ℹ️ BALANCING NOTE: Game terasa agak terlalu mudah, semua persona selamat hingga Babak 12.';
  } else {
    conclusion = '✅ STATUS SEHAT: Mekanik permainan seimbang, ada variasi kemenangan sesuai gaya main.';
  }
  writeLog(conclusion);
  writeLog('===============================================================\n');

  // Tulis ringkasan termutakhir ke markdown file logs/latest_qa_report.md
  try {
    const mdContent = `# 🛡️ AetherMaster AI - Laporan QA & Playtest Terakhir
**Waktu Eksekusi**: ${runTimestamp}  
**Durasi Pengujian**: ${(durationMs / 1000).toFixed(2)} detik  

## 📊 Ringkasan Statistik
- **Total Playthrough**: ${totalRuns} sesi
- **Rasio Kemenangan (Tamat Babak 12)**: ${victories}/${totalRuns} (${((victories/totalRuns)*100).toFixed(0)}%)
- **Total Kematian**: ${deaths}
- **Softlock Terdeteksi**: ${softlocks}
- **Rata-rata Babak Bertahan**: ${avgFinalTurn} / 12
- **Insiden Tas Penuh (Drop Item)**: ${totalInventoryOverlaps} kali

## 🎭 Performa per Persona
${personaDetails.map(p => `- **${p.name}**: Menang ${p.winRate}% | Rata-rata HP Akhir ${p.avgHp}`).join('\n')}

## 🔍 Kesimpulan Auditor
> **${conclusion}**

---
*Log lengkap riwayat eksekusi dapat dilihat di: \`logs/playtester.log\`*
`;
    fs.writeFileSync(REPORT_MD, mdContent, 'utf8');
  } catch (err) {
    console.error('Gagal menulis report markdown:', err.message);
  }
}

// 4. Runner Eksekusi & Penjadwalan Berkala (30 Menit)
async function start() {
  const args = process.argv.slice(2);
  let intervalMinutes = null;

  // Deteksi argumen --interval=30 atau -i 30 atau --watch
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--interval=')) {
      intervalMinutes = parseFloat(args[i].split('=')[1]);
    } else if (args[i] === '-i' || args[i] === '--interval') {
      intervalMinutes = parseFloat(args[i + 1]);
    } else if (args[i] === '--watch' || args[i] === '--loop') {
      intervalMinutes = 30; // default 30 menit
    }
  }

  // Jalankan pengujian pertama kali langsung
  await runAutonomousQA(5);

  if (intervalMinutes && !isNaN(intervalMinutes) && intervalMinutes > 0) {
    const intervalMs = intervalMinutes * 60 * 1000;
    writeLog(`⏳ MODE BERKALA AKTIF: Playtester akan dijalankan otomatis setiap ${intervalMinutes} menit.`);
    writeLog(`👉 Pantau log langsung dengan: npm run playtest:log`);
    writeLog(`👉 Tekan Ctrl + C di terminal ini untuk menghentikan scheduler.\n`);

    setInterval(async () => {
      writeLog(`⏰ Memulai pengujian berkala otomatis (Interval ${intervalMinutes} menit)...`);
      try {
        await runAutonomousQA(5);
      } catch (err) {
        writeLog(`❌ Terjadi error saat pengujian berkala: ${err.message}`);
      }
    }, intervalMs);
  }
}

start();

