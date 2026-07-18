# 同频回声 · 项目交接文档

> 仓库：chen11324/cpz521（公开，main）| 更新：2026-07-18 | 版本：v5

## 项目目标
桌面优先、响应式可运行于移动浏览器/PWA 的情绪分享社区：
匿名/实名发布、同频互动、多智能体（AI）反馈、内容审核、RBAC 分级后台、安全演练。

---

## 目录结构
```
src/
  App.tsx                 会话恢复、路由分流、BrandCursor
  main.tsx                React 入口
  api.ts                  Bearer token 请求封装
  types.ts                全部 TS 类型定义
  constants.ts            主题/圈层/演示账号等常量
  utils.ts                审核/生成回复等工具函数
  components/
    SocialApp.tsx          用户主流程（460行，核心文件）
    AdminApp.tsx           RBAC 后台（审核队列、账号权限、AI 配置）
    LoginScreen.tsx        账号/社交登录 + 注册
    BrandCursor.tsx        桌面端品牌跟随光标
    ConfirmDialog.tsx      确认弹窗
    ErrorBoundary.tsx      错误边界
server.mjs                Node HTTP API（RBAC、审核、SQLite、CORS）
styles.css                全局样式（暗色模式、毛玻璃、动画、响应式，约122KB）
.circleci/config.yml      CI/CD（typecheck → build + api-test + auth-ui-test）
api-smoke-test.mjs        API 冒烟测试
auth-ui-audit.mjs         登录页审计测试
public/images/            登录背景、封面 SVG、动态插图
index.html                SPA 入口
vite.config.ts            Vite 构建配置
capacitor.config.json     Capacitor 8 跨端配置
android/ / ios/           已生成的原生工程
main.js / preload.js      Electron 主进程与桥接
package.json              依赖与脚本
```

---

## 已完成功能

### 用户端
- 匿名/实名发布，支持封面/配图上传
- 点赞、评论、举报、表情回应
- 圈层浏览 + 加入/离开 + 圈层筛选
- AI 智能体对话（暖声/镜面/行动灯）
- 隐私控制（默认匿名、同频推荐、审核日志）
- 数据导出、空间签名编辑
- 心情追踪器 + 心情分布柱状图

### 通知与交互
- 通知抽屉（铃铛 + 未读红点 + 分类 + 全部已读）
- 动态详情弹窗（点击展开，含 AI 回声 + 同频回应）
- 骨架屏加载态、下拉刷新、无限滚动
- 音效反馈（Web Audio API，可开关）
- 暗色模式（CSS 变量，70+ 规则覆盖，localStorage 持久化）
- 图片灯箱（点击全屏查看）
- 移动端底部导航 + 汉堡菜单侧栏抽屉
- 全局毛玻璃效果 + 卡片悬浮动画

### 后台管理
- RBAC 四级：用户 / 内容审核员 / 运营管理员 / 最高管理员
- 审核队列（通过/拒绝/升级）+ 风险评分
- AI 服务配置（OpenAI Compatible）+ 连通测试
- 安全健康度看板 + 快捷防护操作
- 账号权限展示 + 演示账号管理

### 登录系统
- 账号密码登录 + 注册（手机绑定）
- 微信/QQ/Apple 演示授权（含二维码生成）
- 会话恢复、强制预览模式
- 演示账号一键填入

### 工程化
- TypeScript 全量检查
- Vite 生产构建（92KB CSS + 283KB JS）
- API 冒烟测试 + 登录页审计测试
- CircleCI 流水线（typecheck / build / api-test / auth-ui-test）
- prefers-reduced-motion 尊重

### 响应式
- 375px / 768px / 940px / 1080px / 1440px 全覆盖
- 移动端自动隐藏侧栏、显示底部导航
- 暗色模式全组件适配

---

## 关键技术栈
| 层 | 技术 |
|----|------|
| 前端 | React 19, TypeScript, Vite 8, lucide-react, qrcode |
| 后端 | Node.js HTTP, node:sqlite |
| 桌面 | Electron + electron-builder |
| 移动 | Capacitor 8（Android/iOS 工程已生成） |
| CI/CD | CircleCI（.circleci/config.yml） |
| API | http://localhost:8787/api（Bearer token） |

---

## 重要文件说明
| 文件 | 大小 | 说明 |
|------|------|------|
| src/components/SocialApp.tsx | 41KB | 用户核心流程，包含所有交互逻辑 |
| src/components/AdminApp.tsx | 13KB | RBAC 后台管理 |
| src/components/LoginScreen.tsx | 13KB | 登录/注册/社交授权 |
| styles.css | 122KB | 全部样式（主题/动画/暗色模式/响应式） |
| server.mjs | 23KB | API 服务端（审核规则/RBAC/SQLite） |
| .circleci/config.yml | 1.3KB | CI 流水线配置 |

---

## 已知问题
- **Android 构建**：JDK 17 已安装但 Android Studio/SDK 下载失败，未经 Debug APK 验证
- **iOS 构建**：必须在 macOS + Xcode 环境
- **Electron 打包**：二进制曾因 npm 网络失败被清理，需先执行 npm install 确认下载可用
- **演示实现**：AI、认证、RBAC、风控均为前端模拟，生产需对接真实后端
- **运行时数据**：data/empathy-circle.sqlite 已加入 .gitignore

---

## 下一步
1. 浏览器回归测试（四种角色在 375/768/1440 实际设备）
2. 恢复 Electron：npm install → 验证桌面打包与启动
3. Android：设置 JAVA_HOME → android/gradlew.bat assembleDebug
4. iOS：移交 macOS + Xcode 编译
5. 生产化：替换模拟 API、httpOnly 会话、密钥托管、限流审计

---

## 约束 / 不能改动
- **中文源码**：UTF-8 无 BOM；禁止 PowerShell 宽泛替换中文
- **不提交**：node_modules、dist、release、data/*.sqlite、API Key、日志、临时文件
- **API 封装**：受 RBAC 保护的请求必须走 src/api.ts
- **CORS**：必须保留 content-type, authorization 头
- **真机构建**：VITE_API_BASE 必须指向设备可访问的 HTTPS API，禁止打入 localhost
- **原生工程**：android/、ios/ 纳入源码控制，但不提交构建产物/Gradle 缓存/Pods
- **动效**：必须支持 prefers-reduced-motion；触屏保持系统光标；输入框保留文本光标
- **构建不等于启动**：Vite build 成功不等于 Electron/原生应用能正常运行

---

## 提交历史（最近 10 条）
```
ddd8152 feat: v5 - 汉堡菜单·搜索高亮·无限滚动·焦点环无障碍
ddddfa8 feat: v4 - 圈层浏览·实时轮询·CircleCI流水线·auth-ui审计
e459bda feat: UI v3 - 暗色模式·心情图表·表情回应·图片灯箱·音效反馈
ef7f303 feat: UI全面升级v2 - 毛玻璃·骨架屏·通知抽屉·详情弹窗·移动导航·响应式全覆盖
c9062f2 feat: report confirmation dialog, comment panel styling, insight mobile grid
2e9e9bf feat: ConfirmDialog for destructive actions, wired to clear data
d159c5a feat: feed search box and mood chip filters
641d4ec feat: ErrorBoundary graceful error page, brand mark pulse
fe898dd feat: SVG favicon, meta tags, space hero gradient and typography
b89287a feat: elegant cursor redesign, post-login visual upgrade, lazy loading
```