#!/bin/bash
# Playwright 테스트 실행 및 구조화된 결과 출력
# Usage:
#   ./scripts/run-tests.sh                      # 전체 테스트 실행
#   ./scripts/run-tests.sh dashboard.spec.ts     # 특정 파일만 실행
#   ./scripts/run-tests.sh --list-failures       # 마지막 실행의 실패 목록만 출력

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$E2E_DIR/test-results"
JSON_REPORT="$E2E_DIR/test-results.json"

cd "$E2E_DIR"

# === 함수 정의 ===

print_separator() {
  echo "════════════════════════════════════════════════════════════════"
}

# 마지막 실행의 실패 목록 출력
list_failures() {
  if [ ! -f "$JSON_REPORT" ]; then
    echo "❌ test-results.json 파일이 없습니다. 먼저 테스트를 실행하세요."
    exit 1
  fi

  echo ""
  print_separator
  echo "📋 실패한 테스트 목록"
  print_separator

  # jq가 있으면 사용, 없으면 node로 파싱
  if command -v jq &>/dev/null; then
    jq -r '
      .suites[]?.suites[]?.specs[]? |
      select(.tests[]?.results[]?.status == "failed" or .tests[]?.results[]?.status == "timedOut") |
      "  ❌ \(.title)\n     파일: \(.file)\n     라인: \(.line)"
    ' "$JSON_REPORT" 2>/dev/null || echo "  (파싱 실패 - node로 재시도)"
  else
    node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('$JSON_REPORT', 'utf8'));
      const failures = [];
      function walk(suites) {
        for (const suite of (suites || [])) {
          for (const spec of (suite.specs || [])) {
            for (const test of (spec.tests || [])) {
              for (const result of (test.results || [])) {
                if (result.status === 'failed' || result.status === 'timedOut') {
                  failures.push({
                    title: spec.title,
                    file: spec.file,
                    line: spec.line,
                    error: (result.error?.message || '').substring(0, 300)
                  });
                }
              }
            }
          }
          walk(suite.suites);
        }
      }
      walk(data.suites);
      if (failures.length === 0) {
        console.log('  ✅ 실패한 테스트 없음');
      } else {
        failures.forEach(f => {
          console.log('  ❌ ' + f.title);
          console.log('     파일: ' + f.file + ':' + f.line);
          if (f.error) console.log('     에러: ' + f.error.split('\n')[0]);
          console.log('');
        });
      }
    " 2>/dev/null
  fi
}

# 테스트 실행
run_tests() {
  local test_file="${1:-}"
  local extra_args=""

  if [ -n "$test_file" ]; then
    echo "🎯 대상: $test_file"
    extra_args="$test_file"
  else
    echo "🎯 대상: 전체 테스트"
  fi

  print_separator
  echo "🚀 Playwright 테스트 실행 중..."
  print_separator
  echo ""

  # JSON + line reporter로 실행 (line은 실시간 출력, json은 파일로 저장)
  local exit_code=0
  npx playwright test $extra_args \
    --reporter=json \
    2>&1 | tee "$JSON_REPORT.raw" || exit_code=$?

  # raw 출력에서 JSON 부분만 추출하여 저장
  # playwright --reporter=json은 stdout에 JSON을 출력
  if [ -f "$JSON_REPORT.raw" ]; then
    # JSON 시작점 찾기
    node -e "
      const fs = require('fs');
      const raw = fs.readFileSync('$JSON_REPORT.raw', 'utf8');
      const jsonStart = raw.indexOf('{');
      if (jsonStart >= 0) {
        const jsonStr = raw.substring(jsonStart);
        try {
          JSON.parse(jsonStr);
          fs.writeFileSync('$JSON_REPORT', jsonStr);
        } catch(e) {
          // JSON이 불완전한 경우 마지막 } 찾기
          const lastBrace = jsonStr.lastIndexOf('}');
          if (lastBrace >= 0) {
            const trimmed = jsonStr.substring(0, lastBrace + 1);
            try {
              JSON.parse(trimmed);
              fs.writeFileSync('$JSON_REPORT', trimmed);
            } catch(e2) {
              console.error('JSON 파싱 실패');
            }
          }
        }
      }
    " 2>/dev/null
    rm -f "$JSON_REPORT.raw"
  fi

  echo ""
  print_separator

  if [ $exit_code -eq 0 ]; then
    echo "✅ 모든 테스트 통과!"
    print_separator

    # 통과 요약
    if [ -f "$JSON_REPORT" ]; then
      node -e "
        const fs = require('fs');
        try {
          const data = JSON.parse(fs.readFileSync('$JSON_REPORT', 'utf8'));
          const stats = data.stats || {};
          console.log('  총 테스트: ' + (stats.expected || 0));
          console.log('  통과: ' + (stats.expected || 0));
          console.log('  실행시간: ' + ((stats.duration || 0) / 1000).toFixed(1) + 's');
        } catch(e) {}
      " 2>/dev/null
    fi
  else
    echo "❌ 테스트 실패! (exit code: $exit_code)"
    print_separator

    # 실패 요약
    if [ -f "$JSON_REPORT" ]; then
      node -e "
        const fs = require('fs');
        try {
          const data = JSON.parse(fs.readFileSync('$JSON_REPORT', 'utf8'));
          const stats = data.stats || {};
          console.log('');
          console.log('📊 실행 요약:');
          console.log('  총 테스트: ' + ((stats.expected || 0) + (stats.unexpected || 0)));
          console.log('  통과: ' + (stats.expected || 0));
          console.log('  실패: ' + (stats.unexpected || 0));
          console.log('  스킵: ' + (stats.skipped || 0));
          console.log('  실행시간: ' + ((stats.duration || 0) / 1000).toFixed(1) + 's');
        } catch(e) {}
      " 2>/dev/null

      # 실패 목록 출력
      list_failures
    fi

    # 리포트 관련 파일 안내
    echo ""
    print_separator
    echo "📁 디버깅 파일:"
    print_separator

    # test-results 디렉토리의 스냅샷/스크린샷 목록
    if [ -d "$REPORT_DIR" ]; then
      find "$REPORT_DIR" -name "*.png" -o -name "*.webm" -o -name "*.zip" 2>/dev/null | while read f; do
        echo "  📄 $f"
      done
    fi
    echo "  📄 $JSON_REPORT"
  fi

  echo ""
  return $exit_code
}

# === 메인 ===

case "${1:-}" in
  --list-failures)
    list_failures
    ;;
  --help|-h)
    echo "Usage: $0 [test-file] [--list-failures] [--help]"
    echo ""
    echo "Examples:"
    echo "  $0                        # 전체 테스트 실행"
    echo "  $0 dashboard.spec.ts      # 특정 파일만 실행"
    echo "  $0 --list-failures        # 마지막 실패 목록 출력"
    ;;
  *)
    run_tests "${1:-}"
    ;;
esac
