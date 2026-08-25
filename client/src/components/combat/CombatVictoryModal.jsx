import React from 'react';
import { Trophy, Coins, Sparkles, ArrowRight, Award } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

export const CombatVictoryModal = ({ monster, expEarned, goldEarned, onClaimReward }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl max-w-md w-full p-6 border-2 border-fantasy-gold shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center mx-auto shadow-gold-glow animate-bounce">
          <Trophy size={32} className="text-slate-950" />
        </div>

        <div>
          <span className="text-xs text-fantasy-gold uppercase tracking-widest font-bold">KEMENANGAN TEMPUR!</span>
          <h3 className="font-cinzel text-fantasy-gold text-2xl font-black mt-1">
            {monster.name} Telah Tumbang!
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Keberanianmu telah membuahkan hasil dalam pertarungan taktis ini.
          </p>
        </div>

        {/* Rewards Box */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 font-medium">PENGALAMAN (EXP)</div>
            <div className="text-xl font-black font-cinzel text-purple-400 flex items-center justify-center gap-1 mt-0.5">
              <Award size={16} /> +{expEarned} EXP
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 font-medium">KOIN EMAS JARAHAN</div>
            <div className="text-xl font-black font-cinzel text-amber-300 flex items-center justify-center gap-1 mt-0.5">
              <Coins size={16} /> +{goldEarned} GP
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audioEngine.playCoinDrop();
            onClaimReward();
          }}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-gold-glow flex items-center justify-center gap-2 transition-all"
        >
          Klaim Hadiah & Selesaikan Pertarungan <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
