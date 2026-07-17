#!/bin/bash
# 同频回声 - macOS 桌面端构建脚本
# 用法: bash build.sh

set -e
cd "$(dirname "$0")"

echo "========================================"
echo "  同频回声 桌面端 - macOS 构建脚本"
echo "========================================"
echo ""

# Step 1: 检查 Node.js
echo "[1/4] 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    echo "  Node.js: $(node --version)"
else
    echo "  [错误] 未找到 Node.js，请先安装。https://nodejs.org/"
    exit 1
fi

# Step 2: 构建前端
echo ""
echo "[2/4] 构建前端 (Vite)..."
FRONTEND_DIR="../outputs/empathy-circle"
cd "$FRONTEND_DIR"
npm install --no-audit --no-fund 2>&1
npm run build
cd - > /dev/null
echo "  前端构建完成"

# Step 3: 安装 Electron 依赖
echo ""
echo "[3/4] 安装 Electron 依赖..."
npm install --no-audit --no-fund

# Step 4: 打包
echo ""
echo "[4/4] 打包 macOS 桌面应用..."
npx electron-builder --mac

echo ""
echo "========================================"
echo "  构建完成！"
echo "  输出目录: desktop-app/release/"
echo "========================================"