// ============================================================
// P2-1 — 主线任务定义（3 个，形成任务链）
// ============================================================

export const QUESTS = {
  q1: {
    id: "q1",
    title: "初出茅庐",
    description: "消灭草原上的史莱姆，证明你的实力",
    type: "kill",
    target: { monsterType: "slime", count: 5 },
    rewards: { exp: 20, gold: 10, items: [] },
    giverId: "chief",
    submitterId: "chief",
    prerequisite: null, // 无前置
  },
  q2: {
    id: "q2",
    title: "森林危机",
    description: "森林里的野狼越来越猖狂，去清理 3 只",
    type: "kill",
    target: { monsterType: "wolf", count: 3 },
    rewards: { exp: 35, gold: 25, items: [{ id: "iron_sword", qty: 1 }] },
    giverId: "chief",
    submitterId: "chief",
    prerequisite: "q1", // 需要 q1 完成
  },
  q3: {
    id: "q3",
    title: "山谷威胁",
    description: "山谷深处出现了石傀儡，必须击败它",
    type: "kill",
    target: { monsterType: "stoneGolem", count: 1 },
    rewards: { exp: 60, gold: 50, items: [{ id: "life_pendant", qty: 1 }] },
    giverId: "chief",
    submitterId: "chief",
    prerequisite: "q2",
  },
};

// ============================================================
// 辅助函数
// ============================================================

export function getQuest(questId) {
  return QUESTS[questId] || null;
}

/**
 * 检查任务前置条件是否满足
 */
export function isPrerequisiteMet(questId, completedIds) {
  const quest = getQuest(questId);
  if (!quest) return false;
  if (!quest.prerequisite) return true;
  return completedIds.includes(quest.prerequisite);
}

/**
 * 获取某个NPC可接取的任务列表
 */
export function getAvailableQuests(npcId, completedIds, activeIds) {
  return Object.values(QUESTS).filter((q) => {
    if (q.giverId !== npcId) return false;
    if (completedIds.includes(q.id)) return false;
    if (activeIds.includes(q.id)) return false;
    return isPrerequisiteMet(q.id, completedIds);
  });
}

/**
 * 获取已完成但待提交的任务
 */
export function getCompletableQuests(npcId, activeQuests) {
  return activeQuests.filter(
    (aq) => {
      const quest = getQuest(aq.id);
      if (!quest) return false;
      if (quest.submitterId !== npcId) return false;
      return aq.current >= quest.target.count;
    },
  );
}
