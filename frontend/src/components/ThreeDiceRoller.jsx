import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Skull, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import audio from '../services/audioService';

export default function ThreeDiceRoller({
  diceValue = 14,
  statType = 'STR',
  mod = 3,
  dc = 12,
  isSuccess = true,
  isCritSuccess = false,
  isCritFail = false,
  onComplete
}) {
  const mountRef = useRef(null);
  const [animationFinished, setAnimationFinished] = useState(false);
  const total = diceValue + mod;

  useEffect(() => {
    // Play rolling sound on start
    audio.playDiceRoll();

    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf59e0b, 3, 20); // Gold point light
    pointLight1.position.set(4, 5, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38bdf8, 2, 20); // Cyan rim light
    pointLight2.position.set(-4, -3, 3);
    scene.add(pointLight2);

    // D20 Geometry (Icosahedron)
    const geometry = new THREE.IcosahedronGeometry(1.6, 0);

    // Load PBR Textures from /assets/3d/
    const textureLoader = new THREE.TextureLoader();
    const diffuseMap = textureLoader.load('/assets/3d/d20_diffuse.png');
    const normalMap = textureLoader.load('/assets/3d/d20_normal.png');
    const roughnessMap = textureLoader.load('/assets/3d/d20_roughness.png');

    // Materials - Obsidian gold metallic with PBR textures
    const material = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.35,
      flatShading: true
    });

    const diceMesh = new THREE.Mesh(geometry, material);
    scene.add(diceMesh);

    // Wireframe edge glow
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: isCritSuccess ? 0xf59e0b : isCritFail ? 0xef4444 : 0x38bdf8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    diceMesh.add(wireMesh);

    // Physics rotation simulation
    let rotXVel = 0.28 + Math.random() * 0.15;
    let rotYVel = 0.32 + Math.random() * 0.15;
    let rotZVel = 0.22 + Math.random() * 0.1;
    let friction = 0.965;
    let isRolling = true;
    let frameId;

    const startTime = Date.now();
    const duration = 1800; // ms

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        diceMesh.rotation.x += rotXVel;
        diceMesh.rotation.y += rotYVel;
        diceMesh.rotation.z += rotZVel;

        rotXVel *= friction;
        rotYVel *= friction;
        rotZVel *= friction;
      } else if (isRolling) {
        isRolling = false;
        // Smoothly settle
        setAnimationFinished(true);

        // Feedback triggers
        if (diceValue === 20 || isCritSuccess) {
          audio.playCriticalSuccess();
          audio.playGoldCoins();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#38bdf8', '#ffffff']
          });
        } else if (diceValue === 1 || isCritFail) {
          audio.playCriticalFailure();
        } else if (isSuccess) {
          audio.playClick();
        }
      }

      // Gentle resting float after roll completes
      if (!isRolling) {
        diceMesh.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      diffuseMap.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [diceValue, isCritSuccess, isCritFail, isSuccess]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md bg-black/80 ${
        animationFinished && isCritFail ? 'animate-shake' : ''
      }`}
    >
      {/* Red screen shake flash if Crit Fail */}
      {animationFinished && isCritFail && (
        <div className="absolute inset-0 bg-red-950/40 pointer-events-none animate-pulse" />
      )}

      <div className="relative w-full max-w-md flex flex-col items-center text-center">
        {/* Three.js Canvas Container */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full" />
          
          {/* Prominent Rolled Number Overlay in Center of D20 */}
          <AnimatePresence>
            {animationFinished && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]`}
              >
                <span className={`font-cinzel text-5xl md:text-6xl font-black ${
                  diceValue === 20 ? 'text-amber-300 drop-shadow-[0_0_20px_#f59e0b]' :
                  diceValue === 1 ? 'text-rose-500 drop-shadow-[0_0_20px_#ef4444]' :
                  'text-white'
                }`}>
                  {diceValue}
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase mt-1">
                  {diceValue === 20 ? 'Natural 20!' : diceValue === 1 ? 'Critical Failure!' : 'D20 Result'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Calculation Banner */}
        <AnimatePresence>
          {animationFinished && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full mt-4 space-y-4"
            >
              {/* Formula Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-mono text-slate-200">
                  <span className="font-bold text-amber-400">Dadu: {diceValue}</span>
                  <span>+</span>
                  <span className="text-sky-400">{statType} Mod: {mod >= 0 ? `+${mod}` : mod}</span>
                  <span>=</span>
                  <span className="font-bold text-white text-base">{total}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="font-bold text-amber-300">DC {dc}</span>
                </div>

                {/* Outcome Badge */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {isSuccess ? (
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-cinzel tracking-wider shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{diceValue === 20 ? 'KEBERHASILAN KRITIS (NAT 20)!' : 'AKSI BERHASIL!'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold font-cinzel tracking-wider shadow-lg">
                      {diceValue === 1 ? <Skull className="w-4 h-4 text-rose-500" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      <span>{diceValue === 1 ? 'KEGAGALAN KRITIS (NAT 1)!' : 'AKSI GAGAL!'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Continue CTA */}
              <button
                onClick={() => {
                  audio.playClick();
                  onComplete?.();
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-cinzel font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <span>Lanjutkan Kisah</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
