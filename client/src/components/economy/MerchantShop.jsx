import React, { useState } from 'react';
import { Store, Coins, ShoppingBag, Sparkles } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

const MERCHANT_ITEMS = [
  { id: 'healing_potion', name: 'Ramuan Pemulih (Healing Potion)', type: 'consumable', price: 25, weight: 0.5, desc: 'Memulihkan 2d4+2 HP.' },
  { id: 'longsword', name: 'Pedang Panjang Baja Tempa', type: 'weapon', slot: 'mainHand', damage: '1d8 tebasan', price: 15, weight: 3, desc: 'Pedang tajam bermata ganda.' },
  { id: 'shield', name: 'Perisai Kayu Berpaku Besi', type: 'shield', slot: 'offHand', acBonus: 2, price: 10, weight: 6, desc: 'Memberi tambahan +2 AC.' },
  { id: 'chain_mail', name: 'Zirah Rantai Prajurit', type: 'armor', slot: 'chest', acBonus: 6, baseAc: 16, price: 75, weight: 55, desc: 'AC dasar menjadi 16.' },
  { id: 'herb_bloodleaf', name: 'Daun Bloodleaf (Bahan Alkimia)', type: 'ingredient', price: 5, weight: 0.1, desc: 'Bahan herbal peracik ramuan.' },
  { id: 'flask_water', name: 'Botol Kaca Air Murni', type: 'ingredient', price: 2, weight: 0.5, desc: 'Wadah kaca air murni.' },
  { id: 'iron_ore', name: 'Bongkahan Bijih Besi', type: 'ingredient', price: 8, weight: 5, desc: 'Bahan tempa pelindung.' },
  { id: 'ring_of_protection', name: 'Cincin Perlindungan Sihir', type: 'ring', slot: 'ring', acBonus: 1, price: 120, weight: 0.1, desc: 'Menambah +1 AC secara permanen.' },
];

export const MerchantShop = ({ character, onUpdateCharacter }) => {
  const playerGold = character.gold || 0;
  const playerInventory = character.inventory || [];
  const [merchantDialogue, setMerchantDialogue] = useState(
    'Selamat datang, pengembara gagah! Toko kami menyediakan senjata teruji dan ramuan berkhasiat.'
  );
  const [haggleUsed, setHaggleUsed] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Buy Item
  const handleBuyItem = async (item) => {
    const finalPrice = Math.max(1, Math.floor(item.price * (1 - discount)));
    if (playerGold < finalPrice) {
      setMerchantDialogue('Maaf kawan, koin emasmu tidak cukup untuk barang seistimewa ini!');
      return;
    }

    const updatedGold = playerGold - finalPrice;
    const updatedInv = [...playerInventory, { ...item, id: `${item.id}_${Date.now()}` }];

    audioEngine.playCoinDrop();
    setMerchantDialogue(`Terima kasih! Semoga ${item.name} melindungimu di dalam dungeon.`);
    syncCharacterData(updatedGold, updatedInv);
  };

  // Sell Item
  const handleSellItem = async (item, index) => {
    const sellValue = Math.max(1, Math.floor((item.value || item.price || 10) * 0.5));
    const updatedGold = playerGold + sellValue;
    const updatedInv = playerInventory.filter((_, i) => i !== index);

    audioEngine.playCoinDrop();
    setMerchantDialogue(`Barang bagus! Aku membelinya seharga ${sellValue} koin emas.`);
    syncCharacterData(updatedGold, updatedInv);
  };

  // Haggle discount using Charisma D20 Check
  const handleHaggle = () => {
    if (haggleUsed) return;
    setHaggleUsed(true);
    audioEngine.playDiceRoll();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const chaMod = Math.floor(((character.charisma || 10) - 10) / 2);
    const totalRoll = d20 + chaMod;

    if (totalRoll >= 13) {
      setDiscount(0.2); // 20% Discount
      audioEngine.playSpellCast();
      setMerchantDialogue(`🎲 Charisma Check: ${totalRoll} (BERHASIL!). "Hahaha pandai sekali kamu bicara, kawan! Aku berikan diskon khusus 20% untuk semua barang!"`);
    } else {
      setMerchantDialogue(`🎲 Charisma Check: ${totalRoll} (GAGAL). "Harga di tokoku sudah pas, tidak bisa kurang lagi!"`);
    }
  };

  const syncCharacterData = async (gold, inventory) => {
    try {
      await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gold, inventory }),
      });
      onUpdateCharacter?.({ ...character, gold, inventory });
    } catch (e) {
      console.error('Gagal sinkron data karakter:', e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Shop Banner */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-fantasy-gold flex items-center justify-center text-2xl shadow-gold-glow">
            🛒
          </div>
          <div>
            <h2 className="font-cinzel text-fantasy-gold text-xl font-bold flex items-center gap-2">
              Kedai Pedagang Keliling (Merchant Bazaar)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Pusat pertukaran barang, senjata, zirah, dan bahan ramuan berharga
            </p>
          </div>
        </div>

        {/* Player Gold & Haggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleHaggle}
            disabled={haggleUsed}
            className="bg-purple-950/60 hover:bg-purple-900 text-purple-200 font-cinzel font-bold text-xs px-3.5 py-2 rounded-xl border border-purple-700/60 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Sparkles size={14} /> {discount > 0 ? 'Diskon 20% Aktif!' : 'Tawar Harga (Charisma Check)'}
          </button>

          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-fantasy-gold/50 flex items-center gap-2 text-sm font-black font-cinzel text-amber-300 shadow-sm">
            <Coins size={18} className="text-fantasy-gold" /> {playerGold} GP
          </div>
        </div>
      </div>

      {/* Merchant NPC Dialogue Balloon */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
        <span className="text-2xl">🧔‍♂️</span>
        <p className="italic">"{merchantDialogue}"</p>
      </div>

      {/* Shop Grid Split: Buy Catalog vs Sell Player Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Merchant Goods (Beli) */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
          <h3 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <Store size={16} /> Etalase Toko Pedagang
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {MERCHANT_ITEMS.map((item) => {
              const finalPrice = Math.max(1, Math.floor(item.price * (1 - discount)));
              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-fantasy-gold/50 transition-all flex justify-between items-center"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-bold text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-cinzel font-bold text-xs text-amber-300">
                      {discount > 0 ? (
                        <div>
                          <span className="line-through text-slate-500 text-[10px] mr-1">{item.price}</span>
                          <span>{finalPrice} GP</span>
                        </div>
                      ) : (
                        `${item.price} GP`
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyItem(item)}
                      className="bg-fantasy-gold hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      Beli
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Player Inventory (Jual) */}
        <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
          <h3 className="font-cinzel text-amber-300 font-bold text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShoppingBag size={16} /> Tas Pahlawan (Jual Barang Jarahan)
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {playerInventory.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 italic">
                Tas inventarismu kosong. Jelajahi dungeon untuk menemukan harta rampasan!
              </div>
            ) : (
              playerInventory.map((item, idx) => {
                const sellValue = Math.max(1, Math.floor((item.value || item.price || 10) * 0.5));
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex justify-between items-center"
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc || 'Barang petualang.'}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-cinzel font-bold text-xs text-amber-300">+{sellValue} GP</span>
                      <button
                        type="button"
                        onClick={() => handleSellItem(item, idx)}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-cinzel font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 transition-all"
                      >
                        Jual
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
