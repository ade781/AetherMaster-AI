/**
 * AetherMaster Procedural Web Audio Synth & Voice Gateway
 * 100% local synthesis using standard Web Audio API & SpeechSynthesis.
 */

class AudioService {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientNode = null;
    this.heartbeatTimer = null;
    this.isSpeechEnabled = false;
    this.bgmAudio = null;
    this.currentBgmSrc = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted) {
      this.stopBGM();
      this.stopHeartbeat();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- PROCEDURAL SFX GENERATION ---

  playDiceRoll() {
    // Dice mechanic removed
  }

  playCriticalSuccess() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major fanfare

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      
      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.45);
    });
  }

  playCriticalFailure() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [220, 207.65, 196, 174.61]; // descending dissonance

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.55);
    });
  }

  playSwordClash() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'highpass' in this.ctx ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playGoldCoins() {
    if (this.isMuted) return;
    this.init();
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

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.22);
    });
  }

  playHeal() {
    if (this.isMuted) return;
    this.init();
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

    osc.start(now);
    osc.stop(now + 0.42);
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playSelect() {
    this.playClick();
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

  // --- AMBIENT SOUNDSCAPE ---

  startAmbient(type = 'tavern') {
    if (this.isMuted) return;
    this.init();
    if (this.ambientNode) {
      this.stopAmbient();
    }

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Atmospheric presets
      if (type.includes('frost') || type.includes('peak') || type === 'frost') {
        // High whistly howling cold wind
        filter.type = 'bandpass';
        filter.frequency.value = 420;
        filter.Q.value = 3.5;
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      } else if (type.includes('ocean') || type.includes('citadel') || type.includes('cave') || type === 'ocean') {
        // Deep resonant ocean swell
        filter.type = 'lowpass';
        filter.frequency.value = 160;
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      } else {
        // Warm tavern / room ambiance
        filter.type = 'lowpass';
        filter.frequency.value = 260;
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(0);
      this.ambientNode = { source: whiteNoise, gain };
    } catch (e) {
      console.warn('Ambient start error:', e);
    }
  }

  stopAmbient() {
    if (this.ambientNode) {
      try {
        this.ambientNode.source.stop();
      } catch (e) {}
      this.ambientNode = null;
    }
  }

  // --- BACKGROUND MUSIC (BGM) TRACKS ---

  playBGM(type = 'tavern', volume = 0.22) {
    if (this.isMuted) return;
    const sources = {
      tavern: '/assets/audio/bgm_tavern.mp3',
      dungeon: '/assets/audio/bgm_dungeon.mp3',
      combat: '/assets/audio/bgm_combat.mp3'
    };
    const src = sources[type] || sources.tavern;
    if (this.currentBgmSrc === src && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }
    this.stopBGM();
    try {
      this.bgmAudio = new Audio(src);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = volume;
      this.currentBgmSrc = src;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy or load fallback
          this.startAmbient(type);
        });
      }
    } catch (e) {
      this.startAmbient(type);
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch (e) {}
      this.bgmAudio = null;
      this.currentBgmSrc = null;
    }
    this.stopAmbient();
  }

  // --- WEB SPEECH API NARRATION ---

  toggleSpeech() {
    this.isSpeechEnabled = !this.isSpeechEnabled;
    if (!this.isSpeechEnabled) {
      this.stopSpeech();
    }
    return this.isSpeechEnabled;
  }

  speakText(text, lang = 'id-ID') {
    if (!this.isSpeechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audio = new AudioService();
export default audio;
