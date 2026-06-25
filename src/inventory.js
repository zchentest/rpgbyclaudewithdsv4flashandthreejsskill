import { EQUIPMENT, getItem, SET_BONUSES, RARITY, formatStats } from "./equipment.js";

// ============================================================
// P1-3 — 背包系统 + 装备栏 + 属性计算
// ============================================================

// ── 背包：itemId → { item, quantity, roll } ──
const inventory = new Map();

// ── 已装备栏 ──
const equipped = {
  weapon: null,    // itemId
  armor: null,
  accessory: null,
};
const equippedRolls = {}; // weapon → { atkBonus?, defBonus?, hpBonus? }

// ── 状态变更回调 ──
let onChangeCallback = null;

export function onInventoryChange(callback) {
  onChangeCallback = callback;
}

function notifyChange() {
  if (onChangeCallback) onChangeCallback(getStats());
}

// ============================================================
// 背包操作
// ============================================================

/** 添加物品到背包，可附带随机属性 */
export function addItem(itemId, roll = null) {
  if (!getItem(itemId)) return false;
  if (inventory.has(itemId)) return false;
  inventory.set(itemId, { item: getItem(itemId), quantity: 1, roll });
  notifyChange();
  return true;
}

/** 从背包移除物品 */
export function removeItem(itemId) {
  if (!inventory.has(itemId)) return false;
  inventory.delete(itemId);
  notifyChange();
  return true;
}

/** 获取背包内容 */
export function getInventory() {
  return inventory;
}

/** 检查是否拥有物品 */
export function hasItem(itemId) {
  return inventory.has(itemId);
}

/** 获取物品的随机属性roll */
export function getItemRoll(itemId) {
  const entry = inventory.get(itemId);
  return entry ? (entry.roll || {}) : {};
}

// ============================================================
// 装备操作
// ============================================================

/** 装备物品（直接装备，跳过确认） */
export function equipItem(itemId) {
  return doEquip(itemId);
}

function doEquip(itemId) {
  if (!inventory.has(itemId)) return false;
  const entry = inventory.get(itemId);
  const item = entry.item;
  if (!item) return false;

  const slot = item.type;
  const oldItemId = equipped[slot];
  const newRoll = entry.roll || {};

  // 先从背包移除新物品
  inventory.delete(itemId);

  // 再将旧装备放回背包（保留roll）
  if (oldItemId) {
    const oldRoll = equippedRolls[slot] || {};
    equipped[slot] = null;
    delete equippedRolls[slot];
    if (!inventory.has(oldItemId)) {
      inventory.set(oldItemId, { item: getItem(oldItemId), quantity: 1, roll: oldRoll });
    }
  }

  // 装备新物品
  equipped[slot] = itemId;
  equippedRolls[slot] = newRoll;
  notifyChange();
  return true;
}

/** 卸下装备（放回背包，保留roll） */
export function unequipItem(slot) {
  if (!equipped[slot]) return false;
  const itemId = equipped[slot];
  const roll = equippedRolls[slot] || {};
  equipped[slot] = null;
  delete equippedRolls[slot];
  if (!inventory.has(itemId)) {
    inventory.set(itemId, { item: getItem(itemId), quantity: 1, roll });
  }
  notifyChange();
  return true;
}

/** 获取当前装备（返回 { slot: itemId }） */
export function getEquipped() {
  return { ...equipped };
}

/** 检查是否装备了某物品 */
export function hasEquipped(itemId) {
  return equipped.weapon === itemId ||
         equipped.armor === itemId ||
         equipped.accessory === itemId;
}

/** 装备时显示对比确认（返回 Promise<boolean>） */
export function showEquipComparison(itemId) {
  return new Promise((resolve) => {
    const entry = inventory.get(itemId);
    if (!entry) { resolve(false); return; }
    const item = entry.item;
    if (!item) { resolve(false); return; }

    const slot = item.type;
    const newRoll = entry.roll || {};
    const oldItemId = equipped[slot];
    const oldRoll = oldItemId ? (equippedRolls[slot] || {}) : null;
    const oldItem = oldItemId ? getItem(oldItemId) : null;

    const diff = (newVal, oldVal) => {
      if (oldVal === undefined || oldVal === null) return '';
      const d = (newVal || 0) - (oldVal || 0);
      if (d > 0) return `<span style="color:#44dd44;"> ↑+${d}</span>`;
      if (d < 0) return `<span style="color:#ff6644;"> ↓${d}</span>`;
      return '';
    };

    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:6000;display:flex;justify-content:center;align-items:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);font-family:'Segoe UI','Noto Sans JP',sans-serif;user-select:none;`;

    overlay.innerHTML = `
      <div style="background:rgba(15,15,40,0.97);border:2px solid rgba(255,204,68,0.25);border-radius:20px;padding:32px 36px;min-width:400px;max-width:480px;box-shadow:0 20px 80px rgba(0,0,0,0.6);color:#eee;">
        <div style="font-size:20px;color:#ffcc44;font-weight:bold;margin-bottom:20px;text-align:center;">⚔️ 装备对比</div>
        ${oldItem ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding:12px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border-left:4px solid ${RARITY[oldItem.rarity]?.color || '#555'};">
            <div><span style="font-size:24px;">${oldItem.emoji}</span> <span style="font-size:15px;">${oldItem.name}</span></div>
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">${formatStats(oldRoll)}</div>
          </div>
        ` : '<div style="text-align:center;color:rgba(255,255,255,0.3);margin-bottom:14px;padding:12px;">当前槽位：空</div>'}
        <div style="text-align:center;font-size:22px;margin:6px 0;color:rgba(255,255,255,0.2);">↓</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;padding:12px 16px;background:rgba(255,255,255,0.06);border-radius:12px;border-left:4px solid ${RARITY[item.rarity]?.color || '#555'};">
          <div><span style="font-size:24px;">${item.emoji}</span> <span style="font-size:15px;color:#fff;">${item.name}</span></div>
          <div style="font-size:13px;">
            ${(() => {
              const s = [];
              if (newRoll.atkBonus !== undefined) s.push(`⚔️+${newRoll.atkBonus}${diff(newRoll.atkBonus, oldRoll?.atkBonus)}`);
              if (newRoll.defBonus !== undefined) s.push(`🛡️+${newRoll.defBonus}${diff(newRoll.defBonus, oldRoll?.defBonus)}`);
              if (newRoll.hpBonus !== undefined) s.push(`❤️+${newRoll.hpBonus}${diff(newRoll.hpBonus, oldRoll?.hpBonus)}`);
              return s.join(' ') || '—';
            })()}
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button id="cmp-cancel" style="flex:1;padding:12px;font-size:15px;font-family:inherit;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);cursor:pointer;">取消</button>
          <button id="cmp-confirm" style="flex:1;padding:12px;font-size:15px;font-family:inherit;border:1px solid #ffcc44;border-radius:10px;background:rgba(255,204,68,0.15);color:#ffcc44;cursor:pointer;font-weight:bold;">确认装备</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById("cmp-confirm").addEventListener("click", () => { overlay.remove(); resolve(true); });
    document.getElementById("cmp-cancel").addEventListener("click", () => { overlay.remove(); resolve(false); });
  });
}

// ============================================================
// 属性计算（含套装）
// ============================================================

export function getStats() {
  let atkBonus = 0, defBonus = 0, hpBonus = 0;
  const activeSetBonuses = [];

  for (const slot of ["weapon", "armor", "accessory"]) {
    const itemId = equipped[slot];
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item) continue;
    const roll = equippedRolls[slot] || {};
    atkBonus += roll.atkBonus ?? item.atkBonus ?? 0;
    defBonus += roll.defBonus ?? item.defBonus ?? 0;
    hpBonus += roll.hpBonus ?? item.hpBonus ?? 0;
  }

  // 套装检测
  const equippedSet = new Set(
    Object.values(equipped).filter(Boolean)
  );
  for (const set of SET_BONUSES) {
    const hasAll = set.requires.every((id) => equippedSet.has(id));
    if (hasAll) {
      atkBonus += set.bonus.atkBonus || 0;
      defBonus += set.bonus.defBonus || 0;
      hpBonus += set.bonus.hpBonus || 0;
      activeSetBonuses.push(set);
    }
  }

  return { atkBonus, defBonus, hpBonus, activeSetBonuses };
}

// ============================================================
// 背包 UI
// ============================================================

let panelEl = null;
let isOpen = false;

export function isInventoryOpen() {
  return isOpen;
}

export function toggleInventory() {
  if (isOpen) { closeInventory(); }
  else { openInventory(); }
}

export function openInventory() {
  if (isOpen) return;
  isOpen = true;
  renderPanel();
  if (panelEl) panelEl.style.display = "flex";
}

export function closeInventory() {
  isOpen = false;
  if (panelEl) panelEl.style.display = "none";
}

function renderPanel() {
  if (!panelEl) createPanelDOM();
  updatePanelContent();
}

function createPanelDOM() {
  panelEl = document.createElement("div");
  panelEl.id = "inventory-panel";
  panelEl.style.cssText = `
    position: fixed;
    top: 0; right: 0;
    width: 620px;
    height: 100%;
    z-index: 1500;
    background: rgba(10, 10, 30, 0.92);
    backdrop-filter: blur(8px);
    border-left: 1px solid rgba(255,255,255,0.1);
    font-family: 'Segoe UI', 'Noto Sans JP', sans-serif;
    color: #ddd;
    display: none;
    flex-direction: column;
    padding: 40px 36px;
    box-sizing: border-box;
    box-shadow: -10px 0 40px rgba(0,0,0,0.4);
    overflow-y: auto;
    user-select: none;
  `;

  panelEl.innerHTML = `
    <div style="
      font-size: 16px;
      color: #ffcc44;
      font-weight: bold;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span>🎒 背包</span>
      <span style="font-size: 18px; cursor: pointer; color: rgba(255,255,255,0.4);" id="inv-close">✕</span>
    </div>

    <div id="inv-slots" style="
      display: flex;
      gap: 20px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    "></div>

    <div style="
      font-size: 18px;
      margin-bottom: 20px;
      color: rgba(255,255,255,0.6);
    ">📦 物品列表</div>
    <div id="inv-list" style="
      flex: 1;
      overflow-y: auto;
    "></div>
  `;

  document.body.appendChild(panelEl);
  document.getElementById("inv-close").addEventListener("click", closeInventory);
}

function updatePanelContent() {
  if (!panelEl) return;

  // ── 装备槽 ──
  const slotsEl = document.getElementById("inv-slots");
  const slotDefs = [
    { key: "weapon", label: "⚔️ 武器" },
    { key: "armor", label: "🛡️ 防具" },
    { key: "accessory", label: "💍 饰品" },
  ];

  slotsEl.innerHTML = slotDefs
    .map(({ key, label }) => {
      const itemId = equipped[key];
      const item = itemId ? getItem(itemId) : null;
      const roll = itemId ? (equippedRolls[key] || {}) : null;
      const rarityColor = item ? (RARITY[item.rarity]?.color || "#aaa") : "#555";

      return `
        <div style="
          flex: 1;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 8px 6px;
          text-align: center;
          cursor: ${item ? "pointer" : "default"};
          border: 1px solid ${item ? rarityColor + "44" : "rgba(255,255,255,0.05)"};
        " data-slot="${key}">
          <div style="font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 10px;">${label}</div>
          <div style="font-size: 26px;">${item ? item.emoji : "—"}</div>
          <div style="font-size: 14px; color: ${item ? rarityColor : "#555"}; margin-top: 6px;">
            ${item ? item.name : "空"}
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px;">${roll ? formatStats(roll) : ''}</div>
        </div>
      `;
    })
    .join("");

  slotsEl.querySelectorAll("[data-slot]").forEach((el) => {
    el.addEventListener("click", () => {
      const slot = el.dataset.slot;
      if (equipped[slot]) {
        unequipItem(slot);
        updatePanelContent();
      }
    });
  });

  // ── 物品列表（网格） ──
  const listEl = document.getElementById("inv-list");
  const items = Array.from(inventory.values());

  if (items.length === 0) {
    listEl.innerHTML = `<div style="color: rgba(255,255,255,0.25); text-align: center; margin-top: 40px; font-size: 16px;">
      背包空空如也…<br>去击败怪物获取装备吧！
    </div>`;
    return;
  }

  listEl.style.display = "grid";
  listEl.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
  listEl.style.gap = "10px";

  listEl.innerHTML = items
    .map((entry) => {
      const item = entry.item;
      const roll = entry.roll || {};
      const rarityColor = RARITY[item.rarity]?.color || "#aaa";
      const rarityLabel = RARITY[item.rarity]?.label || "";
      const stats = formatStats(roll);

      return `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 14px 10px;
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          border-top: 3px solid ${rarityColor};
        ">
          <div style="font-size: 32px; margin-bottom: 4px;">${item.emoji}</div>
          <div style="font-size: 14px; color: #eee;">${item.name}</div>
          <div style="font-size: 11px; color: ${rarityColor}; margin-bottom: 4px;">[${rarityLabel}]</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">${stats}</div>
          <button class="inv-equip-btn" data-item="${item.id}" style="
            padding: 6px 14px;
            font-size: 13px;
            font-family: inherit;
            border: 1px solid ${rarityColor}66;
            border-radius: 8px;
            background: ${rarityColor}22;
            color: #ddd;
            cursor: pointer;
            width: 100%;
          ">装备</button>
        </div>
      `;
    })
    .join("");

  // 装备按钮 → 显示对比确认
  listEl.querySelectorAll(".inv-equip-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const itemId = btn.dataset.item;
      const ok = await showEquipComparison(itemId);
      if (ok && doEquip(itemId)) {
        updatePanelContent();
        notifyChange();
      }
    });
  });
}
