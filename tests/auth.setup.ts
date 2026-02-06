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

  // === 인증 상태 저장 ===
  await page.context().storageState({ path: authFile });
  console.log(`인증 상태 저장: ${authFile}`);
});
