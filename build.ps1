# 同频回声 - Windows 桌面端构建脚本
# 用法: .\build.ps1

Continue = "Stop"
Set-Location 

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  同频回声 桌面端 - Windows 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: 检查 Node.js
Write-Host "[1/4] 检查 Node.js 环境..." -ForegroundColor Yellow
try {
     = node --version
    Write-Host "  Node.js: " -ForegroundColor Green
} catch {
    Write-Host "  [错误] 未找到 Node.js，请先安装。https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Step 2: 构建前端
Write-Host ""
Write-Host "[2/4] 构建前端 (Vite)..." -ForegroundColor Yellow
 = Join-Path  "..\outputs\empathy-circle"
Push-Location 
try {
    npm install --no-audit --no-fund 2>&1 | Out-Null
    npm run build
    Write-Host "  前端构建完成" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: 安装 Electron 依赖
Write-Host ""
Write-Host "[3/4] 安装 Electron 依赖..." -ForegroundColor Yellow
npm install --no-audit --no-fund

# Step 4: 打包
Write-Host ""
Write-Host "[4/4] 打包 Windows 桌面应用..." -ForegroundColor Yellow
npx electron-builder --win

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  构建完成！" -ForegroundColor Green
Write-Host "  输出目录: desktop-app\release\" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
