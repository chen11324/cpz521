# 跨端打包清单

当前项目先以 PWA 形态实现核心功能。正式软件发布时建议按以下顺序推进，避免四端同时引入过多变量。

## 1. PWA 网站

目标：作为所有端的共用核心体验。

验收项：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- HTTPS 部署后 `manifest.webmanifest` 可被浏览器识别。
- Service Worker 能缓存首页和静态资源。
- 桌面宽屏、平板、手机宽度下无文本重叠。

## 2. Windows/macOS 桌面端

推荐技术：Tauri。

原因：安装包小、系统权限收敛、适合把现有 Web 前端封装为桌面软件。

步骤：

```bash
npm install -D @tauri-apps/cli
npm run build
npx tauri init
npx tauri build
```

验收项：

- Windows 输出 `.msi` 或 `.exe`。
- macOS 输出 `.dmg`。
- 应用图标、窗口标题、自动更新地址配置完成。
- 系统通知和本地加密缓存通过权限检查。

## 3. Android/iOS 移动端

推荐技术：Capacitor。

原因：能复用当前 Web 前端，同时逐步加入推送、相册、相机、生物识别等原生能力。

步骤：

```bash
npm install @capacitor/core @capacitor/cli
npx cap init empathy-circle com.example.empathycircle
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

验收项：

- Android Studio 能打开并运行模拟器。
- Xcode 能打开并运行 iOS 模拟器。
- 推送通知、相册选择和系统分享权限说明完整。
- App Store 和应用市场隐私政策、内容审核说明准备完成。

## 4. 后端上线前安全门禁

- 全站 HTTPS，HSTS 开启。
- CDN + WAF + DDoS 清洗开启。
- API 网关限流按 IP、账号、设备、接口维度生效。
- 用户真实身份、匿名身份、AI 标签、审核日志分表隔离。
- 管理后台强制多因素认证和操作审计。
- AI 评论、人工评论、系统提示在数据库中明确区分来源。

## 5. 最小可上线范围

- 登录注册。
- 匿名/实名发布。
- 动态流和圈层推荐。
- AI 评论生成。
- 用户评论和举报。
- AI 初筛和人工审核后台。
- 安全事件看板。
- 隐私设置和数据导出。
