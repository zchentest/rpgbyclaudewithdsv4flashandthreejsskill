// ============================================================
// P2-2 — 任务追踪 + 任务交互 UI
// ============================================================

import game, { addExp, addGold } from "./gameState.js";
import { getItem } from "./equipment.js";
import { QUESTS, getQuest, getAvailableQuests, getCompletableQuests } from "./quests.js";
import { addItem } from "./inventory.js";
import { showToast } from "./dropSystem.js";

// ============================================================
// 任务状态操作
// ============================================================

/** 接受任务 */
export function acceptQuest(questId) {
  if (!game.activeQuests) game.activeQuests = [];
  if (game.activeQuests.find((q) => q.id === questId)) return false;
  if (!game.completedQuests) game.completedQuests = [];

  const quest = getQuest(questId);
  if (!quest) return false;

  game.activeQuests.push({
    id: questId,
    current: 0,
  });

  showToast(`📋 接受任务：${quest.title}`, "rare");
  updateTrackerHUD();
  return true;
}

/** 提交任务 */
export function submitQuest(questId) {
  if (!game.activeQuests) return false;
  if (!game.completedQuests) game.completedQuests = [];

  const idx = game.activeQuests.findIndex((q) => q.id === questId);
  if (idx === -1) return false;

  const quest = getQuest(questId);
  if (!quest) return false;

  const aq = game.activeQuests[idx];
  if (aq.current < quest.target.count) return false;

  // 移除 active
  game.activeQuests.splice(idx, 1);
  game.completedQuests.push(questId);

  // 发放经验
  if (quest.rewards.exp) addExp(quest.rewards.exp);

  // 构建奖励提示
  const rewardParts = [`✅ ${quest.title} 完成！`];
  if (quest.rewards.gold) {
    addGold(quest.rewards.gold);
    rewardParts.push(`🪙 +${quest.rewards.gold}金币`);
  }
  if (quest.rewards.items) {
    for (const item of quest.rewards.items) {
      for (let i = 0; i < (item.qty || 1); i++) addItem(item.id);
      const eq = getItem(item.id);
      rewardParts.push(`${eq ? eq.emoji : '🎁'} ${eq ? eq.name : item.id}`);
    }
  }

  showToast(rewardParts.join('  '), "uncommon");
  updateTrackerHUD();
  return true;
}

/** 击杀怪物时更新任务进度 */
export function updateQuestProgress(monsterType) {
  if (!game.activeQuests || game.activeQuests.length === 0) return;

  let updated = false;
  for (const aq of game.activeQuests) {
    const quest = getQuest(aq.id);
    if (!quest || quest.target.monsterType !== monsterType) continue;
    if (aq.current >= quest.target.count) continue;

    aq.current++;
    updated = true;

    // 刚好完成
    if (aq.current >= quest.target.count) {
      showToast(`✅ ${quest.title} 完成！回村长处提交`, "rare");
    }
  }

  if (updated) {
    updateTrackerHUD();
  }
}

// ============================================================
// 任务追踪 HUD（右侧）
// ============================================================
let trackerEl = null;

export function setupTrackerHUD() {
  if (trackerEl) return;

  trackerEl = document.createElement("div");
  trackerEl.id = "quest-tracker";
  trackerEl.style.cssText = `
    position: fixed;
    right: 30px;
    top: 120px;
    z-index: 997;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    color: #ddd;
    pointer-events: none;
    user-select: none;
    text-align: right;
    max-width: 500px;
  `;
  document.body.appendChild(trackerEl);
  updateTrackerHUD();
}

export function updateTrackerHUD() {
  if (!trackerEl) return;

  const active = game.activeQuests || [];

  if (active.length === 0) {
    trackerEl.innerHTML = `
      <div style="
        font-size: 14px;
        color: rgba(255,255,255,0.3);
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
      ">暂无任务<br>去村长处接取</div>
    `;
    return;
  }

  trackerEl.innerHTML = active
    .map((aq) => {
      const quest = getQuest(aq.id);
      if (!quest) return "";
      const max = quest.target.count;
      const done = aq.current >= max;
      const icon = done ? "✅" : "📌";
      const color = done ? "#88dd88" : "#ffcc44";
      return `
        <div style="
          font-size: 16px;
          color: ${color};
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
          margin-bottom: 4px;
          line-height: 1.4;
        ">${icon} ${quest.title}：${aq.current}/${max}</div>
      `;
    })
    .join("");
}

// ============================================================
// 任务交互 UI（与村长对话时弹出）
// ============================================================

export function showQuestInteraction(chiefNPC) {
  const existing = document.getElementById("quest-interaction");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "quest-interaction";
  modal.style.cssText = `
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 2500;
    display: flex;
    justify-content: center;
    padding: 40px 20px 60px;
    pointer-events: none;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: rgba(10, 10, 30, 0.92);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 40px 50px;
    min-width: 700px;
    max-width: 900px;
    pointer-events: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    color: #ddd;
  `;

  const completedIds = game.completedQuests || [];
  const activeIds = (game.activeQuests || []).map((q) => q.id);

  // 可接取
  const available = getAvailableQuests("chief", completedIds, activeIds);
  // 可提交
  const completable = getCompletableQuests("chief", game.activeQuests || []);
  // 进行中
  const inProgress = (game.activeQuests || []).filter(
    (aq) => !completable.find((c) => c.id === aq.id),
  );

  let html = `
    <div style="
      font-size: 22px;
      color: #ffcc44;
      font-weight: bold;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    "><span style="
      display: inline-block;
      width: 6px; height: 28px;
      background: #ffcc44;
      border-radius: 3px;
    "></span> 🏘️ 村长</div>
  `;

  const allDone = available.length === 0 && completable.length === 0 && inProgress.length === 0;

  if (allDone) {
    html += `
      <div style="font-size: 18px; color: #88dd88; text-align: center; padding: 30px 0;">
        🎉 你已经拯救了村庄！感谢你！
      </div>
    `;
  } else {
    // 可提交
    for (const aq of completable) {
      const quest = getQuest(aq.id);
      if (!quest) continue;
      html += `
        <button class="quest-btn submit" data-quest="${quest.id}" style="
          display: block;
          width: 100%;
          padding: 20px 24px;
          margin-bottom: 12px;
          font-size: 16px;
          font-family: inherit;
          border: 2px solid #44aa66;
          border-radius: 14px;
          background: rgba(68, 170, 102, 0.15);
          color: #88ddaa;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        ">✅ 提交任务：${quest.title}</button>
      `;
    }

    // 可接取
    for (const quest of available) {
      html += `
        <button class="quest-btn accept" data-quest="${quest.id}" style="
          display: block;
          width: 100%;
          padding: 20px 24px;
          margin-bottom: 12px;
          font-size: 16px;
          font-family: inherit;
          border: 2px solid #4488ff;
          border-radius: 14px;
          background: rgba(68, 136, 255, 0.12);
          color: #88bbff;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        ">📋 接取任务：${quest.title}<br>
          <span style="font-size: 14px; color: rgba(255,255,255,0.5);">${quest.description}</span>
        </button>
      `;
    }

    // 进行中
    for (const aq of inProgress) {
      const quest = getQuest(aq.id);
      if (!quest) continue;
      html += `
        <div style="
          padding: 18px 24px;
          margin-bottom: 12px;
          font-size: 16px;
          border: 2px solid rgba(255,204,68,0.2);
          border-radius: 14px;
          background: rgba(255,204,68,0.06);
          color: #ccaa44;
        ">📌 ${quest.title} (${aq.current}/${quest.target.count})</div>
      `;
    }
  }

  html += `
    <button id="quest-close-btn" style="
      display: block;
      width: 100%;
      padding: 16px;
      margin-top: 8px;
      font-size: 14px;
      font-family: inherit;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.5);
      cursor: pointer;
    ">关闭</button>
  `;

  panel.innerHTML = html;
  modal.appendChild(panel);
  document.body.appendChild(modal);

  // 事件绑定
  panel.querySelectorAll(".quest-btn.accept").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qid = btn.dataset.quest;
      if (acceptQuest(qid)) {
        game.isDialogOpen = false;
        modal.remove();
        updateTrackerHUD();
      }
    });
  });

  panel.querySelectorAll(".quest-btn.submit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qid = btn.dataset.quest;
      if (submitQuest(qid)) {
        game.isDialogOpen = false;
        modal.remove();
        updateTrackerHUD();
      }
    });
  });

  document.getElementById("quest-close-btn").addEventListener("click", () => {
    game.isDialogOpen = false;
    modal.remove();
  });
}
