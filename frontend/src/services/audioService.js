/**
 * AetherMaster Procedural Web Audio Synth & Voice Gateway
 * Procedural client-side synthesis using Web Audio API & SpeechSynthesis/Neural Edge TTS.
 */

import { API_BASE } from './api';

class AudioService {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientNode = null;
    this.heartbeatTimer = null;
    this.isSpeechEnabled = false;
    this.speechAudio = null;
    this.speechAbortController = null;
    this.voiceConfig = {
      voice: 'id-ID-ArdiNeural', // Pria Indonesia Neural
      pitch: '-25Hz',            // Deep / Bass tua
      rate: '-10%'               // Tenang, lambat berwibawa
    };
    this.isUnlocked = false;

    // Attach global first-interaction unlock listeners for modern browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.unlock();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx) {
      this.isUnlocked = true;
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted) {
      this.stopAmbient();
      this.stopHeartbeat();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- PROCEDURAL SFX GENERATION ---

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playSelect() {
    this.playClick();
  }

  playSwordClash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playCombat() {
    this.playSwordClash();
  }

  playHeal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    };

    osc.start(now);
    osc.stop(now + 0.42);
  }

  playMagic() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6 shimmer
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.38);
    });
  }

  playGoldCoins() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [1800, 2400, 3200];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);

      gain.gain.setValueAtTime(0.15, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.22);
    });
  }

  // --- D20 DICE ROLLER AUDIO SYNTH ---

  playDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Rapid tumbling wooden / polyhedral clatter
    const clicks = [0, 0.04, 0.09, 0.15, 0.22, 0.30, 0.40];
    clicks.forEach((timeOffset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const f = 600 + (idx % 3) * 220 + Math.random() * 80;
      osc.frequency.setValueAtTime(f, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(180, now + timeOffset + 0.035);

      const vol = 0.18 * (1 - (idx / clicks.length) * 0.5);
      gain.gain.setValueAtTime(vol, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.04);
    });
  }

  playCriticalHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Resonant golden chord + triumphant chime
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major arpeggio + high sparkle
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.3, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.7);
    });
  }

  playCriticalMiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Heavy metallic clank + dissonant descending tone
    const notes = [293.66, 277.18, 220.00, 155.56, 92.50]; // Dissonant drop
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.32, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  playCriticalSuccess() {
    this.playCriticalHit();
  }

  playSuccess() {
    this.playCriticalSuccess();
  }

  playCriticalFailure() {
    this.playCriticalMiss();
  }

  playFailure() {
    this.playCriticalFailure();
  }

  // --- PROCEDURAL NPC VOICE PREVIEW SYNTHESIS ---

  playNpcVoiceSample(voiceConfig = {}, greeting = 'Salam, petualang!') {
    if (this.isMuted) return;
    const { pitch = 1.0, rate = 1.0, tone = 'neutral' } = voiceConfig;

    // Web Speech API sample playback with tailored pitch/rate
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = 'id-ID';
      utterance.pitch = Math.max(0.4, Math.min(1.8, pitch));
      utterance.rate = Math.max(0.6, Math.min(1.4, rate));

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (tone === 'deep' || tone === 'gruff') {
          const male = voices.find(v => v.lang.startsWith('id') && !v.name.toLowerCase().includes('gadis'));
          if (male) utterance.voice = male;
        } else if (tone === 'melodic' || tone === 'gentle') {
          const female = voices.find(v => v.lang.startsWith('id') && v.name.toLowerCase().includes('gadis'));
          if (female) utterance.voice = female;
        }
      }

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback: procedural harmonic chime preview
      this.playMagic();
    }
  }

  playFailure() {
    this.playCriticalFailure();
  }

  // --- REACTIVE HEARTBEAT SYNTH (< 20% HP) ---

  startHeartbeat() {
    if (this.isMuted || this.heartbeatTimer) return;
    this.init();

    const triggerThump = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // Two thumps: lub - dub
        [0, 0.16].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          const freq = idx === 0 ? 55 : 45;
          osc.frequency.setValueAtTime(freq, now + offset);
          osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.12);

          const vol = idx === 0 ? 0.35 : 0.25;
          gain.gain.setValueAtTime(vol, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.15);
        });
      } catch (e) {
        console.warn('Heartbeat thump error:', e);
      }
    };

    triggerThump();
    this.heartbeatTimer = setInterval(triggerThump, 900);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- PROCEDURAL AMBIENT SOUND GENERATOR ---

  startAmbient(type = 'tavern') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.ambientNode) {
      this.stopAmbient();
    }

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      const cleanType = String(type).toLowerCase();
      let baseFreq = 110; // A2 tavern

      if (cleanType.includes('boss') || cleanType.includes('combat') || cleanType.includes('war')) {
        baseFreq = 65.41; // C2 ominous
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        oscGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      } else if (cleanType.includes('mystic') || cleanType.includes('arcadia') || cleanType.includes('arcane')) {
        baseFreq = 146.83; // D3 ethereal
        osc1.type = 'sine';
        osc2.type = 'triangle';
        oscGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      } else if (cleanType.includes('graveyard') || cleanType.includes('dungeon') || cleanType.includes('crypt')) {
        baseFreq = 73.42; // D2 eerie
        osc1.type = 'triangle';
        osc2.type = 'sine';
        oscGain.gain.setValueAtTime(0.028, this.ctx.currentTime);
      } else {
        osc1.type = 'sine';
        osc2.type = 'sine';
        oscGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      }

      osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(baseFreq * 1.502, this.ctx.currentTime); // subtle beating harmonic

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientNode = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
            oscGain.disconnect();
          } catch (e) {}
        }
      };
    } catch (e) {
      console.warn('Ambient start error:', e);
    }
  }

  stopAmbient() {
    if (this.ambientNode) {
      try {
        this.ambientNode.stop();
      } catch (e) {}
      this.ambientNode = null;
    }
  }

  // --- NEURAL AI & WEB SPEECH NARRATION ---

  toggleSpeech() {
    this.isSpeechEnabled = !this.isSpeechEnabled;
    if (!this.isSpeechEnabled) {
      this.stopSpeech();
    }
    return this.isSpeechEnabled;
  }

  async speakNarration(text) {
    if (!text) return;
    this.stopSpeech();

    const clean = text.replace(/[*_~`#>]/g, '').replace(/\[.*?\]\(.*?\)/g, '').trim();
    if (!clean) return;

    // 1. Try Neural Edge TTS via Backend
    try {
      this.speechAbortController = new AbortController();

      const response = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
        signal: this.speechAbortController.signal
      });

      if (!response.ok) {
        throw new Error(`TTS HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audioEl = new Audio(audioUrl);
      this.speechAudio = audioEl;

      audioEl.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (this.speechAudio === audioEl) {
          this.speechAudio = null;
        }
      };

      await audioEl.play();
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[AudioService] Neural TTS dialihkan ke Web Speech API:', err.message);
    }

    // 2. Fallback to Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v => 
        (v.lang.startsWith('id') && !v.name.toLowerCase().includes('gadis')) || 
        v.name.includes('Andika') || 
        v.name.includes('David')
      );
      if (maleVoice) utterance.voice = maleVoice;
      utterance.lang = 'id-ID';
      utterance.pitch = 0.65;
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }

  stopSpeech() {
    if (this.speechAbortController) {
      this.speechAbortController.abort();
      this.speechAbortController = null;
    }
    if (this.speechAudio) {
      try {
        this.speechAudio.pause();
        this.speechAudio.currentTime = 0;
      } catch (e) {}
      this.speechAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audio = new AudioService();
export default audio;
