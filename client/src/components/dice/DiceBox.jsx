import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Dices, RefreshCw, Sparkles } from 'lucide-react';

export const DiceBox = ({ onRollComplete }) => {
  const mountRef = useRef(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState([]);
  const [selectedDie, setSelectedDie] = useState('d20');
  const [modifier, setModifier] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const diceTypes = [
    { label: 'D4', value: 'd4', max: 4, color: 0x9b59b6 },
    { label: 'D6', value: 'd6', max: 6, color: 0x3498db },
    { label: 'D8', value: 'd8', max: 8, color: 0x2ecc71 },
    { label: 'D10', value: 'd10', max: 10, color: 0xe67e22 },
    { label: 'D12', value: 'd12', max: 12, color: 0xe74c3c },
    { label: 'D20', value: 'd20', max: 20, color: 0xe6c35c },
    { label: 'D100', value: 'd100', max: 100, color: 0x1abc9c },
  ];

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xe6c35c, 2.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8e44ad, 1.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    let geometry;
    if (selectedDie === 'd4') {
      geometry = new THREE.TetrahedronGeometry(1.6);
    } else if (selectedDie === 'd6') {
      geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    } else if (selectedDie === 'd8') {
      geometry = new THREE.OctahedronGeometry(1.6);
    } else if (selectedDie === 'd12') {
      geometry = new THREE.DodecahedronGeometry(1.5);
    } else if (selectedDie === 'd20' || selectedDie === 'd100') {
      geometry = new THREE.IcosahedronGeometry(1.6);
    } else {
      geometry = new THREE.ConeGeometry(1.5, 2, 8);
    }

    const currentDieConfig = diceTypes.find(d => d.value === selectedDie) || diceTypes[5];

    const material = new THREE.MeshPhysicalMaterial({
      color: currentDieConfig.color,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });

    const diceMesh = new THREE.Mesh(geometry, material);
    scene.add(diceMesh);

    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    diceMesh.add(wireLine);

    let animationFrameId;
    let rotationSpeed = { x: 0.005, y: 0.008, z: 0.003 };

    const animate = () => {
      diceMesh.rotation.x += rotationSpeed.x;
      diceMesh.rotation.y += rotationSpeed.y;
      diceMesh.rotation.z += rotationSpeed.z;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    currentMount._triggerRoll = () => {
      const startTime = Date.now();
      const duration = 1400;

      rotationSpeed = {
        x: (Math.random() * 0.4 + 0.3) * (Math.random() > 0.5 ? 1 : -1),
        y: (Math.random() * 0.4 + 0.3) * (Math.random() > 0.5 ? 1 : -1),
        z: (Math.random() * 0.3 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
      };

      const decayInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;

        if (progress >= 1) {
          clearInterval(decayInterval);
          rotationSpeed = { x: 0.003, y: 0.005, z: 0.002 };
          setIsRolling(false);
        } else {
          rotationSpeed.x *= 0.95;
          rotationSpeed.y *= 0.95;
          rotationSpeed.z *= 0.95;
        }
      }, 50);
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [selectedDie]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);

    if (mountRef.current && mountRef.current._triggerRoll) {
      mountRef.current._triggerRoll();
    }

    const currentDieConfig = diceTypes.find(d => d.value === selectedDie) || diceTypes[5];
    const rawVal = Math.floor(Math.random() * currentDieConfig.max) + 1;
    const finalTotal = rawVal + parseInt(modifier || 0, 10);

    setTimeout(() => {
      const rollData = {
        die: selectedDie.toUpperCase(),
        raw: rawVal,
        modifier: parseInt(modifier || 0, 10),
        total: finalTotal,
        isCrit: selectedDie === 'd20' && rawVal === 20,
        isFumble: selectedDie === 'd20' && rawVal === 1,
        timestamp: new Date().toLocaleTimeString('id-ID'),
      };

      setLastResult(rollData);
      setRollHistory(prev => [rollData, ...prev.slice(0, 6)]);
      if (onRollComplete) onRollComplete(rollData);
    }, 1400);
  };

  return (
    <div className="glass-card rounded-xl p-5 relative overflow-hidden border border-fantasy-border shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-cinzel text-fantasy-gold font-bold text-base flex items-center gap-2">
          <Dices size={20} className="text-fantasy-gold" /> Kotak Dadu 3D (Fisika)
        </h3>
        {lastResult && (
          <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
            lastResult.isCrit
              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500'
              : lastResult.isFumble
              ? 'bg-rose-900/40 text-rose-400 border-rose-500'
              : 'bg-fantasy-gold/10 text-fantasy-gold border-fantasy-gold/30'
          }`}>
            {lastResult.isCrit ? 'NATURAL 20 (KRITIKAL!)' : lastResult.isFumble ? 'NATURAL 1 (GAGAL TOTAL!)' : `Hasil: ${lastResult.total}`}
          </span>
        )}
      </div>

      {/* 3D Canvas Box */}
      <div
        ref={mountRef}
        onClick={rollDice}
        title="Klik di mana saja pada kotak dadu untuk melempar!"
        className="w-full h-44 rounded-lg bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-700/50 cursor-pointer relative flex items-center justify-center transition-all hover:border-fantasy-gold/60"
      >
        {lastResult && !isRolling && (
          <div className="absolute bottom-2 right-3 text-right pointer-events-none drop-shadow-md">
            <div className="text-xs text-slate-400 font-mono">
              [{lastResult.raw}] {lastResult.modifier >= 0 ? `+ ${lastResult.modifier}` : `- ${Math.abs(lastResult.modifier)}`}
            </div>
            <div className={`text-3xl font-black font-cinzel ${
              lastResult.isCrit ? 'text-emerald-400' : lastResult.isFumble ? 'text-rose-500' : 'text-fantasy-gold'
            }`}>
              = {lastResult.total}
            </div>
          </div>
        )}

        {isRolling && (
          <div className="absolute text-fantasy-gold font-bold font-cinzel tracking-widest flex items-center gap-2 animate-pulse text-sm">
            <Sparkles className="animate-spin text-fantasy-gold" size={18} /> MELEMPAR DADU...
          </div>
        )}
      </div>

      {/* Die Selection Buttons */}
      <div className="grid grid-cols-7 gap-1.5 my-3">
        {diceTypes.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setSelectedDie(d.value)}
            className={`py-1.5 rounded text-xs font-cinzel font-bold transition-all ${
              selectedDie === d.value
                ? 'bg-fantasy-gold text-slate-950 shadow-gold-glow scale-105'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Modifier and Roll Button */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
          <span className="text-xs text-slate-400 font-medium">Mod:</span>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(e.target.value)}
            className="w-12 bg-transparent text-center text-sm text-fantasy-gold font-bold focus:outline-none"
            placeholder="+0"
          />
        </div>

        <button
          type="button"
          onClick={rollDice}
          disabled={isRolling}
          className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-cinzel font-bold py-2 px-4 rounded-lg shadow-gold-glow flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {isRolling ? <RefreshCw className="animate-spin" size={15} /> : <Dices size={15} />}
          {isRolling ? 'Memutar...' : `Lempar ${selectedDie.toUpperCase()}`}
        </button>
      </div>

      {/* History Log */}
      {rollHistory.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">Riwayat Lemparan:</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {rollHistory.map((item, idx) => (
              <span
                key={idx}
                className={`text-[11px] px-2 py-0.5 rounded border whitespace-nowrap ${
                  item.isCrit
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                    : item.isFumble
                    ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700'
                }`}
              >
                <strong className="text-fantasy-gold">{item.die}:</strong> {item.total} <small className="text-slate-400">({item.raw}{item.modifier >= 0 ? `+${item.modifier}` : item.modifier})</small>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
