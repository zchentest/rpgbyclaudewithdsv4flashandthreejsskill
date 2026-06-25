// ============================================================
// D2 — ESC 暂停菜单
// D3 — 存档按钮
// ============================================================

import game, { saveGame } from "./gameState.js";

let menuContainer = null;
let onResume = null;
let onSave = null;
let onTitle = null;

/**
 * 初始化暂停菜单 DOM（仅一次）
 * @param {Object} callbacks - { onResume, onSave, onTitle }
 */
export function setupMenu(callbacks = {}) {
  if (menuContainer) return;

  onResume = callbacks.onResume || (() => {});
  onSave = callbacks.onSave || (() => {});
  onTitle = callbacks.onTitle || (() => {});

  // ── 遮罩层 ──
  menuContainer = document.createElement("div");
  menuContainer.id = "pause-menu";
  menuContainer.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2000;
    display: none;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    user-select: none;
  `;

  // ── 面板 ──
  const panel = document.createElement("div");
  panel.style.cssText = `
    background: rgba(20, 20, 40, 0.92);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 30px 36px;
    min-width: 260px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;

  panel.innerHTML = `
    <div style="
      font-size: 28px;
      color: #ffcc44;
      font-weight: bold;
      margin-bottom: 18px;
      letter-spacing: 4px;
      text-shadow: 0 0 30px rgba(255,204,68,0.3);
    ">⏸ 暂停</div>

    <button id="menu-btn-resume" style="
      display: block;
      width: 100%;
      padding: 10px 0;
      margin-bottom: 8px;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      background: rgba(255,255,255,0.08);
      color: #eee;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    ">▶ 继续游戏</button>

    <button id="menu-btn-save" style="
      display: block;
      width: 100%;
      padding: 10px 0;
      margin-bottom: 8px;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      background: rgba(68, 170, 102, 0.2);
      color: #8f8;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    ">💾 保存游戏</button>

    <button id="menu-btn-title" style="
      display: block;
      width: 100%;
      padding: 10px 0;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      background: rgba(200, 50, 50, 0.15);
      color: #f88;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    ">🏠 返回标题</button>

    <div style="
      margin-top: 24px;
      font-size: 12px;
      color: rgba(255,255,255,0.25);
    ">按 ESC 继续游戏</div>
  `;

  menuContainer.appendChild(panel);
  document.body.appendChild(menuContainer);

  // ── 按钮事件 ──
  document.getElementById("menu-btn-resume").addEventListener("click", resumeGame);
  document.getElementById("menu-btn-save").addEventListener("click", () => {
    const ok = saveGame();
    const btn = document.getElementById("menu-btn-save");
    btn.textContent = ok ? "✅ 已保存！" : "❌ 保存失败";
    setTimeout(() => {
      btn.textContent = "💾 保存游戏";
    }, 1200);
    onSave();
  });
  document.getElementById("menu-btn-title").addEventListener("click", () => {
    if (confirm("返回标题页？未保存的进度将丢失。")) {
      localStorage.removeItem("rpg_save");
      location.reload();
    }
  });

}

// ============================================================
// 暂停 / 恢复
// ============================================================

export function resumeGame() {
  game.isPaused = false;
  game.isDialogOpen = false;
  if (menuContainer) menuContainer.style.display = "none";
  onResume();
}

export function pauseGame() {
  if (game.isDialogOpen) return; // 对话中不暂停
  game.isPaused = true;
  if (menuContainer) menuContainer.style.display = "flex";
}

export function resumeFromMenu() {
  resumeGame();
}
