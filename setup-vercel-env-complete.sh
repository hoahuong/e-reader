#!/bin/bash
# Script hoàn chỉnh để set Vercel environment variables
# Chạy: bash setup-vercel-env-complete.sh

set -e

echo "🚀 Setup Vercel Environment Variables"
echo "======================================"
echo ""

# Kiểm tra .env.local
if [ ! -f .env.local ]; then
    echo "❌ File .env.local không tồn tại"
    exit 1
fi

# Đọc values từ .env.local
GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env.local | cut -d '=' -f2 | tr -d ' ')
GITHUB_OWNER=$(grep "^GITHUB_OWNER=" .env.local | cut -d '=' -f2 | tr -d ' ')
GITHUB_REPO=$(grep "^GITHUB_REPO=" .env.local | cut -d '=' -f2 | tr -d ' ')

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_OWNER" ] || [ -z "$GITHUB_REPO" ]; then
    echo "❌ Thiếu thông tin trong .env.local"
    exit 1
fi

echo "✅ Đã đọc thông tin từ .env.local:"
echo "   GITHUB_OWNER: $GITHUB_OWNER"
echo "   GITHUB_REPO: $GITHUB_REPO"
echo "   GITHUB_TOKEN: [đã có]"
echo ""

# Kiểm tra Vercel CLI
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Cần cài đặt Node.js và npm"
    exit 1
fi

# Sử dụng npx vercel nếu không có vercel global
VERCEL_CMD="npx vercel"
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
fi

echo "📝 Bước 1: Login vào Vercel (nếu chưa login)"
echo "   Chạy: $VERCEL_CMD login"
echo ""
read -p "Bạn đã login vào Vercel chưa? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Đang login vào Vercel..."
    $VERCEL_CMD login
fi

echo ""
echo "📝 Bước 2: Link project với Vercel (nếu chưa link)"
read -p "Project đã được link chưa? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🔗 Đang link project..."
    $VERCEL_CMD link
fi

echo ""
echo "📝 Bước 3: Setting environment variables..."
echo ""

# Set GITHUB_TOKEN
echo "Setting GITHUB_TOKEN..."
echo "$GITHUB_TOKEN" | $VERCEL_CMD env add GITHUB_TOKEN production
echo ""

# Set GITHUB_OWNER
echo "Setting GITHUB_OWNER..."
echo "$GITHUB_OWNER" | $VERCEL_CMD env add GITHUB_OWNER production
echo ""

# Set GITHUB_REPO
echo "Setting GITHUB_REPO..."
echo "$GITHUB_REPO" | $VERCEL_CMD env add GITHUB_REPO production
echo ""

echo "✅ Đã set xong tất cả environment variables!"
echo ""
echo "📝 Bước tiếp theo:"
echo "   1. Vào Vercel Dashboard để verify: https://vercel.com/dashboard"
echo "   2. Redeploy project để áp dụng changes"
echo "   3. Hoặc push code mới để trigger auto-deploy"
