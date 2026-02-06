# PackToYou E2E 테스트 프로젝트

## 프로젝트 개요
PackToYou 풀필먼트 시스템의 E2E(End-to-End) 테스트 프로젝트입니다.
Playwright를 사용하여 브라우저 기반 UI 테스트를 수행합니다.

## 프로젝트 구조
```
e2e/
├── .claude/
│   ├── agent/
│   │   ├── playwright-analyzer.md  # 오류 분석 가이드
│   │   └── playwright-fixer.md     # 자동 수정 서브에이전트
│   ├── settings.json               # 에이전트 설정
│   └── CLAUDE.md                   # 이 파일
├── scripts/
│   └── run-tests.sh                # 테스트 실행 + 구조화된 결과 출력
├── tests/
│   ├── auth.setup.ts               # 인증 설정 (회원가입/로그인)
│   ├── users.spec.ts               # 사용자 관리 테스트
│   ├── dashboard.spec.ts           # 대시보드 테스트
│   ├── products.spec.ts            # 상품 관리 테스트
│   ├── orders.spec.ts              # 주문 관리 테스트
│   ├── inventory.spec.ts           # 재고 관리 테스트
│   ├── shipments.spec.ts           # 배송 관리 테스트
│   ├── sales-channels.spec.ts      # 판매 채널 테스트
│   └── carriers.spec.ts            # 택배사 연동 테스트
├── .auth/                          # 인증 상태 저장 (gitignore)
├── playwright-report/              # 테스트 리포트 (gitignore)
├── playwright.config.ts            # Playwright 설정
├── package.json
└── tsconfig.json
```

## 관련 프로젝트
- **프론트엔드**: `../frontend/src/` - React 애플리케이션
- **백엔드**: `../backend/` - NestJS API 서버
- **문서**: `../docs/modules/` - 모듈별 기능 명세

## 프론트엔드 페이지 구조

### 인증 (비밀번호 없음, 이메일만 사용)
| 페이지 | 경로 | 파일 |
|-------|------|------|
| 로그인 | `/` | `frontend/src/pages/Auth/LoginPage.tsx` |
| 회원가입 | `/signup` | `frontend/src/pages/Auth/SignupPage.tsx` |

### 주요 페이지
| 페이지 | 경로 | 파일 |
|-------|------|------|
| 대시보드 | `/` | `frontend/src/pages/Dashboard/DashboardPage.tsx` |
| 주문 관리 | `/orders` | `frontend/src/pages/Orders/OrdersPage.tsx` |
| 상품 관리 | `/products` | `frontend/src/pages/Products/ProductsPage.tsx` |
| 재고 관리 | `/inventory` | `frontend/src/pages/Inventory/InventoryPage.tsx` |
| 배송 관리 | `/shipments` | `frontend/src/pages/Shipments/ShipmentsPage.tsx` |
| 판매 채널 | `/sales-channels` | `frontend/src/pages/SalesChannels/SalesChannelsPage.tsx` |
| 사용자 관리 | `/users` | `frontend/src/pages/Users/UsersPage.tsx` |
| 통계 | `/statistics` | `frontend/src/pages/Statistics/StatisticsPage.tsx` |

## 셀렉터 가이드

### Input 컴포넌트
프론트엔드의 Input 컴포넌트는 label과 placeholder를 사용합니다.

```typescript
// placeholder 기반 (권장)
await page.fill('input[placeholder="홍길동"]', '테스트');
await page.fill('input[placeholder="example@email.com"]', 'test@example.com');

// 또는 getByLabel 사용
await page.getByLabel('이름').fill('테스트');
await page.getByLabel('이메일').fill('test@example.com');
```

### Button 컴포넌트
```typescript
await page.click('button:has-text("로그인")');
await page.click('button:has-text("회원가입")');
await page.click('button:has-text("저장")');
await page.click('button:has-text("취소")');
```

## 테스트 실행

```bash
# 기본 실행
npm test

# UI 모드 (브라우저에서 테스트 확인)
npm run test:ui

# headed 모드 (브라우저 창 표시)
npm run test:headed

# 디버그 모드
npm run test:debug

# 특정 테스트만 실행
npx playwright test auth.setup.ts

# 코드젠으로 셀렉터 확인
npx playwright codegen http://localhost:5173
```

## 오류 분석

1. **테스트 실패 시**: `playwright-report/` 폴더 확인
2. **Page Snapshot**: `playwright-report/data/*.md` 파일에서 DOM 구조 확인
3. **스크린샷**: `playwright-report/data/*.png` 파일 확인
4. **비디오**: `playwright-report/data/*.webm` 파일 확인

자세한 오류 분석 방법은 `.claude/agent/playwright-analyzer.md` 참조

## 서브에이전트: 자동 테스트 실행 및 수정

### 사용법

사용자가 아래와 같이 요청하면 자동 수정 워크플로우를 실행한다:
- "Playwright 테스트 실행하고 고쳐줘"
- "E2E 테스트 돌려줘"
- "테스트 실패하면 수정해줘"

### 워크플로우

```
1. 테스트 실행
   cd e2e && bash scripts/run-tests.sh

2. 실패 시 → Task 서브에이전트 실행
   - playwright-fixer.md 지침에 따라 자동 분석/수정
   - 실패 테스트별: 에러분석 → 소스확인 → 수정 → 재실행
   - 최대 3회 반복

3. 전체 재실행으로 최종 확인
```

### 서브에이전트 호출 예시 (Task tool)

```
Task(subagent_type="general-purpose", prompt=`
e2e/.claude/agent/playwright-fixer.md 지침을 따라 Playwright 테스트를 실행하고 실패를 수정하세요.

작업 디렉토리: /Users/kimbeomsoo/Desktop/dockerize
대상: [전체 | 특정파일.spec.ts]

실패 시:
1. test-results/ 의 스크린샷(.png) 확인
2. 테스트 코드(e2e/tests/)와 프론트엔드 소스(frontend/src/pages/) 크로스체크
3. 코드 수정 후 재실행
4. 최대 3회 반복
`)
```

### 에이전트 파일

| 에이전트 | 파일 | 용도 |
|---------|------|------|
| playwright-analyzer | `.claude/agent/playwright-analyzer.md` | 오류 분석 가이드 |
| playwright-fixer | `.claude/agent/playwright-fixer.md` | 자동 실행/수정 루프 |

### 오류 유형별 대응

| 오류 | 수정 대상 | 자동 수정 |
|------|----------|----------|
| 셀렉터 못찾음 | 테스트 코드 셀렉터 | O |
| 타임아웃 | 테스트 코드 wait 추가 | O |
| assertion 실패 | 테스트 기대값 | O |
| 라우트 변경 | 테스트 URL | O |
| API 에러 (4xx/5xx) | 백엔드 | X (보고만) |
| 서버 미실행 | 환경 설정 | X (안내만) |
