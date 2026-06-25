import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ============================================================
// P0-3 — 5种怪物工厂 + 游走AI + 战斗辅助
// ============================================================

// ── 全局伤害数字列表 ──
const dmgLabels = [];

export function getDamageLabels() {
  return dmgLabels;
}

// ── 怪物几何缓存（共享几何体减少内存） ──
const GEO = {
  sphere: new THREE.SphereGeometry(0.7, 24, 18),
  sphereEye: new THREE.SphereGeometry(0.12, 10, 10),
  spherePupil: new THREE.SphereGeometry(0.06, 8, 8),
  box1: new THREE.BoxGeometry(0.7, 0.5, 1.0),
  boxHead: new THREE.BoxGeometry(0.35, 0.3, 0.35),
  cyl4: new THREE.CylinderGeometry(0.06, 0.07, 0.4, 4),
  cylBody: new THREE.CylinderGeometry(0.25, 0.35, 0.6, 6),
  cylArm: new THREE.CylinderGeometry(0.05, 0.06, 0.35, 5),
  coneTail: new THREE.ConeGeometry(0.05, 0.3, 5),
  coneEar: new THREE.ConeGeometry(0.08, 0.12, 4),
};

// ============================================================
// 1. 史莱姆（草原）
// ============================================================
export function createSlimeMonster(posX, posZ) {
  const group = new THREE.Group();

  const bodyGeo = GEO.sphere.clone();
  bodyGeo.scale(1.2, 0.65, 1);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x66dd77,
    transparent: true,
    opacity: 0.9,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  // 眼睛
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lEye = new THREE.Mesh(GEO.sphereEye, eyeMat);
  lEye.position.set(-0.25, 0.62, 0.65);
  group.add(lEye);
  const rEye = new THREE.Mesh(GEO.sphereEye, eyeMat);
  rEye.position.set(0.25, 0.62, 0.65);
  group.add(rEye);

  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const lPupil = new THREE.Mesh(GEO.spherePupil, pupilMat);
  lPupil.position.set(-0.25, 0.60, 0.74);
  group.add(lPupil);
  const rPupil = new THREE.Mesh(GEO.spherePupil, pupilMat);
  rPupil.position.set(0.25, 0.60, 0.74);
  group.add(rPupil);

  group.position.set(posX, 0.5, posZ);
  setupMonsterData(group, {
    type: "slime",
    hp: 30,
    maxHp: 30,
    attack: 5,
    expReward: 10,
    bodyMat,
    dropTable: [
      { itemId: "wooden_sword", chance: 0.4 },
      { itemId: "cloth_armor", chance: 0.3 },
    ],
  });

  return group;
}

// ============================================================
// 2. 野狼（森林）
// ============================================================
export function createWolf(posX, posZ) {
  const group = new THREE.Group();
  const GRAY = 0x888899;
  const DARK = 0x555566;
  const FUR = 0x9999aa;

  // 身体
  const bodyMat = new THREE.MeshStandardMaterial({ color: GRAY, roughness: 0.8 });
  const body = new THREE.Mesh(GEO.box1, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  // 头部（尖嘴）
  const headMat = new THREE.MeshStandardMaterial({ color: FUR, roughness: 0.8 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), headMat);
  head.position.set(0.45, 0.55, 0);
  head.castShadow = true;
  group.add(head);

  // 嘴部（突出）
  const snoutMat = new THREE.MeshStandardMaterial({ color: 0xccccbb, roughness: 0.8 });
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), snoutMat);
  snout.position.set(0.58, 0.48, 0);
  group.add(snout);

  // 耳朵
  const earMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.8 });
  [-0.14, 0.14].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), earMat);
    ear.position.set(0.32, 0.72, z);
    ear.rotation.x = z > 0 ? -0.3 : 0.3;
    group.add(ear);
  });

  // 眼睛（发光绿）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
  const lEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  lEye.position.set(0.53, 0.58, -0.14);
  group.add(lEye);
  const rEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  rEye.position.set(0.53, 0.58, 0.14);
  group.add(rEye);

  // 4条腿
  const legMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.9 });
  const legPositions = [[-0.25, 0.15, -0.3], [-0.25, 0.15, 0.3], [0.25, 0.15, -0.3], [0.25, 0.15, 0.3]];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(GEO.cyl4, legMat);
    leg.position.set(x, y, z);
    group.add(leg);
  }

  // 尾巴
  const tailMat = new THREE.MeshStandardMaterial({ color: GRAY, roughness: 0.8 });
  const tail = new THREE.Mesh(GEO.coneTail, tailMat);
  tail.position.set(-0.45, 0.4, 0);
  tail.rotation.x = 0.5;
  group.add(tail);

  group.position.set(posX, 0.5, posZ);
  group.rotation.y = Math.random() * Math.PI * 2;
  setupMonsterData(group, {
    type: "wolf",
    hp: 45,
    maxHp: 45,
    attack: 8,
    expReward: 18,
    bodyMat,
    dropTable: [
      { itemId: "iron_sword", chance: 0.35 },
      { itemId: "leather_armor", chance: 0.25 },
    ],
  });

  return group;
}

// ============================================================
// 3. 骷髅兵（山谷）
// ============================================================
export function createSkeleton(posX, posZ) {
  const group = new THREE.Group();
  const BONE = 0xf5f0e0;
  const DARK_BONE = 0xccc8b8;

  // 身体（圆柱）
  const bodyMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.6, 6), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  // 胸骨纹理（十字交叉）
  const ribMat = new THREE.MeshStandardMaterial({ color: DARK_BONE, roughness: 1.0 });
  [-0.12, 0.12].forEach((x) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.25), ribMat);
    rib.position.set(x, 0.55, 0.01);
    group.add(rib);
  });

  // 头（球）
  const headMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.9 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), headMat);
  head.position.y = 0.95;
  head.castShadow = true;
  group.add(head);

  // 眼睛（空洞：红色发光点）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  lEye.position.set(-0.08, 0.98, 0.18);
  group.add(lEye);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  rEye.position.set(0.08, 0.98, 0.18);
  group.add(rEye);

  // 双臂
  const armMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.9 });
  const lArm = new THREE.Mesh(GEO.cylArm, armMat);
  lArm.position.set(-0.3, 0.55, 0);
  lArm.rotation.z = 0.4;
  group.add(lArm);
  const rArm = new THREE.Mesh(GEO.cylArm, armMat);
  rArm.position.set(0.3, 0.55, 0);
  rArm.rotation.z = -0.4;
  group.add(rArm);

  // 腿
  const legMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.9 });
  const lLeg = new THREE.Mesh(GEO.cylArm, legMat);
  lLeg.position.set(-0.1, 0.2, 0);
  group.add(lLeg);
  const rLeg = new THREE.Mesh(GEO.cylArm, legMat);
  rLeg.position.set(0.1, 0.2, 0);
  group.add(rLeg);

  group.position.set(posX, 0.5, posZ);
  setupMonsterData(group, {
    type: "skeleton",
    hp: 60,
    maxHp: 60,
    attack: 12,
    expReward: 25,
    bodyMat,
    dropTable: [
      { itemId: "bone_blade", chance: 0.25 },
      { itemId: "bone_armor", chance: 0.2 },
      { itemId: "power_ring", chance: 0.15 },
    ],
  });

  return group;
}

// ============================================================
// 4. 火蜥蜴（洞穴入口）
// ============================================================
export function createFireLizard(posX, posZ) {
  const group = new THREE.Group();
  const RED = 0xdd3333;
  const ORANGE = 0xff6622;

  // 身体（拉长球）
  const bodyMat = new THREE.MeshStandardMaterial({
    color: RED,
    roughness: 0.4,
    emissive: ORANGE,
    emissiveIntensity: 0.15,
  });
  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 10);
  bodyGeo.scale(1.3, 0.7, 0.8);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.4;
  body.castShadow = true;
  group.add(body);

  // 头
  const headMat = new THREE.MeshStandardMaterial({
    color: RED,
    roughness: 0.4,
    emissive: ORANGE,
    emissiveIntensity: 0.1,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), headMat);
  head.position.set(0.55, 0.55, 0);
  head.castShadow = true;
  group.add(head);

  // 眼睛（亮黄）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff44 });
  const lEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  lEye.position.set(0.65, 0.58, -0.15);
  group.add(lEye);
  const rEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  rEye.position.set(0.65, 0.58, 0.15);
  group.add(rEye);

  // 尾巴（锥体）
  const tailMat = new THREE.MeshStandardMaterial({
    color: RED,
    roughness: 0.4,
    emissive: ORANGE,
    emissiveIntensity: 0.1,
  });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 5), tailMat);
  tail.position.set(-0.65, 0.3, 0);
  tail.rotation.x = 0.4;
  group.add(tail);

  // 腿
  const legMat = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.5 });
  const legPositions = [[-0.3, 0.12, -0.25], [-0.3, 0.12, 0.25], [0.3, 0.12, -0.25], [0.3, 0.12, 0.25]];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(GEO.cyl4, legMat);
    leg.position.set(x, y, z);
    group.add(leg);
  }

  group.position.set(posX, 0.5, posZ);
  setupMonsterData(group, {
    type: "fireLizard",
    hp: 80,
    maxHp: 80,
    attack: 15,
    expReward: 35,
    bodyMat,
    dropTable: [
      { itemId: "flame_fang", chance: 0.2 },
      { itemId: "scale_armor", chance: 0.15 },
    ],
  });

  return group;
}

// ============================================================
// 5. 石傀儡（山谷小Boss）
// ============================================================
export function createStoneGolem(posX, posZ) {
  const group = new THREE.Group();
  const GRAY = 0x776666;
  const DARK = 0x554444;

  // 身体（大方块）
  const bodyMat = new THREE.MeshStandardMaterial({
    color: GRAY,
    roughness: 0.9,
    metalness: 0.3,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.9), bodyMat);
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);

  // 身体裂缝发光
  const crackMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.6,
  });
  for (let i = 0; i < 3; i++) {
    const crack = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.15 + Math.random() * 0.2, 0.008),
      crackMat,
    );
    crack.position.set(
      (Math.random() - 0.5) * 0.6,
      0.4 + Math.random() * 0.4,
      0.46,
    );
    group.add(crack);
  }

  // 头
  const headMat = new THREE.MeshStandardMaterial({ color: GRAY, roughness: 0.9, metalness: 0.3 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), headMat);
  head.position.y = 1.3;
  head.castShadow = true;
  group.add(head);

  // 眼睛（红，发光）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const lEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  lEye.position.set(-0.14, 1.32, 0.28);
  group.add(lEye);
  const rEye = new THREE.Mesh(GEO.spherePupil, eyeMat);
  rEye.position.set(0.14, 1.32, 0.28);
  group.add(rEye);

  // 双臂（粗）
  const armMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.9 });
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.7, 6), armMat);
  lArm.position.set(-0.75, 0.6, 0);
  lArm.rotation.z = 0.3;
  lArm.castShadow = true;
  group.add(lArm);
  const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.7, 6), armMat);
  rArm.position.set(0.75, 0.6, 0);
  rArm.rotation.z = -0.3;
  rArm.castShadow = true;
  group.add(rArm);

  // 腿
  const legMat = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.9 });
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 6), legMat);
  lLeg.position.set(-0.25, 0.2, 0);
  group.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 6), legMat);
  rLeg.position.set(0.25, 0.2, 0);
  group.add(rLeg);

  group.position.set(posX, 0.5, posZ);
  // 傀儡更大
  group.scale.setScalar(1.5);
  setupMonsterData(group, {
    type: "stoneGolem",
    hp: 120,
    maxHp: 120,
    attack: 20,
    expReward: 50,
    bodyMat,
    dropTable: [
      { itemId: "life_pendant", chance: 0.5 },
    ],
  });

  return group;
}

// ============================================================
// 通用：为怪物设置 userData
// ============================================================
function setupMonsterData(group, { type, hp, maxHp, attack, expReward, bodyMat, dropTable }) {
  const MONSTER_NAMES = {
    slime: "史莱姆", wolf: "野狼", skeleton: "骷髅兵",
    fireLizard: "火蜥蜴", stoneGolem: "石傀儡",
  };
  const MONSTER_LEVELS = {
    slime: 1, wolf: 3, skeleton: 5, fireLizard: 7, stoneGolem: 10,
  };

  // AI 参数（按类型）
  const AI_CONFIG = {
    slime: { aggroRange: 4, attackRange: 1.5, chaseSpeed: 1.2, deaggroRange: 8 },
    wolf: { aggroRange: 5, attackRange: 1.8, chaseSpeed: 1.5, deaggroRange: 10 },
    skeleton: { aggroRange: 5, attackRange: 1.8, chaseSpeed: 1.3, deaggroRange: 10 },
    fireLizard: { aggroRange: 6, attackRange: 2.0, chaseSpeed: 1.6, deaggroRange: 11 },
    stoneGolem: { aggroRange: 5, attackRange: 2.0, chaseSpeed: 1.0, deaggroRange: 10 },
  };
  const ai = AI_CONFIG[type] || { aggroRange: 5, attackRange: 1.8, chaseSpeed: 1.3, deaggroRange: 10 };

  // 金币掉落（按类型）
  const GOLD_DROP = {
    slime: { chance: 0.5, min: 1, max: 3 },
    wolf: { chance: 0.6, min: 2, max: 4 },
    skeleton: { chance: 0.7, min: 3, max: 5 },
    fireLizard: { chance: 0.8, min: 4, max: 5 },
    stoneGolem: { chance: 1.0, min: 5, max: 8 },
  };
  const gd = GOLD_DROP[type] || { chance: 0.5, min: 1, max: 3 };

  group.userData = {
    type,
    hp,
    maxHp,
    attack,
    expReward,
    dropTable: dropTable || [],
    goldDrop: { chance: gd.chance, min: gd.min, max: gd.max },
    isAlive: true,
    isEnemy: true,
    bodyMat,
    // 显示信息
    level: MONSTER_LEVELS[type] || 1,
    nameCN: MONSTER_NAMES[type] || type,
    // AI 攻击状态
    aiState: "idle", // 'idle' | 'chasing' | 'returning'
    attackCooldown: 0,
    aggroRange: ai.aggroRange,
    attackRange: ai.attackRange,
    chaseSpeed: ai.chaseSpeed,
    deaggroRange: ai.deaggroRange,
    // 游走状态
    roamTarget: new THREE.Vector3(),
    roamTimer: 1 + Math.random() * 2,
    roamSpeed: 0.3 + Math.random() * 0.4,
    isWaiting: true,
    animTime: Math.random() * Math.PI * 2,
    flashTimer: 0,
    // 死亡动画
    deathTimer: 0,
    isDying: false,
    startScale: new THREE.Vector3(1, 1, 1),
    // 头顶标签
    labelEl: null,
    labelHpFill: null,
    labelHpText: null,
  };
}

// ============================================================
// 游走 AI
// ============================================================
export function updateRoaming(monster, delta) {
  const data = monster.userData;
  if (!data.isAlive || data.isDying) return;

  // 朝目标移动
  if (!data.isWaiting) {
    const dx = data.roamTarget.x - monster.position.x;
    const dz = data.roamTarget.z - monster.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.3) {
      data.isWaiting = true;
      data.roamTimer = 1 + Math.random() * 3;
    } else {
      const speed = data.roamSpeed * delta;
      monster.position.x += (dx / dist) * speed;
      monster.position.z += (dz / dist) * speed;

      // 面向移动方向
      const angle = Math.atan2(dx, dz);
      monster.rotation.y = angle;
    }
  } else {
    // 等待中，倒计时
    data.roamTimer -= delta;
    if (data.roamTimer <= 0) {
      pickRoamTarget(monster);
    }
  }
}

function pickRoamTarget(monster) {
  const data = monster.userData;
  // 从 regions 查找所属区域
  // 在创建怪物时注入 region 信息，或者根据当前位置推断
  if (!data.roamCenterX) {
    // 默认：以当前位置为中心，半径 4
    data.roamCenterX = monster.position.x;
    data.roamCenterZ = monster.position.z;
    data.roamRadius = 4;
  }

  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * data.roamRadius;
  data.roamTarget.set(
    data.roamCenterX + Math.cos(angle) * r,
    0.5,
    data.roamCenterZ + Math.sin(angle) * r,
  );
  data.isWaiting = false;
}

/**
 * 为怪物设置游走区域
 */
export function setRoamZone(monster, centerX, centerZ, radius) {
  monster.userData.roamCenterX = centerX;
  monster.userData.roamCenterZ = centerZ;
  monster.userData.roamRadius = radius;
  // 首次立即设定目标
  pickRoamTarget(monster);
}

// ============================================================
// 呼吸动画（针对不同怪物类型）
// ============================================================
export function animateMonster(monster, delta) {
  const data = monster.userData;
  if (!data.isAlive) return;

  // 通用呼吸：上下浮动
  data.animTime += delta * 2.5;
  const breathe = Math.sin(data.animTime) * 0.03;
  monster.position.y = 0.5 + breathe;

  // 闪红计时
  if (data.flashTimer > 0) {
    data.flashTimer -= delta;
    if (data.flashTimer <= 0) {
      if (data.bodyMat) {
        data.bodyMat.emissive.setHex(0x000000);
        data.bodyMat.emissiveIntensity = 0;
      }
      data.flashTimer = 0;
    }
  }
}

// ============================================================
// 战斗辅助
// ============================================================

/** 闪红 */
export function flashMonster(monster, duration = 0.2) {
  const mat = monster.userData.bodyMat;
  if (mat) {
    mat.emissive.setHex(0xff0000);
    mat.emissiveIntensity = 0.6;
  }
  monster.userData.flashTimer = duration;
}

/** 伤害数字 */
export function spawnDamageNumber(position, damage) {
  const div = document.createElement("div");
  div.textContent = `-${damage}`;
  div.style.cssText = `
    color: #ff4444;
    font-size: 64px;
    font-weight: bold;
    font-family: 'Segoe UI', sans-serif;
    text-shadow: 0 0 10px rgba(255,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5);
    pointer-events: none;
    user-select: none;
  `;
  const label = new CSS2DObject(div);
  label.position.copy(position);
  label.position.y += 1.0;
  label.userData = { lifetime: 0.8, age: 0, startY: label.position.y };
  dmgLabels.push(label);
  return label;
}

/** 伤害数字更新 */
export function updateDamageLabels(delta) {
  for (let i = dmgLabels.length - 1; i >= 0; i--) {
    const label = dmgLabels[i];
    const data = label.userData;
    data.age += delta;
    label.position.y = data.startY + data.age * 0.8;
    label.element.style.opacity = Math.max(0, 1 - data.age / data.lifetime);
    if (data.age >= data.lifetime) {
      if (label.parent) label.parent.remove(label);
      dmgLabels.splice(i, 1);
    }
  }
}

/** 范围检测 */
export function getMonstersInRange(playerPos, monsters, range = 3.5) {
  const hits = [];
  for (const m of monsters) {
    if (!m.userData.isAlive || m.userData.isDying) continue;
    const dx = playerPos.x - m.position.x;
    const dz = playerPos.z - m.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < range) {
      hits.push(m);
    }
  }
  return hits;
}

/** 死亡 + 重生 */
export function killMonster(monster) {
  monster.userData.isAlive = false;
  monster.userData.deathTimer = 0.3;
  monster.userData.isDying = true;
  monster.userData.startScale.copy(monster.scale);

  // 3 秒后重生
  setTimeout(() => {
    if (!monster.parent) return;
    monster.userData.hp = monster.userData.maxHp;
    monster.userData.isAlive = true;
    monster.userData.isDying = false;
    monster.position.set(
      monster.userData.spawnX,
      0.5,
      monster.userData.spawnZ,
    );
    monster.scale.copy(monster.userData.originalScale);
    monster.visible = true;
    if (monster.userData.bodyMat) {
      monster.userData.bodyMat.emissive.setHex(0x000000);
      monster.userData.bodyMat.emissiveIntensity = 0;
    }
    monster.userData.flashTimer = 0;
    // 重新设定游走
    pickRoamTarget(monster);
  }, 3000);
}

/** 死亡缩小动画 */
export function updateDeathAnimations(monster, delta) {
  if (!monster.userData.isDying) return;

  const data = monster.userData;
  data.deathTimer -= delta;
  const t = Math.max(0, data.deathTimer / 0.3);
  const s = t * data.startScale.x;
  monster.scale.set(s, s, s);

  if (data.deathTimer <= 0) {
    data.isDying = false;
    monster.visible = false;
  }
}

// ============================================================
// 保存重生信息（创建后调用）
// ============================================================
export function setSpawnData(monster, x, z, scale) {
  monster.userData.spawnX = x;
  monster.userData.spawnZ = z;
  monster.userData.originalScale = scale || new THREE.Vector3(1, 1, 1);
  if (!monster.userData.originalScale) {
    monster.userData.originalScale = monster.scale.clone();
  }
}

// ============================================================
// 怪物主动攻击 AI
// ============================================================

/**
 * 更新怪物攻击 AI（每帧调用）
 * @param {THREE.Group} monster
 * @param {number} delta
 * @param {THREE.Vector3} playerPos
 * @param {(damage: number) => void} onPlayerHit 玩家受击回调
 * @param {boolean} isPaused 是否暂停
 */
export function updateMonsterAI(monster, delta, playerPos, onPlayerHit, isPaused) {
  const data = monster.userData;
  if (!data.isAlive || data.isDying) return;
  // 史莱姆不攻击
  if (data.aggroRange === 0) return;
  // 暂停时不更新 AI
  if (isPaused) return;

  const dx = playerPos.x - monster.position.x;
  const dz = playerPos.z - monster.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // 攻击冷却
  if (data.attackCooldown > 0) {
    data.attackCooldown -= delta;
  }

  switch (data.aiState) {
    case "idle":
      // 检测到玩家 → 追击
      if (dist < data.aggroRange) {
        data.aiState = "chasing";
      }
      break;

    case "chasing":
      if (dist > data.deaggroRange) {
        // 脱离范围 → 返回
        data.aiState = "returning";
        break;
      }
      // 面向玩家
      monster.lookAt(playerPos.x, 0.5, playerPos.z);
      // 追逐移动
      if (dist > data.attackRange) {
        const speed = data.chaseSpeed * delta;
        monster.position.x += (dx / dist) * speed;
        monster.position.z += (dz / dist) * speed;
        monster.position.y = 0.5; // 保持在地面
      }
      // 攻击
      if (dist < data.attackRange && data.attackCooldown <= 0) {
        data.attackCooldown = 1.5; // 1.5 秒冷却
        if (onPlayerHit) onPlayerHit(data.attack);
      }
      break;

    case "returning":
      const sx = data.spawnX - monster.position.x;
      const sz = data.spawnZ - monster.position.z;
      const spawnDist = Math.sqrt(sx * sx + sz * sz);
      if (spawnDist < 0.5) {
        // 回到出生点
        monster.position.x = data.spawnX;
        monster.position.z = data.spawnZ;
        data.aiState = "idle";
      } else {
        // 移动回出生点
        monster.lookAt(data.spawnX, 0.5, data.spawnZ);
        const speed = data.chaseSpeed * delta * 0.8;
        monster.position.x += (sx / spawnDist) * speed;
        monster.position.z += (sz / spawnDist) * speed;
      }
      break;
  }
}

// ============================================================
// 怪物头顶 HUD 标签
// ============================================================

/**
 * 为怪物创建头顶标签（CSS2D）
 */
function createMonsterLabel(monster) {
  const data = monster.userData;

  // 容器
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex; flex-direction: column; align-items: center;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    pointer-events: none; user-select: none;
    text-shadow: 0 1px 6px rgba(0,0,0,0.8);
    width: 120px;
  `;

  // 等级 + 名称
  const nameDiv = document.createElement("div");
  nameDiv.style.cssText = `
    color: #ffcc44; font-size: 14px; font-weight: bold;
    margin-bottom: 2px;
    white-space: nowrap;
  `;
  nameDiv.textContent = `Lv.${data.level} ${data.nameCN}`;
  container.appendChild(nameDiv);

  // 血条背景
  const barBg = document.createElement("div");
  barBg.style.cssText = `
    width: 100%; height: 8px;
    background: rgba(0,0,0,0.6);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.15);
  `;

  // 血条填充
  const barFill = document.createElement("div");
  barFill.style.cssText = `
    width: 100%; height: 100%;
    background: #44cc44;
    border-radius: 3px;
    transition: width 0.12s ease, background 0.2s ease;
  `;
  barBg.appendChild(barFill);
  container.appendChild(barBg);

  // HP 数值
  const hpText = document.createElement("div");
  hpText.style.cssText = `
    color: rgba(255,255,255,0.7); font-size: 11px;
    margin-top: 1px;
  `;
  hpText.textContent = `${data.hp}/${data.maxHp} HP`;
  container.appendChild(hpText);

  const label = new CSS2DObject(container);
  label.position.y = 1.6;
  label.userData = { isMonsterLabel: true };
  monster.add(label);

  // 存引用以便快速更新
  data.labelEl = container;
  data.labelHpFill = barFill;
  data.labelHpText = hpText;
}

/**
 * 更新所有怪物头顶标签（在 animate 中每帧调用）
 * @param {THREE.Vector3} playerPos
 * @param {THREE.Group[]} monsters
 */
export function updateMonsterLabels(playerPos, monsters) {
  for (const m of monsters) {
    const data = m.userData;
    if (!data.labelEl) continue;

    // 距离检测：仅 15 单位内显示
    const dist = playerPos.distanceTo(m.position);
    const isVisible = data.isAlive && !data.isDying && dist < 15;
    data.labelEl.style.display = isVisible ? "flex" : "none";

    if (isVisible) {
      // 更新血条
      const pct = Math.max(0, (data.hp / data.maxHp) * 100);
      data.labelHpFill.style.width = `${pct}%`;
      // 低于 30% 变红
      data.labelHpFill.style.background = pct < 30 ? "#ff4444" : "#44cc44";
      data.labelHpText.textContent = `${Math.max(0, data.hp)}/${data.maxHp} HP`;

      // 使标签始终面向相机（CSS2D 自动面向相机，不需要额外操作）
    }
  }
}

// ============================================================
// 创建所有怪物并摆放到各层
// ============================================================
export function spawnAllMonsters(scene) {
  const allMonsters = [];

  // 各层 X 坐标
  const L1 = 0, L2 = 35, L3 = 70, L4 = 105, L5 = 140;

  // ── 第二层：草原/森林 — 4 史莱姆 ──
  const slimeData = [
    [L2 + 4, 3], [L2 - 5, 6], [L2 + 8, -5], [L2 - 7, -4],
  ];
  for (const [x, z] of slimeData) {
    const m = createSlimeMonster(x, z);
    setSpawnData(m, x, z);
    setRoamZone(m, L2, 0, 12);
    scene.add(m);
    createMonsterLabel(m);
    allMonsters.push(m);
  }

  // ── 第三层：山谷 — 3 野狼 + 2 骷髅 ──
  const wolfData = [
    [L3 + 5, 5], [L3 - 4, -6], [L3 + 3, -3],
  ];
  for (const [x, z] of wolfData) {
    const m = createWolf(x, z);
    setSpawnData(m, x, z);
    setRoamZone(m, L3, 0, 12);
    scene.add(m);
    createMonsterLabel(m);
    allMonsters.push(m);
  }

  const skeletonDataL3 = [
    [L3 - 5, 4], [L3 + 6, 3],
  ];
  for (const [x, z] of skeletonDataL3) {
    const m = createSkeleton(x, z);
    setSpawnData(m, x, z);
    setRoamZone(m, L3, 0, 12);
    scene.add(m);
    createMonsterLabel(m);
    allMonsters.push(m);
  }

  // ── 第四层：火焰洞穴 — 3 火蜥蜴 + 1 石傀儡 ──
  const lizardData = [
    [L4 + 4, 5], [L4 - 5, -4], [L4 + 6, -3],
  ];
  for (const [x, z] of lizardData) {
    const m = createFireLizard(x, z);
    setSpawnData(m, x, z);
    setRoamZone(m, L4, 0, 12);
    scene.add(m);
    createMonsterLabel(m);
    allMonsters.push(m);
  }

  const golem = createStoneGolem(L4 - 2, 5);
  setSpawnData(golem, L4 - 2, 5);
  setRoamZone(golem, L4, 0, 6);
  scene.add(golem);
  createMonsterLabel(golem);
  allMonsters.push(golem);

  return allMonsters;
}
