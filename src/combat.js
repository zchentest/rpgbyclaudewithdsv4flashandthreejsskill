import {
  flashMonster,
  killMonster,
  spawnDamageNumber,
  getMonstersInRange,
} from "./monsters.js";
import { rollDrop, spawnGoldCoin } from "./dropSystem.js";
import { updateQuestProgress } from "./questTracker.js";
import game, { addExp } from "./gameState.js";

// ============================================================
// C2 — 玩家攻击系统（适配多怪物类型）
// ============================================================

let killCount = 0;
const damageCallbacks = [];

export function onDamageTaken(callback) {
  damageCallbacks.push(callback);
}

/**
 * 玩家攻击
 * @param {THREE.Vector3} playerPos
 * @param {THREE.Group[]} monsters - 所有怪物数组
 * @param {THREE.Scene} scene
 * @returns {{ hit: boolean, killCount: number }}
 */
export function attackEnemy(playerPos, monsters, scene) {
  const inRange = getMonstersInRange(playerPos, monsters, 3.5);

  if (inRange.length === 0) {
    return { hit: false, killCount };
  }

  const damage = game.player.attack || 10;

  for (const monster of inRange) {
    if (!monster.userData.isAlive) continue;

    // 扣血
    monster.userData.hp -= damage;

    // 闪红
    flashMonster(monster, 0.2);

    // 伤害数字
    const dmgPos = monster.position.clone();
    dmgPos.y += 1.2;
    const label = spawnDamageNumber(dmgPos, damage);
    scene.add(label);

    // 判断死亡
    if (monster.userData.hp <= 0) {
      // P1-2 — 掉落判定
      rollDrop(monster, scene);

      // 金币掉落
      const gd = monster.userData.goldDrop;
      if (gd && Math.random() < gd.chance) {
        const amount = gd.min + Math.floor(Math.random() * (gd.max - gd.min + 1));
        spawnGoldCoin(monster.position.clone(), amount, scene);
      }

      // P2 — 任务进度
      const mtype = monster.userData.type;
      if (mtype) updateQuestProgress(mtype);

      killMonster(monster);
      killCount++;
      game.kills = killCount;

      // 使用怪物自己的经验奖励
      const expReward = monster.userData.expReward || 10;
      addExp(expReward);
    }
  }

  damageCallbacks.forEach((cb) => cb(killCount));
  return { hit: true, killCount };
}

export function getKillCount() {
  return killCount;
}

export function resetKillCount() {
  killCount = 0;
  game.kills = 0;
  damageCallbacks.forEach((cb) => cb(killCount));
}
