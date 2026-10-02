import React from 'react';
import {
  Sparkles,
  Shield,
  Heart,
  Swords,
  Scroll,
  Clock,
  Compass,
  User,
  Volume2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Flame,
  ArrowLeft
} from 'lucide-react';
import FantasyButton from '../common/FantasyButton';
import FantasyBadge from '../common/FantasyBadge';
import FantasyAvatar from '../common/FantasyAvatar';
import audio from '../../services/audioService';

export default function CampaignLivePreviewCard({
  campaign,
  onOpenNpcModal,
  onBackToEdit,
  onStartAdventure,
  onRegenerateAll
}) {
  if (!campaign) return null;

  const {
    title,
    description,
    themeName,
    difficultyName,
    crModifier,
    storyLength,
    npcs = [],
    enemies = [],
    nodes = []
  } = campaign;

  const crBadgeVariant = crModifier > 0 ? 'rose' : crModifier < 0 ? 'emerald' : 'gold';

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Campaign Overview Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <FantasyBadge variant="gold" size="sm">
                MODUL PROSEDURAL AI
              </FantasyBadge>
              <FantasyBadge variant="cyan" size="sm">
                {themeName}
              </FantasyBadge>
              <FantasyBadge variant={crBadgeVariant} size="sm">
                CR Mod: {crModifier >= 0 ? `+${crModifier}` : crModifier} ({difficultyName})
              </FantasyBadge>
            </div>

            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white tracking-wide">
              {title}
            </h2>

            <p className="font-outfit text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
              {description}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1 flex-wrap">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Scroll className="w-4 h-4 text-amber-400" />
                {storyLength} Babak Cerita
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-cyan-300">
                <User className="w-4 h-4 text-cyan-400" />
                {npcs.length} Karakter NPC
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <Swords className="w-4 h-4 text-rose-400" />
                {enemies.length} Musuh D&D 5E
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <FantasyButton
              variant="primary"
              size="lg"
              icon={Sparkles}
              sound="select"
              onClick={onStartAdventure}
              className="w-full shadow-amber-500/20 shadow-xl"
            >
              Mulai Petualangan Ini
            </FantasyButton>

            <div className="flex items-center gap-2">
              <FantasyButton
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                onClick={onBackToEdit}
                className="flex-1"
              >
                Ubah Parameter
              </FantasyButton>
              <FantasyButton
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={onRegenerateAll}
                title="Bangkitkan ulang cerita dari awal"
              >
                Acak Ulang
              </FantasyButton>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Dynamic NPC Deck & D&D 5E Enemies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic NPC Deck Card */}
        <div className="rounded-3xl bg-slate-950/90 border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="font-cinzel text-base font-bold text-white tracking-wide">
                Deck NPC Dinamis ({npcs.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Interaktif &amp; Uji Suara
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {npcs.map((npc) => {
              const roleVariant = npc.role === 'Merchant' ? 'emerald' : npc.role === 'Ally' ? 'cyan' : npc.role === 'Rival' ? 'rose' : 'gold';

              return (
                <div
                  key={npc.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <FantasyAvatar
                      avatarId={npc.avatarUrl}
                      alt={npc.name}
                      className="w-11 h-11 rounded-xl border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-cinzel text-xs font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                          {npc.name}
                        </h4>
                        <FantasyBadge variant={roleVariant} size="sm">
                          {npc.role}
                        </FantasyBadge>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {npc.race} • {npc.characterClass}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 italic font-light line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                    "{npc.greetingQuote}"
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      onOpenNpcModal(npc);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Tinjau Profil &amp; Suara</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* D&D 5E Enemy Monster Badges Card */}
        <div className="rounded-3xl bg-slate-950/90 border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-rose-400" />
              <h3 className="font-cinzel text-base font-bold text-white tracking-wide">
                Encounter Musuh D&amp;D 5E ({enemies.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              CR Modifier: {crModifier >= 0 ? `+${crModifier}` : crModifier}
            </span>
          </div>

          <div className="space-y-3">
            {enemies.map((enemy, idx) => (
              <div
                key={enemy.id || idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-cinzel text-sm font-bold text-rose-200">
                      {enemy.name}
                    </h4>
                    <FantasyBadge variant="rose" size="sm">
                      Tantangan CR {enemy.cr || 1}
                    </FantasyBadge>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                    <span className="text-rose-400 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      HP {enemy.hp}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Armor Class (AC) {enemy.ac}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(enemy.abilities || []).map((ability, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/50 text-rose-300 text-[10px] font-mono"
                    >
                      {ability}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Nodes Branch Preview Track */}
      <div className="rounded-3xl bg-slate-950/90 border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-base font-bold text-white tracking-wide">
              Pratinjau Simpul Cerita ({nodes.length} Babak)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Urutan Babak Naratif &amp; Taktis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((node, index) => {
            const hasCombat = Boolean(node.combatEncounter);
            const isBoss = index === nodes.length - 1;

            return (
              <div
                key={node.id || index}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isBoss
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : hasCombat
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/60 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span className="text-slate-400">Babak #{index + 1}</span>
                  {isBoss ? (
                    <FantasyBadge variant="rose" size="sm">
                      Boss Puncak
                    </FantasyBadge>
                  ) : hasCombat ? (
                    <FantasyBadge variant="gold" size="sm">
                      Pertempuran
                    </FantasyBadge>
                  ) : (
                    <FantasyBadge variant="cyan" size="sm">
                      Eksplorasi
                    </FantasyBadge>
                  )}
                </div>

                <div className="font-cinzel text-xs font-bold text-white truncate">
                  {node.chapterTitle}
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-light">
                  {node.dialogueText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
