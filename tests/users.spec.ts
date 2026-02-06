import { test, expect } from '@playwright/test';

test.describe('Users Module - 사용자 관리', () => {
  const uniqueId = Date.now();

  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
  });

  test('TC-USER-001: 새 사용자를 생성할 수 있다', async ({ page }) => {
    const testEmail = `test-${uniqueId}@example.com`;
    const testName = '테스트사용자';

    // When: 사용자 생성 버튼 클릭
    await page.getByRole('button', { name: '사용자 생성' }).click();

    // And: 사용자 정보 입력
    await page.getByPlaceholder('이름').fill(testName);
    await page.getByPlaceholder('이메일').fill(testEmail);

    // And: 시간대 및 언어 설정
    await page.getByRole('dialog').locator('select').filter({ hasText: 'UTC' }).selectOption('Asia/Seoul');
    await page.getByRole('dialog').locator('select').filter({ hasText: /영어|English/ }).selectOption('ko');

    // And: 생성 버튼 클릭
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();

    // Then: 사용자 목록에 새 사용자가 표시됨
    await expect(page.getByText(testName).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(testEmail).first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-USER-002: 이메일 형식 검증이 동작한다', async ({ page }) => {
    // When: 사용자 생성 모달 열기
    await page.getByRole('button', { name: '사용자 생성' }).click();

    // And: 잘못된 이메일 형식으로 입력
    await page.getByPlaceholder('이름').fill('테스트');
    await page.getByPlaceholder('이메일').fill('invalid-email');
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();

    // Then: 이메일 형식 에러 메시지 표시
    await expect(page.getByText(/Invalid email|유효하지 않은 이메일|이메일.*형식/i)).toBeVisible();
  });

  test('TC-USER-003: 이름 없이 사용자 생성 시 에러 표시', async ({ page }) => {
    // When: 사용자 생성 모달 열기
    await page.getByRole('button', { name: '사용자 생성' }).click();

    // And: 이름을 비워두고 이메일만 입력
    await page.getByPlaceholder('이메일').fill(`empty-name-${uniqueId}@example.com`);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();

    // Then: 이름 필수 에러 메시지 표시
    await expect(page.getByText(/is required|필수|입력해주세요/i)).toBeVisible();
  });

  test('TC-USER-004: 중복된 이메일로 사용자 생성 시 에러 표시', async ({ page }) => {
    // Given: 먼저 사용자를 생성
    const duplicateEmail = `dup-${uniqueId}@example.com`;
    await page.getByRole('button', { name: '사용자 생성' }).click();
    await page.getByPlaceholder('이름').fill('첫번째사용자');
    await page.getByPlaceholder('이메일').fill(duplicateEmail);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
    await expect(page.getByText('첫번째사용자').first()).toBeVisible({ timeout: 15000 });

    // When: 동일한 이메일로 다시 생성 시도
    await page.getByRole('button', { name: '사용자 생성' }).click();
    await page.getByPlaceholder('이름').fill('중복사용자');
    await page.getByPlaceholder('이메일').fill(duplicateEmail);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();

    // Then: 중복 이메일 에러 - 모달이 닫히지 않고 남아있거나 에러 메시지 표시
    await expect(
      page.getByText(/이미 존재|duplicate|already exists/i)
        .or(page.getByRole('dialog'))
    ).toBeVisible();
  });

  test('TC-USER-005: 사용자 정보를 수정할 수 있다', async ({ page }) => {
    // Given: 사용자 목록에서 수정 버튼 클릭
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByRole('button', { name: '수정' }).click();

    // When: 이름 수정
    const nameInput = page.getByPlaceholder('이름');
    await nameInput.clear();
    await nameInput.fill('수정된이름');

    // And: 시간대 변경
    await page.getByRole('dialog').locator('select').filter({ hasText: /UTC|Asia/ }).first().selectOption('Asia/Tokyo');

    // And: 저장
    await page.getByRole('dialog').getByRole('button', { name: '저장' }).click();

    // Then: 수정된 이름이 목록에 표시됨
    await expect(page.getByText('수정된이름').first()).toBeVisible();
  });

  test('TC-USER-006: 사용자를 삭제할 수 있다', async ({ page }) => {
    // Given: 삭제할 사용자 생성
    const deleteEmail = `delete-${uniqueId}@example.com`;
    await page.getByRole('button', { name: '사용자 생성' }).click();
    await page.getByPlaceholder('이름').fill('삭제용사용자');
    await page.getByPlaceholder('이메일').fill(deleteEmail);
    await page.getByRole('dialog').getByRole('button', { name: '생성' }).click();
    await expect(page.getByText(deleteEmail).first()).toBeVisible({ timeout: 15000 });

    // When: 해당 사용자의 삭제 버튼 클릭 (use email to target the exact row)
    const targetRow = page.locator('tr').filter({ hasText: deleteEmail }).first();
    await targetRow.getByRole('button', { name: '삭제' }).click();

    // And: 확인 모달에서 삭제 확인
    await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

    // Then: 해당 사용자가 목록에서 사라짐 (verify by unique email)
    await expect(page.getByText(deleteEmail)).not.toBeVisible();
  });

  test('TC-USER-007: 사용자 목록 페이지네이션이 동작한다', async ({ page }) => {
    // Given: 충분한 사용자가 있는 경우
    const nextBtn = page.getByRole('button', { name: '다음' });

    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      // When: 다음 페이지 버튼 클릭
      await nextBtn.click();

      // Then: 다음 페이지의 사용자 목록이 로드됨
      await expect(page.locator('table tbody tr')).toBeVisible();
    }
  });

  test('TC-USER-008: 사용자 생성 모달에서 취소할 수 있다', async ({ page }) => {
    // When: 사용자 생성 모달 열기
    await page.getByRole('button', { name: '사용자 생성' }).click();
    await expect(page.getByPlaceholder('이름')).toBeVisible();

    // And: 취소 버튼 클릭
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click();

    // Then: 모달이 닫힘
    await expect(page.getByPlaceholder('이름')).not.toBeVisible();
  });
});
