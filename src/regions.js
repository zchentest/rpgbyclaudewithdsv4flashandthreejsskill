// ============================================================
// 多层塔式地图 — 5层水平排列
// 每层中心在 X 轴上依次排列，Z 始终为 0
// 层间距 = 35，间隔带 = 20
// ============================================================

export const LAYER_DATA = [
  { id: 1, name: "新手村",       key: "l1_village",  centerX: 0,   groundColor: 0x7ec850, fogColor: 0x90aa70, fogNear: 18, fogFar: 30 },
  { id: 2, name: "草原森林",     key: "l2_forest",   centerX: 35,  groundColor: 0x3a6b35, fogColor: 0x2a4a25, fogNear: 15, fogFar: 28 },
  { id: 3, name: "荒芜山谷",     key: "l3_valley",   centerX: 70,  groundColor: 0x8b7d6b, fogColor: 0x6a5a4a, fogNear: 15, fogFar: 28 },
  { id: 4, name: "火焰洞穴",     key: "l4_cave",     centerX: 105, groundColor: 0x6b2020, fogColor: 0x4a1515, fogNear: 12, fogFar: 25 },
  { id: 5, name: "最终王座",     key: "l5_throne",   centerX: 140, groundColor: 0x3b2a4a, fogColor: 0x1a1025, fogNear: 12, fogFar: 25 },
];

export const LAYER_RADIUS = 15;       // 每层平台半径
export const LAYER_SPACING = 35;       // 层中心间距
export const FOG_FAR = 30;            // 全局雾远距离（不看到相邻层）

/**
 * 根据玩家位置返回当前所在层
 */
export function getRegionAt(x, z) {
  for (const layer of LAYER_DATA) {
    const dx = x - layer.centerX;
    const dz = z - 0;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < LAYER_RADIUS + 5) {
      return { id: layer.key, name: layer.name, layerId: layer.id, centerX: layer.centerX, groundColor: layer.groundColor, fogColor: layer.fogColor, fogNear: layer.fogNear, fogFar: layer.fogFar };
    }
  }
  // 在间隙中时返回最近层
  let closest = null;
  let minDist = Infinity;
  for (const layer of LAYER_DATA) {
    const dx = x - layer.centerX;
    const dist = Math.abs(dx);
    if (dist < minDist) {
      minDist = dist;
      closest = { id: layer.key, name: layer.name, layerId: layer.id, centerX: layer.centerX, groundColor: layer.groundColor, fogColor: layer.fogColor, fogNear: layer.fogNear, fogFar: layer.fogFar };
    }
  }
  return closest;
}

/**
 * 获取当前层的雾配置
 */
export function getFogConfig(x, z) {
  const region = getRegionAt(x, z);
  if (!region || !region.fogColor) return null;
  return {
    color: region.fogColor,
    near: region.fogNear || 10,
    far: region.fogFar || 25,
  };
}
