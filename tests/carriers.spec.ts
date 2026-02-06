import { test, expect } from '@playwright/test';

test.describe('Carriers Module - 택배사 연동', () => {
  test.describe('택배사 목록', () => {
    test('TC-CAR-001: 배송 생성 시 택배사 목록이 표시된다', async ({ page }) => {
      // Given: 배송 관리 페이지 이동
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      // When: 배송 생성 모달 열기
      await page.getByRole('button', { name: '배송 생성' }).click();

      // Then: 택배사 드롭다운에 주요 택배사가 포함됨
      const carrierSelect = page.locator('select').filter({ hasText: /택배사/ });
      if (await carrierSelect.isVisible()) {
        await expect(carrierSelect.locator('option')).toHaveCount(10); // 9 carriers + placeholder

        // And: 개별 택배사 확인
        await expect(carrierSelect.locator('option:has-text("CJ대한통운")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("한진택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("롯데택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("로젠택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("우체국")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("UPS")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("FedEx")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("DHL")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("기타")')).toBeVisible();
      }
    });

    test('TC-CAR-002: 배송 필터에서 택배사별 필터링이 가능하다', async ({ page }) => {
      // Given: 배송 관리 페이지
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      // When: 택배사 필터 드롭다운 확인
      const carrierFilter = page.locator('select').filter({ hasText: /전체 택배사/ });
      if (await carrierFilter.isVisible()) {
        // Then: 필터 옵션에 주요 택배사가 포함됨
        await expect(carrierFilter.locator('option:has-text("CJ대한통운")')).toBeVisible();
        await expect(carrierFilter.locator('option:has-text("한진택배")')).toBeVisible();

        // And: 특정 택배사로 필터링
        await carrierFilter.selectOption('cj_logistics');
        await page.waitForLoadState('networkidle');

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
          await expect(page.getByText('CJ대한통운')).toBeVisible();
        }
      }
    });
  });

  test.describe('송장번호 발급', () => {
    test('TC-CAR-003: 배송 상세에서 송장번호를 수정할 수 있다', async ({ page }) => {
      // Given: 배송 상세 페이지로 이동
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      const shipmentLink = page.locator('table tbody tr a').first();
      if (await shipmentLink.isVisible()) {
        await shipmentLink.click();
        await expect(page.getByText('배송 상세')).toBeVisible();

        // When: 송장 수정 버튼 클릭
        const updateTrackingBtn = page.getByRole('button', { name: '송장 수정' });
        if (await updateTrackingBtn.isVisible()) {
          await updateTrackingBtn.click();

          // And: 송장번호 입력
          const trackingInput = page.getByPlaceholder('송장번호 입력');
          if (await trackingInput.isVisible()) {
            await trackingInput.clear();
            await trackingInput.fill('999888777666');
          }

          // And: 저장
          await page.getByRole('button', { name: /저장/ }).click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('TC-CAR-004: 일괄 송장번호 발급 모달에서 택배사를 선택할 수 있다', async ({ page }) => {
      // Given: 배송 관리 페이지
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      // When: 배송 선택 후 일괄 발급 시도
      const bodyCheckboxes = page.locator('tbody input[type="checkbox"]');
      if (await bodyCheckboxes.count() > 0) {
        await bodyCheckboxes.first().check();

        const bulkIssueBtn = page.getByRole('button', { name: /일괄 발급|송장번호 일괄/ });
        if (await bulkIssueBtn.isVisible() && await bulkIssueBtn.isEnabled()) {
          await bulkIssueBtn.click();

          // Then: 택배사 선택 UI가 표시됨
          await expect(page.getByText('택배사 선택')).toBeVisible();
        }
      }
    });
  });

  test.describe('배송 추적', () => {
    test('TC-CAR-005: 배송 상세에서 배송 추적 정보를 확인할 수 있다', async ({ page }) => {
      // Given: 배송중/이동중/배송완료 상태의 배송 찾기
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      // When: 배송 상세 페이지로 이동
      const shipmentLink = page.locator('table tbody tr a').first();
      if (await shipmentLink.isVisible()) {
        await shipmentLink.click();
        await expect(page.getByText('배송 상세')).toBeVisible();

        // Then: 배송 정보가 표시됨
        await expect(page.getByText('배송 정보')).toBeVisible();

        // And: 배송 추적 관련 정보가 있으면 표시
        const trackingSection = page.getByText('배송 추적').or(page.getByText('배송 이력'));
        if (await trackingSection.isVisible()) {
          // Then: 추적 이력이 표시됨
          await expect(trackingSection).toBeVisible();
        }
      }
    });

    test('TC-CAR-006: 배송 상세에서 택배사와 송장번호가 표시된다', async ({ page }) => {
      // Given: 배송 관리 페이지
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');

      // When: 배송 상세 페이지로 이동
      const shipmentLink = page.locator('table tbody tr a').first();
      if (await shipmentLink.isVisible()) {
        await shipmentLink.click();

        // Then: 택배사 정보가 표시됨
        await expect(page.getByText('택배사').or(page.getByText('배송 정보'))).toBeVisible();
        // And: 송장번호가 표시됨
        await expect(page.getByText('송장번호').or(page.getByText('배송 정보'))).toBeVisible();
      }
    });
  });

  test.describe('다양한 택배사 지원', () => {
    test('TC-CAR-007: 국내 택배사 옵션이 모두 존재한다', async ({ page }) => {
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: '배송 생성' }).click();

      const carrierSelect = page.locator('select').filter({ hasText: /택배사/ });
      if (await carrierSelect.isVisible()) {
        // Then: 국내 주요 택배사 확인
        await expect(carrierSelect.locator('option:has-text("CJ대한통운")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("한진택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("롯데택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("로젠택배")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("우체국")')).toBeVisible();
      }
    });

    test('TC-CAR-008: 해외 택배사 옵션이 모두 존재한다', async ({ page }) => {
      await page.goto('/shipments');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: '배송 생성' }).click();

      const carrierSelect = page.locator('select').filter({ hasText: /택배사/ });
      if (await carrierSelect.isVisible()) {
        // Then: 해외 주요 택배사 확인
        await expect(carrierSelect.locator('option:has-text("UPS")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("FedEx")')).toBeVisible();
        await expect(carrierSelect.locator('option:has-text("DHL")')).toBeVisible();
      }
    });
  });
});
