import * as THREE from "three";

// ============================================================
// P4-2 — 粒子特效系统（THREE.Points）
// ============================================================

const MAX_PARTICLES = 500;
const positions = new Float32Array(MAX_PARTICLES * 3);
const colors = new Float32Array(MAX_PARTICLES * 3);
const sizes = new Float32Array(MAX_PARTICLES);
const velos = [];
const lifetimes = [];
let activeCount = 0;

let geometry = null;
let material = null;
let points = null;
let initialized = false;

function init(scene) {
  if (initialized) return;
  geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  initialized = true;
}

/** 添加粒子 */
function addParticle(pos, vel, color, size = 0.15, lifetime = 0.5) {
  if (activeCount >= MAX_PARTICLES) return;
  const i = activeCount;
  positions[i * 3] = pos.x;
  positions[i * 3 + 1] = pos.y;
  positions[i * 3 + 2] = pos.z;
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
  sizes[i] = size;
  velos[i] = vel;
  lifetimes[i] = lifetime;
  activeCount++;
}

/** 更新所有粒子 */
export function updateParticles(delta) {
  if (!initialized || activeCount === 0) return;

  for (let i = activeCount - 1; i >= 0; i--) {
    lifetimes[i] -= delta;
    if (lifetimes[i] <= 0) {
      // 移除：将最后一个粒子移到当前位置
      if (i < activeCount - 1) {
        const last = activeCount - 1;
        positions[i * 3] = positions[last * 3];
        positions[i * 3 + 1] = positions[last * 3 + 1];
        positions[i * 3 + 2] = positions[last * 3 + 2];
        colors[i * 3] = colors[last * 3];
        colors[i * 3 + 1] = colors[last * 3 + 1];
        colors[i * 3 + 2] = colors[last * 3 + 2];
        sizes[i] = sizes[last];
        velos[i] = velos[last];
        lifetimes[i] = lifetimes[last];
      }
      activeCount--;
      continue;
    }

    velos[i].y -= 3 * delta; // 重力
    positions[i * 3] += velos[i].x * delta;
    positions[i * 3 + 1] += velos[i].y * delta;
    positions[i * 3 + 2] += velos[i].z * delta;
    sizes[i] *= (1 - delta * 0.5); // 缩小
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
  material.opacity = 1;
}

// ============================================================
// 特效函数
// ============================================================

let sceneRef = null;

export function initParticleSystem(scene) {
  sceneRef = scene;
  init(scene);
}

/** 攻击命中粒子 */
export function spawnHitParticles(position) {
  const cols = [
    new THREE.Color(0xff4444),
    new THREE.Color(0xff8844),
    new THREE.Color(0xffcc44),
  ];
  for (let i = 0; i < 10; i++) {
    const pos = position.clone();
    pos.x += (Math.random() - 0.5) * 0.3;
    pos.y += (Math.random() - 0.5) * 0.3 + 0.5;
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      Math.random() * 3 + 1,
      (Math.random() - 0.5) * 4,
    );
    addParticle(pos, vel, cols[Math.floor(Math.random() * 3)], 0.12, 0.4);
  }
}

/** 升级烟花 */
export function spawnLevelUpParticles(position) {
  const cols = [
    new THREE.Color(0xff4444), new THREE.Color(0xff8844),
    new THREE.Color(0xffcc44), new THREE.Color(0x44ddff),
    new THREE.Color(0x44ff88),
  ];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const pos = position.clone();
    pos.y += 0.3;
    const vel = new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.random() * 4 + 2,
      Math.sin(angle) * speed,
    );
    addParticle(pos, vel, cols[Math.floor(Math.random() * cols.length)], 0.1 + Math.random() * 0.1, 0.8 + Math.random() * 0.4);
  }
}

/** 传送炫光（螺旋） */
export function spawnTeleportParticles(position) {
  const cols = [
    new THREE.Color(0x44ddff), new THREE.Color(0x8888ff), new THREE.Color(0xffffff),
  ];
  for (let i = 0; i < 20; i++) {
    const t = i / 20;
    const angle = t * Math.PI * 6;
    const r = 0.5 + t * 0.5;
    const pos = position.clone();
    pos.x += Math.cos(angle) * r;
    pos.z += Math.sin(angle) * r;
    pos.y += t * 1.0;
    const vel = new THREE.Vector3(
      Math.cos(angle) * 0.5,
      1.5,
      Math.sin(angle) * 0.5,
    );
    addParticle(pos, vel, cols[Math.floor(Math.random() * cols.length)], 0.15, 0.5);
  }
}

/** Boss 死亡爆炸 */
export function spawnBossDeathParticles(position) {
  const cols = [
    new THREE.Color(0x222222), new THREE.Color(0x441144),
    new THREE.Color(0x8833aa), new THREE.Color(0xffffff),
  ];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const pitch = (Math.random() - 0.5) * Math.PI;
    const speed = 2 + Math.random() * 5;
    const pos = position.clone();
    const vel = new THREE.Vector3(
      Math.cos(angle) * Math.cos(pitch) * speed,
      Math.sin(pitch) * speed + 1,
      Math.sin(angle) * Math.cos(pitch) * speed,
    );
    addParticle(pos, vel, cols[Math.floor(Math.random() * cols.length)], 0.2 + Math.random() * 0.2, 0.8 + Math.random() * 0.6);
  }
}

// ============================================================
// 飘落花瓣（独立系统，始终运行）
// ============================================================

const petalPositions = new Float32Array(60 * 3);
const petalVelos = [];
const petalRotations = [];
let petalMesh = null;
let petalGeometry = null;
let petalMaterial = null;
let petalActive = false;

export function startPetals(scene) {
  if (petalActive) return;
  petalActive = true;

  petalGeometry = new THREE.BufferGeometry();
  const pos = new Float32Array(60 * 3);
  for (let i = 0; i < 60; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = Math.random() * 15;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    petalVelos.push({
      x: (Math.random() - 0.5) * 0.3,
      y: -(0.3 + Math.random() * 0.4),
      z: (Math.random() - 0.5) * 0.3,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
    });
  }
  petalGeometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  // 用纹理或简单形状 - 使用 PointsMaterial 带圆形贴图
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffaacc";
  ctx.beginPath();
  ctx.arc(8, 8, 6, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  petalMaterial = new THREE.PointsMaterial({
    size: 0.25,
    map: texture,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  petalMesh = new THREE.Points(petalGeometry, petalMaterial);
  petalMesh.frustumCulled = false;
  scene.add(petalMesh);
}

export function updatePetals(delta) {
  if (!petalActive || !petalMesh) return;
  const pos = petalGeometry.attributes.position.array;
  for (let i = 0; i < 60; i++) {
    const v = petalVelos[i];
    pos[i * 3] += v.x * delta;
    pos[i * 3 + 1] += v.y * delta;
    pos[i * 3 + 2] += v.z * delta;
    v.rot += v.rotSpeed * delta;

    // 重置到底部
    if (pos[i * 3 + 1] < -1) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = 14 + Math.random() * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
  }
  petalGeometry.attributes.position.needsUpdate = true;
}
