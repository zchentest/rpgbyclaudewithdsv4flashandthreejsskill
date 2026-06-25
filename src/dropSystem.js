import * as THREE from "three";
import { getItem, RARITY, rollItemStats, formatStats } from "./equipment.js";
import { addItem } from "./inventory.js";
import game, { addGold } from "./gameState.js";

// ============================================================
// P1-2 — 掉落系统
// ============================================================

/**
 * 掉落物：{ mesh, light, itemId, position, timer, age, picked }
 */
const dropItems = [];

/**
 * 根据怪物的 dropTable 判定掉落
 * @param {object} monster - Three.js Group
 * @param {THREE.Scene} scene
 */
export function rollDrop(monster, scene) {
  const table = monster.userData.dropTable || [];
  if (table.length === 0) return null;

  // 每个物品独立判定（最多掉 1 件）
  for (const entry of table) {
    if (Math.random() < entry.chance) {
      spawnDropItem(monster.position, entry.itemId, scene);
      return entry.itemId;
    }
  }
  return null;
}

// ============================================================
// 生成掉落物（发光球体）
// ============================================================
function spawnDropItem(position, itemId, scene, _roll) {
  const item = getItem(itemId);
  if (!item) return;
  const roll = _roll || rollItemStats(itemId, 'drop');

  const group = new THREE.Group();
  group.position.copy(position);
  group.position.y = 0.3;

  // 发光球体
  const rarityColor = getRarityColor(item.rarity);
  const geo = new THREE.SphereGeometry(0.4, 12, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: rarityColor,
    emissive: rarityColor,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
  });
  const sphere = new THREE.Mesh(geo, mat);
  sphere.position.y = 0.3;
  group.add(sphere);

  // 光晕环
  const ringGeo = new THREE.RingGeometry(0.5, 0.7, 16);
  const ringMat = new THREE.MeshBasicMaterial({
    color: rarityColor,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  // 点光源
  const light = new THREE.PointLight(rarityColor, 1.2, 8);
  light.position.y = 0.3;
  group.add(light);

  scene.add(group);

  // 追踪数据
  dropItems.push({
    group,
    itemId,
    item,
    roll,
    age: 0,
    lifetime: 10,
    picked: false,
    rotSpeed: 1.5 + Math.random(),
  });
}

function getRarityColor(rarity) {
  switch (rarity) {
    case "common": return 0x88aaff;
    case "uncommon": return 0x44dd44;
    case "rare": return 0x4488ff;
    case "epic": return 0xcc44ff;
    default: return 0x88aaff;
  }
}

// ============================================================
// 金币掉落
// ============================================================
export function spawnGoldCoin(position, amount, scene) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.position.y = 0.3;

  // 金币（黄色薄圆柱）
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    emissive: 0xffaa00,
    emissiveIntensity: 0.2,
    metalness: 0.7,
    roughness: 0.3,
  });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 12), coinMat);
  coin.position.y = 0.3;
  coin.rotation.x = Math.PI / 2;
  group.add(coin);

  // 光晕
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.45, 12), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.1;
  group.add(glow);

  // 点光
  const light = new THREE.PointLight(0xffdd44, 0.6, 4);
  light.position.y = 0.3;
  group.add(light);

  scene.add(group);

  dropItems.push({
    group,
    isGold: true,
    goldAmount: amount,
    age: 0,
    lifetime: 10,
    picked: false,
    rotSpeed: 2 + Math.random(),
  });
}

// ============================================================
// 拾取检测（每帧调用）
// ============================================================
export function checkPickups(playerPos, scene) {
  for (let i = dropItems.length - 1; i >= 0; i--) {
    const drop = dropItems[i];
    if (drop.picked) continue;

    const dx = playerPos.x - drop.group.position.x;
    const dz = playerPos.z - drop.group.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.0) {
      drop.picked = true;
      scene.remove(drop.group);

      if (drop.isGold) {
        addGold(drop.goldAmount);
        showToast(`🪙 +${drop.goldAmount} 金币`, "common");
      } else {
        const added = addItem(drop.itemId, drop.roll || null);
        if (added) {
          const statStr = formatStats(drop.roll || {});
          showToast(`🎁 ${drop.item.emoji} ${drop.item.name}${statStr !== '—' ? ' [' + statStr + ']' : ''}`, drop.item.rarity);
        }
      }

      dropItems.splice(i, 1);
    }
  }
}

// ============================================================
// 掉落物动画 + 过期清理（每帧调用）
// ============================================================
export function updateDrops(delta, scene) {
  for (let i = dropItems.length - 1; i >= 0; i--) {
    const drop = dropItems[i];
    drop.age += delta;

    // 旋转
    drop.group.rotation.y += drop.rotSpeed * delta;

    // 上下浮动
    drop.group.position.y = 0.3 + Math.sin(drop.age * 2.5) * 0.1;

    // 过期消失
    if (drop.age >= drop.lifetime) {
      scene.remove(drop.group);
      dropItems.splice(i, 1);
    }
  }
}

// ============================================================
// Toast 提示系统
// ============================================================
let toastTimer = null;

export function showToast(message, rarity = "common") {
  // 移除旧 toast
  const old = document.getElementById("game-toast");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "game-toast";
  div.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3000;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(4px);
    border: 4px solid ${RARITY_COLORS[rarity] || "#88aaff"};
    border-radius: 24px;
    padding: 18px 32px;
    font-size: 26px;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    pointer-events: none;
    animation: toastIn 0.25s ease-out;
    text-align: center;
    box-shadow: 0 0 40px ${RARITY_COLORS[rarity] || "#88aaff"}33;
  `;
  div.textContent = message;

  document.body.appendChild(div);

  // 2 秒后淡出移除
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    div.style.transition = "opacity 0.4s";
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 400);
  }, 2000);
}

const RARITY_COLORS = {
  common: "#88aaff",
  uncommon: "#44dd44",
  rare: "#4488ff",
  epic: "#cc44ff",
};

// 注入 toast 动画
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes toastIn {
    from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

/**
 * 获取当前所有掉落物（用于游戏状态）
 */
export function getDropCount() {
  return dropItems.length;
}
