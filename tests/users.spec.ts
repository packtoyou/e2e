import { test, expect } from '@playwright/test';

test.describe('Users Module - 사용자 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('TC-USER-001: 새 사용자를 생성할 수 있다', async ({ page }) => {
    // When: 새 사용자 추가 버튼 클릭
    await page.click('button:has-text("사용자 추가")');

    // And: 사용자 정보 입력
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="name"]', '테스트사용자');
    await page.click('button:has-text("저장")');

    // Then: 사용자 목록에 새 사용자가 표시됨
    await expect(page.locator('text=테스트사용자')).toBeVisible();
  });

  test('TC-USER-002: 중복된 이메일로 사용자 생성 시 에러 표시', async ({ page }) => {
    // Given: 이미 존재하는 이메일로 사용자 생성 시도
    await page.click('button:has-text("사용자 추가")');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="name"]', '중복사용자');
    await page.click('button:has-text("저장")');

    // Then: 중복 이메일 에러 메시지 표시
    await expect(page.locator('text=이미 존재하는 이메일입니다')).toBeVisible();
  });

  test('TC-USER-003: 사용자 정보를 수정할 수 있다', async ({ page }) => {
    // Given: 사용자 목록에서 특정 사용자의 수정 버튼 클릭
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button:has-text("수정")').click();

    // When: 이름 수정
    await page.fill('input[name="name"]', '수정된이름');
    await page.click('button:has-text("저장")');

    // Then: 수정된 이름이 목록에 표시됨
    await expect(page.locator('text=수정된이름')).toBeVisible();
  });

  test('TC-USER-004: 사용자를 삭제할 수 있다', async ({ page }) => {
    // Given: 삭제할 사용자 선택
    const targetRow = page.locator('tr:has-text("delete@example.com")');

    // When: 삭제 버튼 클릭 및 확인
    await targetRow.locator('button:has-text("삭제")').click();
    await page.click('button:has-text("확인")');

    // Then: 해당 사용자가 목록에서 사라짐
    await expect(page.locator('text=delete@example.com')).not.toBeVisible();
  });

  test('TC-USER-005: 사용자 목록 페이지네이션이 동작한다', async ({ page }) => {
    // When: 다음 페이지 버튼 클릭
    const nextPageBtn = page.locator('button[aria-label="다음 페이지"]');

    if (await nextPageBtn.isVisible()) {
      await nextPageBtn.click();

      // Then: 페이지 번호가 변경됨
      await expect(page.locator('text=페이지 2')).toBeVisible();
    }
  });
});
