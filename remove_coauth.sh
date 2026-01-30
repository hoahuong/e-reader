#!/bin/bash
# Script để xóa Co-authored-by khỏi các commits gần đây

# Lấy danh sách commits có Co-authored-by
commits=$(git log --all --format="%H" | while read hash; do 
  if git log -1 --format="%B" $hash | grep -q "Co-authored-by: Cursor"; then 
    echo $hash
  fi
done)

echo "Tìm thấy các commits có Co-authored-by:"
echo "$commits"

# Xóa trailer khỏi từng commit
for hash in $commits; do
  echo "Xử lý commit: $hash"
  git filter-branch --force --msg-filter "sed '/^Co-authored-by: Cursor/d'" -- $hash..HEAD
done

echo "✅ Đã xóa Co-authored-by khỏi git history"
