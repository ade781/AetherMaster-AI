import React, { useState } from 'react';
import { GitFork, Plus, Trash2, Edit3, ArrowRight, ShieldAlert, Sparkles, Trophy } from 'lucide-react';

export const QuestFlowBuilder = ({ nodes = [], onChangeNodes }) => {
  const [selectedNode, setSelectedNode] = useState(nodes[0] || null);

  const handleAddNode = () => {
    const newNode = {
      id: `node_${Date.now()}`,
      title: `Node Bab ${nodes.length + 1}`,
      type: 'narrative', // 'narrative' | 'trap' | 'loot' | 'boss'
      desc: 'Tuliskan deskripsi situasi atau peristiwa yang dihadapi pemain...',
      nextNodes: [],
    };
    const updated = [...nodes, newNode];
    onChangeNodes(updated);
    setSelectedNode(newNode);
  };

  const handleUpdateCurrentNode = (field, val) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, [field]: val };
    setSelectedNode(updatedNode);
    onChangeNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const handleDeleteNode = (id) => {
    const updated = nodes.filter(n => n.id !== id);
    onChangeNodes(updated);
    setSelectedNode(updated[0] || null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Node Tree Canvas List */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5">
              <GitFork size={16} /> Bagan Alur Cerita & Quest Tree
            </h4>
            <span className="text-[10px] text-slate-400">Rangkai pohon pilihan dan percabangan narasi</span>
          </div>

          <button
            type="button"
            onClick={handleAddNode}
            className="bg-fantasy-gold hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus size={14} /> Tambah Node Bab
          </button>
        </div>

        {/* Visual Node Chain */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                selectedNode?.id === node.id
                  ? 'bg-amber-950/40 border-fantasy-gold shadow-gold-glow'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  node.type === 'boss' ? 'bg-rose-950 text-rose-300 border border-rose-700' :
                  node.type === 'trap' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                  node.type === 'loot' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                  'bg-sky-950 text-sky-300 border border-sky-700'
                }`}>
                  {node.type === 'boss' ? '👹' : node.type === 'trap' ? '⚠️' : node.type === 'loot' ? '💎' : '📜'}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Bab {index + 1}: {node.title}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{node.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                  {node.type.toUpperCase()}
                </span>
                {nodes.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Inspector & Form */}
      <div className="glass-card rounded-2xl p-5 border border-fantasy-border space-y-4">
        <h4 className="font-cinzel text-fantasy-gold font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Edit3 size={15} /> Edit Detail Node Bab
        </h4>

        {selectedNode ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Judul Bab / Peristiwa:</label>
              <input
                type="text"
                value={selectedNode.title}
                onChange={(e) => handleUpdateCurrentNode('title', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Tipe Bab Quest:</label>
              <select
                value={selectedNode.type}
                onChange={(e) => handleUpdateCurrentNode('type', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold"
              >
                <option value="narrative">📜 Narasi / Eksplorasi</option>
                <option value="trap">⚠️ Bahaya & Jebakan (Skill Check)</option>
                <option value="loot">💎 Harta Karun & Item</option>
                <option value="boss">👹 Pertarungan Bos (Combat)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Deskripsi Naratif untuk AI DM:</label>
              <textarea
                rows={5}
                value={selectedNode.desc}
                onChange={(e) => handleUpdateCurrentNode('desc', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-fantasy-gold leading-relaxed"
                placeholder="Tuliskan petunjuk narasi yang akan dibacakan oleh AI..."
              />
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 italic">
            Pilih atau buat node bab untuk mulai mengedit.
          </div>
        )}
      </div>
    </div>
  );
};
