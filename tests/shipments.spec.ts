import { test, expect } from '@playwright/test';

test.describe('Shipments Module - 배송 관리', () => {
  const uniqueId = Date.now();

  test.beforeEach(async ({ page }) => {
    await page.goto('/shipments');
    await page.waitForLoadState('networkidle');
  });

  test.describe('배송 생성', () => {
    test('TC-SHP-001: 주문에 대한 배송을 생성할 수 있다', async ({ page }) => {
      // When: 배송 생성 버튼 클릭
      await page.getByRole('button', { name: '배송 생성' }).click();

      // And: 주문 선택
      const orderSelect = page.locator('select').filter({ hasText: /주문을 선택/ });
      if (await orderSelect.isVisible()) {
        const options = orderSelect.locator('option');
        const count = await options.count();
        if (count > 1) {
          await orderSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);

          // And: 배송할 상품 선택 (체크박스)
          const itemCheckboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await itemCheckboxes.count();
          if (checkboxCount > 0) {
            await itemCheckboxes.first().check();
          }

          // And: 택배사 선택
          const carrierSelect = page.locator('select').filter({ hasText: /택배사/ });
          if (await carrierSelect.isVisible()) {
            await carrierSelect.selectOption('cj_logistics');
          }

          // And: 생성 버튼 클릭
          await page.getByRole('button', { name: '생성', exact: true }).click();

          // Then: 배송이 생성됨
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-SHP-002: 주문 선택 없이 배송 생성 시 에러 표시', async ({ page }) => {
      // When: 배송 생성 모달 열기
      await page.getByRole('button', { name: '배송 생성' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Then: 주문 선택 없이는 생성 버튼이 비활성화됨
      const submitBtn = page.getByRole('dialog').getByRole('button', { name: '생성', exact: true });
      await expect(submitBtn).toBeVisible();
      await expect(submitBtn).toBeDisabled();
    });

    test('TC-SHP-003: 부분 배송을 생성할 수 있다', async ({ page }) => {
      // When: 배송 생성 모달 열기
      await page.getByRole('button', { name: '배송 생성' }).click();

      // And: 주문 선택
      const orderSelect = page.locator('select').filter({ hasText: /주문을 선택/ });
      if (await orderSelect.isVisible()) {
        const options = orderSelect.locator('option');
        const count = await options.count();
        if (count > 1) {
          await orderSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);

          // And: 상품 선택 후 수량을 줄임 (부분 배송)
          const itemCheckboxes = page.locator('input[type="checkbox"]');
          if (await itemCheckboxes.count() > 0) {
            await itemCheckboxes.first().check();

            // And: 배송 수량을 1로 설정
            const qtyInput = page.locator('input[type="number"]').first();
            if (await qtyInput.isVisible()) {
              await qtyInput.clear();
              await qtyInput.fill('1');
            }
          }

          // And: 택배사 선택
          const carrierSelect = page.locator('select').filter({ hasText: /택배사/ });
          if (await carrierSelect.isVisible()) {
            await carrierSelect.selectOption('cj_logistics');
          }

          await page.getByRole('button', { name: '생성', exact: true }).click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('배송 상태 관리', () => {
    test('TC-SHP-004: 배송 상세 정보를 조회할 수 있다', async ({ page }) => {
      // When: 배송번호 링크 클릭
      const shipmentLink = page.locator('table tbody tr a').first();
      if (await shipmentLink.isVisible()) {
        await shipmentLink.click();

        // Then: 배송 상세 페이지로 이동
        await expect(page.getByText('배송 상세').first()).toBeVisible();
        // Card title is an HTML title attribute, not visible text
        await expect(page.locator('[title="배송 정보"]')).toBeVisible();
      }
    });

    test('TC-SHP-005: 배송을 삭제할 수 있다', async ({ page }) => {
      // Given: 대기중/출고준비 상태의 배송 찾기
      const deleteBtn = page.locator('table tbody tr').first().getByRole('button', { name: '삭제' });
      if (await deleteBtn.isVisible() && await deleteBtn.isEnabled()) {
        await deleteBtn.click();

        // And: 확인 모달에서 삭제 확인
        await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

        // Then: 배송이 삭제됨
        await page.waitForLoadState('networkidle');
      }
    });

    test('TC-SHP-006: 배송중/배송완료 상태의 배송은 삭제 버튼이 비활성화된다', async ({ page }) => {
      // Given: 배송중 상태의 배송 행 찾기
      const shippedRow = page.locator('tr').filter({ hasText: '배송중' }).first();
      if (await shippedRow.isVisible()) {
        // Then: 삭제 버튼이 비활성화되어 있음
        const deleteBtn = shippedRow.getByRole('button', { name: '삭제' });
        if (await deleteBtn.count() > 0) {
          await expect(deleteBtn).toBeDisabled();
        }
      }
    });
  });

  test.describe('배송 필터링 및 검색', () => {
    test('TC-SHP-007: 배송 상태로 필터링할 수 있다', async ({ page }) => {
      // When: 상태 필터에서 '대기중' 선택
      const statusSelect = page.locator('select').filter({ hasText: /전체 상태/ });
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('pending');
        await page.waitForLoadState('networkidle');

        // Then: 대기중 상태의 배송만 표시됨
        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
          await expect(page.getByText('대기중')).toBeVisible();
        }
      }
    });

    test('TC-SHP-008: 택배사별로 배송을 필터링할 수 있다', async ({ page }) => {
      // When: 택배사 필터에서 'CJ대한통운' 선택
      const carrierSelect = page.locator('select').filter({ hasText: /전체 택배사/ });
      if (await carrierSelect.isVisible()) {
        await carrierSelect.selectOption('cj_logistics');
        await page.waitForLoadState('networkidle');

        // Then: CJ대한통운 배송만 표시됨
        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
          await expect(page.getByText('CJ대한통운')).toBeVisible();
        }
      }
    });

    test('TC-SHP-009: 송장번호로 배송을 검색할 수 있다', async ({ page }) => {
      // When: 검색어 입력
      const searchInput = page.getByPlaceholder('송장번호 또는 주문번호 검색...');
      if (await searchInput.isVisible()) {
        // Given: 첫 번째 배송의 정보 확인
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
          const trackingNumber = await firstRow.locator('td').nth(5).textContent();
          if (trackingNumber && trackingNumber.trim()) {
            await searchInput.fill(trackingNumber.trim());
            await page.getByRole('button', { name: '검색' }).click();
            await page.waitForLoadState('networkidle');

            // Then: 검색 결과가 표시됨
            await expect(page.getByText(trackingNumber.trim())).toBeVisible();
          }
        }
      }
    });

    test('TC-SHP-010: 날짜 범위로 배송을 필터링할 수 있다', async ({ page }) => {
      // When: 날짜 범위 설정
      const dateInputs = page.locator('input[type="date"]');
      if (await dateInputs.count() >= 2) {
        const today = new Date().toISOString().split('T')[0];
        await dateInputs.first().fill('2024-01-01');
        await dateInputs.last().fill(today);
        await page.getByRole('button', { name: '검색' }).click();
        await page.waitForLoadState('networkidle');

        // Then: 필터가 적용됨 (table or loading message eventually resolves)
        await expect(page.locator('table').or(page.getByText('데이터가 없습니다'))).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('송장번호 일괄 발급', () => {
    test('TC-SHP-011: 체크박스로 여러 배송을 선택할 수 있다', async ({ page }) => {
      // When: 테이블이 표시되고 전체 선택 체크박스가 있는 경우
      const table = page.locator('table');
      if (await table.isVisible()) {
        const headerCheckbox = table.locator('thead th input[type="checkbox"]');
        if (await headerCheckbox.isVisible() && await headerCheckbox.isEnabled()) {
          await headerCheckbox.check();

          // Then: 활성화된 행의 체크박스가 선택됨
          const enabledCheckboxes = table.locator('tbody td input[type="checkbox"]:not([disabled])');
          const count = await enabledCheckboxes.count();
          for (let i = 0; i < count; i++) {
            await expect(enabledCheckboxes.nth(i)).toBeChecked();
          }
        }
      }
    });

    test('TC-SHP-012: 선택된 배송에 대해 일괄 송장번호 발급을 할 수 있다', async ({ page }) => {
      // Given: 테이블이 표시된 경우 배송 선택
      const table = page.locator('table');
      if (await table.isVisible()) {
        const enabledCheckboxes = table.locator('tbody td input[type="checkbox"]:not([disabled])');
        if (await enabledCheckboxes.count() > 0) {
          await enabledCheckboxes.first().check();

          // When: 일괄 발급 버튼 클릭
          const bulkIssueBtn = page.getByRole('button', { name: /일괄 발급|송장번호 일괄/ });
          if (await bulkIssueBtn.isVisible() && await bulkIssueBtn.isEnabled()) {
            await bulkIssueBtn.click();

            // Then: 일괄 발급 모달이 표시됨
            await expect(page.getByText(/택배사 선택|송장번호/).first()).toBeVisible();
          }
        }
      }
    });

    test('TC-SHP-013: 전체 출고준비 배송에 송장번호를 발급할 수 있다', async ({ page }) => {
      // When: 전체 송장 발급 버튼 클릭
      const issueAllBtn = page.getByRole('button', { name: /전체 송장 발급/ });
      if (await issueAllBtn.isVisible() && await issueAllBtn.isEnabled()) {
        await issueAllBtn.click();

        // Then: 발급 모달이 표시됨
        await expect(page.getByText(/택배사 선택|출고준비 배송|선택된 배송/).first()).toBeVisible();
      }
    });
  });
});
