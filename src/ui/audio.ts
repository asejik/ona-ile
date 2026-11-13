/**
 * Synthesised sounds (no audio files), ported from prototype v0.1: engine hum, horn, warden whistle, thud.
 * Browsers only allow sound after a tap or key press, so the context starts on the first input.
 */

interface Engine {
  o1: OscillatorNode;
  o2: OscillatorNode;
  gain: GainNode;
}

export interface Sound {
  /** Call from a user gesture; safe to call repeatedly. */
  unlock(): void;
  engine(speed: number, throttle: number): void;
  horn(): void;
  whistle(volume?: number): void;
  thud(): void;
  coin(): void;
  shutter(): void;
  muted: boolean;
}

export function createSound(): Sound {
  let ac: AudioContext | null = null;
  let eng: Engine | null = null;

  const tone = (freq: number, dur: number, type: OscillatorType, vol: number, when = 0) => {
    if (!ac || sound.muted) return;
    const t = ac.currentTime + when;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  const sound: Sound = {
    muted: false,
    unlock() {
      if (ac) {
        if (ac.state === 'suspended') void ac.resume();
        return;
      }
      try {
        ac = new AudioContext();
      } catch {
        return;
      }
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator();
      const filter = ac.createBiquadFilter();
      const gain = ac.createGain();
      const g2 = ac.createGain();
      o1.type = 'sawtooth';
      o2.type = 'square';
      o1.frequency.value = 48;
      o2.frequency.value = 96;
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      gain.gain.value = 0;
      g2.gain.value = 0.35;
      o2.connect(g2);
      g2.connect(filter);
      o1.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      o1.start();
      o2.start();
      eng = { o1, o2, gain };
    },
    engine(speed, throttle) {
      if (!ac || !eng) return;
      const t = ac.currentTime;
      eng.gain.gain.setTargetAtTime(sound.muted ? 0 : 0.035 + Math.abs(throttle) * 0.02, t, 0.1);
      eng.o1.frequency.setTargetAtTime(44 + speed * 7.5, t, 0.08);
      eng.o2.frequency.setTargetAtTime(88 + speed * 15, t, 0.08);
    },
    horn() {
      tone(415, 0.16, 'square', 0.07);
      tone(520, 0.16, 'square', 0.05);
      tone(415, 0.2, 'square', 0.07, 0.22);
      tone(520, 0.2, 'square', 0.05, 0.22);
    },
    whistle(volume = 0.06) {
      if (!ac || sound.muted) return;
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      const g = ac.createGain();
      o.frequency.value = 2700;
      lfo.frequency.value = 32;
      lfoGain.gain.value = 140;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(volume, t + 0.03);
      g.gain.setValueAtTime(volume, t + 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t);
      lfo.start(t);
      o.stop(t + 0.65);
      lfo.stop(t + 0.65);
    },
    thud() {
      tone(90, 0.15, 'sine', 0.12);
      tone(60, 0.2, 'triangle', 0.08);
    },
    coin() {
      tone(988, 0.12, 'triangle', 0.09);
      tone(1319, 0.25, 'triangle', 0.08, 0.09);
    },
    shutter() {
      tone(3200, 0.04, 'square', 0.05);
      tone(2400, 0.05, 'square', 0.04, 0.06);
    },
  };
  return sound;
}
