// ============================================================
// P1-1 — 装备模板数据库
// ============================================================

export const RARITY = {
  common:    { label: "普通", color: "#aaaaaa" },
  uncommon:  { label: "精良", color: "#44cc44" },
  rare:      { label: "稀有", color: "#4488ff" },
  epic:      { label: "史诗", color: "#cc44ff" },
};

/**
 * 装备定义
 * id        — 唯一标识
 * name      — 显示名称
 * type      — weapon / armor / accessory
 * atkBonus  — 攻击加成
 * defBonus  — 防御加成
 * hpBonus   — HP上限加成
 * rarity    — common / uncommon / rare / epic
 * emoji     — 显示图标
 */
export const EQUIPMENT = {
  // ── 武器 ──
  wooden_sword: {
    id: "wooden_sword",
    name: "木剑",
    type: "weapon",
    atkBonus: 3,
    defBonus: 0,
    hpBonus: 0,
    rarity: "common",
    emoji: "🗡️",
  },
  iron_sword: {
    id: "iron_sword",
    name: "铁剑",
    type: "weapon",
    atkBonus: 8,
    defBonus: 0,
    hpBonus: 0,
    rarity: "uncommon",
    emoji: "⚔️",
  },
  bone_blade: {
    id: "bone_blade",
    name: "骨刃",
    type: "weapon",
    atkBonus: 12,
    defBonus: 0,
    hpBonus: 0,
    rarity: "rare",
    emoji: "🦴",
  },
  flame_fang: {
    id: "flame_fang",
    name: "炎牙",
    type: "weapon",
    atkBonus: 18,
    defBonus: 0,
    hpBonus: 0,
    rarity: "epic",
    emoji: "🔥",
  },

  // ── 防具 ──
  steel_shield: {
    id: "steel_shield",
    name: "钢盾",
    type: "armor",
    atkBonus: 0,
    defBonus: 5,
    hpBonus: 20,
    rarity: "uncommon",
    emoji: "🛡️",
  },
  cloth_armor: {
    id: "cloth_armor",
    name: "布甲",
    type: "armor",
    atkBonus: 0,
    defBonus: 2,
    hpBonus: 10,
    rarity: "common",
    emoji: "👕",
  },
  leather_armor: {
    id: "leather_armor",
    name: "皮甲",
    type: "armor",
    atkBonus: 0,
    defBonus: 5,
    hpBonus: 20,
    rarity: "uncommon",
    emoji: "🧥",
  },
  bone_armor: {
    id: "bone_armor",
    name: "骨甲",
    type: "armor",
    atkBonus: 0,
    defBonus: 8,
    hpBonus: 30,
    rarity: "rare",
    emoji: "🛡️",
  },
  scale_armor: {
    id: "scale_armor",
    name: "炎鳞甲",
    type: "armor",
    atkBonus: 0,
    defBonus: 12,
    hpBonus: 50,
    rarity: "epic",
    emoji: "🐉",
  },

  // ── 饰品 ──
  power_ring: {
    id: "power_ring",
    name: "力量戒指",
    type: "accessory",
    atkBonus: 5,
    defBonus: 0,
    hpBonus: 15,
    rarity: "rare",
    emoji: "💍",
  },
  life_pendant: {
    id: "life_pendant",
    name: "生命吊坠",
    type: "accessory",
    atkBonus: 0,
    defBonus: 3,
    hpBonus: 40,
    rarity: "epic",
    emoji: "📿",
  },
};

// ============================================================
// 套装规则
// ============================================================
export const SET_BONUSES = [
  {
    name: "炎龙之力",
    emoji: "🔥",
    requires: ["flame_fang", "scale_armor"],
    bonus: { atkBonus: 10, defBonus: 0, hpBonus: 20 },
  },
  {
    name: "白骨护盾",
    emoji: "🛡️",
    requires: ["bone_blade", "bone_armor"],
    bonus: { atkBonus: 5, defBonus: 10, hpBonus: 0 },
  },
];

// ============================================================
// 装备随机属性范围
// 每次掉落时会在此范围内随机
// ============================================================
const STAT_RANGES = {
  wooden_sword: { atkBonus: [2, 5] },
  iron_sword: { atkBonus: [6, 11] },
  bone_blade: { atkBonus: [10, 15] },
  flame_fang: { atkBonus: [15, 22] },
  steel_shield: { defBonus: [3, 7], hpBonus: [15, 26] },
  cloth_armor: { defBonus: [1, 3], hpBonus: [8, 13] },
  leather_armor: { defBonus: [3, 7], hpBonus: [15, 26] },
  bone_armor: { defBonus: [6, 11], hpBonus: [24, 38] },
  scale_armor: { defBonus: [10, 15], hpBonus: [40, 62] },
  power_ring: { atkBonus: [3, 7], hpBonus: [12, 20] },
  life_pendant: { defBonus: [2, 5], hpBonus: [32, 50] },
};

/**
 * 生成随机装备属性
 * @param {string} itemId
 * @param {'drop'|'shop'} source - 'shop' 时属性偏高
 * @returns {object} { atkBonus?: number, defBonus?: number, hpBonus?: number }
 */
export function rollItemStats(itemId, source = 'drop') {
  const ranges = STAT_RANGES[itemId];
  if (!ranges) return {};
  const quality = source === 'shop' ? 0.65 : 0.0; // shop: 65%-100%, drop: 0%-100%
  const stats = {};
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const range = max - min;
    const lo = min + Math.round(range * quality);
    stats[key] = Math.round(lo + Math.random() * (max - lo));
  }
  return stats;
}

/**
 * 获取装备的基础属性（用于显示）
 */
export function getBaseStats(item) {
  return {
    atkBonus: item.atkBonus || 0,
    defBonus: item.defBonus || 0,
    hpBonus: item.hpBonus || 0,
  };
}

/**
 * 格式化属性文本
 */
export function formatStats(roll) {
  const parts = [];
  if (roll.atkBonus) parts.push(`⚔️+${roll.atkBonus}`);
  if (roll.defBonus) parts.push(`🛡️+${roll.defBonus}`);
  if (roll.hpBonus) parts.push(`❤️+${roll.hpBonus}`);
  return parts.join('  ') || '—';
}

/**
 * 获取装备数据
 */
export function getItem(itemId) {
  return EQUIPMENT[itemId] || null;
}

/**
 * 获取所有装备列表
 */
export function getAllItems() {
  return Object.values(EQUIPMENT);
}
