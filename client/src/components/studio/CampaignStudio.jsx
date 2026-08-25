import React, { useState } from 'react';
import { QuestFlowBuilder } from './QuestFlowBuilder';
import { LorebookEditor } from './LorebookEditor';
import { DungeonTilePainter } from './DungeonTilePainter';
import { MonsterCreator } from './MonsterCreator';
import { Hammer, Download, Upload, Save, GitFork, BookOpen, LayoutGrid, Skull, Check } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

export const CampaignStudio = () => {
  const [activeTab, setActiveTab] = useState('quest'); // 'quest' | 'lore' | 'map' | 'monster'
  const [campaignData, setCampaignData] = useState({
    title: 'Makam Kuno Raja yang Terlupakan (Kustom)',
    synopsis: 'Sebuah modul petualangan bawah tanah penuh teka-teki kuno dan monster kegelapan.',
    genre: 'Dark Fantasy',
    difficulty: 'Menengah (Tingkat 1-4)',
    questNodes: [
      { id: 'node_1', title: 'Gerbang Makam Eldoria', type: 'narrative', desc: 'Pemain berdiri di depan pintu gerbang batu kuno yang tertutup lumut.', nextNodes: ['node_2'] },
      { id: 'node_2', title: 'Perangkap Panah Racun', type: 'trap', desc: 'Lantai berderit memicu semburan panah dari dinding.', nextNodes: ['node_3'] },
      { id: 'node_3', title: 'Kamar Harta Karun Naga', type: 'loot', desc: 'Sebuah peti perunggu kuno berkilau di atas altar batu.', nextNodes: ['node_4'] },
      { id: 'node_4', title: 'Ksatria Makam Abadi', type: 'boss', desc: 'Pertarungan puncak melawan pelindung makam kuno.', nextNodes: [] },
    ],
    lorebook: [
      { id: 'lore_1', topic: 'Kerajaan Eldoria', content: 'Kerajaan megah di utara yang runtuh 500 tahun lalu akibat kutukan raja tirani.' },
      { id: 'lore_2', topic: 'Kultus Bayangan', content: 'Organisasi pemuja naga yang bersembunyi di bawah tanah.' },
    ],
    customMonsters: [
      { id: 'cm_1', name: 'Ksatria Zirah Kuno', cr: '2', maxHp: 30, armorClass: 15, attackName: 'Tebasan Pedang Kutukan', damageDice: '1d10+3', icon: '🛡️' }
    ],
    mapLayout: [],
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save to backend database
  const handleSaveToDatabase = async () => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });
      const data = await res.json();
      if (data.success) {
        audioEngine.playSpellCast();
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Gagal menyimpan campaign', e);
    }
  };

  // Export JSON file (Ponytail native download)
  const handleExportJson = () => {
    audioEngine.playCoinDrop();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(campaignData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${campaignData.title.replace(/\s+/g, '_')}_campaign.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJson = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          setCampaignData(parsed);
          audioEngine.playDiceRoll();
          alert('Campaign berhasil diimpor!');
        } catch (err) {
          alert('Format file JSON tidak valid!');
        }
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Studio Header */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 border border-fantasy-border p-5 rounded-2xl gap-4 shadow-xl">
        <div>
          <h2 className="font-cinzel text-fantasy-gold text-2xl font-bold flex items-center gap-2">
            <Hammer size={24} /> No-Code Campaign & World Builder Studio
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Rancang modul petualangan, pohon quest, ensiklopedia dunia, monster kustom, dan tata letak dungeon
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload size={14} /> Impor JSON
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportJson}
            className="bg-slate-800 hover:bg-slate-700 text-fantasy-gold font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border border-fantasy-gold/40 flex items-center gap-1.5 transition-all"
          >
            <Download size={14} /> Ekspor JSON
          </button>

          <button
            type="button"
            onClick={handleSaveToDatabase}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-gold-glow flex items-center gap-1.5 transition-all"
          >
            {savedSuccess ? <Check size={14} /> : <Save size={14} />} {savedSuccess ? 'Tersimpan!' : 'Simpan Modul'}
          </button>
        </div>
      </div>

      {/* Campaign Metadata Fields */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Judul Modul Campaign:</label>
            <input
              type="text"
              value={campaignData.title}
              onChange={(e) => setCampaignData({ ...campaignData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-semibold block mb-1">Genre & Tema:</label>
            <input
              type="text"
              value={campaignData.genre}
              onChange={(e) => setCampaignData({ ...campaignData, genre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 font-semibold block mb-1">Sinopsis Cerita:</label>
          <textarea
            rows={2}
            value={campaignData.synopsis}
            onChange={(e) => setCampaignData({ ...campaignData, synopsis: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold leading-relaxed"
          />
        </div>
      </div>

      {/* Studio Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('quest')}
          className={`font-cinzel font-bold text-xs uppercase pb-3 flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'quest'
              ? 'border-fantasy-gold text-fantasy-gold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork size={15} /> Bagan Alur Quest ({campaignData.questNodes?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lore')}
          className={`font-cinzel font-bold text-xs uppercase pb-3 flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'lore'
              ? 'border-fantasy-gold text-fantasy-gold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen size={15} /> Ensiklopedia Lore ({campaignData.lorebook?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`font-cinzel font-bold text-xs uppercase pb-3 flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'map'
              ? 'border-fantasy-gold text-fantasy-gold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={15} /> Lukis Peta Dungeon
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monster')}
          className={`font-cinzel font-bold text-xs uppercase pb-3 flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'monster'
              ? 'border-fantasy-gold text-fantasy-gold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Skull size={15} /> Monster Kustom ({campaignData.customMonsters?.length || 0})
        </button>
      </div>

      {/* Dynamic Sub-View */}
      <div>
        {activeTab === 'quest' && (
          <QuestFlowBuilder
            nodes={campaignData.questNodes || []}
            onChangeNodes={(nodes) => setCampaignData({ ...campaignData, questNodes: nodes })}
          />
        )}

        {activeTab === 'lore' && (
          <LorebookEditor
            lorebook={campaignData.lorebook || []}
            onChangeLorebook={(lore) => setCampaignData({ ...campaignData, lorebook: lore })}
          />
        )}

        {activeTab === 'map' && (
          <DungeonTilePainter
            mapLayout={campaignData.mapLayout || []}
            onChangeMapLayout={(layout) => setCampaignData({ ...campaignData, mapLayout: layout })}
          />
        )}

        {activeTab === 'monster' && (
          <MonsterCreator
            customMonsters={campaignData.customMonsters || []}
            onChangeCustomMonsters={(monsters) => setCampaignData({ ...campaignData, customMonsters: monsters })}
          />
        )}
      </div>
    </div>
  );
};
