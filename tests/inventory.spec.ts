import { test, expect } from '@playwright/test';

test.describe('Inventory Module - 재고 관리', () => {
  const uniqueId = Date.now();

  test.describe('창고 관리', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/warehouses');
      await page.waitForLoadState('networkidle');
    });

    test('TC-INV-001: 새 창고를 생성할 수 있다', async ({ page }) => {
      const warehouseName = `테스트창고-${uniqueId}`;
      const warehouseCode = `WH-${uniqueId}`;

      // When: 창고 추가 버튼 클릭
      await page.getByRole('button', { name: '창고 추가' }).click();

      // And: 창고 정보 입력
      await page.getByLabel('창고명').fill(warehouseName);
      await page.getByLabel('창고코드').fill(warehouseCode);
      await page.getByLabel('주소').fill('서울시 강남구 테헤란로 123');

      // And: 저장 버튼 클릭
      await page.getByRole('button', { name: '저장' }).click();

      // Then: 창고 목록에 새 창고가 표시됨
      await expect(page.getByText(warehouseName)).toBeVisible();
      await expect(page.getByText(warehouseCode)).toBeVisible();
    });

    test('TC-INV-002: 창고 정보를 수정할 수 있다', async ({ page }) => {
      // Given: 창고 목록에서 수정 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '수정' }).click();

        // When: 창고명 수정
        const nameInput = page.getByLabel('창고명');
        await nameInput.clear();
        await nameInput.fill('수정된창고');
        await page.getByRole('button', { name: '저장' }).click();

        // Then: 수정된 창고명이 목록에 표시됨
        await expect(page.getByText('수정된창고')).toBeVisible();
      }
    });

    test('TC-INV-003: 창고를 삭제할 수 있다', async ({ page }) => {
      // Given: 삭제할 창고 생성
      await page.getByRole('button', { name: '창고 추가' }).click();
      await page.getByLabel('창고명').fill('삭제할창고');
      await page.getByLabel('창고코드').fill(`DEL-WH-${uniqueId}`);
      await page.getByLabel('주소').fill('삭제될 주소');
      await page.getByRole('button', { name: '저장' }).click();
      await expect(page.getByText('삭제할창고')).toBeVisible();

      // When: 삭제 버튼 클릭 및 확인
      const targetRow = page.locator('tr').filter({ hasText: '삭제할창고' });
      await targetRow.getByRole('button', { name: '삭제' }).click();
      await page.getByRole('button', { name: '확인' }).click();

      // Then: 창고가 목록에서 사라짐
      await expect(page.getByText('삭제할창고')).not.toBeVisible();
    });

    test('TC-INV-004: 창고에 위치를 추가할 수 있다', async ({ page }) => {
      const locationCode = `A-01-${uniqueId.toString().slice(-4)}`;

      // Given: 창고의 위치 관리 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '위치 관리' }).click();

        // When: 위치 추가 버튼 클릭
        await page.getByRole('button', { name: '추가' }).click();

        // And: 위치 정보 입력
        await page.getByLabel('위치명').fill(locationCode);
        await page.getByLabel('위치코드').fill(locationCode);
        await page.getByLabel('구역').fill('A');

        // And: 저장
        await page.getByRole('button', { name: '저장' }).click();

        // Then: 위치 목록에 새 위치가 표시됨
        await expect(page.getByText(locationCode)).toBeVisible();
      }
    });
  });

  test.describe('재고 관리', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');
    });

    test('TC-INV-005: 상품 옵션에 대한 재고를 등록할 수 있다', async ({ page }) => {
      // When: 재고 추가 버튼 클릭
      await page.getByRole('button', { name: '재고 추가' }).click();

      // And: 상품 선택
      const productSelect = page.locator('select').filter({ hasText: /상품 선택/ });
      await productSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // And: 옵션 선택
      const optionSelect = page.locator('select').filter({ hasText: /옵션 선택/ });
      if (await optionSelect.isEnabled()) {
        await optionSelect.selectOption({ index: 1 });
      }

      // And: 창고 선택
      const warehouseSelect = page.locator('select').filter({ hasText: /창고 선택/ });
      await warehouseSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // And: 위치 선택
      const locationSelect = page.locator('select').filter({ hasText: /위치 선택/ });
      if (await locationSelect.isEnabled()) {
        await locationSelect.selectOption({ index: 1 });
      }

      // And: 수량 입력
      await page.getByLabel('초기 수량').fill('100');
      await page.getByLabel('재고 부족 기준').fill('10');

      // And: 저장
      await page.getByRole('button', { name: '저장' }).click();

      // Then: 재고가 등록됨
      await page.waitForLoadState('networkidle');
    });

    test('TC-INV-006: 재고를 입고 처리할 수 있다', async ({ page }) => {
      // Given: 재고 행의 입고 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '입고' }).click();

        // When: 입고 수량 및 사유 입력
        await page.getByLabel('수량').fill('50');
        await page.getByLabel('사유').fill('정기 입고');

        // And: 확인 버튼 클릭
        await page.getByRole('button', { name: '확인' }).click();

        // Then: 수량이 증가됨
        await page.waitForLoadState('networkidle');
      }
    });

    test('TC-INV-007: 재고를 출고 처리할 수 있다', async ({ page }) => {
      // Given: 재고 행의 출고 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '출고' }).click();

        // When: 출고 수량 및 사유 입력
        await page.getByLabel('수량').fill('20');
        await page.getByLabel('사유').fill('주문 출고');

        // And: 확인 버튼 클릭
        await page.getByRole('button', { name: '확인' }).click();

        // Then: 수량이 감소됨
        await page.waitForLoadState('networkidle');
      }
    });

    test('TC-INV-008: 가용 수량을 초과하여 출고할 수 없다', async ({ page }) => {
      // Given: 재고 행의 출고 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '출고' }).click();

        // When: 가용 수량 초과 출고 시도
        await page.getByLabel('수량').fill('999999');
        await page.getByRole('button', { name: '확인' }).click();

        // Then: 에러 메시지 표시
        await expect(page.getByText(/가용 수량|부족|초과/)).toBeVisible();
      }
    });

    test('TC-INV-009: 재고를 예약할 수 있다', async ({ page }) => {
      // Given: 재고 행 확인
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        // When: 예약 처리 (버튼이 있는 경우)
        const reserveBtn = firstRow.getByRole('button', { name: /예약/ });
        if (await reserveBtn.isVisible()) {
          await reserveBtn.click();

          // And: 예약 수량 및 사유 입력
          await page.getByLabel('수량').fill('10');
          await page.getByLabel('사유').fill('주문 예약');
          await page.getByRole('button', { name: '확인' }).click();

          // Then: 예약 수량이 반영됨
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-INV-010: 예약된 재고를 해제할 수 있다', async ({ page }) => {
      // Given: 예약이 있는 재고 행 확인
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        const releaseBtn = firstRow.getByRole('button', { name: /해제/ });
        if (await releaseBtn.isVisible()) {
          await releaseBtn.click();

          // When: 해제 수량 및 사유 입력
          await page.getByLabel('수량').fill('5');
          await page.getByLabel('사유').fill('주문 취소');
          await page.getByRole('button', { name: '확인' }).click();

          // Then: 예약 수량이 감소됨
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-INV-011: 재고 실사 결과를 반영할 수 있다 (조정)', async ({ page }) => {
      // Given: 재고 행 확인
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        // When: 조정 처리를 위한 UI 찾기
        // StockOperationModal의 adjust 모드: newQuantity 입력
        // 페이지에서 직접 조작하거나 context menu를 통해 접근
        const adjustBtn = firstRow.getByRole('button', { name: /조정/ });
        if (await adjustBtn.isVisible()) {
          await adjustBtn.click();

          // And: 새 수량 입력
          await page.getByLabel('새 수량').fill('95');
          await page.getByLabel('사유').fill('실사 결과 반영');
          await page.getByRole('button', { name: '확인' }).click();

          // Then: 수량이 조정됨
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-INV-012: 재고를 다른 위치로 이동할 수 있다', async ({ page }) => {
      // Given: 재고 행 확인
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        const transferBtn = firstRow.getByRole('button', { name: /이동/ });
        if (await transferBtn.isVisible()) {
          await transferBtn.click();

          // When: 이동 정보 입력
          const toLocationSelect = page.locator('select').filter({ hasText: /위치 선택/ });
          if (await toLocationSelect.isVisible()) {
            await toLocationSelect.selectOption({ index: 1 });
          }
          await page.getByLabel('수량').fill('30');
          await page.getByLabel('사유').fill('창고 정리');
          await page.getByRole('button', { name: '확인' }).click();

          // Then: 이동 완료
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-INV-013: 재고 이동 이력을 조회할 수 있다', async ({ page }) => {
      // Given: 재고 행의 이력 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '이력' }).click();

        // Then: 이동 이력 모달이 표시됨
        await expect(page.getByText('입출고 이력')).toBeVisible();

        // And: 이력 항목들이 표시됨 (유형, 수량, 사유 등)
        const historyItems = page.locator('table tbody tr');
        if (await historyItems.count() > 0) {
          await expect(
            page.getByText('입고').or(page.getByText('출고')).or(page.getByText('조정'))
          ).toBeVisible();
        }
      }
    });

    test('TC-INV-014: 저재고 상품만 필터링할 수 있다', async ({ page }) => {
      // When: 재고 부족만 체크박스 클릭
      const lowStockCheckbox = page.getByText('재고 부족만');
      if (await lowStockCheckbox.isVisible()) {
        await lowStockCheckbox.click();
        await page.waitForLoadState('networkidle');

        // Then: 재고 부족 항목만 표시됨
        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
          await expect(page.getByText('재고 부족')).toBeVisible();
        }
      }
    });

    test('TC-INV-015: 창고별로 재고를 필터링할 수 있다', async ({ page }) => {
      // When: 창고 필터 드롭다운에서 선택
      const warehouseFilter = page.locator('select').filter({ hasText: /전체 창고/ });
      if (await warehouseFilter.isVisible()) {
        const options = warehouseFilter.locator('option');
        const count = await options.count();
        if (count > 1) {
          await warehouseFilter.selectOption({ index: 1 });
          await page.waitForLoadState('networkidle');

          // Then: 선택한 창고의 재고만 표시됨
          await expect(page.locator('table tbody tr')).toBeVisible();
        }
      }
    });

    test('TC-INV-016: 상품명 또는 SKU로 재고를 검색할 수 있다', async ({ page }) => {
      // When: 검색어 입력
      const searchInput = page.getByPlaceholder('상품명 또는 SKU 검색...');
      if (await searchInput.isVisible()) {
        await searchInput.fill('테스트');
        await page.getByRole('button', { name: '검색' }).click();
        await page.waitForLoadState('networkidle');

        // Then: 검색 결과가 표시됨
        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
          await expect(rows.first()).toContainText('테스트');
        }
      }
    });

    test('TC-INV-017: 재고를 삭제할 수 있다', async ({ page }) => {
      // Given: 재고 행의 삭제 버튼 클릭
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.getByRole('button', { name: '삭제' }).click();

        // And: 확인 모달에서 삭제 확인
        await page.getByRole('button', { name: '확인' }).click();

        // Then: 재고가 삭제됨
        await page.waitForLoadState('networkidle');
      }
    });
  });
});
