#!/bin/bash
# Script để xóa Co-authored-by khỏi các commits gần đây

# Lấy 3 commits gần nhất
commits=$(git log --format="%H" -3)

for hash in $commits; do
    msg=$(git log -1 --format="%B" $hash)
    if echo "$msg" | grep -q "Co-authored-by: Cursor"; then
        # Xóa trailer
        clean_msg=$(echo "$msg" | sed '/^Co-authored-by: Cursor/d' | sed '/^$/d')
        
        # Dùng filter-branch để sửa từng commit
        git filter-branch -f --msg-filter "echo '$clean_msg'" $hash^..HEAD 2>/dev/null || true
    fi
done

echo "✅ Đã xóa Co-authored-by khỏi các commits gần đây"
