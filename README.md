# 同频回声 · Empathy Circle

> **让真实感受被温柔接住，让每一次表达都有安全的回响。**

同频回声是一款面向日常情绪表达与轻社交陪伴的全栈原型应用。用户可以选择匿名或实名分享生活片段，在内容安全机制的保护下，获得 AI 情绪回声与同频用户回应；运营与审核角色则能够在统一后台处理风险内容、隐私设置与安全事件。

它不试图替代专业心理服务，而是希望为“想说说话”的时刻，提供一个更克制、更有边界感的数字空间。

## ✨ 核心体验

- **双重身份表达**：支持匿名与实名发布，让用户自行决定被看见的方式。
- **AI 温和回声**：为通过审核的动态生成情绪陪伴、价值澄清与行动支持三类回应。
- **同频互动模拟**：基于内容主题生成正向的同频用户反馈，呈现社区连接感。
- **分级内容治理**：广告导流、诈骗与违法风险内容会被拦截；高风险情绪内容会进入人工复核队列。
- **角色化运营后台**：用户、内容审核员、运营管理员、最高管理员拥有不同的操作范围。
- **隐私与安全看板**：集中展示匿名默认值、同频推荐、审核记录，以及 WAF / 限流 / DDoS 模拟事件。
- **离线可演示**：未配置 AI Key 时，系统会自动使用本地规则和预设回应，便于演示与开发。

## 🧭 功能地图

| 场景 | 能力 |
| --- | --- |
| 用户表达 | 匿名/实名发布、配图、点赞、举报、隐私偏好 |
| 内容理解 | 情绪风险识别、AI 回声、同频反馈、人工复核 |
| 运营治理 | 审核任务、账号权限、AI 服务配置、安全事件模拟 |
| 数据能力 | SQLite 本地持久化、审核状态同步、审计数据导出 |
| 桌面与 Web | Vite Web 应用、Electron 桌面端入口、PWA 清单与 Service Worker |

## 🏗 技术架构

- **前端**：React + TypeScript + Vite
- **服务端**：Node.js 原生 HTTP 服务
- **数据层**：SQLite（node:sqlite）
- **桌面端**：Electron + electron-builder
- **交互与视觉**：Lucide 图标、响应式 CSS、SVG 本地资源
- **AI 接口**：兼容 DeepSeek / OpenAI 风格的 Chat Completions 接口

~~~text
React / Vite UI
      │
      ├── 本地状态兜底（API 不可用时）
      │
      └── Node API  :8787
              │
              ├── 内容审核与角色权限
              ├── AI 服务连接测试
              └── SQLite 数据持久化
~~~

## 🚀 快速开始

### 环境要求

- Node.js 22 或更高版本
- npm 10 或更高版本

### 安装与启动

~~~bash
npm install
npm run dev:full
~~~

启动后访问：http://localhost:5173

其中：

- 前端开发服务：npm run dev
- 本地 API 服务：npm run dev:api
- 前后端同时启动：npm run dev:full

## ✅ 质量检查

~~~bash
npm run typecheck
npm run test:auth-ui
npm run test:api
npm run build
~~~

**test:api** 会覆盖登录、权限、发布、审核、举报、隐私设置、安全事件与点赞等关键流程。

## 🤖 AI 服务配置

以最高管理员身份进入后台的 **AI 服务** 页面后，可填写兼容接口的地址、模型与 API Key。推荐配置示例：

~~~text
Provider: DeepSeek
Endpoint: https://api.deepseek.com/v1
Model: deepseek-chat
~~~

也可以通过环境变量配置：

~~~powershell
$env:DEEPSEEK_API_KEY='your-api-key'
npm run dev:api
~~~

> API Key 仅用于当前运行期测试；界面只保存脱敏展示信息。未配置 Key 时，应用会自动启用本地回退逻辑。

## 🖥 桌面端构建

~~~bash
npm run desktop:dev
npm run desktop:build:win
npm run desktop:build:mac
~~~

生成的桌面端产物默认输出到 release/。

## 🔐 项目边界

- 本项目是产品原型与本地演示实现，不构成心理诊断、治疗或危机干预服务。
- 内置账号、权限与内容审核规则仅用于演示，不应直接用于生产环境。
- 生产部署前应补充真实身份认证、会话管理、密钥托管、审计留存、专业风控策略与人工应急流程。

## 📁 目录速览

~~~text
src/                  React 前端界面与交互逻辑
server.mjs            Node API、审核流程与 SQLite 持久化
public/images/        认证页本地视觉资源
api-smoke-test.mjs    API 端到端冒烟测试
auth-ui-audit.mjs     登录与注册界面审计脚本
main.js / preload.js  Electron 主进程与预加载脚本
~~~

---

**同频回声**：不急着给答案，先认真回应每一段真实的感受。
