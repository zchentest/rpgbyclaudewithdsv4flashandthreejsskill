import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ===== 共享配色 =====
const SKIN = 0xffccaa;
const HAIR = 0x4a3728;
const WHITE = 0xffffff;
const PUPIL = 0x222222;
const MOUTH = 0xcc6666;

// ============================================================
// B1 — 创建可定制 NPC
// ============================================================
export function createNPC({
  clothesColor = 0x4488cc,
  hatColor = HAIR,
  beltColor = 0xcc9944,
  shoesColor = 0x663333,
  hatPomColor = 0xffffff,
  labelText = "按 E 对话",
  name = "NPC",
  dialogues = ["..."],
}) {
  const group = new THREE.Group();
  group.userData = { name, dialogues, isNPC: true };

  // ── 头部 ──
  const headGeo = new THREE.SphereGeometry(0.4, 24, 24);
  const headMat = new THREE.MeshToonMaterial({ color: SKIN });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.25;
  head.castShadow = true;
  group.add(head);

  // ── 帽子/头发 ──
  const hatGeo = new THREE.SphereGeometry(0.42, 20, 20);
  hatGeo.scale(1, 0.35, 1);
  const hatMat = new THREE.MeshToonMaterial({ color: hatColor });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.set(0, 1.58, 0);
  hat.castShadow = true;
  group.add(hat);

  // 帽檐
  const brimGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.06, 20);
  const brimMat = new THREE.MeshToonMaterial({ color: hatColor });
  const brim = new THREE.Mesh(brimGeo, brimMat);
  brim.position.set(0, 1.38, 0);
  brim.castShadow = true;
  group.add(brim);

  // 帽顶小球
  const pomGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const pomMat = new THREE.MeshToonMaterial({ color: hatPomColor });
  const pom = new THREE.Mesh(pomGeo, pomMat);
  pom.position.set(0, 1.72, -0.3);
  group.add(pom);

  // ── 眼睛 ──
  const eyeGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const eyeMat = new THREE.MeshToonMaterial({ color: WHITE });
  const lEye = new THREE.Mesh(eyeGeo, eyeMat);
  lEye.position.set(-0.16, 1.30, 0.38);
  group.add(lEye);
  const rEye = new THREE.Mesh(eyeGeo, eyeMat);
  rEye.position.set(0.16, 1.30, 0.38);
  group.add(rEye);

  // 瞳孔
  const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const pupilMat = new THREE.MeshToonMaterial({ color: PUPIL });
  const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
  lPupil.position.set(-0.16, 1.29, 0.44);
  group.add(lPupil);
  const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rPupil.position.set(0.16, 1.29, 0.44);
  group.add(rPupil);

  // ── 嘴巴 ──
  const mouthGeo = new THREE.TorusGeometry(0.06, 0.018, 6, 10, Math.PI);
  const mouthMat = new THREE.MeshToonMaterial({ color: MOUTH });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 1.18, 0.40);
  mouth.rotation.x = Math.PI / 2;
  group.add(mouth);

  // ── 身体 ──
  const bodyGeo = new THREE.CapsuleGeometry(0.30, 0.35, 8, 12);
  const bodyMat = new THREE.MeshToonMaterial({ color: clothesColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.70;
  body.castShadow = true;
  group.add(body);

  // ── 腰带 ──
  const beltGeo = new THREE.TorusGeometry(0.30, 0.04, 6, 16);
  const beltMat = new THREE.MeshToonMaterial({ color: beltColor });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.52;
  belt.rotation.x = Math.PI / 2;
  group.add(belt);

  // ── 双臂 ──
  const armGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.40, 8);
  const armMat = new THREE.MeshToonMaterial({ color: SKIN });
  const lArm = new THREE.Mesh(armGeo, armMat);
  lArm.position.set(-0.38, 0.80, 0);
  lArm.rotation.z = 0.25;
  lArm.castShadow = true;
  group.add(lArm);
  const rArm = new THREE.Mesh(armGeo, armMat);
  rArm.position.set(0.38, 0.80, 0);
  rArm.rotation.z = -0.25;
  rArm.castShadow = true;
  group.add(rArm);

  // ── 双腿 ──
  const legGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8);
  const legMat = new THREE.MeshToonMaterial({ color: clothesColor });
  const lLeg = new THREE.Mesh(legGeo, legMat);
  lLeg.position.set(-0.13, 0.27, 0);
  lLeg.castShadow = true;
  group.add(lLeg);
  const rLeg = new THREE.Mesh(legGeo, legMat);
  rLeg.position.set(0.13, 0.27, 0);
  rLeg.castShadow = true;
  group.add(rLeg);

  // ── 鞋子 ──
  const shoeGeo = new THREE.SphereGeometry(0.09, 8, 8);
  shoeGeo.scale(1, 0.6, 1.3);
  const shoeMat = new THREE.MeshToonMaterial({ color: shoesColor });
  const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
  lShoe.position.set(-0.13, 0.06, 0.04);
  lShoe.castShadow = true;
  group.add(lShoe);
  const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rShoe.position.set(0.13, 0.06, 0.04);
  rShoe.castShadow = true;
  group.add(rShoe);

  // ── B2 — 头顶交互提示标签（CSS2DObject） ──
  const labelDiv = document.createElement("div");
  labelDiv.textContent = labelText;
  labelDiv.style.cssText = `
    background: rgba(0,0,0,0.75);
    color: #fff;
    padding: 6px 16px;
    border-radius: 12px;
    font-size: 18px;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    pointer-events: none;
    white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.3);
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    transition: opacity 0.3s;
  `;
  const label = new CSS2DObject(labelDiv);
  label.position.y = 2.25; // 头顶上方
  label.visible = false;
  group.add(label);

  // 在 userData 中存标签引用方便外部控制
  group.userData.label = label;

  // ── NPC 名称标签（始终可见） ──
  const nameDiv = document.createElement("div");
  nameDiv.textContent = name;
  nameDiv.style.cssText = `
    color: #ffffff;
    font-size: 16px;
    font-weight: bold;
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    text-shadow: 0 1px 6px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.5);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    background: rgba(0,0,0,0.4);
    padding: 2px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.15);
  `;
  const nameLabel = new CSS2DObject(nameDiv);
  nameLabel.position.y = 2.7; // 在交互标签上方
  group.add(nameLabel);

  return group;
}

// ============================================================
// B1 — 预配置 NPC 数据
// ============================================================

/** NPC1: 杂货商（绿衣，站房屋门口） */
export function createMerchant() {
  return createNPC({
    clothesColor: 0x44aa66,
    hatColor: 0x5a4a2a,
    beltColor: 0xcc8844,
    shoesColor: 0x553322,
    hatPomColor: 0xffdd44,
    name: "杂货商",
    dialogues: [
      "欢迎光临！本店有上等的药草和冒险道具。",
      "最近森林里不太平静，进山要小心啊。",
      "瞧你这一身装备…是新来的冒险者吧？",
      "下次光顾给你算便宜点，嘿嘿。",
    ],
  });
}

/** NPC2: 旅人（粉丝，站树下） */
export function createVillager() {
  return createNPC({
    clothesColor: 0xff88aa,
    hatColor: 0xccaacc,
    beltColor: 0xaa7755,
    shoesColor: 0x885566,
    hatPomColor: 0xffffff,
    name: "旅人",
    dialogues: [
      "你好呀！这附近的风景真不错。",
      "那边有座日式小屋，住着一位和蔼的老奶奶。",
      "听说东边的森林里有一片会发光的湖。",
      "如果你打算走远路，带够干粮哦！",
    ],
  });
}



/** NPC3: 村长（白色衣服，任务发布者） */
export function createChief() {
    const npc = createNPC({
      clothesColor: 0xeeeeee,
      hatColor: 0xddccaa,
      beltColor: 0xcc8844,
      shoesColor: 0x553322,
      hatPomColor: 0xffee88,
      labelText: "按 E 对话",
      name: "村长",
      dialogues: [
        "年轻人，你来得正好。",
        "村庄最近饱受怪物侵扰，需要你的帮助。",
        "去消灭那些怪物，我会给你丰厚的报酬。",
      ],
    });
    npc.userData.isQuestGiver = true;
    npc.userData.quests = ["q1", "q2", "q3"];
    return npc;
}
