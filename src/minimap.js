// ============================================================
// P4-3 — 小地图（Canvas 2D，右上角）
// ============================================================

import { LAYER_DATA, LAYER_RADIUS } from "./regions.js";

const RADIUS = 100;
const SCALE = 30; // world units visible from center to edge

let canvas = null;
let ctx = null;
let visible = true;
let frameCount = 0;

export function isMinimapVisible() { return visible; }
export function toggleMinimap() { visible = !visible; if (canvas) canvas.style.display = visible ? "block" : "none"; }

export function setupMinimap() {
  if (canvas) return;

  canvas = document.createElement("canvas");
  canvas.id = "game-minimap";
  canvas.width = RADIUS * 2;
  canvas.height = RADIUS * 2;
  canvas.style.cssText = `
    position: fixed; top: 8px; right: 8px;
    z-index: 996; border-radius: 50%;
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
    pointer-events: none;
  `;
  ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
}

// 每 5 帧才更新
export function drawMinimap(playerPos, monsters, npcs, portals, boss) {
  if (!visible || !ctx) return;

  frameCount++;
  if (frameCount % 5 !== 0) return;

  const cx = RADIUS;
  const cy = RADIUS;

  // 清空
  ctx.clearRect(0, 0, RADIUS * 2, RADIUS * 2);

  // 圆形容器
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS - 2, 0, Math.PI * 2);
  ctx.clip();

  // 背景
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, RADIUS * 2, RADIUS * 2);

  const px = playerPos.x;
  const pz = playerPos.z;
  const s = SCALE;

  // ── 区域 ──
  for (const region of LAYER_DATA) {
    const rx = cx + (region.centerX - px) / s * RADIUS;
    const ry = cy + (0 - pz) / s * RADIUS;
    const r = LAYER_RADIUS / s * RADIUS;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.max(r, 4), 0, Math.PI * 2);
    const color = hexToRGBA(region.groundColor, 0.25);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = hexToRGBA(region.groundColor, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── 传送门（绿点） ──
  if (portals) {
    for (const p of portals) {
      const dx = cx + (p.position.x - px) / s * RADIUS;
      const dy = cy + (p.position.z - pz) / s * RADIUS;
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#44ff44";
      ctx.fill();
    }
  }

  // ── Boss（大紫点） ──
  if (boss && boss.userData.isAlive) {
    const bx = cx + (boss.position.x - px) / s * RADIUS;
    const by = cy + (boss.position.z - pz) / s * RADIUS;
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#cc44ff";
    ctx.fill();
    ctx.strokeStyle = "#ff44ff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── 怪物（小红点） ──
  if (monsters) {
    for (const m of monsters) {
      if (!m.userData.isAlive) continue;
      const mx = cx + (m.position.x - px) / s * RADIUS;
      const my = cy + (m.position.z - pz) / s * RADIUS;
      if (mx < 0 || mx > RADIUS * 2 || my < 0 || my > RADIUS * 2) continue;
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.fill();
    }
  }

  // ── NPC（小蓝点） ──
  if (npcs) {
    for (const n of npcs) {
      const nx = cx + (n.position.x - px) / s * RADIUS;
      const ny = cy + (n.position.z - pz) / s * RADIUS;
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#4488ff";
      ctx.fill();
    }
  }

  // ── 玩家中心（闪烁白点） ──
  const pulse = 1 + Math.sin(Date.now() / 300) * 0.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 5 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  // 边框圆圈
  ctx.beginPath();
  ctx.arc(cx, cy, RADIUS - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function hexToRGBA(hex, a) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r},${g},${b},${a})`;
}
