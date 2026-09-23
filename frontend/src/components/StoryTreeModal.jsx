import React, { useState, useEffect } from 'react';
import { GitFork, RotateCcw, X, MapPin, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import audio from '../services/audioService';

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
    fetch(`http://127.0.0.1:5000/api/story/tree/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreeNodes(data.data || []);
          const current = data.data.find(n => n.id === currentNodeId);
          setSelectedNode(current || data.data[data.data.length - 1]);
        }
      })
      .catch(err => console.error('Gagal memuat story tree:', err))
      .finally(() => setLoading(false));
  }, [isOpen, sessionId, currentNodeId]);

  if (!isOpen) return null;

  const handleRewind = (nodeId) => {
    audio.playSelect();
    onRewind(nodeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-fantasy-card border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg md:text-xl font-bold text-cyan-300 tracking-wide">
                Pohon Percabangan Takdir & Rewind
              </h2>
              <p className="text-xs text-slate-400">
                Lompat kembali ke simpul cerita sebelumnya jika salah mengambil keputusan.
              </p>
            </div>
          </div>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Node List */}
          <div className="md:col-span-1 border-r border-slate-800/80 pr-4 space-y-2 max-h-[50vh] overflow-y-auto">
            <span className="text-[11px] font-bold font-cinzel text-slate-400 uppercase tracking-wider block mb-2">
              Jejak Perjalanan ({treeNodes.length} Adegan)
            </span>
            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">Memuat rantai cerita...</div>
            ) : (
              treeNodes.map((node, index) => {
                const isCurrent = node.id === currentNodeId;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => { audio.playClick(); setSelectedNode(node); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-md'
                        : isCurrent
                        ? 'bg-amber-950/30 border-fantasy-gold/60 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span>Simpul #{index + 1}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-fantasy-gold text-[9px] border border-amber-500/40">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="font-cinzel text-xs font-semibold truncate text-slate-200">
                      {node.chapterTitle || 'Babak'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {node.location || 'Lokasi'}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Node Detail Preview */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <h3 className="font-cinzel text-base font-bold text-cyan-300">
                      {selectedNode.chapterTitle}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedNode.location}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      "{selectedNode.dialogueText}"
                    </div>
                    {selectedNode.consequenceNote && (
                      <div className="text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/50 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-fantasy-gold flex-shrink-0" />
                        <span>{selectedNode.consequenceNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rewind Trigger */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-cinzel text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      Rewind ke Adegan Ini?
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Kamu akan memutar waktu kembali ke adegan ini. Progres setelahnya akan disesuaikan.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRewind(selectedNode.id)}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-cinzel font-bold text-xs tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Putar Balik
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center justify-center h-full">
                Pilih simpul di sisi kiri untuk melihat detail.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
