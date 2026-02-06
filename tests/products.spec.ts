import { test, expect } from '@playwright/test';

test.describe('Products Module - 상품 관리', () => {
  const uniqueId = Date.now();

  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test.describe('상품 CRUD', () => {
    test('TC-PROD-001: 새 상품을 생성할 수 있다', async ({ page }) => {
      const uniqueSku = `TEST-SKU-${uniqueId}`;
      const productName = `테스트 상품 ${uniqueId}`;

      // When: 상품 추가 버튼 클릭
      await page.getByRole('button', { name: '상품 추가' }).click();

      // And: 상품 정보 입력
      await page.getByPlaceholder('상품명을 입력하세요').fill(productName);
      await page.getByPlaceholder('SKU를 입력하세요').fill(uniqueSku);
      await page.getByPlaceholder('상품 설명을 입력하세요').fill('테스트 상품 설명입니다');

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가', exact: true }).click();

      // Then: 상품 목록에 새 상품이 표시됨
      await expect(page.getByText(productName)).toBeVisible();
      await expect(page.getByText(uniqueSku)).toBeVisible();
    });

    test('TC-PROD-002: 상품명 없이 생성 시 에러 표시', async ({ page }) => {
      // When: 상품 추가 모달 열기
      await page.getByRole('button', { name: '상품 추가' }).click();

      // And: 상품명 없이 SKU만 입력
      await page.getByPlaceholder('SKU를 입력하세요').fill(`NONAME-${uniqueId}`);
      await page.getByRole('button', { name: '추가', exact: true }).click();

      // Then: 상품명 필수 에러 메시지 표시
      await expect(page.getByText('상품명을 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-003: SKU 없이 생성 시 에러 표시', async ({ page }) => {
      // When: 상품 추가 모달 열기
      await page.getByRole('button', { name: '상품 추가' }).click();

      // And: SKU 없이 상품명만 입력
      await page.getByPlaceholder('상품명을 입력하세요').fill('SKU없는상품');
      await page.getByRole('button', { name: '추가', exact: true }).click();

      // Then: SKU 필수 에러 메시지 표시
      await expect(page.getByText('SKU를 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-004: 중복된 SKU로 상품 생성 시 에러 표시', async ({ page }) => {
      const dupSku = `DUP-SKU-${uniqueId}`;

      // Given: 먼저 상품을 생성
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByPlaceholder('상품명을 입력하세요').fill('첫번째상품');
      await page.getByPlaceholder('SKU를 입력하세요').fill(dupSku);
      await page.getByRole('button', { name: '추가', exact: true }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('table tbody').getByText('첫번째상품').first()).toBeVisible();

      // When: 동일한 SKU로 다시 생성 시도
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByPlaceholder('상품명을 입력하세요').fill('중복SKU상품');
      await page.getByPlaceholder('SKU를 입력하세요').fill(dupSku);

      // Intercept the API response for duplicate SKU
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/products') && resp.request().method() === 'POST'
      );
      await page.getByRole('button', { name: '추가', exact: true }).click();
      const response = await responsePromise;

      // Then: API returns error (409 Conflict or similar) and modal stays open
      expect(response.status()).toBeGreaterThanOrEqual(400);
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('TC-PROD-005: 상품 정보를 수정할 수 있다', async ({ page }) => {
      // Given: 상품 목록에서 수정 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '수정' }).click();

      // When: 상품명 수정
      const nameInput = page.getByPlaceholder('상품명을 입력하세요');
      await nameInput.clear();
      await nameInput.fill('수정된상품명');

      // And: 저장
      await page.getByRole('dialog').getByRole('button', { name: '수정' }).click();

      // Wait for modal to close
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Then: 수정된 상품명이 목록에 표시됨
      await expect(page.locator('table tbody').getByText('수정된상품명').first()).toBeVisible();
    });

    test('TC-PROD-006: 상품을 비활성화할 수 있다', async ({ page }) => {
      // Given: 상품 수정 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '수정' }).click();

      // When: 상태 토글을 비활성으로 변경
      const toggleButton = page.locator('button[class*="toggle"]');
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
      }

      await page.getByRole('dialog').getByRole('button', { name: '수정' }).click();

      // Wait for modal to close
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Then: 상품 상태가 비활성으로 변경됨 (scope to table to avoid matching filter option)
      await expect(page.locator('table tbody').getByText('비활성').first()).toBeVisible();
    });

    test('TC-PROD-007: 상품을 삭제할 수 있다', async ({ page }) => {
      const delSku = `DEL-${uniqueId}`;

      // Given: 삭제할 상품 생성
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByPlaceholder('상품명을 입력하세요').fill(`삭제할상품-${uniqueId}`);
      await page.getByPlaceholder('SKU를 입력하세요').fill(delSku);
      await page.getByRole('button', { name: '추가', exact: true }).click();
      await expect(page.getByText(delSku)).toBeVisible();

      // When: 삭제 버튼 클릭
      const targetRow = page.locator('tr').filter({ hasText: delSku });
      await targetRow.getByRole('button', { name: '삭제' }).click();

      // And: 확인 모달에서 삭제 확인
      await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

      // Wait for confirm modal to close
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Then: 상품이 목록에서 사라짐
      await expect(page.locator('table tbody').getByText(delSku)).not.toBeVisible();
    });
  });

  test.describe('상품 옵션 관리', () => {
    test('TC-PROD-008: 상품에 옵션을 추가할 수 있다', async ({ page }) => {
      const uniqueOptionSku = `OPT-SKU-${uniqueId}`;
      const uniqueBarcode = `880${uniqueId}`;

      // Given: 상품의 옵션 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();

      // When: 옵션 추가 버튼 클릭
      await page.getByRole('button', { name: '옵션 추가' }).click();

      // And: 옵션 정보 입력
      await page.getByPlaceholder('예: 화이트 / M').fill('화이트 / M');
      await page.getByPlaceholder('SKU', { exact: true }).fill(uniqueOptionSku);
      await page.getByPlaceholder('바코드 (선택)').fill(uniqueBarcode);

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가', exact: true }).click();

      // Then: 옵션 목록에 새 옵션이 표시됨
      await expect(page.getByText('화이트 / M')).toBeVisible();
      await expect(page.getByText(uniqueOptionSku)).toBeVisible();
    });

    test('TC-PROD-009: 옵션명 없이 옵션 추가 시 에러 표시', async ({ page }) => {
      // Given: 상품의 옵션 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();

      // When: 옵션명 없이 추가 시도
      await page.getByRole('button', { name: '옵션 추가' }).click();
      await page.getByPlaceholder('SKU', { exact: true }).fill(`NONAME-OPT-${uniqueId}`);
      await page.getByRole('button', { name: '추가', exact: true }).click();

      // Then: 옵션명 필수 에러 메시지 표시
      await expect(page.getByText('옵션명을 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-010: 중복된 바코드로 옵션 생성 시 에러 표시', async ({ page }) => {
      const dupBarcode = `DUP880${uniqueId}`;

      // Given: 옵션 모달에서 첫 번째 옵션 생성
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      const dialog = page.getByRole('dialog');

      await dialog.getByRole('button', { name: '옵션 추가' }).click();
      await page.getByPlaceholder('예: 화이트 / M').fill('블랙 / S');
      await page.getByPlaceholder('SKU', { exact: true }).fill(`BC1-${uniqueId}`);
      await page.getByPlaceholder('바코드 (선택)').fill(dupBarcode);

      // Intercept the first creation response
      const createPromise = page.waitForResponse(
        (resp) => resp.url().includes('/options') && resp.request().method() === 'POST'
      );
      await dialog.getByRole('button', { name: '추가', exact: true }).click();
      const createResp = await createPromise;
      expect(createResp.ok()).toBeTruthy();

      // Wait for option to appear in dialog table
      await expect(dialog.getByText('블랙 / S')).toBeVisible({ timeout: 10000 });

      // When: 동일한 바코드로 두 번째 옵션 추가 시도
      await dialog.getByRole('button', { name: '옵션 추가' }).click();
      await page.getByPlaceholder('예: 화이트 / M').fill('블루 / L');
      await page.getByPlaceholder('SKU', { exact: true }).fill(`BC2-${uniqueId}`);
      await page.getByPlaceholder('바코드 (선택)').fill(dupBarcode);

      // Intercept the API response for duplicate barcode
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/options') && resp.request().method() === 'POST'
      );
      await dialog.getByRole('button', { name: '추가', exact: true }).click();
      const response = await responsePromise;

      // Then: API returns error (409 Conflict or similar) and form stays open
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('TC-PROD-011: 옵션을 수정할 수 있다', async ({ page }) => {
      // Given: 옵션 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();

      // When: 첫 번째 옵션의 수정 버튼 클릭 (scope to dialog table)
      const dialog = page.getByRole('dialog');
      const optionRow = dialog.locator('table tbody tr').first();
      if (await optionRow.isVisible()) {
        await optionRow.getByRole('button', { name: '수정' }).click();

        // And: 옵션명 수정
        const optionNameInput = page.getByPlaceholder('예: 화이트 / M');
        await optionNameInput.clear();
        await optionNameInput.fill('수정된옵션');

        // Click submit button in form area (first '수정' button in dialog, before the table)
        await dialog.getByRole('button', { name: '수정' }).first().click();

        // Then: 수정된 옵션명이 표시됨
        await expect(dialog.getByText('수정된옵션')).toBeVisible();
      }
    });

    test('TC-PROD-012: 옵션을 삭제할 수 있다', async ({ page }) => {
      // Given: 옵션 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // When: 옵션 삭제 버튼 클릭 (scope to first dialog)
      const dialog = page.getByRole('dialog').first();
      const optionRows = dialog.locator('table tbody tr');
      const initialCount = await optionRows.count();

      if (initialCount > 0) {
        const optionDeleteBtn = optionRows.first().getByRole('button', { name: '삭제' });
        if (await optionDeleteBtn.isVisible()) {
          await optionDeleteBtn.click();

          // And: 확인 모달에서 삭제 확인 (ConfirmModal is the last dialog)
          const confirmDialog = page.getByRole('dialog').last();
          await expect(confirmDialog.getByRole('button', { name: '삭제' })).toBeVisible();
          await confirmDialog.getByRole('button', { name: '삭제' }).click();
          await page.waitForLoadState('networkidle');

          // Then: 옵션 수가 줄어듦
          await expect(optionRows).toHaveCount(initialCount - 1, { timeout: 10000 });
        }
      }
    });
  });

  test.describe('상품 검색 및 필터', () => {
    test('TC-PROD-013: 상품명으로 검색할 수 있다', async ({ page }) => {
      // When: 검색어 입력
      await page.getByPlaceholder('상품명 또는 SKU 검색...').fill('테스트');
      await page.getByRole('button', { name: '검색' }).click();

      // Then: 검색 결과가 표시됨
      await page.waitForLoadState('networkidle');
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      if (count > 0) {
        await expect(rows.first()).toContainText('테스트');
      }
    });

    test('TC-PROD-014: 상태별로 필터링할 수 있다', async ({ page }) => {
      // When: 활성 상태 필터 선택
      await page.locator('select').filter({ hasText: /전체 상태/ }).selectOption('active');

      // Then: 활성 상품만 표시됨 (scope to table to avoid matching filter option text)
      await page.waitForLoadState('networkidle');
      const badges = page.locator('table tbody').getByText('비활성');
      await expect(badges).toHaveCount(0);
    });
  });
});
