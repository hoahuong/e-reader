# 🤖 Automated Testing & Bug Fix Planning Guide

## 📋 Tổng quan

Hệ thống test tự động và bug detection đã được setup để:
1. ✅ Tự động phát hiện bugs
2. ✅ Tạo kế hoạch fix tự động
3. ✅ Generate bug reports
4. ✅ CI/CD integration

## 🚀 Sử dụng

### 1. Chạy Test Tự động

```bash
# Chạy tất cả tests
npm run test:run

# Chạy integration tests
npm run test:integration

# Chạy automated test suite với bug detection
npm run test:automated

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### 2. Bug Detection

Bug detector tự động phát hiện:
- ❌ Undefined variables
- ❌ localStorage errors
- ❌ Missing error handlers
- ❌ Runtime errors
- ❌ Unhandled promise rejections

### 3. Bug Fix Planning

Khi phát hiện bug, hệ thống tự động:
1. Phân loại bug theo severity
2. Tạo kế hoạch fix chi tiết
3. Estimate thời gian fix
4. Generate fix steps

## 📊 Bug Report Format

Sau khi chạy `npm run test:automated`, bạn sẽ có:

### `bug-report.json`
```json
{
  "timestamp": "2026-01-30T...",
  "bugs": [
    {
      "id": "BUG_001",
      "severity": "high",
      "type": "undefined_variable",
      "message": "uploadDriveFolderId is not defined",
      "component": "LanguageRoutes",
      "fix": "Add uploadDriveFolderId to component props"
    }
  ],
  "fixReport": {
    "summary": {
      "totalBugs": 1,
      "highPriority": 1
    },
    "estimatedTotalTime": "15-30 minutes"
  }
}
```

### `BUG_REPORT.md`
Markdown report với:
- Summary
- Detected bugs
- Fix plans với steps chi tiết

## 🔧 Fix Strategies

### Undefined Variable
- **Priority:** High
- **Time:** 15-30 minutes
- **Steps:**
  1. Identify missing prop
  2. Add to component signature
  3. Pass from parent
  4. Add default value
  5. Test

### localStorage Error
- **Priority:** Medium
- **Time:** 10-20 minutes
- **Steps:**
  1. Add try-catch
  2. Implement fallback
  3. Use memory storage
  4. Test in incognito

### Missing Error Handler
- **Priority:** Low
- **Time:** 5-15 minutes
- **Steps:**
  1. Add error boundary
  2. Add error UI
  3. Add logging
  4. Test scenarios

## 🤖 CI/CD Integration

GitHub Actions workflow tự động:
- ✅ Chạy tests trên mỗi push/PR
- ✅ Phát hiện bugs
- ✅ Generate reports
- ✅ Tạo GitHub issues cho high priority bugs

Workflow file: `.github/workflows/automated-tests.yml`

## 📝 Test Files Structure

```
src/test/
├── setup.js                 # Test setup
├── integration.test.jsx      # Integration tests
├── bug-detector.js          # Bug detection logic
├── bug-fix-planner.js       # Fix planning logic
└── automated-test-runner.js  # Test runner

scripts/
└── run-automated-tests.js   # CLI script
```

## 🎯 Best Practices

1. **Run tests trước khi commit:**
   ```bash
   npm run test:automated
   ```

2. **Check bug reports:**
   - Review `BUG_REPORT.md` sau mỗi test run
   - Fix high priority bugs trước

3. **Update fix strategies:**
   - Thêm strategies mới trong `bug-fix-planner.js`
   - Update auto-fix logic khi cần

4. **Monitor CI/CD:**
   - Check GitHub Actions runs
   - Review auto-generated issues

## 🔍 Example Workflow

```bash
# 1. Develop feature
git checkout -b feature/new-feature

# 2. Run tests
npm run test:automated

# 3. Check bug report
cat BUG_REPORT.md

# 4. Fix bugs nếu có
# Follow fix plan trong report

# 5. Re-run tests
npm run test:automated

# 6. Commit
git add .
git commit -m "feat: Add new feature"

# 7. Push (CI/CD sẽ auto-test)
git push origin feature/new-feature
```

## 📈 Metrics

Theo dõi:
- Test coverage
- Bug detection rate
- Fix time estimates
- Auto-fix success rate

## 🚨 Troubleshooting

### Tests fail
```bash
# Check test output
npm run test:run -- --reporter=verbose

# Check specific test
npm run test:run -- src/test/integration.test.jsx
```

### Bug detector không hoạt động
- Check `bug-detector.js` được import đúng
- Verify error monitoring được setup
- Check console logs

### Fix plan không chính xác
- Update strategies trong `bug-fix-planner.js`
- Add custom fix logic
- Improve bug classification
