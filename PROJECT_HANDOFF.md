# 同频回声 · 项目交接

## 维护规则
- 每完成一个可验证阶段，立即更新“已完成 / 正在开发 / 已知问题 / 下一步”。
- 只记录已验证事实；环境受限项必须写明前置条件。

## 项目目标
桌面优先、响应式可运行于移动浏览器/PWA 的情绪分享社区：匿名或实名发布、同频互动、多智能体反馈、内容审核、分级后台与安全演练。仓库：chen11324/cpz521（公开，main）。

## 当前目录
~~~text
src/                    React 前端；components/ 含 LoginScreen、SocialApp、AdminApp、BrandCursor
server.mjs               Node HTTP API、RBAC、审核、SQLite
styles.css               全局主题、响应式、登录动效与品牌光标
public/images/           登录背景、封面和动态插图
main.js / preload.js     Electron 主进程与桥接
capacitor.config.json    Capacitor 配置
android/ / ios/          已生成的原生工程
api-smoke-test.mjs       API 冒烟测试
PROJECT_HANDOFF.md       本交接文档
~~~

## 已完成
- 用户端：匿名/实名发布、封面/配图上传、点赞评论举报、圈层、隐私、数据导出、AI 对话和主题。
- 审核安全：内容拦截、人工复核、SQLite、WAF/DDoS 演练；CORS 已允许 Authorization。
- 登录权限：注册/手机绑定、微信/QQ/Apple 演示授权、会话恢复、用户/审核员/运营/最高管理员分级。
- 后台：审核队列、权限展示、AI Compatible 配置/测试、安全健康度和快捷防护操作。
- 体验：发布提示、字数/隐私状态、图片预览、动态筛选、重复点赞保护、通知浮层、通知抽屉（铃铛+已读）、骨架屏加载、下拉刷新、动态详情弹窗、心情追踪器、移动端底部导航栏。
- 登录页：聚焦单卡 + 登录/注册切换；移除左侧下方说明文字，增加“回声”动效，桌面与 390px 页面已实测。
- 品牌光标：改为仅在真实鼠标移动后出现的页面内跟随光标；普通、可点击、文本输入状态分别处理，避免 SVG cursor 固定残影。
- 跨端：已接入 Capacitor 8，已生成并同步 Android/iOS 工程；移动构建可用 VITE_API_BASE 指向远端 API；静态图片已补齐。
- 2026-07-18 UI 全面升级：全局毛玻璃背景纹理、骨架屏加载态、通知抽屉（分类+已读标记）、动态详情弹窗（AI回声+同频回应）、下拉刷新、心情追踪芯片、圈层浏览增强、移动端底部导航、375/768/940/1080/1440 响应式全覆盖、按钮/卡片/评论/气泡入场动画增强、reduced-motion 尊重。

## 关键技术栈
React 19、TypeScript、Vite、Node HTTP、node:sqlite、Electron/electron-builder、Capacitor 8、lucide-react、qrcode。默认 API：http://localhost:8787/api。

## 重要文件
- src/App.tsx：会话恢复、路由分流、全局 BrandCursor。
- src/components/BrandCursor.tsx：桌面端跟随式品牌光标。
- src/components/LoginScreen.tsx：账号/社交登录与登录页体验。
- src/components/SocialApp.tsx：用户主流程；src/components/AdminApp.tsx：RBAC 后台与 AI 配置。
- src/api.ts：Bearer token 请求封装；server.mjs：API、CORS、审核规则、数据库。
- styles.css：全局视觉、响应式、动效和光标规则。

## 正在开发
- 用户、审核员、运营管理员、最高管理员的浏览器回归；响应式已覆盖 375px / 768px / 940px / 1080px / 1440px（含移动端底部导航）。
- Android 原生构建环境尚未完成；用户要求优先完善网站，暂缓后续安装配置。

## 已知问题
- JDK 17 已安装于 C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot；Android Studio/SDK 官方下载失败，尚未完成 Debug APK 验证。iOS 编译必须在 macOS + Xcode。
- Electron 二进制曾因 npm 网络脚本失败被清理；桌面打包前先正常运行 npm install 并确认 Electron 下载可用。
- AI、认证、RBAC、风控均为演示实现；生产需真实用户系统、httpOnly 会话、密钥托管、限流与审计。
- data/empathy-circle.sqlite 是忽略的运行时数据；?login=1 会清空本地会话，只用于登录页预览。

## 下一步
1. 完成四种角色的浏览器回归，继续修正 375px / 768px / 1440px 响应式细节。
2. 补充发布、会话恢复、防护演练的自动化测试。
3. 网站验收后恢复 Android Studio/SDK 配置，设置 JAVA_HOME 并执行 android\gradlew.bat assembleDebug；iOS 交由 macOS/Xcode。
4. 恢复 Electron 后验证 Windows/macOS 打包与实际启动。
5. 最终执行 typecheck、test:auth-ui、test:api、build、git diff --check 后再提交推送。

## 不能改动 / 注意
- 中文源码统一 UTF-8 无 BOM；不要用 PowerShell 做宽泛中文替换。
- 不提交 node_modules、dist、release、data/*.sqlite、API Key、日志或临时文件。
- 受 RBAC 保护的 API 必须走 src/api.ts；CORS 必须保留 content-type, authorization。
- 真机包必须以 VITE_API_BASE 指向设备可访问的 HTTPS API，禁止打入 localhost。
- android/、ios/ 需纳入源码控制，但不能提交构建产物、Pods、DerivedData、Gradle 缓存或生成的 public。
- 动效需支持 prefers-reduced-motion；触屏保持系统光标；输入框必须保留文本光标。
- 构建成功不等于 Electron 或原生应用启动成功；最终审核后再推送。
