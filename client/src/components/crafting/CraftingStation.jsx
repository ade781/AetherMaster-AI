import React, { useState } from 'react';
import { Hammer } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

const CRAFT_RECIPES = [
  {
    id: 'recipe_heal',
    name: 'Ramuan Pemulih Darah (Healing Potion)',
    result: { id: 'healing_potion', name: 'Ramuan Pemulih (Healing Potion)', type: 'consumable', healDice: '2d4+2', weight: 0.5, value: 50, desc: 'Cairan merah berkilau yang memulihkan 2d4+2 HP saat diminum.' },
    materials: ['herb_bloodleaf', 'flask_water'],
    materialNames: ['Daun Bloodleaf (1x)', 'Botol Kaca Air Murni (1x)'],
    icon: '🧪',
    desc: 'Seduhan herbal beraroma harum penumbuh jaringan sel luka.'
  },
  {
    id: 'recipe_shield',
    name: 'Perisai Kayu Berpaku Besi (Shield)',
    result: { id: 'shield', name: 'Perisai Kayu Berpaku (Shield)', type: 'shield', slot: 'offHand', acBonus: 2, weight: 6, value: 10, desc: 'Perisai bundar yang memberi tambahan +2 Armor Class.' },
    materials: ['iron_ore'],
    materialNames: ['Bongkahan Bijih Besi (1x)'],
    icon: '🛡️',
    desc: 'Penempaan lempengan besi padat menjadi pelindung perisai.'
  },
  {
    id: 'recipe_dagger',
    name: 'Belati Baja Beracun (Venom Dagger)',
    result: { id: 'poison_dagger', name: 'Belati Baja Beracun', type: 'weapon', slot: 'offHand', damage: '1d4 tusukan + 1d4 racun', weight: 1, value: 35, desc: 'Belati tajam yang dilapisi racun ular makam.' },
    materials: ['iron_ore', 'venom_sac'],
    materialNames: ['Bongkahan Bijih Besi (1x)', 'Kantung Racun Ular Makam (1x)'],
    icon: '🗡️',
    desc: 'Bilah belati yang dicelupkan ke dalam racun pekat.'
  }
];

export const CraftingStation = ({ character, onUpdateCharacter }) => {
  const inventory = character.inventory || [];
  const [craftMessage, setCraftMessage] = useState('');

  // Check if player has all required materials
  const canCraft = (recipe) => {
    return recipe.materials.every((matId) => {
      return inventory.some((item) => item.id.includes(matId));
    });
  };

  const handleCraft = async (recipe) => {
    if (!canCraft(recipe)) {
      alert('Bahan mentah di dalam tas inventarismu tidak mencukupi untuk resep ini!');
      return;
    }

    // Remove 1 unit of each required material from inventory
    const updatedInv = [...inventory];
    recipe.materials.forEach((matId) => {
      const idx = updatedInv.findIndex((item) => item.id.includes(matId));
      if (idx >= 0) {
        updatedInv.splice(idx, 1);
      }
    });

    // Add crafted result item
    const newItem = { ...recipe.result, id: `${recipe.result.id}_${Date.now()}` };
    updatedInv.push(newItem);

    audioEngine.playSpellCast();
    setCraftMessage(`Berhasil meracik: ${recipe.name}! Item telah dimasukkan ke dalam tas.`);
    setTimeout(() => setCraftMessage(''), 4000);

    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: updatedInv }),
      });
      onUpdateCharacter?.({ ...character, inventory: updatedInv });
    } catch (e) {
      console.error('Gagal menyimpan hasil crafting:', e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-2xl shadow-arcane-glow">
            ⚗️
          </div>
          <div>
            <h2 className="font-cinzel text-purple-300 text-xl font-bold flex items-center gap-2">
              Meja Alkimia & Bengkel Penempaan (Crafting Station)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Kombinasikan bahan herbal, bijih tambang, dan organ monster menjadi ramuan serta perlengkapan tempur
            </p>
          </div>
        </div>
      </div>

      {craftMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl text-center font-bold text-xs shadow-md animate-pulse">
          ✨ {craftMessage}
        </div>
      )}

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CRAFT_RECIPES.map((recipe) => {
          const available = canCraft(recipe);
          return (
            <div
              key={recipe.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                available ? 'border-fantasy-gold/60 shadow-gold-glow' : 'border-slate-800 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{recipe.icon}</span>
                  <div>
                    <h3 className="font-cinzel text-slate-100 font-bold text-xs sm:text-sm">{recipe.name}</h3>
                    <span className="text-[10px] text-slate-400">{recipe.desc}</span>
                  </div>
                </div>

                <div className="mt-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Bahan yang Dibutuhkan:</div>
                  {recipe.materialNames.map((mat, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                      <span className="text-fantasy-gold">•</span> {mat}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCraft(recipe)}
                disabled={!available}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase py-2.5 rounded-xl shadow-gold-glow flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Hammer size={14} /> {available ? 'Racik / Tempa Sekarang' : 'Bahan Belum Cukup'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
