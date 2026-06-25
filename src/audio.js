// ============================================================
// P4-1 — Web Audio API 音效合成（无需外部文件）
// ============================================================

let audioCtx = null;
let isMuted = false;

export function isAudioMuted() { return isMuted; }
export function toggleMute() { isMuted = !isMuted; return isMuted; }

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/** 通用：白噪声片段 */
function noise(duration, gainVal = 0.3) {
  const ctx = getCtx();
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime);
  src.stop(ctx.currentTime + duration);
}

/** 通用：振荡器 */
function osc(type, freq, duration, gainVal = 0.2, freqEnd) {
  const ctx = getCtx();
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainVal, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(ctx.currentTime);
  o.stop(ctx.currentTime + duration);
}

// ============================================================
// 音效函数
// ============================================================

/** 砍怪音效：方波 + 噪声 */
export function playHit() {
  if (isMuted) return;
  noise(0.06, 0.25);
  osc("square", 180, 0.08, 0.18, 40);
}

/** 拾取音效：上升音调 */
export function playPickup() {
  if (isMuted) return;
  osc("sine", 600, 0.15, 0.2, 1200);
  setTimeout(() => osc("sine", 1200, 0.1, 0.15, 1400), 80);
}

/** 传送音效：噪声扫频 */
export function playTeleport() {
  if (isMuted) return;
  noise(0.4, 0.3);
  osc("sine", 200, 0.4, 0.15, 800);
  osc("sawtooth", 100, 0.3, 0.08, 400);
}

/** 升级音效：上升琶音 */
export function playLevelUp() {
  if (isMuted) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => osc("sine", f, 0.15, 0.2), i * 80);
  });
}

/** Boss 背景音乐（循环低频 + 鼓点） */
let bossMusicInterval = null;
let bossBassOsc = null;
let bossBassGain = null;

export function startBossMusic() {
  if (isMuted) return;
  stopBossMusic();
  const ctx = getCtx();
  // 持续低音
  bossBassOsc = ctx.createOscillator();
  bossBassOsc.type = "sawtooth";
  bossBassOsc.frequency.setValueAtTime(55, ctx.currentTime);
  bossBassGain = ctx.createGain();
  bossBassGain.gain.setValueAtTime(0.08, ctx.currentTime);
  bossBassOsc.connect(bossBassGain);
  bossBassGain.connect(ctx.destination);
  bossBassOsc.start();

  // 鼓点节奏（每 600ms）
  let drumCount = 0;
  bossMusicInterval = setInterval(() => {
    if (isMuted) return;
    noise(0.08, 0.15);
    if (drumCount % 2 === 0) osc("sine", 80, 0.1, 0.1);
    drumCount++;
  }, 600);
}

export function stopBossMusic() {
  if (bossMusicInterval) {
    clearInterval(bossMusicInterval);
    bossMusicInterval = null;
  }
  if (bossBassOsc) {
    bossBassOsc.stop();
    bossBassGain.disconnect();
    bossBassOsc = null;
    bossBassGain = null;
  }
}
