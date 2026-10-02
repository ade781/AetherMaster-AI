import React, { useState, useEffect } from 'react';
import { GitFork, RotateCcw, MapPin, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import FantasyModal from './common/FantasyModal';
import FantasyButton from './common/FantasyButton';
import FantasyBadge from './common/FantasyBadge';
import audio from '../services/audioService';
import storyApi from '../services/api';

export default function StoryTreeModal({
  isOpen,
  onClose,
  sessionId,
  currentNodeId,
  onRewind
}) {
  const [treeNodes, setTreeNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setLoading(true);
    storyApi.getStoryTree(sessionId)
      .then(data => {
        if (data.success) {
          const nodes = data.data || [];
          setTreeNodes(nodes);
          const current = nodes.find(n => n.id === currentNodeId);
          setSelectedNode(current || nodes[nodes.length - 1] || null);
        }
      })
      .catch(err => console.error('Gagal memuat timeline story tree:', err))
      .finally(() => setLoading(false));
  }, [isOpen, sessionId, currentNodeId]);

  if (!isOpen) return null;

  const handleRewind = (nodeId) => {
    audio.playSelect();
    onRewind(nodeId);
    onClose();
  };

  const isCurrentActive = selectedNode?.id === currentNodeId;

  return (
    <FantasyModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chronicle of Choices (Pohon Takdir)"
      subtitle="Tinjau cabang alur cerita dan pulihkan snapshot takdir sebelumnya"
      icon={GitFork}
      accentColor="cyan"
      maxWidth="max-w-4xl"
    >
      {/* Branching Minimap Scroller */}
      <div className="mb-4 p-3 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-300 font-cinzel font-bold">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            Minimap Alur Cerita
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Masa Lalu
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Saat Ini
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Tersedia Rewind
            </span>
          </div>
        </div>

        {/* Drag-scrollable horizontal node track */}
        <div className="overflow-x-auto py-3 px-2 flex items-center gap-2 custom-scrollbar">
          {treeNodes.map((node, idx) => {
            const isCurrent = node.id === currentNodeId;
            const isSelected = selectedNode?.id === node.id;
            const isPast = idx < treeNodes.findIndex(n => n.id === currentNodeId);

            return (
              <React.Fragment key={node.id}>
                {idx > 0 && (
                  <div className={`h-0.5 w-6 shrink-0 transition-colors ${
                    isPast ? 'bg-cyan-500/40' : isCurrent ? 'bg-amber-400/80' : 'bg-white/10'
                  }`} />
                )}
                <button
                  type="button"
                  onClick={() => { audio.playClick(); setSelectedNode(node); }}
                  className={`group relative shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                  title={`${node.chapterTitle || 'Adegan'} (Babak #${idx + 1})`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-md ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 animate-pulse'
                      : isSelected
                      ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300'
                      : isPast
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-cinzel max-w-[64px] truncate text-center ${
                    isCurrent ? 'text-amber-300 font-bold' : isSelected ? 'text-cyan-300' : 'text-slate-400'
                  }`}>
                    {node.chapterTitle?.split(' ')[0] || `Node ${idx + 1}`}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Node Timeline List */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4 space-y-2 max-h-[46vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold font-cinzel text-slate-400 uppercase tracking-wider">
              Daftar Babak ({treeNodes.length})
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 font-cinzel space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-cyan-400" />
              <p>Membaca percabangan...</p>
            </div>
          ) : (
            treeNodes.map((node, index) => {
              const isCurrent = node.id === currentNodeId;
              const isSelected = selectedNode?.id === node.id;
              const isPast = index < treeNodes.findIndex(n => n.id === currentNodeId);

              return (
                <button
                  type="button"
                  key={node.id}
                  onClick={() => { audio.playClick(); setSelectedNode(node); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-sm'
                      : isCurrent
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md ring-1 ring-amber-500/30'
                      : isPast
                      ? 'bg-slate-900/60 border-cyan-950/60 text-slate-300 hover:border-cyan-500/40'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span>Babak #{index + 1}</span>
                    {isCurrent ? (
                      <FantasyBadge variant="gold" size="sm">
                        Saat Ini
                      </FantasyBadge>
                    ) : isPast ? (
                      <FantasyBadge variant="cyan" size="sm">
                        Rewind
                      </FantasyBadge>
                    ) : (
                      <span className="text-[10px] text-slate-500">Masa Depan</span>
                    )}
                  </div>

                  <div className="font-cinzel text-xs font-semibold truncate text-white">
                    {node.chapterTitle || 'Adegan Kisah'}
                  </div>

                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{node.location || 'Aetheria'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Node Dossier & Rewind Trigger */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-wrap gap-2">
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-cyan-300">
                      {selectedNode.chapterTitle || 'Simpul Cerita'}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Penutur: <strong className="text-slate-200">{selectedNode.speaker || 'Narator'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedNode.location || 'Aetheria'}</span>
                  </div>
                </div>

                {/* Dialogue Narrative Extract */}
                <div className="text-xs sm:text-sm text-slate-300 italic bg-slate-950/80 p-3.5 rounded-xl border border-white/5 leading-relaxed font-light">
                  "{selectedNode.dialogueText}"
                </div>

                {/* Consequence Note if any */}
                {selectedNode.consequenceNote && (
                  <div className="text-xs text-amber-300 bg-amber-950/30 p-3 rounded-xl border border-amber-500/30 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{selectedNode.consequenceNote}</span>
                  </div>
                )}
              </div>

              {/* Rewind Action Panel */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-cinzel text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    {isCurrentActive ? 'Posisi Adegan Aktif' : 'Putar Balik Takdir ke Simpul Ini?'}
                  </h4>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {isCurrentActive
                      ? 'Ini adalah adegan yang sedang kamu mainkan saat ini.'
                      : 'Memutar waktu akan mengembalikan HP, tas inventaris, dan status dunia persis pada saat adegan ini terjadi.'}
                  </p>
                </div>

                {!isCurrentActive ? (
                  <FantasyButton
                    variant="primary"
                    size="md"
                    icon={RotateCcw}
                    sound="select"
                    onClick={() => handleRewind(selectedNode.id)}
                    className="shrink-0 w-full sm:w-auto"
                  >
                    Putar Balik
                  </FantasyButton>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-cinzel font-semibold px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sedang Berjalan</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center justify-center h-48">
              Pilih salah satu simpul di garis waktu sebelah kiri untuk melihat rincian kisah.
            </div>
          )}
        </div>
      </div>
    </FantasyModal>
  );
}
