export const PRESET_STORIES = [
  {
    id: 'tomb-of-forgotten-king',
    title: 'Makam Kuno Raja yang Terlupakan',
    category: 'Dungeon Crawl & Misteri',
    difficulty: 'Sedang (Level 1-3)',
    description: 'Di kedalaman Rawa Berkabut, gerbang batu sebuah makam kuno yang terkunci selama ribuan tahun tiba-tiba terbuka. Konon di dalamnya tersimpan Mahkota Surya, namun aura sihir kutukan dan jeritan prajurit undead mulai merayap keluar.',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    tags: ['Undead', 'Teka-teki', 'Harta Karun', 'Kutukan Kuno'],
    startingLocation: 'Gerbang Makam Kuno Crypt of Eldoria',
    introPrompt: 'Kamu berdiri di depan gerbang batu raksasa berlumut yang telah terbelah dua. Bau tanah basah dan udara dingin berhembus dari dalam koridor gelap. Obor di tanganmu menyinari ukiran rune kuno bertuliskan peringatan bahaya...',
    initialChoices: [
      { id: 'c1', text: 'Nyalakan obor lebih terang dan melangkah masuk ke koridor utama dengan waspada.', action: 'enter_cautiously' },
      { id: 'c2', text: 'Periksa rune kuno di dinding gerbang untuk mencari petunjuk atau jebakan tersembunyi (Intelligence Check).', action: 'inspect_runes' },
      { id: 'c3', text: 'Tarik senjata dan bersiap siaga menghadapi apapun yang bersembunyi di dalam kegelapan.', action: 'ready_weapon' }
    ]
  },
  {
    id: 'shadow-of-drakon-peak',
    title: 'Bayangan Puncak Drakon',
    category: 'Ekspedisi Naga & Pegunungan',
    difficulty: 'Tinggi (Level 2-4)',
    description: 'Desa lereng gunung Frostpeak diteror oleh wyrm api merah yang terbangun dari tidurnya di kawah puncak. Sebagai petualang berani, kamu ditugaskan oleh tetua desa untuk menyusup ke sarang naga sebelum seluruh lembah hangus terbakar.',
    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    tags: ['Naga Wyrm', 'Salju Ekstrem', 'Survival', 'Pertarungan Bos'],
    startingLocation: 'Pondok Pemburu di Kaki Gunung Frostpeak',
    introPrompt: 'Badai salju berhembus kencang membekukan mantelmu. Di kejauhan puncak gunung, langit malam menyala kemerahan disusul suara raungan dahsyat yang menggetarkan lereng es...',
    initialChoices: [
      { id: 'c1', text: 'Cari jalur pendakian tersembunyi lewat tebing beku agar terhindar dari badai terbuka (Athletics Check).', action: 'climb_cliff' },
      { id: 'c2', text: 'Konsultasikan peta gunung tua milik pemburu untuk menemukan gua persembunyian terdekat.', action: 'check_map' },
      { id: 'c3', text: 'Gunakan mantra pencari jejak atau sihir deteksi panas untuk melacak sarang monster.', action: 'cast_tracker' }
    ]
  },
  {
    id: 'whispers-of-shadowfen',
    title: 'Bisikan Hutan Sihir Shadowfen',
    category: 'Misteri Arcane & Eksplorasi',
    difficulty: 'Mudah - Sedang (Level 1-2)',
    description: 'Pohon-pohon di hutan Shadowfen mulai berbicara dengan suara yang menyesatkan para pengembara. Kristal mana ungu misterius menyembur dari akar-akar raksasa, mengubah hewan buas menjadi monster berkilau magis.',
    cover: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80',
    tags: ['Peri Liar', 'Sihir Terlarang', 'Investigasi', 'Faerie Realm'],
    startingLocation: 'Tepi Hutan Kabut Ungu Shadowfen',
    introPrompt: 'Cahaya bulan malam ini berwarna ungu keperakan. Ranting-ranting pepohonan tampak saling bertaut membentuk lorong hidup. Suara senandika merdu terdengar samar dari balik kabut tebal...',
    initialChoices: [
      { id: 'c1', text: 'Ikuti arah senandung misterius dengan langkah perlahan dan senjata terhunus.', action: 'follow_song' },
      { id: 'c2', text: 'Ambil sampel kristal ungu di dekat pohon untuk mengidentifikasi jenis sihirnya (Arcana Check).', action: 'analyze_crystal' },
      { id: 'c3', text: 'Pasang api unggun suci untuk menangkal ilusi dan pengaruh magis kabut.', action: 'light_holy_fire' }
    ]
  },
  {
    id: 'tavern-brawl-conspiracy',
    title: 'Konspirasi di Kedai Red Boar',
    category: 'Petualangan Kota & Intrik Politik',
    difficulty: 'Level 1 (Pemula)',
    description: 'Sebuah malam santai di kedai ibukota berubah kacau saat seorang utusan kerajaan tewas diracun di depan matamu, dan sebelum menghembuskan nafas terakhir, ia menyelipkan sebuah segel surat rahasia ke dalam sakumu.',
    cover: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    tags: ['Intrik Kota', 'Detektif', 'Perkelahian Bar', 'Assassin'],
    startingLocation: 'Kedai Minum The Red Boar, Kota Oakhaven',
    introPrompt: 'Gelas bir pecah dan teriakan histeris menggema di penjuru kedai. Para penjaga kota mulai mengepung pintu keluar, sementara beberapa sosok bertudung hitam menatap tajam ke arahmu dari sudut gelap...',
    initialChoices: [
      { id: 'c1', text: 'Sembunyikan surat rahasia itu ke dalam sepatu boot sebelum penjaga menggeledah (Sleight of Hand Check).', action: 'hide_letter' },
      { id: 'c2', text: 'Lompat ke atas meja dan hadapi sosok bertudung hitam sebelum mereka menyerang (Initiative Roll).', action: 'fight_assassins' },
      { id: 'c3', text: 'Loloskan diri keluar lewat jendela dapur kedai di bagian belakang (Acrobatics Check).', action: 'escape_kitchen' }
    ]
  }
];
