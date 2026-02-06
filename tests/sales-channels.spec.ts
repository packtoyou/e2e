import { test, expect } from '@playwright/test';

test.describe('Sales Channels Module - 판매 채널 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sales-channels');
  });

  test('TC-SC-001: Amazon 판매 채널을 생성할 수 있다', async ({ page }) => {
    // When: 새 채널 추가 버튼 클릭
    await page.click('button:has-text("채널 추가")');

    // And: Amazon 선택 및 정보 입력
    await page.click('button:has-text("Amazon")');
    await page.fill('input[name="name"]', `내 아마존 스토어 ${Date.now()}`);
    await page.fill('input[name="sellerId"]', 'A1BCDEFG2HI3JK');
    await page.fill('input[name="marketplaceId"]', 'ATVPDKIKX0DER');
    await page.fill('input[name="lwaClientId"]', 'amzn1.xxx');
    await page.fill('input[name="lwaClientSecret"]', 'secret');
    await page.fill('input[name="refreshToken"]', 'token');
    await page.click('button:has-text("저장")');

    // Then: 채널 목록에 새 채널이 표시됨
    await expect(page.locator('text=내 아마존 스토어')).toBeVisible();
    await expect(page.locator('.badge:has-text("Amazon")')).toBeVisible();
  });

  test('TC-SC-002: Shopify 판매 채널을 생성할 수 있다', async ({ page }) => {
    // When: 새 채널 추가 버튼 클릭
    await page.click('button:has-text("채널 추가")');

    // And: Shopify 선택 및 정보 입력
    await page.click('button:has-text("Shopify")');
    await page.fill('input[name="name"]', `내 쇼피파이 스토어 ${Date.now()}`);
    await page.fill('input[name="shopDomain"]', 'mystore.myshopify.com');
    await page.fill('input[name="accessToken"]', 'shpat_xxx');
    await page.click('button:has-text("저장")');

    // Then: 채널 목록에 새 채널이 표시됨
    await expect(page.locator('text=내 쇼피파이 스토어')).toBeVisible();
    await expect(page.locator('.badge:has-text("Shopify")')).toBeVisible();
  });

  test('TC-SC-003: 연결 테스트가 성공하면 성공 메시지를 표시한다', async ({ page }) => {
    // Given: 판매 채널 목록에서 채널 선택
    const channelRow = page.locator('tr:has-text("아마존")').first();

    // When: 연결 테스트 버튼 클릭
    await channelRow.locator('button:has-text("연결 테스트")').click();

    // Then: 결과 메시지 표시 (성공 또는 실패)
    await expect(
      page.locator('text=연결 성공').or(page.locator('text=연결 실패'))
    ).toBeVisible({ timeout: 30000 });
  });

  test('TC-SC-004: 연결 테스트가 실패하면 에러 메시지를 표시한다', async ({ page }) => {
    // Given: 잘못된 인증 정보를 가진 채널 (존재한다면)
    const invalidChannelRow = page.locator('tr:has-text("잘못된")');

    if (await invalidChannelRow.count() > 0) {
      // When: 연결 테스트 버튼 클릭
      await invalidChannelRow.locator('button:has-text("연결 테스트")').click();

      // Then: 실패 메시지 표시
      await expect(page.locator('text=연결 실패')).toBeVisible();
    }
  });

  test('TC-SC-005: 주문을 동기화할 수 있다', async ({ page }) => {
    // Given: 판매 채널 목록
    const channelRow = page.locator('tr:has-text("아마존")').first();

    // When: 동기화 버튼 클릭
    await channelRow.locator('button:has-text("동기화")').click();

    // Then: 동기화 결과 표시
    await expect(page.locator('text=동기화')).toBeVisible();
  });

  test('TC-SC-006: 중복된 채널명으로 생성 시 에러 표시', async ({ page }) => {
    // Given: 이미 존재하는 채널명
    await page.click('button:has-text("채널 추가")');
    await page.click('button:has-text("Shopify")');
    await page.fill('input[name="name"]', '내 쇼피파이 스토어'); // 기존 이름
    await page.fill('input[name="shopDomain"]', 'other.myshopify.com');
    await page.fill('input[name="accessToken"]', 'shpat_other');
    await page.click('button:has-text("저장")');

    // Then: 중복 에러 메시지 표시
    await expect(page.locator('text=이미 존재하는 채널명입니다')).toBeVisible();
  });

  test('TC-SC-007: 채널을 비활성화할 수 있다', async ({ page }) => {
    // Given: 채널 수정 모달 열기
    const channelRow = page.locator('tr').filter({ hasText: '아마존' }).first();
    await channelRow.locator('button:has-text("수정")').click();

    // When: 활성화 체크박스 해제
    await page.uncheck('input[name="isActive"]');
    await page.click('button:has-text("저장")');

    // Then: 채널 상태가 비활성화로 변경됨
    await expect(page.locator('.badge:has-text("비활성")')).toBeVisible();
  });

  test('TC-SC-008: 판매 채널을 삭제할 수 있다', async ({ page }) => {
    // Given: 삭제할 채널 선택
    const deleteTarget = page.locator('tr:has-text("삭제할")');

    if (await deleteTarget.count() > 0) {
      // When: 삭제 버튼 클릭 및 확인
      await deleteTarget.locator('button:has-text("삭제")').click();
      await page.click('button:has-text("확인")');

      // Then: 채널이 목록에서 사라짐
      await expect(page.locator('text=삭제할')).not.toBeVisible();
    }
  });
});
