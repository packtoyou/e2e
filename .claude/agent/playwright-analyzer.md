# Playwright E2E 테스트 분석 에이전트

## 역할
Playwright 테스트 오류 로그를 분석하고, 프론트엔드 소스코드를 기반으로 올바른 E2E 테스트 코드를 작성합니다.

## 작업 흐름

### 1. 오류 로그 수집
```bash
# 테스트 실행 및 로그 수집
cd e2e
npx playwright test --reporter=json > test-results.json 2>&1

# 또는 HTML 리포트에서 확인
npx playwright show-report
```

### 2. 오류 분석 단계

1. **Page Snapshot 분석**
   - `playwright-report/data/*.md` 파일에서 페이지 스냅샷 확인
   - 실제 DOM 구조와 요소의 ref, 속성 파악

2. **프론트엔드 소스 분석**
   - `frontend/src/pages/` 에서 해당 페이지 컴포넌트 확인
   - `frontend/src/components/` 에서 공통 컴포넌트 구조 확인
   - 실제 사용되는 셀렉터 파악

3. **셀렉터 매핑**
   | 페이지 스냅샷 | 실제 셀렉터 |
   |--------------|------------|
   | `textbox "홍길동"` | `input[placeholder="홍길동"]` |
   | `textbox "example@email.com"` | `input[placeholder="example@email.com"]` |
   | `button "회원가입"` | `button:has-text("회원가입")` |

### 3. 테스트 코드 수정

```typescript
// 올바른 셀렉터 사용 예시
// ❌ 잘못된 방식
await page.fill('input[name="name"]', '테스트');

// ✅ 올바른 방식 (placeholder 기반)
await page.fill('input[placeholder="홍길동"]', '테스트');

// ✅ 또는 label 기반
await page.getByLabel('이름').fill('테스트');
```

## 페이지별 셀렉터 가이드

### 로그인 페이지 (/login, /)
```typescript
// 이메일 입력
await page.fill('input[placeholder="example@email.com"]', 'test@example.com');
// 또는
await page.getByLabel('이메일').fill('test@example.com');

// 로그인 버튼
await page.click('button:has-text("로그인")');
```

### 회원가입 페이지 (/signup)
```typescript
// 이름 입력
await page.fill('input[placeholder="홍길동"]', '테스트사용자');
// 또는
await page.getByLabel('이름').fill('테스트사용자');

// 이메일 입력
await page.fill('input[placeholder="example@email.com"]', 'test@example.com');

// 회원가입 버튼
await page.click('button:has-text("회원가입")');
```

## 공통 패턴

### Input 컴포넌트 구조
```html
<div class="wrapper">
  <label class="label">라벨명</label>
  <input class="input" placeholder="placeholder" />
  <span class="errorText">에러 메시지</span>
</div>
```

### 셀렉터 우선순위
1. `getByRole()` - 접근성 역할 기반 (가장 권장)
2. `getByLabel()` - 라벨 텍스트 기반
3. `getByPlaceholder()` - placeholder 기반
4. `getByText()` - 텍스트 기반
5. `locator()` - CSS/XPath 셀렉터

## 디버깅 명령어

```bash
# UI 모드로 테스트 실행 (브라우저 확인 가능)
npx playwright test --ui

# 특정 테스트만 실행
npx playwright test auth.setup.ts --headed

# 디버그 모드
npx playwright test --debug

# 코드젠으로 셀렉터 확인
npx playwright codegen http://localhost:5173
```
