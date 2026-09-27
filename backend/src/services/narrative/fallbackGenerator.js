const { cleanText, resolveItemById, KNOWN_ITEMS } = require('./sceneSchema');
const { resolvePlayerIntent } = require('./intentResolver');

const NPC_NAME_LOOKUP = {
  char_npc_01_barkeep: 'Eldrin sang Barkeep',
  char_npc_02_informant: 'Informan Bayangan',
  char_npc_03_vampire: 'Lord Cassian',
  char_npc_04_necromancer: 'Malakar sang Necromancer',
  char_npc_05_dryad: 'Sylvanis sang Dryad',
  char_npc_06_goblin: 'Pedagang Goblin',
  char_npc_07_guard: 'Kapten Penjaga',
  char_npc_08_cultist: 'Pemuja Samudra Silus',
  char_npc_09_lich: 'Kaisar Tengkorak Purba',
  char_hero_01_paladin: 'Ksatria Aliansi',
  char_hero_02_ranger: 'Pemandu Rimba Lyra',
  char_hero_03_wizard: 'Pustakawan Bintang',
  char_hero_04_dwarf: 'Penambang Kurcaci Torin',
  char_hero_05_rogue: 'Penyusup Bayangan',
  char_hero_06_cleric: 'Pendeta Cahaya',
  char_hero_07_warlock: 'Penyihir Dimensi Malakor',
  char_hero_08_dragonborn: 'Prajurit Api Ignis',
  char_hero_09_bard: 'Penyair Pengelana Mandolin'
};

function generateFallbackOpening(campaign, character) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';
  const title = campaign?.title || 'Petualangan Aether';
  const location = campaign?.title ? `Wilayah ${campaign.title}` : 'Kedai Whispering Tavern';
  const bgId = campaign?.defaultBackgroundId || 'bg_01_tavern';
  const npcId = campaign?.defaultNpcId || 'char_npc_01_barkeep';
  const speaker = NPC_NAME_LOOKUP[npcId] || 'Pemandu Petualangan';

  const missionLog = {
    title: `Jurnal Misi: ${title}`,
    prologue: `${campaign?.premise || 'Krisis tak terduga mengancam wilayah ini.'}\n\nKehadiran ${charName} sebagai seorang ${charClass} membawa harapan penting bagi penyelesaian masalah ini. Penyelidikan mendalam harus segera dilakukan untuk mengungkap fakta sebelum dampak buruk kian meluas.`,
    targetGoal: `Selesaikan investigasi di ${location} dan netralkan sumber ancaman.`,
    objective: `Selesaikan investigasi di ${location} dan netralkan sumber ancaman.`,
    status: 'active'
  };

  const dialogue = `${speaker} menatap ${charName} sang ${charClass} dengan raut wajah tegang saat kamu tiba di ${location}. "Syukurlah kamu lekas tiba," ucapnya pelan seraya menunjuk ke arah celah lorong di hadapanmu. "Situasi di sini tidak beres. Kita harus bertindak sekarang."`;

  let receivedItem = null;
  let receivedItemId = null;
  if (campaign?.id === 'crypt_of_crimson') {
    receivedItemId = 'item_06_skeleton_key';
    receivedItem = resolveItemById(receivedItemId);
  } else if (campaign?.id === 'whispering_tavern') {
    receivedItemId = 'item_01_potion_heal';
    receivedItem = resolveItemById(receivedItemId);
  }

  return {
    missionLog,
    chapterTitle: `Babak I: Langkah Awal di ${title}`,
    location,
    backgroundId: bgId,
    speaker,
    characterId: npcId,
    mood: 'mysterious',
    dialogue: cleanText(dialogue),
    consequenceNote: `Tiba di ${location} untuk memulai investigasi misi.`,
    stateUpdates: {
      proposedHpChange: 0,
      proposedManaChange: 0,
      proposedGoldChange: 10,
      hpChange: 0,
      manaChange: 0,
      goldChange: 10,
      receivedItemId,
      consumedItemId: null,
      receivedItem,
      consumedItem: null,
      reputationChange: {},
      reputation: {},
      factDiscovered: `Memulai petualangan di ${title}.`,
      addLedgerFact: `Memulai petualangan di ${title}.`
    },
    combatEncounter: null,
    choices: [
      {
        id: 'c1',
        text: 'Amati situasi sekitar dengan saksama dan cari petunjuk tersembunyi',
        tone: 'cautious',
        actionType: 'INVESTIGATE',
        requiredItem: null
      },
      {
        id: 'c2',
        text: 'Melangkah maju mendekati sumber suara atau sosok di hadapanmu',
        tone: 'bold',
        actionType: 'MOVE',
        requiredItem: null
      },
      {
        id: 'c3',
        text: 'Ajak berdiskusi untuk menggali informasi lebih dalam',
        tone: 'curious',
        actionType: 'TALK',
        requiredItem: null
      }
    ]
  };
}

function generateFallbackNextScene({
  previousNode,
  actionTaken,
  character,
  session,
  worldLedger,
  questState,
  resolvedIntent: explicitIntent
}) {
  const charName = character?.name || 'Petualang';
  const charClass = character?.characterClass || 'Pengelana';
  const prevLoc = previousNode?.location || 'Ruang Petualangan';
  const prevBgId = previousNode?.backgroundId || 'bg_01_tavern';
  const prevSpeaker = previousNode?.speaker || 'Narator';
  const prevCharId = previousNode?.characterId || 'char_npc_01_barkeep';
  const actionText = actionTaken?.text || actionTaken?.customText || 'Melangkah maju dengan waspada';
  const turnCount = session?.turnCount || 1;

  // Resolve intent through the intent classification engine
  const resolved = explicitIntent || resolvePlayerIntent(actionText, {
    character,
    previousNode,
    speaker: prevSpeaker
  });

  // 1. Handling non-diegetic / modern actions without arbitrary HP penalties
  if (resolved.isAnachronistic) {
    return {
      chapterTitle: `Babak ${turnCount + 1}: Suara Ganjil di Keheningan`,
      location: prevLoc,
      backgroundId: prevBgId,
      speaker: prevSpeaker,
      characterId: prevCharId,
      mood: 'mysterious',
      dialogue: cleanText(resolved.diegeticFeedback),
      consequenceNote: `Tindakan aneh di luar nalar hanya mengundang kebingungan. Takdir memaksamu kembali fokus ke kenyataan.`,
      stateUpdates: {
        proposedHpChange: 0,
        proposedManaChange: 0,
        proposedGoldChange: 0,
        hpChange: 0,
        manaChange: 0,
        goldChange: 0,
        receivedItemId: null,
        consumedItemId: null,
        receivedItem: null,
        consumedItem: null,
        reputationChange: {},
        reputation: {},
        factDiscovered: `${charName} tersadar dan memusatkan kembali perhatian ke situasi sekitar.`,
        addLedgerFact: `${charName} tersadar dan memusatkan kembali perhatian ke situasi sekitar.`
      },
      combatEncounter: null,
      choices: [
        {
          id: `c_${turnCount + 1}_1`,
          text: `Kumpulkan kembali fokus pikiran ${charName} dan selidiki situasi sekitar`,
          tone: 'cautious',
          actionType: 'INVESTIGATE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: `Abaikan kecanggungan barusan dan amati langkah berikutnya`,
          tone: 'bold',
          actionType: 'OBSERVE',
          requiredItem: null
        }
      ],
      missionLog: session?.missionLog || null
    };
  }

  // 2. Contextual Narrative based on Intent
  let chapterTitle = `Babak ${turnCount + 1}: Kelanjutan Jejak`;
  let dialogue = '';
  let consequenceNote = '';
  let mood = 'neutral';
  let manaDelta = 0;
  let choices = [];

  switch (resolved.intent) {
    case 'TALK':
      chapterTitle = `Babak ${turnCount + 1}: Percakapan Bermakna`;
      mood = 'tense';
      dialogue = `Mata ${charName} menatap lawan bicara saat kamu memutuskan untuk: "${actionText}". ${prevSpeaker} mendengarkan dengan seksama lalu membalas pelan, "Setiap kata di tempat ini bisa membawa petaka jika didengar telinga yang salah. Dengarkan aku baik-baik, jalur di depan tidak sesederhana kelihatannya."`;
      consequenceNote = `${prevSpeaker} memberikan tanggapan atas pertanyaanmu mengenai situasi di lokasi.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Tanyakan rincian bahaya yang mengintai di jalur depan',
          tone: 'inquisitive',
          actionType: 'TALK',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Persiapkan perlengkapan dan segera susuri lorong tersebut',
          tone: 'cautious',
          actionType: 'MOVE',
          requiredItem: null
        }
      ];
      break;

    case 'INVESTIGATE':
      chapterTitle = `Babak ${turnCount + 1}: Jejak Terselubung`;
      mood = 'mysterious';
      dialogue = `Dengan ketelitian tinggi, ${charName} melangkah untuk: "${actionText}". Di bawah pencahayaan redup di ${prevLoc}, jemarimu menelusuri sudut-sudut tersembunyi. Terdapat goresan tanda pada dinding batu dan debu yang tersibak, membuktikan bahwa tempat ini belum lama ditinggalkan seseorang.`;
      consequenceNote = `Pemeriksaan cermat menemukan tanda-tanda keberadaan jejak segar.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Telusuri ke mana arah goresan tanda tersebut membimbing',
          tone: 'curious',
          actionType: 'MOVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Amati apakah ada mekanisme atau jebakan di sekitar tanda itu',
          tone: 'cautious',
          actionType: 'INVESTIGATE',
          requiredItem: null
        }
      ];
      break;

    case 'MOVE':
      chapterTitle = `Babak ${turnCount + 1}: Melangkah ke Depan`;
      mood = 'neutral';
      dialogue = `${charName} sang ${charClass} mantap mengambil inisiatif untuk: "${actionText}". Langkah kakimu berderak pelan di lantai saat kamu berpindah posisi di ${prevLoc}. Dari sudut pandang yang baru, ruang di hadapanmu tampak lebih terbuka, meski bayangan gelap masih menyelimuti ujung koridor.`;
      consequenceNote = `Perpindahan posisi membuka sudut pandang baru yang lebih strategis.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Amati situasi di ujung koridor sebelum melangkah lebih jauh',
          tone: 'cautious',
          actionType: 'OBSERVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Teruskan langkah dengan langkah waspada',
          tone: 'bold',
          actionType: 'MOVE',
          requiredItem: null
        }
      ];
      break;

    case 'ATTACK':
      chapterTitle = `Babak ${turnCount + 1}: Ketegangan Fisik`;
      mood = 'danger';
      dialogue = `Dengan sigap, ${charName} mengerahkan ketangkasan untuk: "${actionText}". Udara di ${prevLoc} seketika memanas saat gesekan senjatamu memecah keheningan. Hambatan di depanmu berhasil ditepis, menandakan kesiapan sang ${charClass} dalam menghadapi bahaya apa pun.`;
      consequenceNote = `Tindakan tegas menyingkirkan rintangan fisik di depanmu.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Pasang kuda-kuda bertahan dan awasi reaksi sekitar',
          tone: 'cautious',
          actionType: 'OBSERVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Melangkah cepat memanfaatkan celah yang terbuka',
          tone: 'aggressive',
          actionType: 'MOVE',
          requiredItem: null
        }
      ];
      break;

    case 'MAGIC':
      chapterTitle = `Babak ${turnCount + 1}: Gelombang Arkana`;
      mood = 'mysterious';
      manaDelta = -4;
      dialogue = `Konsentrasi penuh dikerahkan saat ${charName} melancarkan: "${actionText}". Kilatan cahaya sihir membuncah dari ujung jemarimu, menerangi relief di dinding ${prevLoc}. Struktur energi magis bergetar sejenak merespons rapalan mantramu sebelum perlahan stabil.`;
      consequenceNote = `Mantra berhasil dirapalkan dan memindai aliran energi gaib.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Fokuskan energi sihir untuk mendeteksi bahaya tersembunyi',
          tone: 'inquisitive',
          actionType: 'INVESTIGATE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Maju dengan perlindungan sisa energi pelindung',
          tone: 'bold',
          actionType: 'MOVE',
          requiredItem: null
        }
      ];
      break;

    case 'STEALTH':
      chapterTitle = `Babak ${turnCount + 1}: Dalam Senyap Bayang`;
      mood = 'tense';
      dialogue = `${charName} mengambil langkah cerdik: "${actionText}". Melebur dalam bayangan ${prevLoc}, napasmu tertahan rapi saat mengamati pergerakan sekitar tanpa menimbulkan suara derit sedikit pun.`;
      consequenceNote = `Langkah senyap berhasil menyamarkan posisimu dari pantauan langsung.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Manfaatkan celah pengawasan untuk menyusup lebih dalam',
          tone: 'cautious',
          actionType: 'MOVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Tetap dalam persembunyian dan amati pola sekitar',
          tone: 'shrewd',
          actionType: 'OBSERVE',
          requiredItem: null
        }
      ];
      break;

    case 'USE_ITEM':
      chapterTitle = `Babak ${turnCount + 1}: Pemanfaatan Perlengkapan`;
      mood = 'neutral';
      dialogue = `${charName} bersiap memanfaatkan perlengkapan: "${actionText}". Tindakan cermat ini memberikan kestabilan dalam menghadapi situasi yang sedang berkembang di ${prevLoc}.`;
      consequenceNote = `Tindakan menggunakan perlengkapan dieksekusi dengan baik.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Lanjutkan pengamatan dengan perlengkapan yang telah siap',
          tone: 'cautious',
          actionType: 'OBSERVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Melangkah menuju sasaran berikutnya',
          tone: 'bold',
          actionType: 'MOVE',
          requiredItem: null
        }
      ];
      break;

    default:
      chapterTitle = `Babak ${turnCount + 1}: Dinamika Langkah`;
      mood = 'neutral';
      dialogue = `Menimbang situasi yang terus berkembang, ${charName} sang ${charClass} mengambil tindakan: "${actionText}". Keputusan ini mengubah atmosfer di ${prevLoc}, memperjelas pilihan apa yang harus diambil selanjutnya.`;
      consequenceNote = `Inisiatif tindakanmu mengarahkan alur peristiwa ke babak baru.`;
      choices = [
        {
          id: `c_${turnCount + 1}_1`,
          text: 'Lanjutkan inisiatif dengan kewaspadaan penuh',
          tone: 'bold',
          actionType: 'MOVE',
          requiredItem: null
        },
        {
          id: `c_${turnCount + 1}_2`,
          text: 'Amati situasi terkini sebelum memutuskan langkah berikutnya',
          tone: 'cautious',
          actionType: 'OBSERVE',
          requiredItem: null
        }
      ];
      break;
  }

  return {
    chapterTitle,
    location: prevLoc,
    backgroundId: prevBgId,
    speaker: prevSpeaker,
    characterId: prevCharId,
    mood,
    dialogue: cleanText(dialogue),
    consequenceNote: cleanText(consequenceNote),
    stateUpdates: {
      proposedHpChange: 0,
      proposedManaChange: manaDelta,
      proposedGoldChange: 0,
      hpChange: 0,
      manaChange: manaDelta,
      goldChange: 0,
      receivedItemId: null,
      consumedItemId: null,
      receivedItem: null,
      consumedItem: null,
      reputationChange: {},
      reputation: {},
      factDiscovered: `Melakukan '${actionText.slice(0, 35)}' di ${prevLoc}.`,
      addLedgerFact: `Melakukan '${actionText.slice(0, 35)}' di ${prevLoc}.`
    },
    combatEncounter: null,
    choices,
    missionLog: session?.missionLog || null
  };
}

module.exports = {
  NPC_NAME_LOOKUP,
  generateFallbackOpening,
  generateFallbackNextScene
};
