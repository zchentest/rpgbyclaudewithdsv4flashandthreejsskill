import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ============================================================
// P3-1 — 区域传送门系统
// ============================================================

const portals = [];
let flashOverlay = null;
let areaToastEl = null;

// 区域颜色
const COLORS = {
  forest: 0x44dd44,
  valley: 0x4488ff,
  cave: 0xff4444,
  throne: 0xaa44ff,
  layer_up: 0x44ff44,    // 上行传送门（绿色）
  layer_down: 0x4488ff,  // 下行传送门（蓝色）
};

/**
 * 创建传送门
 * @param {number} x
 * @param {number} z
 * @param {'forest'|'valley'|'cave'|'throne'} target 目标区域 key
 * @param {string} labelText 标签显示文字
 * @param {[number, number]} dest 目标坐标 [x, z]
 */
export function createPortal(x, z, target, labelText, dest) {
  const group = new THREE.Group();
  const color = COLORS[target] || 0x44dd44;
  const colorObj = new THREE.Color(color);

  // ── 主光环（RingGeometry） ──
  const ringGeo = new THREE.RingGeometry(1.0, 1.6, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  // ── 第二光环（内圈，旋转方向相反） ──
  const innerGeo = new THREE.RingGeometry(0.5, 0.9, 24);
  const innerMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const innerRing = new THREE.Mesh(innerGeo, innerMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.1;
  group.add(innerRing);

  // ── 垂直光环（竖立旋转环） ──
  const vertGeo = new THREE.TorusGeometry(0.7, 0.06, 12, 24);
  const vertMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
  });
  const vertRing = new THREE.Mesh(vertGeo, vertMat);
  vertRing.position.y = 0.8;
  vertRing.rotation.x = Math.PI / 3;
  group.add(vertRing);

  // ── 第二个垂直环（反向旋转） ──
  const vertGeo2 = new THREE.TorusGeometry(0.85, 0.04, 10, 24);
  const vertMat2 = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
  });
  const vertRing2 = new THREE.Mesh(vertGeo2, vertMat2);
  vertRing2.position.y = 0.8;
  vertRing2.rotation.x = -Math.PI / 4;
  group.add(vertRing2);

  // ── 中心光柱（锥体，更亮） ──
  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.05, 2.6, 12, 1, true);
  const pillarMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 1.4;
  group.add(pillar);

  // ── 内发光柱 ──
  const glowGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
  });
  const glowPillar = new THREE.Mesh(glowGeo, glowMat);
  glowPillar.position.y = 1.2;
  group.add(glowPillar);

  // ── 旋涡粒子（围绕光柱的球体环） ──
  const vortexParticles = [];
  for (let i = 0; i < 12; i++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 4, 4),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    dot.userData.angle = (i / 12) * Math.PI * 2;
    dot.userData.radius = 0.6 + Math.random() * 0.3;
    dot.userData.heightOffset = Math.random() * 1.8;
    dot.userData.speed = 1.2 + Math.random() * 0.8;
    group.add(dot);
    vortexParticles.push(dot);
  }

  // ── 点光源 ──
  const light = new THREE.PointLight(color, 1.2, 6);
  light.position.y = 1.0;
  group.add(light);

  // ── CSS2D 标签 ──
  const labelDiv = document.createElement("div");
  labelDiv.textContent = `➡️ ${labelText}`;
  labelDiv.style.cssText = `
    background: rgba(0,0,0,0.75);
    color: #fff;
    padding: 8px 24px;
    border-radius: 20px;
    font-size: 28px;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    pointer-events: none;
    white-space: nowrap;
    border: 2px solid ${colorObj.getStyle()};
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  `;
  const label = new CSS2DObject(labelDiv);
  label.position.y = 2.6;
  group.add(label);

  group.position.set(x, 0.3, z);

  // 存储数据
  group.userData = {
    isPortal: true,
    target,
    destX: dest[0],
    destZ: dest[1],
    labelText,
    color,
    vertRing,
    vertRing2,
    innerRing,
    mainRing: ring,
    pillar,
    glowPillar,
    vortexParticles,
    rotSpeed: 0.8 + Math.random() * 0.4,
  };

  portals.push(group);
  return group;
}

// ============================================================
// 传送门动画
// ============================================================
export function updatePortals(delta, elapsed) {
  for (const portal of portals) {
    const data = portal.userData;
    // 光环旋转
    data.mainRing.rotation.z += data.rotSpeed * delta;
    data.innerRing.rotation.z -= data.rotSpeed * 1.5 * delta;
    // 垂直环旋转（正反两个方向）
    data.vertRing.rotation.y += data.rotSpeed * 1.2 * delta;
    data.vertRing2.rotation.y -= data.rotSpeed * 1.5 * delta;
    // 光柱呼吸
    data.pillar.material.opacity = 0.12 + Math.sin(elapsed * 2.5) * 0.08;
    data.glowPillar.material.opacity = 0.25 + Math.sin(elapsed * 3.0) * 0.15;
    // 光柱脉冲缩放
    const pulse = 1 + Math.sin(elapsed * 2.5) * 0.08;
    data.pillar.scale.set(pulse, 1, pulse);
    // 旋涡粒子旋转
    for (const dot of data.vortexParticles) {
      dot.userData.angle += dot.userData.speed * delta;
      const a = dot.userData.angle;
      const r = dot.userData.radius;
      const hOff = dot.userData.heightOffset;
      dot.position.x = Math.cos(a) * r;
      dot.position.z = Math.sin(a) * r;
      dot.position.y = 0.3 + Math.sin(elapsed * dot.userData.speed + hOff) * 0.5 + hOff * 0.4;
      dot.material.opacity = 0.4 + Math.sin(elapsed * 2 + hOff) * 0.3;
    }
  }
}

// ============================================================
// 传送检测
// ============================================================
export function checkPortal(playerPos, character, triggerFlash, showAreaToast, accessGuard) {
  for (const portal of portals) {
    const dx = playerPos.x - portal.position.x;
    const dz = playerPos.z - portal.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.0) {
      const data = portal.userData;
      // 检查访问权限（Boss区域需要完成任务）
      if (accessGuard && !accessGuard(data)) {
        return null;
      }
      // 传送！
      character.position.x = data.destX;
      character.position.z = data.destZ;
      character.position.y = 0;

      // 传送特效
      if (triggerFlash) triggerFlash();
      if (showAreaToast) showAreaToast(data.target, data.labelText);
      return data; // 返回传送门数据，含 target 等信息
    }
  }
  return null;
}

// ============================================================
// 传送特效（屏幕闪白 + 区域提示）
// ============================================================
let flashTimeout = null;

export function createPortalEffects() {
  // 闪白
  flashOverlay = document.createElement("div");
  flashOverlay.id = "portal-flash";
  flashOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: #fff; z-index: 3000; pointer-events: none;
    opacity: 0; transition: opacity 0.2s ease;
  `;
  document.body.appendChild(flashOverlay);

  // 区域名称 Toast
  areaToastEl = document.createElement("div");
  areaToastEl.id = "area-toast";
  areaToastEl.style.cssText = `
    position: fixed; top: 38%; left: 50%; transform: translate(-50%, -50%);
    z-index: 3001; pointer-events: none;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    text-align: center;
    opacity: 0; transition: opacity 0.5s ease;
  `;
  document.body.appendChild(areaToastEl);
}

export function triggerTeleportFlash() {
  if (!flashOverlay) return;
  if (flashTimeout) clearTimeout(flashTimeout);
  flashOverlay.style.opacity = "0.8";
  flashTimeout = setTimeout(() => {
    flashOverlay.style.opacity = "0";
  }, 250);
}

export function showAreaToast(target, label) {
  if (!areaToastEl) return;
  const emojis = { forest: "🌲", valley: "🏜️", cave: "🔥", throne: "👑", layer_up: "⬆️", layer_down: "⬇️" };
  const emoji = emojis[target] || "🏰";
  areaToastEl.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
    <div style="font-size: 42px; color: #ffcc44; font-weight: bold; text-shadow: 0 4px 30px rgba(0,0,0,0.9);">${label}</div>
    <div style="font-size: 18px; color: rgba(255,255,255,0.5); margin-top: 8px;">✦ 按 WASD 探索 ✦</div>
  `;
  areaToastEl.style.opacity = "1";
  setTimeout(() => {
    areaToastEl.style.opacity = "0";
  }, 3500);
}

// 清理
export function disposePortals() {
  portals.length = 0;
}
