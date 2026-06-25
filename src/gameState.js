// ============================================================
// D1 — 游戏状态管理
// D3 — 存档 / 读档（LocalStorage）
// ============================================================

const SAVE_KEY = "rpg_save";

/**
 * 全局游戏状态
 *
 * ※ enemies 数组存的是场景中的对象引用，不会被序列化。
 *    存档时只存 player.pos / hp / attack / level / exp / kills。
 */
const game = {
  player: {
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 0,
    level: 1,
    exp: 0,
    expToNext: 20,
    pos: { x: 1.8, z: 0 },
    setBonuses: [],
  },
  enemies: [], // 外部注入：main.js 创建后赋值 game.enemies = slimes
  kills: 0,
  isPaused: false,
  isDialogOpen: false,
  bossDefeated: false,
  gold: 0,
  // 新手引导
  tutorialShown: false,
  hasTalkedToChief: false,
  // P2 — 任务
  activeQuests: [],
  completedQuests: [],
};

// ===== 外部 HUD 更新回调 =====
let hudUpdateCallback = null;

export function onHUDUpdate(callback) {
  hudUpdateCallback = callback;
}

function refreshHUD() {
  if (hudUpdateCallback) hudUpdateCallback(game);
}

// 升级回调（外部注册，避免循环依赖）
let levelUpCallback = null;
export function onLevelUp(callback) {
  levelUpCallback = callback;
}

// ============================================================
// D1 — 经验 / 升级
// ============================================================

export function addExp(amount) {
  const p = game.player;
  p.exp += amount;

  // 可能连续升多级
  while (p.exp >= p.expToNext) {
    p.exp -= p.expToNext;
    p.level++;
    p.attack += 2;
    p.maxHp += 10;
    p.hp = p.maxHp; // 升级满血
    p.expToNext = Math.floor(p.expToNext * 1.5);

    if (levelUpCallback) levelUpCallback(p.level);
  }

  refreshHUD();
}

// ============================================================
// 金币操作
// ============================================================

export function addGold(amount) {
  game.gold = (game.gold || 0) + amount;
  refreshHUD();
  return game.gold;
}

export function spendGold(amount) {
  if ((game.gold || 0) < amount) return false;
  game.gold -= amount;
  refreshHUD();
  return true;
}

// ============================================================
// D3 — 存档（LocalStorage）
// ============================================================

export function saveGame() {
  const p = game.player;
  const data = {
    player: {
      hp: p.hp,
      maxHp: p.maxHp,
      attack: p.attack,
      defense: p.defense || 0,
      level: p.level,
      exp: p.exp,
      expToNext: p.expToNext,
      pos: { x: p.pos.x, z: p.pos.z },
    },
    kills: game.kills,
    gold: game.gold || 0,
    tutorialShown: game.tutorialShown || false,
    hasTalkedToChief: game.hasTalkedToChief || false,
    activeQuests: game.activeQuests || [],
    completedQuests: game.completedQuests || [],
    bossDefeated: game.bossDefeated || false,
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    console.log("💾 游戏已保存");
    return true;
  } catch (e) {
    console.error("存档失败:", e);
    return false;
  }
}

// ============================================================
// D3 — 读档
// ============================================================

export function hasSaveData() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * 读档并应用到 game 对象
 * @returns {boolean} 是否成功读取
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    const p = data.player;
    if (!p) return false;

    const gp = game.player;
    gp.hp = p.hp ?? 100;
    gp.maxHp = p.maxHp ?? 100;
    gp.attack = p.attack ?? 10;
    gp.defense = p.defense ?? 0;
    gp.level = p.level ?? 1;
    gp.exp = p.exp ?? 0;
    gp.expToNext = p.expToNext ?? 20;
    gp.pos.x = p.pos?.x ?? 1.8;
    gp.pos.z = p.pos?.z ?? 0;

    game.kills = data.kills ?? 0;
    game.gold = data.gold ?? 0;
    game.tutorialShown = data.tutorialShown ?? false;
    game.hasTalkedToChief = data.hasTalkedToChief ?? false;
    game.activeQuests = data.activeQuests ?? [];
    game.completedQuests = data.completedQuests ?? [];
    game.bossDefeated = data.bossDefeated ?? false;

    console.log("📂 存档已读取");
    refreshHUD();
    return true;
  } catch (e) {
    console.error("读档失败:", e);
    return false;
  }
}

// ============================================================
// D1 — 刷新 HUD 一次（供外部初始化后调用）
// ============================================================
export function refreshGameHUD() {
  refreshHUD();
}

// ============================================================
// 暴露 game 引用（只读建议，但外部需要修改）
// ============================================================
export function getGame() {
  return game;
}

export default game;
