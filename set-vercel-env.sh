#!/bin/bash
# Script để set Vercel environment variables
# Sử dụng npx vercel để không cần cài global

echo "🚀 Setting up Vercel environment variables..."
echo ""

# Đọc token từ .env.local
if [ ! -f .env.local ]; then
    echo "❌ File .env.local không tồn tại"
    exit 1
fi

GITHUB_TOKEN=$(grep GITHUB_TOKEN .env.local | cut -d '=' -f2 | tr -d ' ')
GITHUB_OWNER="hoahuong"
GITHUB_REPO="e-reader"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Không tìm thấy GITHUB_TOKEN trong .env.local"
    exit 1
fi

echo "✅ Đã đọc token từ .env.local"
echo "📝 Setting environment variables..."
echo ""

# Set GITHUB_TOKEN
echo "$GITHUB_TOKEN" | npx vercel env add GITHUB_TOKEN production
echo ""

# Set GITHUB_OWNER
echo "$GITHUB_OWNER" | npx vercel env add GITHUB_OWNER production
echo ""

# Set GITHUB_REPO
echo "$GITHUB_REPO" | npx vercel env add GITHUB_REPO production
echo ""

echo "✅ Đã set xong environment variables!"
echo "📝 Bước tiếp theo: Redeploy project trên Vercel"
