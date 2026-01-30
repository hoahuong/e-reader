#!/usr/bin/env python3
"""Script để xóa Co-authored-by khỏi tất cả commits"""
import subprocess
import re
import sys

def get_commits_with_coauth():
    """Lấy danh sách commits có Co-authored-by"""
    result = subprocess.run(['git', 'log', '--all', '--format=%H'], capture_output=True, text=True)
    commits = result.stdout.strip().split('\n')
    
    found = []
    for hash_val in commits:
        msg_result = subprocess.run(['git', 'log', '-1', '--format=%B', hash_val], capture_output=True, text=True)
        msg = msg_result.stdout
        if 'Co-authored-by: Cursor' in msg:
            found.append(hash_val)
    
    return found

def clean_message(msg):
    """Xóa Co-authored-by trailer khỏi message"""
    # Xóa dòng Co-authored-by và dòng trống trước nó nếu có
    lines = msg.split('\n')
    clean_lines = []
    i = 0
    while i < len(lines):
        if 'Co-authored-by: Cursor' in lines[i]:
            # Bỏ qua dòng này
            i += 1
            continue
        clean_lines.append(lines[i])
        i += 1
    
    return '\n'.join(clean_lines).strip()

def main():
    commits = get_commits_with_coauth()
    print(f"Tìm thấy {len(commits)} commits có Co-authored-by")
    
    if not commits:
        print("✅ Không có commits nào cần sửa")
        return
    
    # Dùng git filter-branch để rewrite tất cả
    print("Đang rewrite git history...")
    subprocess.run([
        'git', 'filter-branch', '-f', '--msg-filter',
        'sed "/^Co-authored-by: Cursor/d"',
        '--', '--all'
    ], check=False)
    
    # Cleanup
    print("Đang cleanup...")
    subprocess.run(['rm', '-rf', '.git/refs/original/'], check=False)
    subprocess.run(['git', 'reflog', 'expire', '--expire=now', '--all'], check=False)
    subprocess.run(['git', 'gc', '--prune=now', '--aggressive'], check=False)
    
    # Kiểm tra lại
    remaining = get_commits_with_coauth()
    if remaining:
        print(f"⚠️ Vẫn còn {len(remaining)} commits có Co-authored-by")
    else:
        print("✅ Đã xóa hoàn toàn Co-authored-by khỏi git history")

if __name__ == '__main__':
    main()
