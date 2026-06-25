// ============================================================
// C3 — HUD 界面
// D4 — 完整状态栏：Lv / HP / ATK / EXP
// ============================================================

let hudLeftEl = null;
let hudRightEl = null;
let hitFlashEl = null;

// ============================================================
// 初始化 HUD（仅一次）
// ============================================================
export function setupHUD() {
  if (hudLeftEl) return;

  // ── 左上：完整状态栏 ──
  hudLeftEl = document.createElement("div");
  hudLeftEl.id = "hud-left";
  hudLeftEl.style.cssText = `
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 999;
    color: #fff;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    font-size: 22px;
    line-height: 1.6;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    pointer-events: none;
    user-select: none;
  `;
  hudLeftEl.innerHTML = `<div id="hud-status">Loading...</div>`;
  document.body.appendChild(hudLeftEl);

  // ── 右上：击杀数 ──
  hudRightEl = document.createElement("div");
  hudRightEl.id = "hud-right";
  hudRightEl.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 999;
    color: #ffcc44;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    font-size: 22px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    pointer-events: none;
    user-select: none;
    text-align: right;
    transition: transform 0.15s ease;
  `;
  hudRightEl.innerHTML = `<div id="hud-kills">💀 击杀数：0</div>`;
  document.body.appendChild(hudRightEl);

  // ── 受击边缘闪烁 ──
  hitFlashEl = document.createElement("div");
  hitFlashEl.id = "hud-hitflash";
  hitFlashEl.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 998;
    pointer-events: none;
    box-shadow: inset 0 0 120px 40px rgba(255,0,0,0);
    transition: box-shadow 0.1s ease;
  `;
  document.body.appendChild(hitFlashEl);

  // ── 静音图标 ──
  const muteEl = document.createElement("div");
  muteEl.id = "hud-mute";
  muteEl.style.cssText = `
    position: fixed;
    top: 12px;
    right: 220px;
    z-index: 999;
    font-size: 22px;
    pointer-events: none;
    user-select: none;
    display: none;
  `;
  document.body.appendChild(muteEl);
}

export function updateMuteIcon(muted) {
  const el = document.getElementById("hud-mute");
  if (!el) return;
  el.style.display = muted ? "block" : "none";
  el.textContent = "🔇";
}

// ============================================================
// D4 — 统一 HUD 更新（从 game 对象读取）
// ============================================================
export function updateHUD(game) {
  if (!hudLeftEl) return;
  const p = game.player;

  const statusEl = document.getElementById("hud-status");
  if (statusEl) {
    const def = p.defense || 0;
    // 套装提示
    let setHtml = "";
    if (p.setBonuses && p.setBonuses.length > 0) {
      setHtml = p.setBonuses
        .map((s) => `<span style="color:#ff8844;font-size:0.6em;margin-left:6px;">${s.emoji} ${s.name}</span>`)
        .join("");
    }

    statusEl.innerHTML = `
      <span style="color:#ffcc44;">Lv.${p.level}</span>
      <span style="color:rgba(255,255,255,0.25);margin:0 6px;">|</span>
      <span style="color:#ff7777;">❤️</span> ${p.hp}/${p.maxHp}
      <span style="color:rgba(255,255,255,0.25);margin:0 6px;">|</span>
      <span style="color:#88ccff;">⚔️</span> ${p.attack}
      <span style="color:rgba(255,255,255,0.25);margin:0 6px;">|</span>
      <span style="color:#88dd88;">🛡️</span> ${def}
      <span style="color:rgba(255,255,255,0.25);margin:0 6px;">|</span>
      <span style="color:#88dd88;">⭐</span> ${p.exp}/${p.expToNext}
      <span style="color:rgba(255,255,255,0.25);margin:0 6px;">|</span>
      <span style="color:#ffdd44;">🪙</span> ${game.gold || 0}
      ${setHtml}
    `;
  }

  // 击杀数
  const killsEl = document.getElementById("hud-kills");
  if (killsEl) {
    killsEl.textContent = `💀 ${game.kills}`;
  }
}

// ============================================================
// C3 — 攻击命中闪烁
// ============================================================
export function triggerAttackFlash() {
  if (!hitFlashEl) return;
  hitFlashEl.style.boxShadow = "inset 0 0 100px 30px rgba(255,255,100,0.25)";
  setTimeout(() => {
    hitFlashEl.style.boxShadow = "inset 0 0 120px 40px rgba(255,0,0,0)";
  }, 120);
}

// ============================================================
// C4 — 玩家受击闪烁（红色）
// ============================================================
export function triggerHurtFlash() {
  if (!hitFlashEl) return;
  hitFlashEl.style.boxShadow = "inset 0 0 120px 50px rgba(255,0,0,0.45)";
  setTimeout(() => {
    hitFlashEl.style.boxShadow = "inset 0 0 120px 40px rgba(255,0,0,0)";
  }, 200);
}

// ============================================================
// 击杀数字弹跳动画
// ============================================================
export function animateKillCount() {
  if (!hudRightEl) return;
  hudRightEl.style.transform = "scale(1.3)";
  setTimeout(() => {
    hudRightEl.style.transform = "scale(1)";
  }, 150);
}
