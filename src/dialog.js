// ============================================================
// B3 — 对话界面（HTML 覆盖层）
// B4 — 打字机效果（50ms/字）
// ============================================================

let dialogueActive = false;
let dialogueContainer = null;
let nameEl = null;
let textEl = null;
let continueEl = null;

let currentDialogues = [];
let currentIndex = 0;
let onEndCallback = null;

// 打字机
let typewriterTimer = null;
let currentText = "";
let charIndex = 0;
const TYPE_SPEED = 50; // ms 每字

// ============================================================
// 创建对话面板 DOM（仅一次）
// ============================================================
export function setupDialoguePanel() {
  if (dialogueContainer) return; // 避免重复创建

  dialogueContainer = document.createElement("div");
  dialogueContainer.id = "dialogue-panel";
  dialogueContainer.style.cssText = `
    position: fixed;
    bottom: 0; left: 0; right: 0;
    padding: 28px 50px 32px;
    background: linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.70));
    color: #eee;
    font-family: 'Noto Sans JP', 'Segoe UI', sans-serif;
    display: none;
    z-index: 1000;
    min-height: 170px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-top: 2px solid rgba(255,255,255,0.12);
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
  `;

  dialogueContainer.innerHTML = `
    <div id="dialogue-name" style="
	      font-size: 22px;
	      color: #ffcc44;
	      margin-bottom: 9px;
	      font-weight: bold;
	      letter-spacing: 1px;
	      display: flex;
	      align-items: center;
	      gap: 8px;
	    "><span style="
	      display: inline-block;
	      width: 4px; height: 14px;
	      background: #ffcc44;
	      border-radius: 2px;
	    "></span></div>
	    <div id="dialogue-text" style="
	      font-size: 22px;
	      line-height: 1.6;
	      min-height: 60px;
	      padding-right: 20px;
	      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
	    "></div>
	    <div id="dialogue-continue" style="
	      text-align: right;
	      margin-top: 6px;
	      font-size: 16px;
	      color: rgba(255,255,255,0.45);
	      letter-spacing: 2px;
	      transition: color 0.2s;
	    ">▼ 点击继续</div>
  `;

  document.body.appendChild(dialogueContainer);

  nameEl = document.getElementById("dialogue-name");
  textEl = document.getElementById("dialogue-text");
  continueEl = document.getElementById("dialogue-continue");

  // 点击面板 → 下一条
  dialogueContainer.addEventListener("click", nextDialogue);
}

// ============================================================
// 启动对话
// ============================================================
export function startDialogue(npcName, dialogues, onEnd) {
  if (dialogueActive || !dialogues || dialogues.length === 0) return;

  dialogueActive = true;
  currentDialogues = dialogues;
  currentIndex = 0;
  onEndCallback = onEnd || null;

  // 显示 NPC 名称（左侧小黄条前已有）
  nameEl.innerHTML = `
    <span style="
      display: inline-block;
      width: 4px; height: 16px;
      background: #ffcc44;
      border-radius: 2px;
    "></span> ${npcName}
  `;

  dialogueContainer.style.display = "block";
  showCurrentDialogue();
}

// ============================================================
// 显示当前条对话（打字机启动）
// ============================================================
function showCurrentDialogue() {
  if (currentIndex >= currentDialogues.length) {
    closeDialogue();
    return;
  }

  currentText = currentDialogues[currentIndex];
  charIndex = 0;
  textEl.textContent = "";

  // 显示「继续」按钮
  continueEl.style.display = "block";
  continueEl.style.opacity = "0.3"; // 打字中半透明

  // 清除旧计时器
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  // B4 — 打字机效果（每 TYPE_SPEED ms 增加一字）
  typewriterTimer = setInterval(() => {
    charIndex++;
    textEl.textContent = currentText.substring(0, charIndex);
    if (charIndex >= currentText.length) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      // 打字完毕，亮起「继续」
      continueEl.style.opacity = "1";
    }
  }, TYPE_SPEED);
}

// ============================================================
// 下一条 / 结束
// ============================================================
function nextDialogue() {
  if (!dialogueActive) return;

  // 打字中 → 立即显示完整文本（不跳转）
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
    textEl.textContent = currentText;
    charIndex = currentText.length;
    continueEl.style.opacity = "1";
    return;
  }

  // 打字完毕 → 下一条
  currentIndex++;
  showCurrentDialogue();
}

// ============================================================
// 关闭对话面板
// ============================================================
export function closeDialogue() {
  dialogueActive = false;
  if (dialogueContainer) dialogueContainer.style.display = "none";
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }
  if (onEndCallback) {
    onEndCallback();
    onEndCallback = null;
  }
}

// ============================================================
// 查询状态
// ============================================================
export function isDialogueActive() {
  return dialogueActive;
}
