# 同频回声 · 项目交接

## 目标
打造一款桌面优先、响应式可在移动浏览器/PWA 运行的情绪分享社区：支持匿名或实名发布、同频互动、多智能体情绪反馈、实时内容审核、分级管理后台与安全防护演练。仓库：chen11324/cpz521（公开，分支 main）。

## 当前结构

~~~text
src/                    React 前端
src/components/          LoginScreen、SocialApp、AdminApp
server.mjs               Node HTTP API、RBAC、审核、SQLite
styles.css               全局视觉与响应式样式
public/images/           登录页本地背景资源
main.js / preload.js     Electron 主进程与桥接
api-smoke-test.mjs       API 端到端冒烟
PROJECT_HANDOFF.md       本交接文档
~~~

## 已完成
- 用户端：匿名/实名发布、封面与配图上传、动态流、点赞、评论、举报、同频圈层、个人签名、隐私开关、数据导出、AI 对话与主题装扮。
- 审核与安全：广告/诈骗/违法拦截、负面情绪复核、人工审核、SQLite 持久化、WAF/DDoS 防护事件模拟。
- 登录与权限：账号注册、手机号绑定、微信/QQ/Apple 演示授权、会话令牌、页面刷新后用户身份恢复；用户/审核员/运营/最高管理员分级。
- 后台：审核队列、账号权限展示、DeepSeek/OpenAI Compatible 配置与测试、安全健康度、状态刷新与防护演练。
- 本轮体验升级：发布灵感、字数/隐私提示、图片预览移除、动态筛选、重复认可防护、统一通知浮层、管理员健康卡片与快捷操作。
- 本轮关键修复：API CORS 已允许 Authorization，浏览器后台权限请求可通过预检。

## 关键技术
React 19、TypeScript、Vite、Node HTTP、node:sqlite、Electron、electron-builder、lucide-react、qrcode。默认 API 为 http://localhost:8787/api。

## 重要文件
- src/App.tsx：会话用户恢复/清除与用户端、后台路由分流。
- src/api.ts：自动附带本地保存的 Bearer token。
- src/components/SocialApp.tsx：主用户体验与大部分互动状态。
- src/components/AdminApp.tsx：RBAC 后台和 AI 配置。
- server.mjs：权限解析、CORS、所有 API、审核规则和数据库。
- styles.css：所有视觉主题、响应式和本轮交互样式。
- api-smoke-test.mjs：覆盖登录、权限、发布、审核、举报、隐私、安全、点赞。

## 已知问题 / 风险
- Android/iOS 目前是响应式 Web/PWA，不是 Capacitor 原生工程；Windows/macOS 打包脚本已存在但本轮未重新制作安装包。
- AI 服务默认可本地回退；真实 API Key 不要写入仓库或 SQLite。
- 当前认证、RBAC 和风控为演示实现，生产环境需接入真实用户系统、httpOnly 会话、密钥托管、限流与审计。
- data/empathy-circle.sqlite 为运行时数据，已忽略；测试会重置/写入此文件。
- ?login=1 是强制登录页预览参数，会主动清空本地会话；不要用它测试刷新后的会话恢复。

## 下一步
1. 使用浏览器分别完成用户、审核员、运营管理员、最高管理员的完整回归；重点验证 CORS 后的审核/防护/AI 配置请求。
2. 在 375px、768px、1440px 断点做视觉审查，修正溢出与交互密度。
3. 为发布、会话恢复和管理员防护演练新增自动化测试。
4. 若要满足原生移动端要求，新增 Capacitor 工程；若要发桌面安装包，分别验证 Windows 与 macOS 构建和启动。
5. 最终执行 typecheck、test:auth-ui、test:api、build，检查 git diff --check 后提交并推送。

## 约束
- 中文源码必须 UTF-8 无 BOM；避免 PowerShell 的宽泛中文替换。
- 不提交 node_modules、dist、release、data/*.sqlite、API Key、构建日志或临时修复文件。
- API 受 RBAC 保护时必须使用 src/api.ts；修改 CORS 时保留 content-type, authorization。
- 不要用构建成功代替桌面应用启动验证；不要把演示账号/密钥方案当生产安全方案。
- 用户要求：持续迭代界面与交互，最终审核完成后再推送仓库。
