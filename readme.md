markdown
# 🎮 日式RPG - AI 辅助独立游戏

> 用 ClaudeCode 客户端 + DeepSeek-V4-Flash API + Three.js Skill，**花费 3.37 元**制作的日式 RPG 游戏

[![在线试玩](https://img.shields.io/badge/在线试玩-点击进入-brightgreen?style=for-the-badge)](https://dw7jnjk8s-rpgbyccwd4fatjs-y0qkg01ht.maozi.io/)
[![GitHub](https://img.shields.io/badge/查看源码-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/zchentest/rpgbyclaudewithdsv4flashandthreejsskill)

---

## 📖 项目简介

这是一个**零游戏开发经验**的开发者，借助 AI 编程助手完成的日式 RPG 游戏。项目展示了当前 AI 编程能力在游戏开发领域的实际应用——从零开始，仅用自然语言描述需求，AI 即可生成可运行的 3D 游戏代码。

**游戏地址**：[https://dw7jnjk8s-rpgbyccwd4fatjs-y0qkg01ht.maozi.io/](https://dw7jnjk8s-rpgbyccwd4fatjs-y0qkg01ht.maozi.io/)

**源码仓库**：[https://github.com/zchentest/rpgbyclaudewithdsv4flashandthreejsskill](https://github.com/zchentest/rpgbyclaudewithdsv4flashandthreejsskill)

---

## 🛠️ 技术栈

| 工具 | 说明 |
|------|------|
| **ClaudeCode 客户端** | AI 编程助手交互界面 |
| **DeepSeek-V4-Flash API** | 底层大语言模型推理接口 |
| **Three.js Skill** | Three.js 专业开发知识库（含 10 个技能模块） |
| **Three.js** | 3D 图形渲染引擎 |
| **Vite** | 前端构建工具 |

**Three.js Skill 包含的 10 个技能模块**：
- `threejs-fundamentals` — 场景、相机、渲染器
- `threejs-geometry` — 几何体与 BufferGeometry
- `threejs-materials` — PBR、卡通、Shader 材质
- `threejs-lightning` — 光源、阴影、环境光照
- `threejs-textures` — 纹理、UV 映射、环境贴图
- `threejs-animation` — 关键帧、骨骼、Morph 动画
- `threejs-loaders` — GLTF/GLB 模型加载
- `threejs-shaders` — GLSL、ShaderMaterial、自定义特效
- `threejs-postprocessing` — Bloom、景深、屏幕特效
- `threejs-interaction` — Raycaster、相机控制、交互输入

---

## 🎯 游戏特色

- 🗺️ **多层塔式地图** — 5 层独立区域，通过传送门上下连通
- 🏘️ **新手村（安全区）** — 第一层为安全区域，无怪物，有 NPC 可接取任务
- 📋 **主线任务系统** — 村长处接取任务，完成后获得经验、金币、装备奖励
- 🏪 **杂货店系统** — 使用金币购买武器、防具、饰品
- ⚔️ **战斗系统** — 多种怪物（史莱姆、野狼、骷髅兵、火蜥蜴、石傀儡）
- 👾 **怪物 AI** — 怪物会主动追击并攻击玩家
- 📊 **怪物信息显示** — 头顶显示等级和实时血量条
- 🎒 **装备与背包** — 击杀怪物掉落装备，按 `I` 键打开背包进行装备管理
- 💾 **存档系统** — 基于 LocalStorage，支持保存/读取游戏进度
- ✨ **视觉特效** — Bloom 辉光、粒子特效、传送门动画、飘落花瓣
- 🎵 **音效系统** — Web Audio 合成音效（攻击、拾取、传送、升级）

---

## ⌨️ 操作说明

| 按键 | 功能 |
|------|------|
| `W A S D` | 角色移动 |
| `鼠标拖拽` | 旋转视角 |
| `空格` | 攻击（靠近怪物时） |
| `E` | 与 NPC 对话 / 交互 |
| `I` | 打开背包 |
| `ESC` | 暂停菜单 |
| `M` | 静音开关 |

---

## 💰 开发成本

| 项目 | 费用 |
|------|------|
| DeepSeek-V4-Flash API 调用 | **3.37 元** |
| 开发者游戏开发经验 | **0** |
| **总计** | **3.37 元** |

> 是的，你没看错——**只花了 3.37 元**，一个零基础开发者就完成了一款可玩的 3D RPG 游戏。

---

## 🚀 本地运行

```bash
# 克隆项目
git clone https://github.com/zchentest/rpgbyclaudewithdsv4flashandthreejsskill.git

# 进入目录
cd rpgbyclaudewithdsv4flashandthreejsskill

# 安装依赖
npm install

# 启动开发服务器
npm run dev
访问 http://localhost:5173 即可开始游戏。

🙏 致谢
DeepSeek — 提供了强大且低成本的 API 服务，让 AI 辅助开发变得触手可及

ClaudeCode — 优秀的 AI 编程客户端，让自然语言编程成为现实

Three.js Skill — 专业的三维开发知识库，让 AI 生成的代码更加规范可靠

Three.js 社区 — 提供了一流的 3D 图形引擎和生态工具

📝 开发感悟
这是一个证明：AI 已经降低了游戏开发的门槛。

零经验的开发者，通过自然语言描述需求，配合专业的 AI 技能库，可以在极低的成本下完成一个可玩的 3D 游戏。这不仅是技术的进步，更是创作民主化的一个缩影。

欢迎试玩，欢迎优化，欢迎 fork —— 让我们一起探索 AI 辅助开发的无限可能。

📄 许可证
MIT License

📬 联系与反馈
提交 Issue：GitHub Issues

欢迎 Star ⭐ 和 Fork 🍴

Happy Gaming! 🎮