import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

// 환경 변수에서 테스트 계정 정보 가져오기 (나중에 설정 가능)
const TEST_EMAIL = process.env.TEST_EMAIL || `test${Date.now()}@example.com`;
const TEST_NAME = process.env.TEST_NAME || '테스트사용자';

// 기존 테스트 계정 사용 여부
const USE_EXISTING_ACCOUNT = process.env.USE_EXISTING_ACCOUNT === 'true';

setup('회원가입 및 로그인', async ({ page }) => {
  console.log(`테스트 계정: ${TEST_EMAIL}`);

  if (!USE_EXISTING_ACCOUNT) {
    // === 1. 회원가입 ===
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // 회원가입 페이지 확인
    await expect(page.locator('text=새 계정을 만들어보세요')).toBeVisible();

    // 이름 입력 (placeholder 기반)
    await page.fill('input[placeholder="홍길동"]', TEST_NAME);

    // 이메일 입력 (placeholder 기반)
    await page.fill('input[placeholder="example@email.com"]', TEST_EMAIL);

    // 회원가입 버튼 클릭
    await page.click('button:has-text("회원가입")');

    // 회원가입 성공 대기 (대시보드로 리다이렉트)
    await page.waitForURL('/', { timeout: 15000 });

    console.log('회원가입 완료');
  } else {
    // === 기존 계정으로 로그인 ===
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 로그인 페이지 확인
    await expect(page.locator('text=서비스를 이용하려면 로그인하세요')).toBeVisible();

    // 이메일 입력
    await page.fill('input[placeholder="example@email.com"]', TEST_EMAIL);

    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 로그인 성공 대기
    await page.waitForURL('/', { timeout: 15000 });

    console.log('로그인 완료');
  }

  // === 언어를 한국어로 전환 ===
  // LocaleContext 우선순위: user.language > localStorage['language'] > 'en'
  // AuthContext는 localStorage['packtoyou_user']에서 user 객체를 읽으므로,
  // packtoyou_user.language를 'ko'로 설정해야 다음 테스트에서도 한국어가 유지됨
  await page.waitForLoadState('networkidle');

  // 1) localStorage에 한국어 설정 (packtoyou_user 포함)
  await page.evaluate(() => {
    localStorage.setItem('language', 'ko');
    const userStr = localStorage.getItem('packtoyou_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.language = 'ko';
        localStorage.setItem('packtoyou_user', JSON.stringify(user));
      } catch { /* ignore */ }
    }
  });

  // 2) UI 셀렉트로도 한국어 선택 (i18n 즉시 반영)
  const langSelect = page.locator('select').filter({ hasText: 'English' });
  if (await langSelect.isVisible()) {
    await langSelect.selectOption('ko');
    await page.waitForLoadState('networkidle');
    console.log('UI 셀렉트로 한국어 전환 완료');
  }

  // 3) 리로드 후 한국어 적용 확인
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 10000 });
  console.log('한국어 전환 확인 완료');

  // === 인증 상태 저장 (한국어 설정 포함) ===
  await page.context().storageState({ path: authFile });
  console.log(`인증 상태 저장: ${authFile}`);
});
