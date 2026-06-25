import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ============================================================
// C1 — 史莱姆敌人
// ============================================================

/**
 * 在指定位置创建一只史莱姆
 * @param {THREE.Vector3 | [number, number, number]} position
 * @returns {THREE.Group}
 */
export function createSlime(position) {
  const group = new THREE.Group();
  group.userData = {
    hp: 30,
    maxHp: 30,
    attack: 5,
    isAlive: true,
    isEnemy: true,
    // 动画状态
    animTime: Math.random() * Math.PI * 2, // 随机相位
  };

  // ── 身体（下半球形，压扁的球体） ──
  const bodyGeo = new THREE.SphereGeometry(0.7, 24, 18);
  bodyGeo.scale(1.2, 0.65, 1); // 横向拉宽 + 纵向压扁 → 史莱姆造型
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x66dd77,
    transparent: true,
    opacity: 0.9,
    roughness: 0.2,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.6,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 保存材质引用，方便闪红
  group.userData.bodyMat = bodyMat;

  // ── 底部光晕圆环 ──
  const glowGeo = new THREE.RingGeometry(0.5, 0.8, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x66dd77,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.06;
  group.add(glow);

  // ── 眼睛：左眼白 ──
  const eyeGeo = new THREE.SphereGeometry(0.12, 10, 10);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lEye = new THREE.Mesh(eyeGeo, eyeMat);
  lEye.position.set(-0.25, 0.62, 0.65);
  group.add(lEye);

  // 右眼白
  const rEye = new THREE.Mesh(eyeGeo, eyeMat);
  rEye.position.set(0.25, 0.62, 0.65);
  group.add(rEye);

  // ── 瞳孔 ──
  const pupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
  lPupil.position.set(-0.25, 0.60, 0.74);
  group.add(lPupil);

  const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rPupil.position.set(0.25, 0.60, 0.74);
  group.add(rPupil);

  // ── 嘴巴（微笑小弧 / 小半圆） ──
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 10, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x225533 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.46, 0.72);
  mouth.rotation.x = Math.PI / 2;
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // ── 设置位置 ──
  if (Array.isArray(position)) {
    group.position.set(position[0], position[1], position[2]);
  } else {
    group.position.copy(position);
  }

  // 保存初始位置用于重生
  group.userData.spawnPos = group.position.clone();

  return group;
}

// ============================================================
// C1 — 史莱姆呼吸弹跳动画
// ============================================================
export function animateSlime(slime, delta, elapsed) {
  if (!slime.userData.isAlive) return;

  const data = slime.userData;
  const bodyMat = data.bodyMat;

  // 呼吸：position.y 正弦波动
  data.animTime += delta * 2.5;
  const breathe = Math.sin(data.animTime) * 0.08;
  slime.position.y = breathe;

  // 轻微缩放配合呼吸（挤压与拉伸）
  const squash = 1 + Math.sin(data.animTime) * 0.04;
  slime.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

  // 如果在闪红计时中，恢复材质
  if (data.flashTimer) {
    data.flashTimer -= delta;
    if (data.flashTimer <= 0) {
      bodyMat.emissive.setHex(0x000000);
      bodyMat.emissiveIntensity = 0;
      data.flashTimer = 0;
    }
  }
}

// ============================================================
// C2 — 伤害数字（CSS2D 飘字）
// ============================================================
const dmgLabels = []; // 全局追踪，由 main.js 每帧更新可见性

export function spawnDamageNumber(position, damage) {
  const div = document.createElement("div");
  div.textContent = `-${damage}`;
  div.style.cssText = `
    color: #ff4444;
    font-size: 32px;
    font-weight: bold;
    font-family: 'Segoe UI', sans-serif;
    text-shadow: 0 0 10px rgba(255,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5);
    pointer-events: none;
    user-select: none;
  `;

  const label = new CSS2DObject(div);
  label.position.copy(position);
  label.position.y += 1.0;

  // 附加动画数据
  label.userData = {
    lifetime: 0.8,
    age: 0,
    startY: label.position.y,
  };

  dmgLabels.push(label);
  return label;
}

export function getDamageLabels() {
  return dmgLabels;
}

export function updateDamageLabels(delta) {
  for (let i = dmgLabels.length - 1; i >= 0; i--) {
    const label = dmgLabels[i];
    const data = label.userData;
    data.age += delta;

    // 向上飘移
    label.position.y = data.startY + data.age * 0.8;

    // 淡出
    const opacity = Math.max(0, 1 - data.age / data.lifetime);
    label.element.style.opacity = opacity;

    if (data.age >= data.lifetime) {
      // 从父级移除
      if (label.parent) label.parent.remove(label);
      dmgLabels.splice(i, 1);
    }
  }
}

// ============================================================
// C2 — 闪红效果
// ============================================================
export function flashEnemy(slime, duration = 0.2) {
  const bodyMat = slime.userData.bodyMat;
  bodyMat.emissive.setHex(0xff0000);
  bodyMat.emissiveIntensity = 0.6;
  slime.userData.flashTimer = duration;
}

// ============================================================
// C2 — 死亡消失动画 + 重生
// ============================================================
export function killSlime(slime, scene) {
  slime.userData.isAlive = false;

  // 缩小消失动画（用 ticker 在 main.js 中驱动）
  slime.userData.deathTimer = 0.3;
  slime.userData.isDying = true;
  slime.userData.startScale = slime.scale.clone();

  // 3 秒后重生
  setTimeout(() => {
    if (!slime.parent) {
      scene.add(slime); // 如果已被移除，加回场景
    }
    // 重置满血
    slime.userData.hp = slime.userData.maxHp;
    slime.userData.isAlive = true;
    slime.userData.isDying = false;
    slime.position.copy(slime.userData.spawnPos);
    slime.scale.set(1, 1, 1);
    // 清除闪红
    slime.userData.bodyMat.emissive.setHex(0x000000);
    slime.userData.bodyMat.emissiveIntensity = 0;
    slime.userData.flashTimer = 0;
  }, 3000);
}

// ============================================================
// C2 — 死亡动画更新
// ============================================================
export function updateDeathAnimations(slime, delta) {
  if (!slime.userData.isDying) return;

  slime.userData.deathTimer -= delta;
  const t = Math.max(0, slime.userData.deathTimer / 0.3);
  const s = t * slime.userData.startScale.x;
  slime.scale.set(s, s, s);

  if (slime.userData.deathTimer <= 0) {
    slime.userData.isDying = false;
    slime.visible = false;
    // 3秒后重生的 setTimeout 已由 killSlime 设置
  }
}

// ============================================================
// 判断攻击范围内的史莱姆
// ============================================================
export function getSlimesInRange(playerPos, slimes, range = 3.5) {
  const hits = [];
  for (const slime of slimes) {
    if (!slime.userData.isAlive || slime.userData.isDying) continue;
    const dx = playerPos.x - slime.position.x;
    const dz = playerPos.z - slime.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < range) {
      hits.push(slime);
    }
  }
  return hits;
}
