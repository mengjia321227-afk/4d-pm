#!/bin/bash

# 4D-PM 一键部署脚本
# 用法: ./deploy.sh

echo "🚀 开始构建..."
cd "$(dirname "$0")"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查代码错误"
    exit 1
fi

echo "📤 正在部署到 GitHub Pages..."
cd dist

git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin gh-pages

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🌐 访问地址: https://$(git remote get-url origin | sed 's/.*github.com\///' | sed 's/\.git//' | sed 's/\//.github.io\//').github.io/4d-pm"
else
    echo "❌ 部署失败"
fi