import React, { useState } from 'react';
import { Volume2, RefreshCw, Sparkles, Shield, Heart, User, Check, X } from 'lucide-react';
import FantasyModal from '../common/FantasyModal';
import FantasyButton from '../common/FantasyButton';
import FantasyBadge from '../common/FantasyBadge';
import FantasyAvatar from '../common/FantasyAvatar';
import audio from '../../services/audioService';

export default function DynamicNpcModal({
  isOpen,
  onClose,
  npc,
  onRerollNpc,
  onSaveNpc
}) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [customQuote, setCustomQuote] = useState(npc?.greetingQuote || '');

  if (!isOpen || !npc) return null;

  const handlePlayVoice = () => {
    audio.playSelect();
    setIsPlayingVoice(true);
    audio.playNpcVoiceSample(npc.voiceConfig, customQuote || npc.greetingQuote);
    setTimeout(() => {
      setIsPlayingVoice(false);
    }, 2200);
  };

  const handleReroll = () => {
    onRerollNpc?.(npc.id);
  };

  const handleSave = () => {
    onSaveNpc?.(npc.id, { greetingQuote: customQuote });
    onClose?.();
  };

  const getRoleVariant = (role) => {
    switch (role) {
      case 'Merchant': return 'emerald';
      case 'Ally': return 'cyan';
      case 'Rival': return 'rose';
      default: return 'gold';
    }
  };

  return (
    <FantasyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil NPC Dinamis"
      subtitle="Pratinjau karakter non-pemain prosedural, kepribadian, dan modulasi suara"
      icon={User}
      accentColor={getRoleVariant(npc.role)}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* NPC Identity Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="relative">
            <FantasyAvatar
              avatarId={npc.avatarUrl}
              alt={npc.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/10 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2">
              <FantasyBadge variant={getRoleVariant(npc.role)} size="sm">
                {npc.role}
              </FantasyBadge>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="font-cinzel text-lg font-bold text-white tracking-wide">
                {npc.name}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Lvl {npc.stats?.level || 2} {npc.race}
              </span>
            </div>

            <p className="text-xs text-amber-300/90 font-medium">
              Kelas: {npc.characterClass}
            </p>

            <p className="text-xs text-slate-300 leading-relaxed font-light pt-1">
              {npc.bio}
            </p>

            {/* Quick Vitals */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                {npc.stats?.hp || 25} HP
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3.5 h-3.5" />
                AC {npc.stats?.ac || 14}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Modulation Test Deck */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="font-cinzel text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Modulasi Suara Web Audio / AI Voice
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <span>Pitch: {npc.voiceConfig?.pitch || 1.0}x</span>
              <span>Speed: {npc.voiceConfig?.rate || 1.0}x</span>
            </div>
          </div>

          {/* Dialogue Quote Input / Display */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-medium block">
              Kutipan Sapaan Awal (Dialog Pertama):
            </label>
            <textarea
              rows={2}
              value={customQuote}
              onChange={(e) => setCustomQuote(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-outfit"
              placeholder="Masukkan dialog sapaan NPC..."
            />
          </div>

          {/* Voice Play Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 italic">
              Klik untuk menguji modulasi sapaan suara NPC
            </span>
            <FantasyButton
              size="sm"
              variant="cyan"
              icon={Volume2}
              loading={isPlayingVoice}
              onClick={handlePlayVoice}
            >
              {isPlayingVoice ? 'Memutar Suara...' : 'Dengarkan Suara'}
            </FantasyButton>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <FantasyButton
            size="sm"
            variant="outline"
            icon={RefreshCw}
            onClick={handleReroll}
            title="Bangkitkan NPC baru untuk peran ini saja"
          >
            Acak Ulang NPC (Reroll)
          </FantasyButton>

          <div className="flex items-center gap-2">
            <FantasyButton
              size="sm"
              variant="secondary"
              onClick={onClose}
            >
              Tutup
            </FantasyButton>
            <FantasyButton
              size="sm"
              variant="primary"
              icon={Check}
              onClick={handleSave}
            >
              Simpan Profil
            </FantasyButton>
          </div>
        </div>
      </div>
    </FantasyModal>
  );
}
