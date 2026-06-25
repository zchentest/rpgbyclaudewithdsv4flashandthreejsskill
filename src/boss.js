import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import game from "./gameState.js";
import { showToast } from "./dropSystem.js";

// ============================================================
// P3-2 — Boss 系统
// ============================================================

let boss = null;
let bossHpBar = null;
let isBossDefeated = false;

// 粒子系统
const particles = [];

// ============================================================
// 创建暗影骑士 Boss
// ============================================================
export function createBoss() {
  if (boss) return boss;

  const group = new THREE.Group();
  const DARK = 0x2a1a2a;
  const STEEL = 0x555566;
  const GOLD = 0xccaa44;
  const CAPE = 0x441133;

  // ── 身体（盔甲） ──
  const bodyMat = new THREE.MeshStandardMaterial({
    color: DARK, roughness: 0.6, metalness: 0.4,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.6), bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  // ── 头盔 ──
  const helmMat = new THREE.MeshStandardMaterial({
    color: STEEL, roughness: 0.3, metalness: 0.7,
  });
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), helmMat);
  helm.position.y = 1.25;
  helm.scale.set(0.9, 0.8, 0.8);
  helm.castShadow = true;
  group.add(helm);

  // 头盔面罩（窄条）
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.1, metalness: 0.8,
  });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.3), visorMat);
  visor.position.set(0, 1.2, 0.38);
  group.add(visor);

  // 头盔角
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.6 });
  [-0.2, 0.2].forEach((x) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 5), hornMat);
    horn.position.set(x, 1.5, 0.15);
    horn.rotation.z = x < 0 ? -0.3 : 0.3;
    group.add(horn);
  });

  // 眼睛（红，发光）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  lEye.position.set(-0.1, 1.28, 0.42);
  group.add(lEye);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  rEye.position.set(0.1, 1.28, 0.42);
  group.add(rEye);

  // ── 披风（多层） ──
  const capeMat = new THREE.MeshStandardMaterial({
    color: CAPE, roughness: 0.8, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.85 - i * 0.08, 0.5 - i * 0.1), capeMat);
    c.position.set(0, 0.7 - i * 0.12, -0.36 - i * 0.04);
    c.rotation.x = 0.15 + i * 0.12;
    group.add(c);
  }

  // ── 大剑（发光） ──
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xcc4444, roughness: 0.2, metalness: 0.6,
    emissive: 0xff2222, emissiveIntensity: 0.6,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.02), bladeMat);
  blade.position.set(0.45, 0.72, 0);
  group.add(blade);
  // 剑格
  const guardMat = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.3, metalness: 0.8 });
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.04), guardMat);
  guard.position.set(0.45, 0.42, 0);
  group.add(guard);
  // 剑柄
  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0x664422, roughness: 0.6,
  });
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6), hiltMat);
  hilt.position.set(0.45, 0.32, 0);
  group.add(hilt);

  // ── 肩甲（带尖刺） ──
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: STEEL, roughness: 0.3, metalness: 0.7,
  });
  [-0.48, 0.48].forEach((x) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), shoulderMat);
    shoulder.position.set(x, 1.0, 0);
    shoulder.scale.set(1, 0.5, 0.8);
    group.add(shoulder);
    // 肩刺
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), shoulderMat);
    spike.position.set(x, 0.95, -0.15);
    spike.rotation.x = 0.4;
    group.add(spike);
  });

  group.position.set(140, 0.7, 0); // 第五层
  group.scale.setScalar(1.8);

  group.userData = {
    isBoss: true,
    hp: 500,
    maxHp: 500,
    attack: 25,
    expReward: 200,
    isAlive: true,
    // AI 状态
    state: "idle", // idle | chasing | charging | returning
    attackCooldown: 0,
    chaseTimer: 0,
    chargeTimer: 0,
    chargeCooldown: 2.5,
    origPos: group.position.clone(),
    chargeTarget: new THREE.Vector3(),
    chargeStartPos: group.position.clone(),
    chargeProgress: 0,
    animTime: Math.random() * 6,
    bodyMat,
    helmMat,
    bladeMat,
  };

  boss = group;
  return group;
}

export function getBoss() { return boss; }
export function isBossAlive() { return boss && boss.userData.isAlive; }
export function getBossDefeated() { return isBossDefeated; }

// ============================================================
// Boss AI 更新
// ============================================================
export function updateBoss(delta, playerPos, onPlayerHit) {
  if (!boss || !boss.userData.isAlive) return;
  const data = boss.userData;
  data.animTime += delta;

  // 呼吸浮动（始终）
  const breathe = Math.sin(data.animTime * 1.5) * 0.04;
  boss.position.y = 0.5 + breathe;

  // 攻击冷却
  if (data.attackCooldown > 0) data.attackCooldown -= delta;
  if (data.chargeTimer > 0) data.chargeTimer -= delta;

  // 水平距离
  const dx = playerPos.x - boss.position.x;
  const dz = playerPos.z - boss.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  switch (data.state) {
    case "idle":
      boss.lookAt(playerPos.x, 0.5, playerPos.z);
      if (dist < 8 && data.chargeTimer <= 0) {
        // 冲锋准备
        data.state = "charging";
        data.chargeStartPos.copy(boss.position);
        const dir = new THREE.Vector3(dx, 0, dz).normalize();
        // 冲锋距离随距离变化 — 远则远冲
        const chargeDist = Math.min(dist + 1, 5);
        data.chargeTarget.copy(boss.position).add(dir.multiplyScalar(chargeDist));
        data.chargeProgress = 0;
      } else if (dist < 4 && data.attackCooldown <= 0) {
        // 近距离：挥砍攻击
        data.attackCooldown = 1.5;
        if (onPlayerHit) onPlayerHit(data.attack);
      }
      break;

    case "chasing":
      boss.lookAt(playerPos.x, 0.5, playerPos.z);
      // 缓慢逼近玩家
      if (dist > 2.5) {
        const speed = 2.0 * delta;
        boss.position.x += (dx / dist) * speed;
        boss.position.z += (dz / dist) * speed;
      }
      // 近距离攻击
      if (dist < 2.5 && data.attackCooldown <= 0) {
        data.attackCooldown = 1.5;
        if (onPlayerHit) onPlayerHit(data.attack);
      }
      // 可以发动冲锋
      if (data.chargeTimer <= 0 && dist < 7) {
        data.state = "charging";
        data.chargeStartPos.copy(boss.position);
        const dir = new THREE.Vector3(dx, 0, dz).normalize();
        data.chargeTarget.copy(boss.position).add(dir.multiplyScalar(4));
        data.chargeProgress = 0;
      }
      break;

    case "charging":
      data.chargeProgress += delta * 3.0; // 约 0.33 秒完成冲锋
      boss.position.lerpVectors(data.chargeStartPos, data.chargeTarget, data.chargeProgress);
      // 冲锋路径上命中玩家
      if (dist < 2.0 && data.chargeProgress < 0.6) {
        data.attackCooldown = 1.0;
        if (onPlayerHit) onPlayerHit(data.attack + 10); // 冲锋额外伤害
      }
      if (data.chargeProgress >= 1) {
        data.chargeProgress = 1;
        data.state = "chasing";
        data.chargeTimer = data.chargeCooldown;
      }
      break;

    case "returning":
      data.chargeProgress -= delta * 2;
      if (data.chargeProgress <= 0) {
        data.chargeProgress = 0;
        data.state = "idle";
        data.chargeTimer = data.chargeCooldown;
        boss.position.copy(data.origPos);
      } else {
        boss.position.lerpVectors(data.chargeStartPos, data.chargeTarget, data.chargeProgress);
      }
      break;
  }

  // 如果玩家跑远，回到 idle
  if (dist > 12 && (data.state === "chasing" || data.state === "idle")) {
    if (data.state === "chasing") {
      data.state = "returning";
      data.chargeStartPos.copy(boss.position);
      data.chargeTarget.copy(data.origPos);
      data.chargeProgress = 0;
    }
  }

  // 更新血条
  updateBossHpBar();
}

// ============================================================
// Boss 受伤
// ============================================================
export function damageBoss(amount, scene) {
  if (!boss || !boss.userData.isAlive) return false;
  const data = boss.userData;
  data.hp -= amount;

  // 闪红（修改身体材质）
  if (data.bodyMat) {
    data.bodyMat.emissive.setHex(0xff0000);
    data.bodyMat.emissiveIntensity = 0.4;
    setTimeout(() => {
      if (data.bodyMat) {
        data.bodyMat.emissive.setHex(0x000000);
        data.bodyMat.emissiveIntensity = 0;
      }
    }, 150);
  }

  if (data.hp <= 0) {
    defeatBoss(scene);
    return true;
  }
  return false;
}

// ============================================================
// Boss 死亡
// ============================================================
function defeatBoss(scene) {
  const data = boss.userData;
  data.isAlive = false;
  isBossDefeated = true;

  // 粒子爆炸
  spawnDeathParticles(boss.position.clone(), scene);

  // 隐藏 Boss
  setTimeout(() => {
    boss.visible = false;
    // 移除粒子
    cleanupParticles(scene);
  }, 1500);

  // 隐藏血条
  hideBossHpBar();
}

// ============================================================
// 粒子爆炸效果
// ============================================================
function spawnDeathParticles(position, scene) {
  const colors = [0xff4444, 0xff8844, 0xffcc44, 0xcc44ff, 0xffffff];
  for (let i = 0; i < 40; i++) {
    const size = 0.03 + Math.random() * 0.08;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.y += Math.random() * 0.5;
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      Math.random() * 4 + 1,
      (Math.random() - 0.5) * 6,
    );
    mesh.userData = { vel, life: 1.0 };
    scene.add(mesh);
    particles.push(mesh);
  }
}

export function updateParticles(delta, scene) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const d = p.userData;
    d.life -= delta * 0.8;
    p.position.add(d.vel.clone().multiplyScalar(delta));
    d.vel.y -= 5 * delta; // 重力
    p.scale.setScalar(Math.max(0, d.life));
    if (d.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }
}

function cleanupParticles(scene) {
  for (const p of particles) {
    scene.remove(p);
  }
  particles.length = 0;
}

// ============================================================
// Boss 血条（屏幕顶部）
// ============================================================
let hpBarContainer = null;

export function setupBossHpBar() {
  if (hpBarContainer) return;
  hpBarContainer = document.createElement("div");
  hpBarContainer.id = "boss-hp-bar";
  hpBarContainer.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 2000; display: none; text-align: center;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    width: 700px;
  `;
  hpBarContainer.innerHTML = `
    <div id="boss-name" style="
      font-size: 18px; color: #ff4444; font-weight: bold;
      text-shadow: 0 2px 12px rgba(255,0,0,0.4);
      margin-bottom: 4px;
    ">👹 暗影骑士</div>
    <div style="
      width: 100%; height: 16px;
      background: rgba(0,0,0,0.6);
      border-radius: 14px;
      overflow: hidden;
      border: 2px solid rgba(255,68,68,0.3);
    ">
      <div id="boss-hp-fill" style="
        width: 100%; height: 100%;
        background: linear-gradient(90deg, #cc2222, #ff4444);
        border-radius: 12px;
        transition: width 0.15s ease;
      "></div>
    </div>
    <div id="boss-hp-text" style="
      font-size: 14px; color: rgba(255,255,255,0.7);
      margin-top: 4px;
    ">500 / 500</div>
  `;
  document.body.appendChild(hpBarContainer);
}

export function showBossHpBar() {
  if (hpBarContainer) hpBarContainer.style.display = "block";
}

export function hideBossHpBar() {
  if (hpBarContainer) hpBarContainer.style.display = "none";
}

function updateBossHpBar() {
  if (!boss || !hpBarContainer || hpBarContainer.style.display === "none") return;
  const data = boss.userData;
  const pct = Math.max(0, (data.hp / data.maxHp) * 100);
  const fill = document.getElementById("boss-hp-fill");
  const text = document.getElementById("boss-hp-text");
  if (fill) fill.style.width = `${pct}%`;
  if (text) text.textContent = `${Math.max(0, data.hp)} / ${data.maxHp}`;
}

// ============================================================
// 光墙（Boss 房间守卫）
// ============================================================
let lightWall = null;

/** 创建光墙 Mesh（由 main.js 添加 CSS2D 标签） */
export function createLightWallMesh(scene) {
  if (lightWall) return lightWall.wall;

  const wallGeo = new THREE.BoxGeometry(3, 3, 0.2);
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0xff4444,
    emissive: 0xff2222,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(130, 1.5, 0); // 第五层入口前
  scene.add(wall);

  lightWall = { wall, mat: wallMat };
  return wall;
}

export function getLightWall() {
  return lightWall ? lightWall.wall : null;
}

export function checkLightWallAccess() {
  const completed = game.completedQuests || [];
  const allDone = ["q1", "q2", "q3"].every((id) => completed.includes(id));
  return allDone;
}

export function removeLightWall(scene) {
  if (!lightWall) return;
  scene.remove(lightWall.wall);
  if (lightWall.label) scene.remove(lightWall.label);
  lightWall = null;
}

export function showLightWallWarning(scene) {
  // 创建浮动警告面板
  const warnDiv = document.createElement("div");
  warnDiv.textContent = "⚠️ 暗影骑士的结界尚未解除！请完成村长交付的所有任务。";
  warnDiv.style.cssText = `
    background: rgba(0,0,0,0.85);
    color: #ff6644;
    padding: 16px 32px;
    border-radius: 16px;
    font-size: 22px;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    font-weight: bold;
    pointer-events: none;
    white-space: nowrap;
    border: 2px solid rgba(255,68,68,0.5);
    box-shadow: 0 0 40px rgba(255,0,0,0.3), inset 0 0 20px rgba(255,0,0,0.1);
    text-shadow: 0 2px 12px rgba(0,0,0,0.8);
  `;
  const label = new CSS2DObject(warnDiv);
  // 第五层入口传送门上方
  label.position.set(128, 3.5, 0);
  scene.add(label);
  // 3.5 秒后消失
  setTimeout(() => {
    scene.remove(label);
  }, 3500);
}

// ============================================================
// Boss 重置
// ============================================================
export function resetBoss() {
  if (!boss) return;
  const data = boss.userData;
  data.hp = data.maxHp;
  data.isAlive = true;
  isBossDefeated = false;
  data.state = "idle";
  boss.position.copy(data.origPos);
  boss.visible = true;
}

// ============================================================
// 存档兼容
// ============================================================
export function getBossSaveData() {
  return { isBossDefeated };
}

export function loadBossState(data) {
  if (!data) return;
  isBossDefeated = data.isBossDefeated || false;
  if (isBossDefeated && boss) {
    boss.userData.isAlive = false;
    boss.visible = false;
  }
}
