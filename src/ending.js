// ============================================================
// P3-3 — 通关结局系统
// ============================================================

let endingActive = false;
let startTime = Date.now();

export function resetTimer() {
  startTime = Date.now();
}

function getPlayTime() {
  const ms = Date.now() - startTime;
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ============================================================
// 显示通关结局
// ============================================================
export function showEnding(stats) {
  if (endingActive) return;
  endingActive = true;

  const overlay = document.createElement("div");
  overlay.id = "ending-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 5000;
    background: rgba(0,0,0,0);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    transition: background 1.5s ease;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    text-align: center;
    color: #fff;
    opacity: 0;
    transition: opacity 1s ease;
  `;

  const kills = stats?.kills || 0;
  const level = stats?.level || 1;

  panel.innerHTML = `
    <div style="font-size: 36px; color: #ffcc44; margin-bottom: 8px;">🎉</div>
    <div style="font-size: 16px; color: #ffcc44; font-weight: bold; margin-bottom: 12px;">恭喜通关！</div>
    <div style="font-size: 14px; color: #ddd; margin-bottom: 16px; line-height: 1.6;">
      你击败了暗影骑士，拯救了这片大陆！
    </div>
    <div style="font-size: 16px; color: rgba(255,255,255,0.7); line-height: 2;">
      💀 击杀数：<span style="color:#fff;">${kills}</span><br>
      ⭐ 最终等级：<span style="color:#ffcc44;">${level}</span><br>
      ⏱️ 通关时间：<span style="color:#88ddff;">${getPlayTime()}</span>
    </div>
    <div style="margin-top: 30px; display: flex; gap: 24px; justify-content: center;">
      <button id="ending-restart" style="
        padding: 10px 24px; font-size: 14px; font-family: inherit;
        border: 2px solid #44aa66; border-radius: 14px;
        background: rgba(68,170,102,0.15); color: #88ddaa;
        cursor: pointer;
      ">🔄 重新开始</button>
      <button id="ending-title" style="
        padding: 10px 24px; font-size: 14px; font-family: inherit;
        border: 2px solid #4488ff; border-radius: 14px;
        background: rgba(68,136,255,0.12); color: #88bbff;
        cursor: pointer;
      ">🏠 返回标题</button>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 渐入
  requestAnimationFrame(() => {
    overlay.style.background = "rgba(0,0,0,0.92)";
    panel.style.opacity = "1";
  });

  // 按钮事件
  document.getElementById("ending-restart").addEventListener("click", () => {
    localStorage.removeItem("rpg_save");
    location.reload();
  });

  document.getElementById("ending-title").addEventListener("click", () => {
    localStorage.removeItem("rpg_save");
    showTitleScreen();
  });
}

// ============================================================
// 标题画面
// ============================================================
let titleActive = false;

export function showTitleScreen() {
  // 移除结局覆盖
  const endingEl = document.getElementById("ending-overlay");
  if (endingEl) endingEl.remove();

  // 移除现有游戏元素
  document.querySelectorAll("canvas").forEach((c) => c.remove());
  document.querySelectorAll("[id]").forEach((el) => {
    if (el.id !== "game-title") el.remove();
  });
  document.body.innerHTML = "";

  titleActive = true;

  const container = document.createElement("div");
  container.id = "game-title";
  container.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, #0a0a2a 0%, #1a0a2a 50%, #0a0a2a 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
  `;

  container.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 16px; color: rgba(255,255,255,0.3); margin-bottom: 12px;">— 幻境旅人 —</div>
      <div style="font-size: 14px; color: rgba(255,255,255,0.15); margin-bottom: 50px;">Ethereal Traveler</div>
      <button id="title-start" style="
        padding: 12px 36px; font-size: 36px; font-family: inherit;
        border: 2px solid #ffcc44; border-radius: 16px;
        background: rgba(255,204,68,0.1); color: #ffcc44;
        cursor: pointer;
        letter-spacing: 4px;
      ">开始游戏</button>
      <div style="margin-top: 40px; font-size: 16px; color: rgba(255,255,255,0.15);">
        WASD移动 · 空格攻击 · E对话 · I背包 · ESC菜单
      </div>
    </div>
  `;

  document.body.appendChild(container);

  document.getElementById("title-start").addEventListener("click", () => {
    location.reload();
  });
}

export function isEndingActive() {
  return endingActive;
}
