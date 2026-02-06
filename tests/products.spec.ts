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
      await page.getByLabel('상품명').fill(productName);
      await page.getByLabel('SKU').fill(uniqueSku);
      await page.getByLabel('설명').fill('테스트 상품 설명입니다');

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 상품 목록에 새 상품이 표시됨
      await expect(page.getByText(productName)).toBeVisible();
      await expect(page.getByText(uniqueSku)).toBeVisible();
    });

    test('TC-PROD-002: 상품명 없이 생성 시 에러 표시', async ({ page }) => {
      // When: 상품 추가 모달 열기
      await page.getByRole('button', { name: '상품 추가' }).click();

      // And: 상품명 없이 SKU만 입력
      await page.getByLabel('SKU').fill(`NONAME-${uniqueId}`);
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 상품명 필수 에러 메시지 표시
      await expect(page.getByText('상품명을 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-003: SKU 없이 생성 시 에러 표시', async ({ page }) => {
      // When: 상품 추가 모달 열기
      await page.getByRole('button', { name: '상품 추가' }).click();

      // And: SKU 없이 상품명만 입력
      await page.getByLabel('상품명').fill('SKU없는상품');
      await page.getByRole('button', { name: '추가' }).click();

      // Then: SKU 필수 에러 메시지 표시
      await expect(page.getByText('SKU를 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-004: 중복된 SKU로 상품 생성 시 에러 표시', async ({ page }) => {
      const dupSku = `DUP-SKU-${uniqueId}`;

      // Given: 먼저 상품을 생성
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByLabel('상품명').fill('첫번째상품');
      await page.getByLabel('SKU').fill(dupSku);
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByText('첫번째상품')).toBeVisible();

      // When: 동일한 SKU로 다시 생성 시도
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByLabel('상품명').fill('중복SKU상품');
      await page.getByLabel('SKU').fill(dupSku);
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 중복 SKU 에러 메시지 표시
      await expect(page.getByText(/이미 존재|duplicate|already exists/i)).toBeVisible();
    });

    test('TC-PROD-005: 상품 정보를 수정할 수 있다', async ({ page }) => {
      // Given: 상품 목록에서 수정 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '수정' }).click();

      // When: 상품명 수정
      const nameInput = page.getByLabel('상품명');
      await nameInput.clear();
      await nameInput.fill('수정된상품명');

      // And: 저장
      await page.getByRole('button', { name: '수정' }).click();

      // Then: 수정된 상품명이 목록에 표시됨
      await expect(page.getByText('수정된상품명')).toBeVisible();
    });

    test('TC-PROD-006: 상품을 비활성화할 수 있다', async ({ page }) => {
      // Given: 상품 수정 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '수정' }).click();

      // When: 상태 토글을 비활성으로 변경
      const statusToggle = page.getByText('활성').or(page.locator('input[type="checkbox"]'));
      if (await statusToggle.isVisible()) {
        await statusToggle.click();
      }

      await page.getByRole('button', { name: '수정' }).click();

      // Then: 상품 상태가 비활성으로 변경됨
      await expect(page.getByText('비활성')).toBeVisible();
    });

    test('TC-PROD-007: 상품을 삭제할 수 있다', async ({ page }) => {
      // Given: 삭제할 상품 생성
      await page.getByRole('button', { name: '상품 추가' }).click();
      await page.getByLabel('상품명').fill('삭제할상품');
      await page.getByLabel('SKU').fill(`DEL-${uniqueId}`);
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByText('삭제할상품')).toBeVisible();

      // When: 삭제 버튼 클릭
      const targetRow = page.locator('tr').filter({ hasText: '삭제할상품' });
      await targetRow.getByRole('button', { name: '삭제' }).click();

      // And: 확인 모달에서 삭제 확인
      await page.getByRole('button', { name: '삭제' }).last().click();

      // Then: 상품이 목록에서 사라짐
      await expect(page.getByText('삭제할상품')).not.toBeVisible();
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
      await page.getByLabel('옵션명').fill('화이트 / M');
      await page.getByLabel('SKU').fill(uniqueOptionSku);
      await page.getByLabel('바코드').fill(uniqueBarcode);

      // And: 추가 버튼 클릭
      await page.getByRole('button', { name: '추가' }).click();

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
      await page.getByLabel('SKU').fill(`NONAME-OPT-${uniqueId}`);
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 옵션명 필수 에러 메시지 표시
      await expect(page.getByText('옵션명을 입력해주세요')).toBeVisible();
    });

    test('TC-PROD-010: 중복된 바코드로 옵션 생성 시 에러 표시', async ({ page }) => {
      const dupBarcode = `DUP880${uniqueId}`;

      // Given: 옵션 모달에서 첫 번째 옵션 생성
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();
      await page.getByRole('button', { name: '옵션 추가' }).click();
      await page.getByLabel('옵션명').fill('블랙 / S');
      await page.getByLabel('SKU').fill(`BC1-${uniqueId}`);
      await page.getByLabel('바코드').fill(dupBarcode);
      await page.getByRole('button', { name: '추가' }).click();
      await expect(page.getByText('블랙 / S')).toBeVisible();

      // When: 동일한 바코드로 두 번째 옵션 추가 시도
      await page.getByRole('button', { name: '옵션 추가' }).click();
      await page.getByLabel('옵션명').fill('블루 / L');
      await page.getByLabel('SKU').fill(`BC2-${uniqueId}`);
      await page.getByLabel('바코드').fill(dupBarcode);
      await page.getByRole('button', { name: '추가' }).click();

      // Then: 중복 바코드 에러 메시지 표시
      await expect(page.getByText(/이미 존재|duplicate|already exists/i)).toBeVisible();
    });

    test('TC-PROD-011: 옵션을 수정할 수 있다', async ({ page }) => {
      // Given: 옵션 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();

      // When: 첫 번째 옵션의 수정 버튼 클릭
      const optionRow = page.locator('table tbody tr').first();
      if (await optionRow.isVisible()) {
        await optionRow.getByRole('button', { name: '수정' }).click();

        // And: 옵션명 수정
        const optionNameInput = page.getByLabel('옵션명');
        await optionNameInput.clear();
        await optionNameInput.fill('수정된옵션');
        await page.getByRole('button', { name: '수정' }).click();

        // Then: 수정된 옵션명이 표시됨
        await expect(page.getByText('수정된옵션')).toBeVisible();
      }
    });

    test('TC-PROD-012: 옵션을 삭제할 수 있다', async ({ page }) => {
      // Given: 옵션 모달 열기
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.getByRole('button', { name: '옵션' }).click();

      // When: 옵션 삭제 버튼 클릭
      const optionDeleteBtn = page.locator('table tbody tr').first().getByRole('button', { name: '삭제' });
      if (await optionDeleteBtn.isVisible()) {
        const optionText = await page.locator('table tbody tr').first().textContent();
        await optionDeleteBtn.click();

        // And: 확인 모달에서 삭제 확인
        await page.getByRole('button', { name: '삭제' }).last().click();

        // Then: 옵션이 목록에서 사라짐
        await expect(page.locator('table tbody tr').first()).not.toHaveText(optionText || '');
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
      await page.locator('select').selectOption('active');

      // Then: 활성 상품만 표시됨
      await page.waitForLoadState('networkidle');
      const badges = page.getByText('비활성');
      await expect(badges).toHaveCount(0);
    });
  });
});
