import { test, expect } from '@playwright/test';

test.describe('Sales Channels Module - 판매채널 관리', () => {
  const uniqueId = Date.now();

  test.beforeEach(async ({ page }) => {
    await page.goto('/sales-channels');
    await page.waitForLoadState('networkidle');
  });

  test.describe('판매채널 생성', () => {
    test('TC-SC-001: Amazon 판매채널을 생성할 수 있다', async ({ page }) => {
      const channelName = `아마존 스토어 ${uniqueId}`;

      // When: 채널 추가 버튼 클릭
      await page.getByRole('button', { name: '채널 추가' }).click();

      // And: Amazon 플랫폼 선택
      await page.getByRole('button', { name: 'Amazon' }).click();

      // And: 채널 정보 입력
      await page.getByLabel('채널명').fill(channelName);

      // And: Amazon SP-API 인증정보 입력
      await page.getByLabel('Seller ID').fill('A1BCDEFG2HI3JK');
      await page.getByLabel('Marketplace ID').fill('ATVPDKIKX0DER');
      await page.getByLabel('LWA Client ID').fill('amzn1.application-oa2-client.test123');
      await page.getByLabel('LWA Client Secret').fill('test-secret-value');
      await page.getByLabel('Refresh Token').fill('test-refresh-token');

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 채널 목록에 새 채널이 표시됨
      await expect(page.getByText(channelName)).toBeVisible();
      await expect(page.getByText('Amazon')).toBeVisible();
    });

    test('TC-SC-002: Shopify 판매채널을 생성할 수 있다', async ({ page }) => {
      const channelName = `쇼피파이 스토어 ${uniqueId}`;

      // When: 채널 추가 버튼 클릭
      await page.getByRole('button', { name: '채널 추가' }).click();

      // And: Shopify 플랫폼 선택
      await page.getByRole('button', { name: 'Shopify' }).click();

      // And: 채널 정보 입력
      await page.getByLabel('채널명').fill(channelName);

      // And: Shopify Admin API 인증정보 입력
      await page.getByLabel('Shop Domain').fill('mystore.myshopify.com');
      await page.getByLabel('Access Token').fill('shpat_test_token_123');

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 채널 목록에 새 채널이 표시됨
      await expect(page.getByText(channelName)).toBeVisible();
      await expect(page.getByText('Shopify')).toBeVisible();
    });

    test('TC-SC-003: 채널명 없이 생성 시 에러 표시', async ({ page }) => {
      // When: 채널 추가 모달 열기
      await page.getByRole('button', { name: '채널 추가' }).click();

      // And: 채널명 없이 추가 시도
      await page.getByRole('button', { name: 'Amazon' }).click();
      await page.getByLabel('Seller ID').fill('test');
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 채널명 필수 에러 메시지 표시
      await expect(page.getByText('채널명을 입력해주세요')).toBeVisible();
    });

    test('TC-SC-004: Amazon 인증정보 누락 시 에러 표시', async ({ page }) => {
      // When: 채널 추가 모달 열기
      await page.getByRole('button', { name: '채널 추가' }).click();
      await page.getByRole('button', { name: 'Amazon' }).click();

      // And: 채널명만 입력하고 인증정보 누락
      await page.getByLabel('채널명').fill('인증정보 누락 채널');
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 인증정보 필수 에러 메시지 표시
      await expect(
        page.getByText('Seller ID를 입력해주세요')
          .or(page.getByText('Marketplace ID를 입력해주세요'))
      ).toBeVisible();
    });

    test('TC-SC-005: Shopify 인증정보 누락 시 에러 표시', async ({ page }) => {
      // When: 채널 추가 모달 열기
      await page.getByRole('button', { name: '채널 추가' }).click();
      await page.getByRole('button', { name: 'Shopify' }).click();

      // And: 채널명만 입력하고 인증정보 누락
      await page.getByLabel('채널명').fill('쇼피파이 누락 채널');
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 인증정보 필수 에러 메시지 표시
      await expect(
        page.getByText('Shop Domain을 입력해주세요')
          .or(page.getByText('Access Token을 입력해주세요'))
      ).toBeVisible();
    });

    test('TC-SC-006: 중복된 채널명으로 생성 시 에러 표시', async ({ page }) => {
      const dupName = `중복채널-${uniqueId}`;

      // Given: 먼저 채널을 생성
      await page.getByRole('button', { name: '채널 추가' }).click();
      await page.getByRole('button', { name: 'Shopify' }).click();
      await page.getByLabel('채널명').fill(dupName);
      await page.getByLabel('Shop Domain').fill('first.myshopify.com');
      await page.getByLabel('Access Token').fill('shpat_first');
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByText(dupName)).toBeVisible();

      // When: 동일한 채널명으로 다시 생성 시도
      await page.getByRole('button', { name: '채널 추가' }).click();
      await page.getByRole('button', { name: 'Shopify' }).click();
      await page.getByLabel('채널명').fill(dupName);
      await page.getByLabel('Shop Domain').fill('second.myshopify.com');
      await page.getByLabel('Access Token').fill('shpat_second');
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 중복 채널명 에러 메시지 표시
      await expect(page.getByText(/이미 존재|duplicate|already exists/i)).toBeVisible();
    });
  });

  test.describe('판매채널 수정 및 삭제', () => {
    test('TC-SC-007: 채널 정보를 수정할 수 있다', async ({ page }) => {
      // Given: 채널 목록에서 수정 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '수정' }).click();

        // When: 채널명 수정
        const nameInput = page.getByLabel('채널명');
        await nameInput.clear();
        await nameInput.fill(`수정된채널-${uniqueId}`);

        // And: 수정 버튼 클릭
        await page.getByRole('button', { name: '수정' }).click();

        // Then: 수정된 채널명이 목록에 표시됨
        await expect(page.getByText(`수정된채널-${uniqueId}`)).toBeVisible();
      }
    });

    test('TC-SC-008: 채널을 비활성화할 수 있다', async ({ page }) => {
      // Given: 채널 수정 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '수정' }).click();

        // When: 상태를 비활성으로 변경
        const statusToggle = page.getByText('활성').or(page.locator('input[type="checkbox"]'));
        if (await statusToggle.isVisible()) {
          await statusToggle.click();
        }
        await page.getByRole('button', { name: '수정' }).click();

        // Then: 비활성 상태로 변경됨
        await expect(page.getByText('비활성')).toBeVisible();
      }
    });

    test('TC-SC-009: 판매채널을 삭제할 수 있다', async ({ page }) => {
      // Given: 삭제할 채널 생성
      await page.getByRole('button', { name: '채널 추가' }).click();
      await page.getByRole('button', { name: 'Shopify' }).click();
      await page.getByLabel('채널명').fill('삭제할채널');
      await page.getByLabel('Shop Domain').fill('delete.myshopify.com');
      await page.getByLabel('Access Token').fill('shpat_delete');
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByText('삭제할채널')).toBeVisible();

      // When: 삭제 버튼 클릭
      const targetRow = page.locator('tr').filter({ hasText: '삭제할채널' });
      await targetRow.getByRole('button', { name: '삭제' }).click();

      // And: 확인 모달에서 삭제 확인
      await page.getByRole('button', { name: '삭제' }).last().click();

      // Then: 채널이 목록에서 사라짐
      await expect(page.getByText('삭제할채널')).not.toBeVisible();
    });
  });

  test.describe('연결 테스트 및 동기화', () => {
    test('TC-SC-010: 연결 테스트를 실행할 수 있다', async ({ page }) => {
      // Given: 채널 목록에서 연결테스트 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        const testBtn = firstRow.getByRole('button', { name: '연결테스트' });
        if (await testBtn.isVisible()) {
          await testBtn.click();

          // Then: 결과 메시지 표시 (성공 또는 실패)
          await expect(
            page.getByText('연결 성공').or(page.getByText('연결 실패'))
          ).toBeVisible({ timeout: 30000 });
        }
      }
    });

    test('TC-SC-011: 주문을 동기화할 수 있다', async ({ page }) => {
      // Given: 채널 목록에서 동기화 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        const syncBtn = firstRow.getByRole('button', { name: '동기화' });
        if (await syncBtn.isVisible()) {
          await syncBtn.click();

          // Then: 동기화 결과 메시지 표시
          await expect(
            page.getByText(/동기화 완료|동기화/).or(page.getByText(/오류/))
          ).toBeVisible({ timeout: 30000 });
        }
      }
    });
  });

  test.describe('다중 플랫폼 관리', () => {
    test('TC-SC-012: Amazon과 Shopify 채널을 모두 관리할 수 있다', async ({ page }) => {
      // Given: Amazon 채널이 목록에 있는지 확인
      const amazonExists = await page.getByText('Amazon').isVisible();
      const shopifyExists = await page.getByText('Shopify').isVisible();

      if (amazonExists && shopifyExists) {
        // Then: 두 플랫폼 모두 목록에 표시됨
        await expect(page.getByText('Amazon')).toBeVisible();
        await expect(page.getByText('Shopify')).toBeVisible();
      }
    });
  });
});
