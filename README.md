# 同频回声 · Empathy Circle

> **让真实感受被温柔接住，让每一次表达都有安全的回响。**

同频回声是一款面向日常情绪表达与轻社交陪伴的全栈原型应用。用户可以选择匿名或实名分享生活片段，在内容安全机制的保护下，获得 AI 情绪反馈与同频用户回应；运营与审核角色则能够在统一后台处理风险内容、隐私设置与安全事件。

它不试图替代专业心理服务，而是希望在"想说说"的时刻，提供一个更克制、更有边界感的数字空间。

## 当前版本：v6.1（Web端优先）

### v6.1 动态元素升级
- **动画渐变网格背景**：多层径向渐变缓慢漂移，营造沉浸氛围
- **浮动环境光斑**：CSS 纯动画的大尺寸柔光球体，增加空间深度感
- **玻璃拟态导航条**：顶部 sticky 导航栏，backdrop-filter 毛玻璃 + 滚动进度条
- **卡片 3D 悬浮**：perspective + rotateX 微倾斜，多层阴影立体感
- **品牌标识脉冲动画**：品牌 mark 呼吸光晕 + hover 旋转缩放
- **移动端导航 active 指示器**：顶部胶囊形 indicator 滑入动画
- **通知徽章脉冲**：未读红点周期性呼吸光晕
- **汉堡菜单升级**：更大触控面积、毛玻璃背景、hover 缩放
- **骨架屏闪烁动画**：shimmer 渐变流动加载态
- **登录页动效**：auth-panel 渐变背景 + 浮动光斑 + 毛玻璃卡片
- **暗色模式全覆盖**：所有新元素适配暗色主题

### v6 基础升级
- 🐛 **光标修复**：品牌光标 display:none 被 @media(pointer:fine) 覆盖
- 🎨 **设计令牌系统**：--shadow-sm/md/lg、--radius-xs~xl、--ease-out/spring
- 🎨 **Google Fonts**：Inter + Noto Sans SC
- 🎨 **玻璃拟态全局**：侧边栏、面板、卡片、编写器
- 🎨 **渐变按钮系统**：渐变背景 + 彩色阴影 + 悬浮动效
- 🎨 **聚焦光环**：5px 主题色辉光 + 微上浮
- 🎨 **暗色模式**：OLED 深黑背景

### 移动端计划
> 当前版本聚焦 Web 端体验优化和功能完善。Web 端稳定后，将推进 Capacitor 跨端适配（Android/iOS），包括原生构建验证、触控手势优化、离线缓存策略。详见 `PROJECT_HANDOFF.md` 下一步章节。

## ✦ 核心体验

- **双重身份表达**：支持匿名与实名发布，让用户自行决定被看见的方式。
- **AI 温和回声**：为通过审核的动态生成情绪陪伴、价值澄清与行动支持三类回应。
- **同频互动模拟**：基于内容主题生成正向的同频用户反馈，呈现社区连接感。
- **分级内容治理**：广告引流、诈骗与违法风险内容会被拦截；高风险情绪内容会进入人工复核队列。
- **角色化运营后台**：用户、内容审核员、运营管理员、最高管理员拥有不同的操作范围。
- **隐私与安全看板**：集中展示匿名默认值、同频推荐、审核记录，以及 WAF / 限流 / DDoS 模拟事件。
- **离线可演示**：未配置 AI Key 时，系统会自动使用本地规则和预设回应，便于演示与开发。

## 🗺 功能地图

| 场景 | 能力 |
| --- | --- |
| 用户表达 | 匿名/实名发布、配图、点赞、举报、隐私偏好 |
| 内容理解 | 情绪风险识别、AI 回声、同频反馈、人工复核 |
| 运营治理 | 审核任务、账号权限、AI 服务配置、安全事件模拟 |
| 数据能力 | SQLite 本地持久化、审核状态同步、审计数据导出 |
| 桌面与 Web | Vite Web 应用、Electron 桌面入口、PWA 清单 + Service Worker |

## 🧬 技术架构
- **前端**：React + TypeScript + Vite
- **服务端**：Node.js 原生 HTTP 服务
- **数据层**：SQLite（node:sqlite）
- **桌面端**：Electron + electron-builder
- **交互与视觉**：Lucide 图标、响应式 CSS、SVG 本地资源
- **AI 接口**：兼容 DeepSeek / OpenAI 风格的 Chat Completions 接口

```
React / Vite UI
      │
      ├── 本地状态兜底（API 不可用时）
      │
      └── Node API :8787
              │
              ├── 内容审核与角色权限
              ├── AI 服务连接测试
              └── SQLite 数据持久化
```

## 🚀 快速开始
### 环境要求

- Node.js 22 或更高版本
- npm 10 或更高版本

### 安装与启动
```bash
npm install
npm run dev:full
```

启动后访问：http://localhost:5173

其中：
- 前端开发服务：`npm run dev`
- 本地 API 服务：`npm run dev:api`
- 前后端同时启动：`npm run dev:full`

## ✅ 质量检查
```bash
npm run typecheck
npm run test:auth-ui
npm run test:api
npm run build
```

**test:api** 会覆盖登录、权限、发布、审核、举报、隐私设置、安全事件与点赞等关键流程。

## 🔮 AI 服务配置

以最高管理员身份进入后台的 **AI 服务** 页面后，可填写兼容接口的地址、模型与 API Key。推荐配置示例：

```
Provider: DeepSeek
Endpoint: https://api.deepseek.com/v1
Model: deepseek-chat
```

也可以通过环境变量配置：
```powershell
$env:DEEPSEEK_API_KEY='your-api-key'
npm run dev:api
```

> API Key 仅用于当前运行期测试；界面只保存脱敏展示信息。未配置 Key 时，应用会自动启用本地回退逻辑。

## 🖥 桌面端构建
```bash
npm run desktop:dev
npm run desktop:build:win
npm run desktop:build:mac
```

生成的桌面端产物默认输出到 `release/`。

## 🔒 项目边界

- 本项目是产品原型与本地演示实现，不构成心理诊断、治疗或危机干预服务。
- 内置账号、权限与内容审核规则仅用于演示，不应直接用于生产环境。
- 生产部署前应补充真实身份认证、会话管理、密钥托管、审计留存、专业风控策略与人工应急流程。

## 📁 目录速览

```
src/                  React 前端界面与交互逻辑
server.mjs            Node API、审核流程与 SQLite 持久化
public/images/        认证页本地视觉资源
api-smoke-test.mjs    API 端到端冒烟测试
auth-ui-audit.mjs     登录与注册界面审计脚本
main.js / preload.js  Electron 主进程与预加载脚本
```

---

**同频回声**：不急着给答案，先认真回应每一段真实的感受。