#!/bin/bash

# コードレビュー自動チェックスクリプト
# 使用方法: npm run review または ./scripts/code-review.sh

set -e

echo "🔍 Starting code review checks..."
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# チェック結果を保存
CHECKS_PASSED=0
CHECKS_FAILED=0

# 各チェックを実行する関数
run_check() {
  local name=$1
  local command=$2

  echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${BLUE}📋 $name${NC}"
  echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if eval $command; then
    echo "${GREEN}✅ $name passed${NC}"
    echo ""
    ((CHECKS_PASSED++))
    return 0
  else
    echo "${RED}❌ $name failed${NC}"
    echo ""
    ((CHECKS_FAILED++))
    return 1
  fi
}

# 1. コードスタイルチェック
run_check "Code Style Check" "npm run check" || true

# 2. 型チェック
run_check "TypeScript Type Check" "npm run typecheck" || true

# 3. ビルドチェック
run_check "Build Check" "npm run build" || true

# 4. 単体テスト
run_check "Unit Tests" "npm run test:unit -- --run --reporter=verbose" || true

# 5. 統合テスト
run_check "Integration Tests" "npm run test:integration -- --run --reporter=verbose" || true

# 結果サマリー
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📊 Review Summary${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo "${GREEN}🎉 All checks passed! Ready to commit.${NC}"
  exit 0
else
  echo "${RED}⚠️  Some checks failed. Please fix the issues before committing.${NC}"
  echo ""
  echo "${YELLOW}Recommendations:${NC}"
  echo "  - Run ${BLUE}npm run check:write${NC} to auto-fix style issues"
  echo "  - Check the error messages above for specific issues"
  echo "  - Refer to ${BLUE}.github/CODE_REVIEW_CHECKLIST.md${NC} for details"
  exit 1
fi
