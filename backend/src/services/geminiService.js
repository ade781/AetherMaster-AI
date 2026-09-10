const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const DM_SYSTEM_PROMPT = `
Kamu adalah seorang Dungeon Master (DM) legendaris untuk game Visual Novel RPG D&D 5E.
Gunakan Bahasa Indonesia sastrawi yang imersif, deskriptif, dramatis, namun mudah dipahami dan atmosferik layaknya novel fantasi interaktif.

SETIAP RESPON HARUS BERFORMAT JSON MURNI DENGAN SKEMA PERSIS BERIKUT (tanpa markdown backtick):
{
  "chapterTitle": "string (Judul bab/adegan saat ini)",
  "location": "string (Nama lokasi spesifik saat adegan berlangsung)",
  "speaker": "string (Nama pembicara saat ini, misal: 'Dungeon Master', nama NPC, atau arwah)",
  "mood": "string ('mysterious' | 'tense' | 'cozy' | 'ominous' | 'triumphant' | 'dangerous')",
  "dialogue": "string (Deskripsi adegan naratif atau dialog sekitar 2 hingga 4 kalimat penuh yang menggugah emosi)",
  "consequenceNote": "string (Satu kalimat singkat menceritakan dampak langsung dari aksi sebelumnya)",
  "choices": [
    {
      "id": "string (identifier unik singkat)",
      "text": "string (Deskripsi pilihan aksi yang jelas dan memikat)",
      "tone": "string ('bold' | 'cautious' | 'curious' | 'shrewd')"
    }
  ]
}

Aturan:
1. Sediakan tepat 3 atau 4 pilihan aksi yang beragam secara taktis/moral pada array 'choices'.
2. Kembangkan plot maju berdasarkan pilihan dan premis cerita.
`;

// AI Quest Forge: Generate a custom campaign from player prompt
const forgeCustomCampaign = async ({ premise, genre = 'dark_fantasy' }) => {
  const fallback = {
    title: premise ? `Kisah: ${premise.slice(0, 30)}...` : 'Petualangan Rimba Kuno',
    premise: premise || 'Sebuah perjalanan misterius ke tanah tak bertuan.',
    genre,
    icon: '🔮',
  };

  if (!ai) return fallback;

  try {
    const prompt = `
Sebagai Game Master D&D, buatkan metadata kampanye petualangan baru berdasarkan ide berikut:
Ide/Premis Pemain: "${premise}"
Genre: "${genre}"

Hasilkan JSON murni dengan format:
{
  "title": "string (Judul epik/menarik, max 6 kata)",
  "premise": "string (Ringkasan latar belakang cerita 2-3 kalimat menarik)",
  "genre": "${genre}",
  "icon": "string (1 emoji representatif, misal: 🐉, 🏰, 🗡️, 🌙, ⚓)"
}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text.trim());
  } catch (err) {
    console.warn('[Forge Campaign Fallback]:', err.message);
    return fallback;
  }
};

// Generate opening scene for a specific campaign
const generateCampaignOpening = async (campaign) => {
  const fallbackOpening = {
    chapterTitle: `Bab I: Permulaan ${campaign?.title || 'Kisah'}`,
    location: campaign?.title?.includes('Deep') ? 'Dermaga Terdalam' : 'Kedai The Whispering Hearth',
    speaker: "Dungeon Master",
    mood: "mysterious",
    dialogue: `Takdir membawamu ke gerbang petualangan: "${campaign?.premise || 'Malam badai yang dingin'}". Di sekelilingmu, bayangan misterius bergerak perlahan, menunggu keputusan pertamamu untuk melangkah maju.`,
    consequenceNote: "Perjalanan baru telah dimulai.",
    choices: [
      { id: "c_bold", text: "Maju dengan percaya diri dan menantang apa pun yang menanti.", tone: "bold" },
      { id: "c_cautious", text: "Mengamati sekitar dengan seksama sambil menyiapkan senjata atau mantra.", tone: "cautious" },
      { id: "c_curious", text: "Menyelidiki tulisan atau tanda aneh di dekat tempatmu berdiri.", tone: "curious" },
      { id: "c_shrewd", text: "Mencari tempat tersembunyi untuk menyusun rencana yang matang.", tone: "shrewd" }
    ]
  };

  if (!ai) return { scene: fallbackOpening, source: 'offline_preset' };

  try {
    const prompt = `
Modul Petualangan: "${campaign?.title}"
Latar Belakang: "${campaign?.premise}"
Genre: "${campaign?.genre}"

Instruksi:
Hasilkan adegan pembuka Bab I yang sangat memikat untuk petualangan ini dalam format JSON yang telah ditentukan.
Pemain baru saja tiba di lokasi awal.
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: DM_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    return { scene: JSON.parse(response.text.trim()), source: 'gemini' };
  } catch (err) {
    console.warn('[Start Campaign Fallback]:', err.message);
    return { scene: fallbackOpening, source: 'fallback', error: err.message };
  }
};

// Generate next scene branch in the relational tree
const generateNextBranch = async ({ campaign, previousScene, choiceText, history = [] }) => {
  const fallbackContinuation = {
    chapterTitle: `Cabang: ${choiceText.slice(0, 25)}...`,
    location: previousScene?.location || "Area Tak Dikenal",
    speaker: "Dungeon Master",
    mood: "tense",
    dialogue: `Kamu memutuskan untuk: "${choiceText}". Pilihanmu memicu rangkaian peristiwa baru di ${campaign?.title || 'dunia ini'}. Suasana semakin pekat saat bisikan angin membawakan firasat akan tantangan yang lebih besar di depan mata.`,
    consequenceNote: `Keputusanmu meninggalkan jejak tak terhapuskan pada alur takdir.`,
    choices: [
      { id: "b1", text: "Melanjutkan langkah dengan tekad baja.", tone: "bold" },
      { id: "b2", text: "Memeriksa kembali perbekalan dan mencari tempat perlindungan sementara.", tone: "cautious" },
      { id: "b3", text: "Mengamati reaksi lingkungan di sekitar dengan teliti.", tone: "curious" },
      { id: "b4", text: "Memanfaatkan situasi ini untuk keuntungan taktis.", tone: "shrewd" }
    ]
  };

  if (!ai) return { scene: fallbackContinuation, source: 'offline_preset' };

  try {
    const recentHistory = history.slice(-3).map((item, idx) => 
      `Langkah ${idx + 1}: Di ${item.location}, Pembicara: ${item.speaker}, Narasi: "${item.dialogue}". Aksi: "${item.chosenAction || 'Aksi'}"`
    ).join('\n');

    const prompt = `
Kampanye: "${campaign?.title || 'Petualangan D&D'}"
Premis Utama: "${campaign?.premise || ''}"

Konteks Cerita Sebelumnya:
${recentHistory || `Di ${previousScene?.location}: "${previousScene?.dialogue}"`}

Aksi Terpilih Pemain:
"${choiceText}"

Hasilkan adegan lanjutan berikutnya dalam format JSON murni.
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: DM_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    return { scene: JSON.parse(response.text.trim()), source: 'gemini' };
  } catch (err) {
    console.warn('[Next Branch Fallback]:', err.message);
    return { scene: fallbackContinuation, source: 'fallback', error: err.message };
  }
};

module.exports = {
  forgeCustomCampaign,
  generateCampaignOpening,
  generateNextBranch,
};
