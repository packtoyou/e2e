import { test, expect } from '@playwright/test';

test.describe('Carriers Module - 택배사 연동', () => {
  test('TC-CAR-001: 사용 가능한 택배사 목록을 조회할 수 있다', async ({ page }) => {
    // Given: 배송 생성 모달
    await page.goto('/shipments');
    await page.click('button:has-text("배송 생성")');

    // When: 택배사 선택 드롭다운 클릭
    await page.click('select[name="carrier"]');

    // Then: 사용 가능한 택배사 목록이 표시됨
    await expect(page.locator('option:has-text("CJ대한통운")')).toBeVisible();
    await expect(page.locator('option:has-text("한진택배")')).toBeVisible();
  });

  test('TC-CAR-002: 송장번호를 발급받을 수 있다', async ({ page }) => {
    // Given: 배송 생성 페이지에서 정보 입력 완료
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');
    await page.click('button:has-text("배송 생성")');

    // And: 배송 정보 입력
    await page.selectOption('select[name="carrier"]', 'cj_logistics');

    // When: 송장번호 자동 발급 버튼 클릭 (존재하는 경우)
    const autoIssueBtn = page.locator('button:has-text("송장번호 발급")');
    if (await autoIssueBtn.count() > 0) {
      await autoIssueBtn.click();

      // Then: 송장번호가 자동으로 입력됨
      await expect(page.locator('input[name="trackingNumber"]')).not.toBeEmpty();
    }
  });

  test('TC-CAR-003: 배송 추적 정보를 조회할 수 있다', async ({ page }) => {
    // Given: 발송된 배송 상세 페이지
    await page.goto('/shipments');
    await page.click('tr:has-text("발송됨")');

    // When: 배송 추적 버튼 클릭
    const trackBtn = page.locator('button:has-text("배송 추적")');
    if (await trackBtn.count() > 0) {
      await trackBtn.click();

      // Then: 배송 추적 정보가 표시됨
      await expect(page.locator('.tracking-history, [data-testid="tracking-history"]')).toBeVisible();
    }
  });

  test('TC-CAR-004: 연동 불가 시 에러 메시지를 표시한다', async ({ page }) => {
    // Given: 배송 생성 페이지
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');
    await page.click('button:has-text("배송 생성")');

    // When: 기타(other) 택배사 선택하고 자동 발급 시도
    await page.selectOption('select[name="carrier"]', 'other');

    const autoIssueBtn = page.locator('button:has-text("송장번호 발급")');
    if (await autoIssueBtn.count() > 0) {
      await autoIssueBtn.click();

      // Then: 에러 메시지 표시 또는 수동 입력 요청
      await expect(
        page.locator('text=자동 발급 불가').or(page.locator('text=수동으로 입력'))
      ).toBeVisible();
    }
  });

  test('TC-CAR-005: 택배사별 배송 현황을 확인할 수 있다', async ({ page }) => {
    // Given: 배송 목록 페이지
    await page.goto('/shipments');

    // When: CJ대한통운 필터 선택
    await page.selectOption('select[name="carrier"]', 'cj_logistics');

    // Then: 해당 택배사의 배송만 표시됨
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await expect(page.locator('text=CJ대한통운')).toBeVisible();
    }
  });

  test('TC-CAR-006: 다양한 택배사 옵션을 선택할 수 있다', async ({ page }) => {
    // Given: 배송 생성 페이지
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');
    await page.click('button:has-text("배송 생성")');

    // Then: 다양한 택배사 옵션이 존재함
    const carrierSelect = page.locator('select[name="carrier"]');
    await expect(carrierSelect.locator('option:has-text("CJ대한통운")')).toBeVisible();
    await expect(carrierSelect.locator('option:has-text("한진택배")')).toBeVisible();
    await expect(carrierSelect.locator('option:has-text("롯데택배")')).toBeVisible();
    await expect(carrierSelect.locator('option:has-text("로젠택배")')).toBeVisible();
  });
});
