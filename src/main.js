import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

import { createWorldGrounds, createDecorations, createSignpost } from "./world.js";
import { createMerchant, createVillager, createChief } from "./npc.js";
import {
  setupDialoguePanel,
  startDialogue,
  closeDialogue,
  isDialogueActive,
} from "./dialog.js";
import {
  spawnAllMonsters,
  updateRoaming,
  animateMonster,
  updateDeathAnimations,
  updateDamageLabels,
  getDamageLabels,
  updateMonsterLabels,
  updateMonsterAI,
} from "./monsters.js";
import { attackEnemy, onDamageTaken } from "./combat.js";
import game, {
  addExp,
  addGold,
  spendGold,
  loadGame,
  hasSaveData,
  saveGame,
  onHUDUpdate,
  onLevelUp,
  refreshGameHUD,
} from "./gameState.js";
import { setupMenu, pauseGame, resumeGame } from "./menu.js";
import { setupHUD, updateHUD, triggerAttackFlash, triggerHurtFlash, animateKillCount, updateMuteIcon } from "./ui.js";
import { getFogConfig, getRegionAt, LAYER_DATA, LAYER_RADIUS } from "./regions.js";
import {
  toggleInventory,
  isInventoryOpen,
  closeInventory,
  onInventoryChange,
  getStats,
  addItem,
  getInventory,
  removeItem,
  hasItem,
} from "./inventory.js";
import { getItem, rollItemStats } from "./equipment.js";
import { checkPickups, updateDrops, showToast } from "./dropSystem.js";
import { setupTrackerHUD, updateTrackerHUD, showQuestInteraction } from "./questTracker.js";
import {
  createPortal, updatePortals, checkPortal,
  createPortalEffects, triggerTeleportFlash, showAreaToast,
} from "./portal.js";
import {
  createBoss, updateBoss, damageBoss, getBoss, isBossAlive,
  setupBossHpBar, showBossHpBar, hideBossHpBar,
  createLightWallMesh, getLightWall, checkLightWallAccess,
  showLightWallWarning, removeLightWall, resetBoss,
  updateParticles as updateBossParticles,
} from "./boss.js";
import { showEnding, resetTimer } from "./ending.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  playHit, playPickup, playTeleport, playLevelUp,
  startBossMusic, stopBossMusic, toggleMute, isAudioMuted,
} from "./audio.js";
import {
  initParticleSystem, updateParticles, spawnHitParticles,
  spawnLevelUpParticles, spawnTeleportParticles, spawnBossDeathParticles,
  startPetals, updatePetals,
} from "./particles.js";
import { setupMinimap, drawMinimap, toggleMinimap, isMinimapVisible } from "./minimap.js";

// ============================================================
// Scene
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

// 多层塔视角 — 从上方俯瞰当前层
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  120,
);
camera.position.set(0, 18, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.5, 0);
controls.minDistance = 5;
controls.maxDistance = 28;
controls.maxPolarAngle = Math.PI / 2.3;

// ── 每层相机预设 ──
const LAYER_CAMERA = {
  1: { pos: [0, 11, 12], target: [0, 0, 0] },
  2: { pos: [35, 11, 12], target: [35, 0, 0] },
  3: { pos: [70, 11, 12], target: [70, 0, 0] },
  4: { pos: [105, 11, 12], target: [105, 0, 0] },
  5: { pos: [140, 11, 12], target: [140, 0, 0] },
};

function snapCameraToLayer(layerId) {
  const preset = LAYER_CAMERA[layerId];
  if (!preset) return;
  const [px, py, pz] = preset.pos;
  const [tx, ty, tz] = preset.target;
  controls.target.set(tx, ty, tz);
  camera.position.set(px, py, pz);
  controls.update();
}

// ── 重生点 ──
const SPAWN_POINT = { x: 2, y: 0.7, z: 1 }; // 第一层小屋前

function respawnPlayer() {
  game.player.hp = game.player.maxHp;
  character.position.set(SPAWN_POINT.x, SPAWN_POINT.y, SPAWN_POINT.z);
  // 重置所有怪物 AI 状态
  for (const mm of monsters) {
    mm.userData.aiState = "idle";
    mm.userData.attackCooldown = 0;
  }
  // 扣除 10% 金币（死亡惩罚）
  const lost = Math.floor((game.gold || 0) * 0.1);
  if (lost > 0) {
    game.gold = Math.max(0, (game.gold || 0) - lost);
    showToast(`💸 损失 ${lost} 金币`, "common");
  }
  // 切回第一层视角
  snapCameraToLayer(1);
  refreshGameHUD();
  showToast("💀 你被击败了…在第一层复活", "common");
}

// ============================================================
// Post-Processing
// ============================================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0, 0.4, 0.1,
);
composer.addPass(bloomPass);

let bloomTimeout = null;
function triggerBloom(strength = 0.8, duration = 500) {
  if (bloomTimeout) clearTimeout(bloomTimeout);
  bloomPass.strength = strength;
  bloomTimeout = setTimeout(() => {
    bloomPass.strength = 0;
    bloomTimeout = null;
  }, duration);
}

// ============================================================
// CSS2DRenderer
// ============================================================
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";

// ============================================================
// UI / 对话 / 菜单
// ============================================================
setupHUD();
setupDialoguePanel();

onHUDUpdate((g) => { updateHUD(g); });
onLevelUp((level) => {
  showToast(`🎉 升级！ Lv.${level} 攻击+2 HP+10`, "epic");
  triggerBloom(0.8, 600);
});
refreshGameHUD();

setupMenu({
  onResume: () => { game.isPaused = false; },
  onSave: () => {
    game.player.pos.x = character.position.x;
    game.player.pos.z = character.position.z;
    saveGame();
  },
  onTitle: () => {},
});

// P1-3 — 背包变更时更新玩家属性
function applyEquipmentStats() {
  const stats = getStats();
  game.player.attack = 10 + stats.atkBonus;
  game.player.defense = stats.defBonus;
  game.player.maxHp = 100 + stats.hpBonus;
  game.player.setBonuses = stats.activeSetBonuses;
  if (game.player.hp > game.player.maxHp) {
    game.player.hp = game.player.maxHp;
  }
  refreshGameHUD();
}

onInventoryChange(() => {
  applyEquipmentStats();
});

// P2 — 任务追踪 HUD
setupTrackerHUD();

// ── P4 全局视觉风格 ──
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { font-family: "Hiragino Sans", "Noto Sans SC", "Segoe UI", sans-serif !important; }
  button:hover { transform: scale(1.04); transition: transform 0.12s ease, background 0.12s ease; }
  @keyframes warnPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.85; }
  }
`;
document.head.appendChild(globalStyle);

// ── P4 粒子系统 + 小地图 ──
initParticleSystem(scene);
setupMinimap();
startPetals(scene);
updateTrackerHUD();

// ============================================================
// Lighting
// ============================================================
// ============================================================
// P4-4 — 动态光影（太阳缓慢旋转）
// ============================================================
const ambientLight = new THREE.AmbientLight(0x404065, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 1.8);
dirLight.position.set(8, 12, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 160;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// 太阳围绕 Y 轴缓慢旋转（每 60 秒一圈）
const sunAngle = { value: 0 };
const SUN_RADIUS = 80;
const SUN_HEIGHT = 30;

// ============================================================
// P0-2 — 世界地面 + 环境装饰
// ============================================================
createWorldGrounds(scene);
createDecorations(scene);

// ============================================================
// 玩家角色
// ============================================================
function createChibiCharacter() {
  const group = new THREE.Group();

  const SKIN = 0xffccaa, HAIR = 0x4a3728, HAT = 0xcc3333,
        CLOTHES = 0x4488cc, BELT = 0xcc9944, WHITE = 0xffffff,
        PUPIL = 0x222222, MOUTH = 0xcc6666, SHOES = 0x663333;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 24, 24),
    new THREE.MeshToonMaterial({ color: SKIN }),
  );
  head.position.y = 1.25; head.castShadow = true; group.add(head);

  const hatGeo = new THREE.SphereGeometry(0.42, 20, 20);
  hatGeo.scale(1, 0.35, 1);
  const hat = new THREE.Mesh(hatGeo, new THREE.MeshToonMaterial({ color: HAT }));
  hat.position.set(0, 1.58, 0); hat.castShadow = true; group.add(hat);

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.52, 0.06, 20),
    new THREE.MeshToonMaterial({ color: HAT }),
  );
  brim.position.set(0, 1.38, 0); brim.castShadow = true; group.add(brim);

  const pom = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 10),
    new THREE.MeshToonMaterial({ color: 0xffffff }),
  );
  pom.position.set(0, 1.72, -0.3); group.add(pom);

  const eyeMat = new THREE.MeshToonMaterial({ color: WHITE });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), eyeMat);
  lEye.position.set(-0.16, 1.30, 0.38); group.add(lEye);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), eyeMat);
  rEye.position.set(0.16, 1.30, 0.38); group.add(rEye);

  const pupilMat = new THREE.MeshToonMaterial({ color: PUPIL });
  const lPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pupilMat);
  lPupil.position.set(-0.16, 1.29, 0.44); group.add(lPupil);
  const rPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pupilMat);
  rPupil.position.set(0.16, 1.29, 0.44); group.add(rPupil);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.018, 6, 10, Math.PI),
    new THREE.MeshToonMaterial({ color: MOUTH }),
  );
  mouth.position.set(0, 1.18, 0.40); mouth.rotation.x = Math.PI / 2; group.add(mouth);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.30, 0.35, 8, 12),
    new THREE.MeshToonMaterial({ color: CLOTHES }),
  );
  body.position.y = 0.70; body.castShadow = true; group.add(body);

  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.30, 0.04, 6, 16),
    new THREE.MeshToonMaterial({ color: BELT }),
  );
  belt.position.y = 0.52; belt.rotation.x = Math.PI / 2; group.add(belt);

  // ── 披风/围巾 ──
  const scarfMat = new THREE.MeshToonMaterial({ color: 0xcc4444, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.18 - i * 0.03),
      scarfMat,
    );
    seg.position.set(0, 0.9 - i * 0.12, -0.32 - i * 0.04);
    seg.rotation.x = 0.15 + i * 0.12;
    group.add(seg);
  }

  const armMat = new THREE.MeshToonMaterial({ color: SKIN });
  [0.38, -0.38].forEach((x, i) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.40, 8), armMat);
    arm.position.set(x, 0.80, 0);
    arm.rotation.z = i === 0 ? -0.25 : 0.25;
    arm.castShadow = true;
    group.add(arm);
  });

  const legMat = new THREE.MeshToonMaterial({ color: CLOTHES });
  [0.13, -0.13].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), legMat);
    leg.position.set(x, 0.27, 0); leg.castShadow = true; group.add(leg);
  });

  const shoeMat = new THREE.MeshToonMaterial({ color: SHOES });
  [0.13, -0.13].forEach((x) => {
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), shoeMat);
    shoe.scale.set(1, 0.6, 1.3);
    shoe.position.set(x, 0.06, 0.04); group.add(shoe);
  });

  // ── 背上的剑 ──
  const bladeMat = new THREE.MeshToonMaterial({ color: 0xccccdd, emissive: 0x4488ff, emissiveIntensity: 0.1 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.015), bladeMat);
  blade.position.set(-0.28, 0.85, -0.22);
  blade.rotation.x = -0.2;
  group.add(blade);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), new THREE.MeshToonMaterial({ color: 0xccaa44 }));
  guard.position.set(-0.28, 0.60, -0.22);
  guard.rotation.x = -0.2;
  group.add(guard);
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 6), new THREE.MeshToonMaterial({ color: 0x664422 }));
  hilt.position.set(-0.28, 0.52, -0.22);
  hilt.rotation.x = -0.2;
  group.add(hilt);

  return group;
}

// 玩家出生在第一层中心
const character = createChibiCharacter();
character.position.set(0, 0.7, 0);
character.scale.setScalar(0.9);
scene.add(character);

// ============================================================
// NPC（仍在草原区域）
// ============================================================
const merchant = createMerchant();
merchant.position.set(3.5, 0, -1.5);
merchant.userData.isShop = true;
scene.add(merchant);

const villager = createVillager();
villager.position.set(-3, 0, -4);
scene.add(villager);

const chief = createChief();
chief.position.set(1.5, 0, 3);
scene.add(chief);

// ── 村长头顶"！"标记（新手引导，使用opacity动画避免与CSS2D的transform冲突） ──
const chiefMarkerDiv = document.createElement("div");
chiefMarkerDiv.textContent = "❗";
chiefMarkerDiv.style.cssText = `
  font-size: 38px; font-weight: bold;
  color: #ff4444; text-shadow: 0 0 20px rgba(255,68,68,0.8), 0 0 40px rgba(255,0,0,0.4);
  pointer-events: none; user-select: none;
  animation: chiefPulse 1s ease-in-out infinite;
`;
const chiefMarker = new CSS2DObject(chiefMarkerDiv);
chiefMarker.position.set(0, 3.2, 0);
chief.add(chiefMarker);

const pulseStyle = document.createElement("style");
pulseStyle.textContent = `
  @keyframes chiefPulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.3; }
  }
`;
document.head.appendChild(pulseStyle);

const npcs = [merchant, villager, chief];
let closestNPC = null;

// ============================================================
// P0-3 — 生成所有怪物
// ============================================================
const monsters = spawnAllMonsters(scene);
game.enemies = monsters;

// 提示层信息
console.log("🏰 多层塔已展开！5层：新手村 / 草原森林 / 荒芜山谷 / 火焰洞穴 / 最终王座");

// ============================================================
// 创建层间传送门
// ============================================================
const L1 = 0, L2 = 35, L3 = 70, L4 = 105, L5 = 140;
const allPortals = [];

// L1 → L2（上行，绿色）
const p1 = createPortal(L1 + 12, 0, "layer_up", "↑ 第二层·草原森林", [L2, 0]);
allPortals.push(p1);

// L2 下行→L1（蓝色），上行→L3（绿色）
const p2d = createPortal(L2 - 12, 0, "layer_down", "↓ 第一层·新手村", [L1, 0]);
const p2u = createPortal(L2 + 12, 0, "layer_up", "↑ 第三层·荒芜山谷", [L3, 0]);
allPortals.push(p2d, p2u);

// L3 下行→L2（蓝色），上行→L4（绿色）
const p3d = createPortal(L3 - 12, 0, "layer_down", "↓ 第二层·草原森林", [L2, 0]);
const p3u = createPortal(L3 + 12, 0, "layer_up", "↑ 第四层·火焰洞穴", [L4, 0]);
allPortals.push(p3d, p3u);

// L4 下行→L3（蓝色），上行→L5（绿色）
const p4d = createPortal(L4 - 12, 0, "layer_down", "↓ 第三层·荒芜山谷", [L3, 0]);
const p4u = createPortal(L4 + 12, 0, "layer_up", "↑ 第五层·最终王座", [L5, 0]);
allPortals.push(p4d, p4u);

// L5 下行→L4（蓝色）
const p5 = createPortal(L5 - 12, 0, "layer_down", "↓ 第四层·火焰洞穴", [L4, 0]);
allPortals.push(p5);

allPortals.forEach(p => scene.add(p));
const portals = allPortals;
createPortalEffects();

// 更新传送门标签显示解锁状态
function refreshPortalLabels() {
  const completed = game.completedQuests || [];
  const labelMap = {
    [L3]: { quest: "q1", name: "初出茅庐" },
    [L4]: { quest: "q2", name: "森林危机" },
  };
  for (const p of portals) {
    const dx = p.userData.destX;
    const req = labelMap[dx];
    if (!req) continue;
    // 找到 CSS2DObject 子元素
    const labelObj = p.children.find(c => c.isCSS2DObject);
    if (!labelObj) continue;
    const unlocked = completed.includes(req.quest);
    labelObj.element.innerHTML = unlocked
      ? `➡️ ${p.userData.labelText}`
      : `🔒 ${p.userData.labelText}<br><span style="font-size:14px;color:#ff6644;">（需完成「${req.name}」）</span>`;
  }
}
refreshPortalLabels();

// ============================================================
// 路标（第一层指引）
// ============================================================
const signpost = createSignpost(L1);
scene.add(signpost);

// 引导文字（CSS2D）
const guideDiv = document.createElement("div");
guideDiv.textContent = "➡️ 前往传送门，前往下一层";
guideDiv.style.cssText = `
  color: #ffcc44; font-size: 20px; font-weight: bold;
  font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
  text-shadow: 0 2px 12px rgba(0,0,0,0.9);
  background: rgba(0,0,0,0.5); padding: 6px 18px; border-radius: 12px;
  border: 1px solid rgba(255,204,68,0.3);
  pointer-events: none; user-select: none;
  animation: guidePulse 2s ease-in-out infinite;
`;
const guideLabel = new CSS2DObject(guideDiv);
guideLabel.position.set(L1 + 6, 2.5, 4);
scene.add(guideLabel);

// 脉冲动画
const guideStyle = document.createElement("style");
guideStyle.textContent = `
  @keyframes guidePulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
`;
document.head.appendChild(guideStyle);

// ============================================================
// 创建 Boss（第五层）+ 光墙
// ============================================================
const boss = createBoss();
scene.add(boss);
setupBossHpBar();

// 光墙（第五层入口，仅在任务未完成时阻挡）
const wallMesh = createLightWallMesh(scene);
const wallLabelDiv = document.createElement("div");
wallLabelDiv.textContent = "🔒 需要完成所有任务";
wallLabelDiv.style.cssText = `
  color: #ff6666; font-size: 16px; font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
  text-shadow: 0 0 20px rgba(255,0,0,0.5);
  background: rgba(0,0,0,0.6); padding: 8px 20px; border-radius: 12px;
  border: 1px solid rgba(255,68,68,0.3);
  pointer-events: none; white-space: nowrap;
`;
const wallLabel = new CSS2DObject(wallLabelDiv);
// 放在第四层→第五层的传送门前
wallLabel.position.set(L5 - 10, 3.0, 0);
scene.add(wallLabel);

// Boss 状态恢复
if (game.bossDefeated) {
  boss.userData.isAlive = false;
  boss.visible = false;
}

resetTimer();

// 初始雾效
updateFog();

// ============================================================
// 读档
// ============================================================
function applyLoadedState() {
  if (!hasSaveData()) return;
  const saved = loadGame();
  if (!saved) return;
  setTimeout(() => {
    character.position.x = game.player.pos.x;
    character.position.z = game.player.pos.z;
    // 重置所有怪物
    for (const m of monsters) {
      m.userData.hp = m.userData.maxHp;
      m.userData.isAlive = true;
      m.userData.isDying = false;
      m.position.set(m.userData.spawnX, 0.5, m.userData.spawnZ);
      m.scale.copy(m.userData.originalScale);
      m.visible = true;
      if (m.userData.bodyMat) {
        m.userData.bodyMat.emissive.setHex(0x000000);
        m.userData.bodyMat.emissiveIntensity = 0;
      }
      m.userData.flashTimer = 0;
    }
    refreshGameHUD();
  }, 0);
}

if (hasSaveData()) {
  const wantLoad = confirm("📂 检测到存档数据，是否读取？\n取消将从头开始。");
  if (wantLoad) applyLoadedState();
}

// ============================================================
// 新手引导（首次加载时自动触发）
// ============================================================
function showTutorial() {
  if (game.tutorialShown) return;
  game.tutorialShown = true;

  const overlay = document.createElement("div");
  overlay.id = "tutorial-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 5000; display: flex; justify-content: center; align-items: center;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    user-select: none;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: rgba(15, 15, 40, 0.95); border: 2px solid rgba(255,204,68,0.3);
    border-radius: 24px; padding: 40px 50px; max-width: 560px;
    text-align: center; box-shadow: 0 20px 80px rgba(0,0,0,0.5);
    color: #eee;
  `;
  panel.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px;">🏘️</div>
    <div style="font-size: 26px; color: #ffcc44; font-weight: bold; margin-bottom: 16px;">
      欢迎来到幻境旅人！
    </div>
    <div style="font-size: 18px; line-height: 1.7; color: rgba(255,255,255,0.8); margin-bottom: 16px;">
      请前往村庄中心找<strong style="color:#ffcc44;">村长</strong>（头上带有 <strong style="color:#ff4444;">❗</strong> 标记）接取任务。
    </div>
    <div style="font-size: 16px; line-height: 2; color: rgba(255,255,255,0.6); margin-bottom: 24px; text-align: left; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px 18px;">
      🎮 <strong style="color:#ddd;">操作指南</strong><br>
      <strong style="color:#ffcc44;">W/A/S/D</strong> — 移动<br>
      <strong style="color:#ffcc44;">空格</strong> — 攻击怪物<br>
      <strong style="color:#ffcc44;">E</strong> — 与 NPC 对话 / 交易<br>
      <strong style="color:#ffcc44;">I</strong> — 打开背包<br>
      <strong style="color:#ffcc44;">ESC</strong> — 暂停 / 保存游戏
    </div>
    <button id="tutorial-ok-btn" style="
      padding: 14px 48px; font-size: 20px; font-family: inherit;
      background: linear-gradient(135deg, #ffcc44, #eeaa22); color: #222;
      border: none; border-radius: 40px; cursor: pointer; font-weight: bold;
      transition: transform 0.12s;
    ">我知道了</button>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  document.getElementById("tutorial-ok-btn").addEventListener("click", () => {
    overlay.remove();
    saveGame();
  });
}

// 根据存档状态初始化"！"标记
if (game.hasTalkedToChief || (game.completedQuests && game.completedQuests.length > 0) || (game.activeQuests && game.activeQuests.length > 0)) {
  chiefMarker.visible = false;
}

// 延迟一帧确保场景已加载
setTimeout(showTutorial, 100);

// ============================================================
// P0-1 — 动态雾效
// ============================================================
function updateFog() {
  const p = character.position;
  const cfg = getFogConfig(p.x, p.z);
  if (cfg) {
    scene.fog = new THREE.Fog(cfg.color, cfg.near, cfg.far);
    scene.background.setHex(cfg.color);
  } else {
    scene.fog = null;
    scene.background.setHex(0x111122);
  }
}

// ============================================================
// 杂货店界面
// ============================================================
const SHOP_ITEMS = [
  { itemId: "iron_sword", name: "铁剑", type: "weapon", atk: 8, def: 0, hp: 0, price: 30, emoji: "⚔️" },
  { itemId: "steel_shield", name: "钢盾", type: "armor", atk: 0, def: 5, hp: 20, price: 40, emoji: "🛡️" },
  { itemId: "power_ring", name: "力量戒指", type: "accessory", atk: 5, def: 0, hp: 15, price: 50, emoji: "💍" },
  { itemId: "life_pendant", name: "生命吊坠", type: "accessory", atk: 0, def: 3, hp: 40, price: 60, emoji: "📿" },
];

let shopOpen = false;
let shopTab = "buy"; // 'buy' | 'sell'

function showShop() {
  if (shopOpen) return;
  shopOpen = true;
  shopTab = "buy";

  const overlay = document.createElement("div");
  overlay.id = "shop-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 5000; display: flex; justify-content: center; align-items: center;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    user-select: none;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: rgba(15, 15, 40, 0.96); border: 2px solid rgba(255,204,68,0.3);
    border-radius: 24px; padding: 36px 40px; min-width: 560px; max-width: 620px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.6); color: #eee;
  `;

  function renderShop() {
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-size:24px; font-weight:bold; color:#ffcc44;">🏪 杂货店</div>
        <div style="font-size:18px; color:#ffdd44;">🪙 ${game.gold || 0}</div>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:18px;">
        <button class="shop-tab" data-tab="buy" style="
          flex:1; padding:10px; font-size:15px; font-family:inherit;
          border:2px solid ${shopTab === 'buy' ? '#ffcc44' : 'rgba(255,255,255,0.1)'};
          border-radius:10px; background:${shopTab === 'buy' ? 'rgba(255,204,68,0.12)' : 'rgba(255,255,255,0.04)'};
          color:${shopTab === 'buy' ? '#ffcc44' : 'rgba(255,255,255,0.4)'}; cursor:pointer;
        ">🛒 购买</button>
        <button class="shop-tab" data-tab="sell" style="
          flex:1; padding:10px; font-size:15px; font-family:inherit;
          border:2px solid ${shopTab === 'sell' ? '#44dd88' : 'rgba(255,255,255,0.1)'};
          border-radius:10px; background:${shopTab === 'sell' ? 'rgba(68,221,136,0.12)' : 'rgba(255,255,255,0.04)'};
          color:${shopTab === 'sell' ? '#44dd88' : 'rgba(255,255,255,0.4)'}; cursor:pointer;
        ">💰 出售</button>
      </div>
      ${shopTab === 'buy' ? renderBuyTable() : renderSellGrid()}
      <button id="shop-close-btn" style="
        display:block; width:100%; padding:14px; margin-top:12px; font-size:15px; font-family:inherit;
        border:1px solid rgba(255,255,255,0.15); border-radius:12px;
        background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.5); cursor:pointer;
      ">关闭</button>
    `;

    panel.querySelectorAll(".shop-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        shopTab = btn.dataset.tab;
        renderShop();
      });
    });
    panel.querySelectorAll(".shop-buy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.dataset.item;
        const price = parseInt(btn.dataset.price);
        if (!spendGold(price)) { showToast("❌ 金币不足！", "common"); renderShop(); return; }
        const roll = rollItemStats(itemId, 'shop');
        addItem(itemId, roll);
        showToast(`🛒 购买成功！`, "uncommon");
        renderShop();
      });
    });
    panel.querySelectorAll(".shop-sell-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.dataset.item;
        const price = parseInt(btn.dataset.price);
        if (removeItem(itemId)) {
          addGold(price);
          showToast(`💰 售出，获得 ${price} 金币`, "common");
          renderShop();
        }
      });
    });
    panel.querySelector("#shop-close-btn").addEventListener("click", closeShop);
  }

  function renderBuyTable() {
    return `
      <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
        <thead><tr style="color:rgba(255,255,255,0.4); font-size:14px; text-align:left;">
          <th style="padding:8px 10px;">装备</th>
          <th style="padding:8px 10px;">名称</th>
          <th style="padding:8px 10px;">属性</th>
          <th style="padding:8px 10px;">价格</th>
          <th style="padding:8px 10px;"></th>
        </tr></thead>
        <tbody>
          ${SHOP_ITEMS.map(item => {
            const stats = [];
            if (item.atk) stats.push(`⚔️+${item.atk}`);
            if (item.def) stats.push(`🛡️+${item.def}`);
            if (item.hp) stats.push(`❤️+${item.hp}`);
            const affordable = (game.gold || 0) >= item.price;
            return `<tr style="border-top:1px solid rgba(255,255,255,0.06);">
              <td style="padding:14px 10px; font-size:28px;">${item.emoji}</td>
              <td style="padding:14px 10px; font-size:16px;">${item.name}</td>
              <td style="padding:14px 10px; font-size:14px; color:rgba(255,255,255,0.6);">${stats.join(' ')}</td>
              <td style="padding:14px 10px; font-size:16px; color:#ffdd44;">🪙${item.price}</td>
              <td style="padding:14px 10px;">
                <button class="shop-buy-btn" data-item="${item.itemId}" data-price="${item.price}" style="
                  padding:8px 18px; font-size:14px; font-family:inherit;
                  border:1px solid ${affordable ? '#44aa66' : 'rgba(255,255,255,0.15)'};
                  border-radius:8px; background:${affordable ? 'rgba(68,170,102,0.2)' : 'rgba(255,255,255,0.04)'};
                  color:${affordable ? '#88ddaa' : 'rgba(255,255,255,0.3)'};
                  cursor:${affordable ? 'pointer' : 'not-allowed'};
                  ${affordable ? '' : 'pointer-events:none;'}
                " ${affordable ? '' : 'disabled'}>${affordable ? '购买' : '💰不足'}</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="font-size:13px; color:rgba(255,255,255,0.3); text-align:center;">
        购买后放入背包，按 <strong style="color:rgba(255,255,255,0.5);">I</strong> 打开背包装备
      </div>`;
  }

  function renderSellGrid() {
    const inv = getInventory();
    const items = Array.from(inv.values());
    if (items.length === 0) {
      return `<div style="text-align:center; padding:30px; color:rgba(255,255,255,0.3); font-size:16px;">背包空空如也…</div>`;
    }
    const cards = items.map(entry => {
      const item = entry.item;
      const sellPrice = SHOP_ITEMS.find(s => s.itemId === item.id)?.price || Math.floor(((item.atkBonus||0)+(item.defBonus||0)+(item.hpBonus||0)/10) * 3 + 5);
      const sellValue = Math.max(1, Math.floor(sellPrice * 0.5));
      return `<div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 8px;background:rgba(255,255,255,0.04);border-radius:12px;border-top:3px solid ${item.rarity === 'common' ? '#aaa' : item.rarity === 'uncommon' ? '#44cc44' : item.rarity === 'rare' ? '#4488ff' : '#cc44ff'};">
        <div style="font-size:28px;margin-bottom:4px;">${item.emoji}</div>
        <div style="font-size:13px;color:#eee;">${item.name}</div>
        <div style="font-size:12px;color:#ffdd44;margin:6px 0;">🪙${sellValue}</div>
        <button class="shop-sell-btn" data-item="${item.id}" data-price="${sellValue}" style="padding:6px 14px;font-size:13px;font-family:inherit;border:1px solid rgba(68,221,136,0.4);border-radius:8px;background:rgba(68,221,136,0.15);color:#44dd88;cursor:pointer;width:100%;">出售</button>
      </div>`;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;max-height:300px;overflow-y:auto;margin-bottom:8px;">${cards}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.3);text-align:center;">出售已装备物品请先按 <strong style="color:rgba(255,255,255,0.5);">I</strong> 卸下</div>`;
  }

  function closeShop() {
    shopOpen = false;
    overlay.remove();
  }

  renderShop();
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

// ============================================================
// Keyboard
// ============================================================
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    e.preventDefault();
    if (shopOpen) {
      const overlay = document.getElementById("shop-overlay");
      if (overlay) { shopOpen = false; overlay.remove(); }
    } else if (isInventoryOpen()) { closeInventory(); }
    else if (isDialogueActive()) { closeDialogue(); }
    else if (game.isPaused) { resumeGame(); }
    else {
      game.player.pos.x = character.position.x;
      game.player.pos.z = character.position.z;
      pauseGame();
    }
    return;
  }

  if (game.isPaused) return;

  // ── P4 — M 键静音 / Tab 键小地图 ──
  if (e.code === "KeyM") {
    e.preventDefault();
    toggleMute();
    updateMuteIcon(isAudioMuted());
    return;
  }
  if (e.code === "Tab") {
    e.preventDefault();
    toggleMinimap();
    return;
  }

  switch (e.code) {
    case "KeyW": keys.w = true; e.preventDefault(); break;
    case "KeyA": keys.a = true; e.preventDefault(); break;
    case "KeyS": keys.s = true; e.preventDefault(); break;
    case "KeyD": keys.d = true; e.preventDefault(); break;

    case "Space":
      e.preventDefault();
      if (isDialogueActive()) break;
      const result = attackEnemy(character.position, monsters, scene);
      triggerBloom(0.3, 200);
      if (result.hit) {
        triggerAttackFlash();
        animateKillCount();
      }

      // P3-2 — 攻击Boss（独立于普通怪物，Boss层无小怪）
      if (isBossAlive()) {
        const bDist = getBoss().position.distanceTo(character.position);
        if (bDist < 5) {
          const playerAtk = game.player.attack || 10;
          const killed = damageBoss(playerAtk, scene);
          refreshGameHUD();
          if (killed) {
            game.bossDefeated = true;
            stopBossMusic();
            bossMusicPlaying = false;
            showToast("💀 暗影骑士已被击败！", "epic");
            setTimeout(() => {
              const stats = { kills: game.kills, level: game.player.level };
              showEnding(stats);
            }, 3000);
          }
        }
      }

      if (result.hit) {
        refreshGameHUD();
      }
      break;

    case "KeyE":
      e.preventDefault();
      if (isDialogueActive()) {
        document.getElementById("dialogue-panel")?.click();
      } else if (closestNPC) {
        if (closestNPC.userData.isShop) {
          showShop();
        } else if (closestNPC.userData.isQuestGiver) {
          // 隐藏"！"标记（首次对话）
          if (!game.hasTalkedToChief) {
            game.hasTalkedToChief = true;
            chiefMarker.visible = false;
            saveGame();
          }
          game.isDialogOpen = true;
          showQuestInteraction(closestNPC);
        } else {
          game.isDialogOpen = true;
          startDialogue(closestNPC.userData.name, closestNPC.userData.dialogues, () => {
            game.isDialogOpen = false;
          });
        }
      }
      break;

    case "KeyI":
    case "KeyB":
      e.preventDefault();
      if (!isDialogueActive() && !game.isPaused) {
        toggleInventory();
      }
      break;
  }
});

window.addEventListener("keyup", (e) => {
  if (game.isPaused) return;
  switch (e.code) {
    case "KeyW": keys.w = false; break;
    case "KeyA": keys.a = false; break;
    case "KeyS": keys.s = false; break;
    case "KeyD": keys.d = false; break;
  }
});

// ============================================================
// Click Interaction
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const origColors = new Map();
const clickables = [character];

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickables, true);
  if (intersects.length === 0) return;
  let root = intersects[0].object;
  while (root.parent && !clickables.includes(root)) root = root.parent;
  if (!clickables.includes(root)) return;
  const paintRed = (obj) => {
    if (obj.isMesh && obj.material) {
      if (!origColors.has(obj)) origColors.set(obj, obj.material.color.getHex());
      obj.material.color.setHex(0xff0000);
    }
  };
  const restoreColor = (obj) => {
    if (obj.isMesh && obj.material && origColors.has(obj))
      obj.material.color.setHex(origColors.get(obj));
  };
  root.children.forEach(paintRed);
  setTimeout(() => root.children.forEach(restoreColor), 300);
});

// ============================================================
// Animation Loop
// ============================================================
const clock = new THREE.Clock();
const moveSpeed = 3;
const forwardVec = new THREE.Vector3();
const rightVec = new THREE.Vector3();
const moveDir = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

let fogTimer = 0;
let portalLabelTimer = 0;
let bossMusicPlaying = false;
let currentRegionId = "l1_village"; // 区域进入检测（当前层）

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // ── 暂停时：跳过全部逻辑，只渲染（画面不卡死） ──
  if (game.isPaused) {
    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);
    return;
  }

  // ── NPC 距离检测 ──
  const INTERACT_DIST = 2.5;
  let newClosest = null;
  let minDist = INTERACT_DIST;
  for (const npc of npcs) {
    const dist = character.position.distanceTo(npc.position);
    const label = npc.userData.label;
    if (dist < INTERACT_DIST) { label.visible = true; if (dist < minDist) { minDist = dist; newClosest = npc; } }
    else { label.visible = false; }
  }
  closestNPC = newClosest;

  // ── P0-1 — 动态雾效（每秒检查一次，不每帧更新） ──
  fogTimer += delta;
  if (fogTimer > 1.0) {
    updateFog();
    fogTimer = 0;
  }

  // ── P4-4 — 动态太阳旋转 ──
  sunAngle.value += delta * 0.105; // 360° / 60秒 ≈ 6°/秒 → 0.105 rad/s
  dirLight.position.x = Math.cos(sunAngle.value) * SUN_RADIUS;
  dirLight.position.z = Math.sin(sunAngle.value) * SUN_RADIUS;
  dirLight.position.y = SUN_HEIGHT + Math.sin(sunAngle.value) * 3; // 中午高、黄昏低

  // ── 层进入检测 ──
  const region = getRegionAt(character.position.x, character.position.z);
  if (region && region.id !== currentRegionId && !game.isPaused) {
    currentRegionId = region.id;
    if (region.layerId !== 1) { // 第一层进入不提示
      showAreaToast(region.id, region.name);
      triggerTeleportFlash();
      snapCameraToLayer(region.layerId);
    }
  }

  // ── P0-3 — 怪物 AI + 游走 + 动画（带 LOD） ──
  for (const m of monsters) {
    // 主动攻击 AI（史莱姆除外，第一层安全区不受伤）
    updateMonsterAI(m, delta, character.position, (dmg) => {
      // 第一层为安全区，不受伤
      if (Math.abs(character.position.x - L1) < 15) return;
      const actualDmg = Math.max(3, dmg - (game.player.defense || 0));
      game.player.hp -= actualDmg;
      refreshGameHUD();
      triggerHurtFlash();
      playHit();
      // 玩家死亡 → 重生
      if (game.player.hp <= 0) {
        respawnPlayer();
      }
    }, game.isPaused || isDialogueActive());

    const mDist = character.position.distanceTo(m.position);
    if (mDist < 20) {
      // 只在非追击/非返回状态时游走
      if (m.userData.aiState === "idle") {
        updateRoaming(m, delta);
      }
      animateMonster(m, delta);
    } else {
      // LOD: far monster - idle breathing only
      if (m.userData.isAlive) {
        m.position.y = 0.3 + Math.sin(Date.now() * 0.001) * 0.02;
      }
    }
    updateDeathAnimations(m, delta);
  }

  // ── P4-5 — 怪物头顶标签更新 ──
  updateMonsterLabels(character.position, monsters);

  // ── P3-1 — 传送门旋转 ──
  updatePortals(delta, elapsed);

  // ── P3-2 — Boss AI（含返回追击逻辑） ──
  const bossDist = boss.position.distanceTo(character.position);
  if (bossDist < 20 && isBossAlive()) {
    if (bossDist < 12) {
      if (!bossMusicPlaying) {
        startBossMusic();
        bossMusicPlaying = true;
      }
      showBossHpBar();
    }
    // 暂停/对话时仍更新 Boss（让它返回原位），但不攻击
    if (!game.isPaused && !isDialogueActive()) {
      updateBoss(delta, character.position, (atk) => {
        const dmg = Math.max(5, atk - (game.player.defense || 0));
        game.player.hp -= dmg;
        refreshGameHUD();
        triggerHurtFlash();
        playHit();
        if (game.player.hp <= 0) {
          respawnPlayer();
        }
      });
    }
  } else {
    if (bossMusicPlaying) {
      stopBossMusic();
      bossMusicPlaying = false;
    }
    hideBossHpBar();
  }

  // ── P3-2 — 粒子更新（Points粒子 + Boss死亡粒子） ──
  updateParticles(delta);
  updateBossParticles(delta, scene);

  // ── 定期刷新传送门标签（任务状态变化后更新） ──
  if (typeof refreshPortalLabels !== 'undefined') {
    portalLabelTimer += delta;
    if (portalLabelTimer > 2) {
      refreshPortalLabels();
      portalLabelTimer = 0;
    }
  }

  // ── 传送门检测（任务解锁层数） ──
  if (!isDialogueActive() && !game.isPaused) {
    const entered = checkPortal(character.position, character, triggerTeleportFlash, showAreaToast, (portalData) => {
      const completed = game.completedQuests || [];
      // 层数解锁：第三层需 q1，第四层需 q2，第五层需所有任务
      if (portalData.destX === L3 && !completed.includes("q1")) {
        showToast("🔒 需要先完成「初出茅庐」任务才能进入第三层！", "common");
        return null;
      }
      if (portalData.destX === L4 && !completed.includes("q2")) {
        showToast("🔒 需要先完成「森林危机」任务才能进入第四层！", "common");
        return null;
      }
      if (portalData.destX === L5 && !checkLightWallAccess()) {
        showLightWallWarning(scene);
        return null;
      }
      return portalData;
    });
    if (entered) {
      playTeleport();
      spawnTeleportParticles(character.position.clone());
      // 从目标X坐标确定层号
      const LAYER_X = [L1, L2, L3, L4, L5];
      const destLayer = LAYER_X.indexOf(entered.destX) + 1;
      snapCameraToLayer(destLayer || 1);
    }
  }

  // ── P3-2 — 光墙守卫：任务全部完成后移除 ──
  if (checkLightWallAccess() && getLightWall()) {
    removeLightWall(scene);
    scene.remove(wallLabel);
  }

  // ── 伤害数字更新 ──
  updateDamageLabels(delta);

  // ── P1-2 — 掉落物拾取 + 动画 ──
  checkPickups(character.position, scene);
  updateDrops(delta, scene);

  // ── 对话/商店中 → 跳过移动 ──
  if (!isDialogueActive() && !shopOpen) {
    camera.getWorldDirection(forwardVec);
    forwardVec.y = 0; forwardVec.normalize();
    rightVec.crossVectors(forwardVec, camera.up).normalize();

    moveDir.set(0, 0, 0);
    if (keys.w) moveDir.add(forwardVec);
    if (keys.s) moveDir.sub(forwardVec);
    if (keys.a) moveDir.sub(rightVec);
    if (keys.d) moveDir.add(rightVec);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      character.position.x += moveDir.x * moveSpeed * delta;
      character.position.z += moveDir.z * moveSpeed * delta;

      // 限制在层平台范围内（圆形边界）
      const region = getRegionAt(character.position.x, character.position.z);
      if (region) {
        const dx = character.position.x - region.centerX;
        const dz = character.position.z - 0;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > LAYER_RADIUS) {
          character.position.x = region.centerX + (dx / dist) * LAYER_RADIUS;
          character.position.z = (dz / dist) * LAYER_RADIUS;
        }
      }

      game.player.pos.x = character.position.x;
      game.player.pos.z = character.position.z;
      lookTarget.set(
        character.position.x + moveDir.x, character.position.y,
        character.position.z + moveDir.z,
      );
      character.lookAt(lookTarget);
    }

    const isMoving = keys.w || keys.a || keys.s || keys.d;
    if (!isMoving) {
      character.position.y = Math.sin(elapsed * 2) * 0.03;
      character.rotation.z = Math.sin(elapsed * 1.5) * 0.015;
    } else { character.rotation.z = 0; }
  }

  // ── P4-3 — 小地图绘制 ──
  drawMinimap(character.position, monsters, npcs, portals, boss);

  // ── P4-4 — 花瓣更新 ──
  updatePetals(delta);

  // ── 相机跟随角色（同步移动相机位置，保持视角不变） ──
  const trackSpeed = 0.06;
  const tgtX = controls.target.x + (character.position.x - controls.target.x) * trackSpeed;
  const tgtZ = controls.target.z + (character.position.z - controls.target.z) * trackSpeed;
  camera.position.x += tgtX - controls.target.x;
  camera.position.z += tgtZ - controls.target.z;
  controls.target.x = tgtX;
  controls.target.z = tgtZ;

  controls.update();
  composer.render();
  labelRenderer.render(scene, camera);
}
animate();

// ============================================================
// Window Resize
// ============================================================
window.addEventListener("resize", () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);
});
