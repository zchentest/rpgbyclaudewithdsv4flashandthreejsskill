import * as THREE from "three";
import { LAYER_DATA, LAYER_RADIUS } from "./regions.js";

// ============================================================
// 多层塔式地图 — 地面 + 装饰
// ============================================================

const Y_GROUND = -0.5;

/**
 * 创建所有5层的地面圆盘
 */
export function createWorldGrounds(scene) {
  for (const layer of LAYER_DATA) {
    const geo = new THREE.CircleGeometry(LAYER_RADIUS, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: layer.groundColor,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(layer.centerX, Y_GROUND, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

// ============================================================
// 装饰物工厂函数
// ============================================================

export function createTree() {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.1; trunk.castShadow = true; group.add(trunk);

  const canopyColors = [0x3a8c3a, 0x4ca64c, 0x5cb85c];
  for (let i = 0; i < 3; i++) {
    const r = 1.2 - i * 0.25;
    const h = 0.9 - i * 0.15;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 8),
      new THREE.MeshStandardMaterial({ color: canopyColors[i], roughness: 0.8 }),
    );
    cone.position.y = 0.7 + i * 0.5; cone.castShadow = true;
    group.add(cone);
  }
  return group;
}

export function createDeadTree() {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.9, 6), trunkMat);
  trunk.position.y = 0.05; trunk.castShadow = true; group.add(trunk);

  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 }),
    );
    branch.position.set(
      Math.cos((i * Math.PI * 2) / 3) * 0.2,
      0.5 + Math.random() * 0.3,
      Math.sin((i * Math.PI * 2) / 3) * 0.2,
    );
    branch.rotation.z = 0.5; branch.rotation.y = (i * Math.PI * 2) / 3;
    group.add(branch);
  }
  return group;
}

export function createRock() {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3),
    new THREE.MeshStandardMaterial({ color: 0x887766, roughness: 0.9, metalness: 0.1 }),
  );
  rock.position.y = -0.3;
  rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  rock.castShadow = true; rock.receiveShadow = true;
  group.add(rock);
  return group;
}

export function createCrystal() {
  const group = new THREE.Group();
  const crystal = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff2222, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.2 }),
  );
  crystal.position.y = -0.2; crystal.castShadow = true; group.add(crystal);

  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 5),
      new THREE.MeshStandardMaterial({ color: 0xff5544, emissive: 0xff2222, emissiveIntensity: 0.3, roughness: 0.3 }),
    );
    s.position.set((Math.random() - 0.5) * 0.3, -0.35, (Math.random() - 0.5) * 0.3);
    s.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(s);
  }
  return group;
}

export function createHouse() {
  const group = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.2, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.8 }),
  );
  walls.position.y = 0.1; walls.castShadow = true; walls.receiveShadow = true;
  group.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 0.7, 4),
    new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.7 }),
  );
  roof.position.y = 0.65; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 }),
  );
  door.position.set(0, -0.05, 0.901);
  group.add(door);
  return group;
}

// ============================================================
// 暗色柱子（王座层用）
// ============================================================
function createDarkPillar() {
  const group = new THREE.Group();
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.9, metalness: 0.3 }),
  );
  pillar.position.y = -0.1; pillar.castShadow = true;
  group.add(pillar);
  return group;
}

// ============================================================
// 路标（指向上行传送门）
// ============================================================
export function createSignpost(layerCenterX) {
  const group = new THREE.Group();

  // 柱子
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.9 }),
  );
  pole.position.y = 0.1; pole.castShadow = true;
  group.add(pole);

  // 箭头牌
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xccaa44, emissive: 0xccaa44, emissiveIntensity: 0.2 }),
  );
  sign.position.set(0.3, 0.7, 0);
  sign.rotation.y = -Math.PI / 2;
  group.add(sign);

  // 箭头指向
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.15, 4),
    new THREE.MeshStandardMaterial({ color: 0x44ff44, emissive: 0x44ff44, emissiveIntensity: 0.3 }),
  );
  arrow.position.set(0.6, 0.7, 0);
  arrow.rotation.z = -Math.PI / 2;
  group.add(arrow);

  group.position.set(layerCenterX + 8, 0, 4);
  return group;
}

// ============================================================
// 生成所有环境的装饰
// ============================================================
export function createDecorations(scene) {
  // ── 第一层：新手村 ──
  const L1 = 0;
  // 几棵树 + 小屋
  const villageTrees = [[-4, -3], [5, 4], [-6, -6], [-2, 6], [7, -2]];
  villageTrees.forEach(([x, z]) => {
    const tree = createTree();
    tree.position.set(L1 + x, 0, z);
    scene.add(tree);
  });
  const house = createHouse();
  house.position.set(L1 + 3, 0, -2);
  scene.add(house);

  // ── 第二层：草原森林 ──
  const L2 = 35;
  for (let i = 0; i < 20; i++) {
    const tree = createTree();
    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 11;
    tree.position.set(L2 + Math.cos(angle) * r, 0, Math.sin(angle) * r);
    tree.scale.setScalar(0.7 + Math.random() * 0.6);
    scene.add(tree);
  }

  // ── 第三层：荒芜山谷 ──
  const L3 = 70;
  for (let i = 0; i < 8; i++) {
    const dt = createDeadTree();
    const angle = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 11;
    dt.position.set(L3 + Math.cos(angle) * r, 0, Math.sin(angle) * r);
    scene.add(dt);
  }
  for (let i = 0; i < 10; i++) {
    const rock = createRock();
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 12;
    rock.position.set(L3 + Math.cos(angle) * r, 0, Math.sin(angle) * r);
    scene.add(rock);
  }

  // ── 第四层：火焰洞穴 ──
  const L4 = 105;
  for (let i = 0; i < 8; i++) {
    const crystal = createCrystal();
    const angle = Math.random() * Math.PI * 2;
    const r = 1 + Math.random() * 12;
    crystal.position.set(L4 + Math.cos(angle) * r, 0, Math.sin(angle) * r);
    scene.add(crystal);
  }

  // ── 第五层：最终王座 ──
  const L5 = 140;
  for (let i = 0; i < 4; i++) {
    const pillar = createDarkPillar();
    const angle = (i / 4) * Math.PI * 2;
    pillar.position.set(L5 + Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
    scene.add(pillar);
  }
}
