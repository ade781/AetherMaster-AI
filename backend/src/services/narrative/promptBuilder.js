const { cleanText } = require('./sceneSchema');

function buildRolePrompt() {
  return `[ROLE]
Kamu adalah Dungeon Master (DM) legendaris untuk game Visual Novel RPG interaktif berbasis teks di dunia fantasi Aether.
Tugas utamamu adalah memandu cerita yang mendalam, atmosferik, taktis, dan responsif langsung terhadap aksi pemain.
Gunakan Bahasa Indonesia sastrawi yang lugas, tajam, dan tidak hiperbolis berlebihan ("tidak lebay").`;
}

function buildWorldRulesPrompt() {
  return `[WORLD RULES & NARRATIVE CONSTRAINTS]
1. SETTING FANTASI MURNI:
   - Setting adalah dunia fantasi klasik (pedang, sihir arkana, reruntuhan kuno, monster, ordo ksatria).
   - DILARANG KERAS memunculkan perangkat modern, teknologi elektronik, senjata api modern, atau konsep dunia nyata masa kini.
   - Jika pemain mencoba aksi modern atau di luar nalar dunia, tanggapi secara diegetik: NPC menatap heran mengira pemain meracau, atau sihir/tindakan gagal terwujud. JANGAN langsung menghukum HP pemain dengan kejam.
2. MUTLAK TANPA MEKANIK DADU:
   - DILARANG KERAS menyebut kata dadu, lemparan dadu, d20, DC, roll, atau modifier dadu di narasi maupun pilihan.
   - Cerita dinilai berdasarkan logika taktis, kecerdikan aksi, dan keahlian kelas karakter.
3. TIPOGRAFI & GAYA BAHASA:
   - JANGAN PERNAH gunakan em dash (—). Gunakan koma, titik dua, atau tanda kurung.
   - Dialog NPC harus hidup, menggunakan tanda kutip "...", dan mencerminkan emosi nyata saat merespons tindakan pemain.
   - Paragraf pertama dialog narasi HARUS langsung merespons dan menggambarkan eksekusi dari tindakan pemain.
4. INTEGRITAS COMBAT & STATE:
   - 'combatEncounter' WAJIB selalu bernilai null kecuali ada ancaman monster terprogram.
   - Perubahan status (HP, mana, gold) harus masuk akal secara diegetik dan proporsional (misal: merapal mantra mengonsumsi sedikit mana, terluka mengonsumsi sedikit HP).`;
}

function buildCurrentStatePrompt({ character, previousNode, worldLedger, session, questState, nearbyNpcs, availableLocations }) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';
  const charRace = character?.race || 'Human';
  const hp = character?.hp ?? 100;
  const maxHp = character?.maxHp ?? 100;
  const mana = character?.mana ?? 50;
  const maxMana = character?.maxMana ?? 50;
  const gold = character?.gold ?? 0;

  let inventorySummary = 'Kosong';
  if (Array.isArray(character?.inventory) && character.inventory.length > 0) {
    inventorySummary = character.inventory.map(i => i?.name || i?.id || 'Item').join(', ');
  }

  const prevLoc = previousNode?.location || 'Ruang Petualangan';
  const prevBgId = previousNode?.backgroundId || 'bg_01_tavern';
  const prevSpeaker = previousNode?.speaker || 'Narator';

  // World ledger facts
  let ledgerSummary = 'Belum ada catatan fakta khusus.';
  const factsList = [];
  if (worldLedger?.questFlags && typeof worldLedger.questFlags === 'object') {
    const facts = Object.values(worldLedger.questFlags).filter(Boolean);
    factsList.push(...facts);
  }
  if (Array.isArray(session?.worldFacts)) {
    factsList.push(...session.worldFacts.map(f => f.fact || f));
  }
  if (factsList.length > 0) {
    ledgerSummary = Array.from(new Set(factsList)).join('; ');
  }

  // Reputation
  let repSummary = 'Netral (0)';
  if (worldLedger?.reputation && typeof worldLedger.reputation === 'object') {
    const entries = Object.entries(worldLedger.reputation);
    if (entries.length > 0) {
      repSummary = entries.map(([f, score]) => `${f}: ${score >= 0 ? '+' + score : score}`).join(', ');
    }
  }

  const turn = session?.turnCount || 1;

  let extraContext = '';
  if (Array.isArray(nearbyNpcs) && nearbyNpcs.length > 0) {
    extraContext += `\n- NPC Terkemuka di Sekitar: ${nearbyNpcs.map(n => n.name || n.id).join(', ')}`;
  }
  if (Array.isArray(availableLocations) && availableLocations.length > 0) {
    extraContext += `\n- Wilayah Terkait: ${availableLocations.map(l => l.name || l.id).join(', ')}`;
  }

  return `[CURRENT STATE]
- Karakter: ${charName} (Ras: ${charRace}, Kelas: ${charClass})
- Atribut: HP ${hp}/${maxHp}, Mana ${mana}/${maxMana}, Gold ${gold}
- Inventaris: ${inventorySummary}
- Lokasi Terkini: ${prevLoc} (Latar Visual: "${prevBgId}")
- Sosok di Hadapanmu: ${prevSpeaker}
- Turn Sesi: ${turn}
- Catatan Fakta Dunia (World Ledger): ${ledgerSummary}
- Reputasi Fraksi: ${repSummary}${extraContext}
${questState ? `- Status Quest: ${typeof questState === 'string' ? questState : JSON.stringify(questState)}` : ''}`;
}

function buildRecentEventsPrompt(recentHistory, previousNode) {
  let lines = [];
  if (Array.isArray(recentHistory) && recentHistory.length > 0) {
    lines = recentHistory.map((h, idx) => {
      const label = h.turnCount ? `Turn ${h.turnCount}` : `Langkah ${idx + 1}`;
      const loc = h.location || 'Lokasi';
      const spk = h.speaker || 'DM';
      const text = cleanText(h.dialogueText || h.dialogue || '');
      return `[${label} | Lokasi: ${loc} | Pembicara: ${spk}]: "${text}"`;
    });
  } else if (previousNode) {
    const loc = previousNode.location || 'Lokasi';
    const spk = previousNode.speaker || 'DM';
    const text = cleanText(previousNode.dialogueText || previousNode.dialogue || '');
    lines.push(`[Langkah Terakhir | Lokasi: ${loc} | Pembicara: ${spk}]: "${text}"`);
  }

  if (lines.length === 0) {
    return `[RECENT EVENTS]\nMemulai perjalanan pertama kali di lokasi ini.`;
  }

  return `[RECENT EVENTS - ROLLING HISTORY]\n${lines.join('\n')}`;
}

function buildPlayerActionPrompt(actionTaken, resolvedIntent) {
  const actionText = actionTaken?.text || actionTaken?.customText || 'Melangkah maju dengan waspada';
  const tone = actionTaken?.tone || 'cautious';
  const intentType = resolvedIntent?.intent || 'INVESTIGATE';

  let note = '';
  if (resolvedIntent?.isAnachronistic) {
    note = `\nPERINGATAN: Aksi pemain mengandung konsep modern/anachronistic di luar nalar fantasi! Respon secara diegetik dengan kebingungan karakter/NPC, tanpa memberi hukuman HP sembarangan.`;
  }

  return `[PLAYER ACTION]
Aksi: "${cleanText(actionText)}"
Nada Aksi: ${tone}
Tipe Intent Terdeteksi: ${intentType}${note}`;
}

function buildOutputContractPrompt({ isOpening = false }) {
  if (isOpening) {
    return `[OUTPUT CONTRACT - WAJIB FORMAT JSON MURNI]
Keluarkan respon HANYA dalam format JSON valid tanpa pembungkus markdown (tanpa \`\`\`json):
{
  "missionLog": {
    "title": "Jurnal Misi: [Judul]",
    "prologue": "Ringkasan latar belakang kampanye dan peran karakter personal (2-3 paragraf)",
    "targetGoal": "Sasaran utama investigasi misi",
    "objective": "Sasaran utama investigasi misi",
    "status": "active"
  },
  "chapterTitle": "Babak I: [Judul Babak]",
  "location": "Nama Lokasi",
  "backgroundId": "bg_01_tavern",
  "speaker": "Nama NPC atau Pembicara",
  "characterId": "ID Karakter",
  "mood": "mysterious",
  "dialogue": "Narasi adegan Babak I di lokasi kejadian (in media res). Jangan ulangi teks dari prologue!",
  "consequenceNote": "Tiba di lokasi untuk memulai investigasi.",
  "stateUpdates": {
    "proposedHpChange": 0,
    "proposedManaChange": 0,
    "proposedGoldChange": 0,
    "hpChange": 0,
    "manaChange": 0,
    "goldChange": 0,
    "receivedItemId": null,
    "consumedItemId": null,
    "reputationChange": {},
    "factDiscovered": "Memulai petualangan."
  },
  "combatEncounter": null,
  "choices": [
    {
      "id": "c1",
      "text": "Aksi taktis pertama yang jelas dan lugas",
      "tone": "cautious",
      "actionType": "INVESTIGATE"
    },
    {
      "id": "c2",
      "text": "Aksi taktis kedua yang berani",
      "tone": "bold",
      "actionType": "TALK"
    }
  ]
}`;
  }

  return `[OUTPUT CONTRACT - WAJIB FORMAT JSON MURNI]
Keluarkan respon HANYA dalam format JSON valid tanpa pembungkus markdown (tanpa \`\`\`json):
{
  "chapterTitle": "Babak [N]: [Nama Babak]",
  "location": "Nama Lokasi saat ini",
  "backgroundId": "ID latar visual aktif (bg_01 s.d bg_29)",
  "speaker": "Nama NPC yang berbicara atau Narator",
  "characterId": "ID NPC atau Hero",
  "mood": "neutral | tense | heroic | mysterious | danger | victory",
  "dialogue": "Narasi deskriptif dan dialog langsung yang merespons aksi pemain secara spesifik",
  "consequenceNote": "1 kalimat ringkas mengenai konsekuensi dari aksi yang diambil",
  "stateUpdates": {
    "proposedHpChange": 0,
    "proposedManaChange": 0,
    "proposedGoldChange": 0,
    "hpChange": 0,
    "manaChange": 0,
    "goldChange": 0,
    "receivedItemId": null,
    "consumedItemId": null,
    "reputationChange": {},
    "factDiscovered": null
  },
  "combatEncounter": null,
  "choices": [
    {
      "id": "c1",
      "text": "Pilihan aksi lanjutan pertama (ringkas, taktis)",
      "tone": "cautious",
      "actionType": "INVESTIGATE"
    },
    {
      "id": "c2",
      "text": "Pilihan aksi lanjutan kedua (ringkas, taktis)",
      "tone": "bold",
      "actionType": "TALK"
    }
  ],
  "missionLog": {
    "title": "Jurnal Misi",
    "objective": "Sasaran utama yang sedang berjalan",
    "status": "active"
  }
}`;
}

function buildOpeningSystemPrompt({ campaign, character }) {
  const role = buildRolePrompt();
  const rules = buildWorldRulesPrompt();
  const targetBgId = campaign?.defaultBackgroundId || 'bg_01_tavern';
  const targetNpcId = campaign?.defaultNpcId || 'char_npc_01_barkeep';

  const openingRules = `[OPENING SCENE RULES - TWO COMPONENTS]
1. 'missionLog':
   - 'title': Judul berkas misi singkat (misal: "Jurnal Misi: ${campaign?.title || 'Petualangan'}").
   - 'prologue': Narasi 2-3 paragraf mengalir memadukan premis krisis dengan profil ${character?.name || 'Petualang'} sang ${character?.characterClass || 'Pengelana'}.
   - 'objective' & 'targetGoal': 1 kalimat lugas sasaran utama misi.
2. ADEGAN BABAK I IN MEDIA RES:
   - Adegan Babak I dimulai langsung di tempat kejadian (in media res).
   - DILARANG KERAS mengulang teks prolog 'missionLog' di dalam 'dialogue'!
   - 'backgroundId' WAJIB bernilai "${targetBgId}".
   - 'characterId' WAJIB bernilai "${targetNpcId}".
   - 'combatEncounter' WAJIB null.`;

  const contract = buildOutputContractPrompt({ isOpening: true });

  return `${role}\n\n${rules}\n\n${openingRules}\n\n${contract}`;
}

function buildOpeningUserPrompt({ campaign, character }) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';
  const charRace = character?.race || 'Human';
  const title = campaign?.title || 'Petualangan Aether';
  const premise = campaign?.premise || 'Sebuah krisis menuntut penyelidikan mendalam.';
  const bgId = campaign?.defaultBackgroundId || 'bg_01_tavern';

  return `Mulai petualangan kampanye: "${title}"
Premis: ${premise}
Karakter Pemain: ${charName} (Ras: ${charRace}, Kelas: ${charClass})
Latar Visual Awal: "${bgId}"

Buatlah missionLog yang personal dan adegan pembuka Babak I in media res yang tajam dan atmosferik!`;
}

function buildNextSceneSystemPrompt({
  session,
  character,
  previousNode,
  actionTaken,
  recentHistory,
  worldLedger,
  questState,
  resolvedIntent,
  nearbyNpcs,
  availableLocations
}) {
  const role = buildRolePrompt();
  const rules = buildWorldRulesPrompt();
  const state = buildCurrentStatePrompt({
    character,
    previousNode,
    worldLedger: worldLedger || session?.worldLedger,
    session,
    questState,
    nearbyNpcs,
    availableLocations
  });
  const events = buildRecentEventsPrompt(recentHistory, previousNode);
  const action = buildPlayerActionPrompt(actionTaken, resolvedIntent);
  const contract = buildOutputContractPrompt({ isOpening: false });

  return `${role}\n\n${rules}\n\n${state}\n\n${events}\n\n${action}\n\n${contract}`;
}

function buildNextSceneUserPrompt({ character, actionTaken, resolvedIntent }) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';
  const actionText = actionTaken?.text || actionTaken?.customText || 'Melangkah maju dengan waspada';

  return `Lanjutkan petualangan untuk ${charName} sang ${charClass}!
Aksi yang baru saja diambil oleh pemain: "${cleanText(actionText)}".
Tanggapi aksi ini secara mendalam pada paragraf pertama dialogue, tampilkan reaksi karakter/NPC sekitar, tentukan konsekuensi yang logis, dan tawarkan 2-3 pilihan aksi lanjutan berikutnya!`;
}

module.exports = {
  buildRolePrompt,
  buildWorldRulesPrompt,
  buildCurrentStatePrompt,
  buildRecentEventsPrompt,
  buildPlayerActionPrompt,
  buildOutputContractPrompt,
  buildOpeningSystemPrompt,
  buildOpeningUserPrompt,
  buildNextSceneSystemPrompt,
  buildNextSceneUserPrompt
};
