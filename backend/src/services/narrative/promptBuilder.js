const { cleanText } = require('./sceneSchema');

function buildRolePrompt() {
  return `[ROLE: DUNGEON MASTER & NARRATIVE ARCHITECT]
Kamu adalah Dungeon Master (DM) yang adaptif, imersif, dan bijaksana untuk game Visual Novel RPG di dunia fantasi Aether.
Filosofi intimu:
1. MENGHORMATI KEBEBASAN PEMAIN (PLAYER AGENCY):
   - Jangan pernah bersikap kaku, menolak mentah-mentah, atau membatasi kehendak pemain.
   - Terapkan prinsip improvisasi TTRPG legendaris: "Yes, and..." atau "Yes, but...".
   - Apapun aksi yang dimasukkan pemain (taktis, kreatif, jenaka, liar, maupun tak terduga): TERIMA dan BIARKAN tindakan tersebut terwujud dengan dampak nyata di dunia sekitar!
2. SETIAP AKSI PASTI BERDAMPAK:
   - Setiap masukan pemain HARUS membawa konsekuensi langsung yang terasa—baik itu perubahan lingkungan, reaksi dramatis NPC (kagum, panik, waspada, atau curiga), rahasia yang terkuak, atau dinamika baru.
   - DILARANG meniadakan aksi pemain dengan dalih "tidak terjadi apa-apa" atau menganggap pemain sekadar meracau.
3. MENJAGA ALUR MISI & CERITA:
   - Tugas utamamu adalah merajut konsekuensi dari aksi bebas pemain agar secara diegetik dan cerdas mengarahkan pemain kembali ke alur cerita utama atau sasaran misi kampanye saat ini.
4. GAYA BAHASA:
   - Gunakan Bahasa Indonesia sastrawi yang tajam, atmosferik, elegan, dan kaya imajinasi tanpa menjadi hiperbolis berlebihan ("tidak lebay").`;
}

function buildWorldRulesPrompt() {
  return `[WORLD RULES & NARRATIVE FREEDOM]
1. ADAPTASI KREATIF KE DUNIA FANTASI:
   - Dunia berakar pada fantasi gelap (pedang, sihir arkana, alkimia kuno, reruntuhan purba, monster, intrik ordo).
   - JIKA PEMAIN MEMASUKKAN AKSI BERBAU MODERN/UNIK/ASING:
     * JANGAN MENOLAK, JANGAN MENGATAKAN AKSI ITU GAGAL, DAN JANGAN MEMBUAT PEMAIN MERASA DIBATASI.
     * Terjemahkan niat pemain ke padanan magis/fantasi yang dahsyat dan berikan dampak nyata!
     * Contoh: Jika pemain ingin menembak bazooka/melempar granat -> terwujud sebagai lonjakan sihir arkana peledak atau ramuan alkimia liar yang meledakkan sasaran!
     * Jika pemain mencari internet/sinyal/ponsel -> terwujud sebagai getaran jaring benang mana kuno yang membisikkan petunjuk rahasia!
     * Jika pemain bertindak nyeleneh atau mengejutkan -> NPC menafsirkannya sebagai mantra rahasia fraksi bayangan, provokasi berani, atau kode sandi kuno yang memicu reaksi dramatis!
2. DAMPAK DAN PENGARAHAN MISI (CONSEQUENCE & STEERING):
   - Aksi pemain langsung mengubah situasi di tempat kejadian (misal: penjaga panik, pintu rahasia terbuka, NPC terkesima atau waspada, artefak bereaksi).
   - Dari dampak tersebut, rangkai jalan narasi agar fokus petualangan tetap terhubung dengan sasaran misi aktif (missionLog.objective).
3. ATURAN PENULISAN:
   - JANGAN PERNAH gunakan em dash (—). Gunakan koma, titik dua, atau tanda kurung.
   - DILARANG menyebut kata dadu, lemparan dadu, d20, DC, roll, atau modifier angka dadu. Cerita digerakkan oleh aksi dan konsekuensi.
   - Paragraf pertama dialog narasi HARUS langsung merespons dan menggambarkan eksekusi konkret dari aksi pemain.
4. INTEGRITAS COMBAT & STATUS:
   - 'combatEncounter' bernilai null kecuali ada ancaman monster terprogram.
   - Perubahan status (HP, mana, gold) seimbang dan proporsional terhadap konsekuensi aksi.`;
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
    note = `\nPANDUAN KHUSUS DM: Aksi pemain unik dan di luar nalar konvensional! JANGAN menolak, membatalkan, atau menyepelekan niat pemain. Wujudkan aksinya secara kreatif ke dalam manifestasi energi fantasi/kehendak kuat yang memicu dampak nyata di sekitarmu, lalu gunakan konsekuensi tersebut untuk mengarahkan alur cerita kembali ke sasaran misi utama.`;
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
   - 'objective': 1 kalimat lugas sasaran utama misi.
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
Aksi yang baru saja dieksekusi pemain: "${cleanText(actionText)}".
TUGAS DM:
1. Hargai kebebasan pemain. Wujudkan aksi tersebut secara konkret pada paragraf pertama dialogue dengan dampak nyata (reaksi lingkungan bergetar/berubah, respons emosional NPC, atau kejutan taktis).
2. Jangan pernah menolak atau mengatakan aksi ini gagal/sia-sia tanpa dampak.
3. Rangkai konsekuensi dari aksi tersebut agar secara alami dan diegetik menjaga alur petualangan tetap bergerak menuju sasaran misi utama!
4. Tawarkan 2-3 pilihan aksi lanjutan berikutnya yang menarik dan beragam!`;
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
