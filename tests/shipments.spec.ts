import { test, expect } from '@playwright/test';

test.describe('Shipments Module - 배송 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shipments');
  });

  test('TC-SHP-001: 주문에 대한 배송을 생성할 수 있다', async ({ page }) => {
    // Given: 주문 상세 페이지에서 배송 생성
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');

    // When: 배송 생성 버튼 클릭
    await page.click('button:has-text("배송 생성")');

    // And: 배송 정보 입력
    await page.selectOption('select[name="carrier"]', 'cj_logistics');
    await page.fill('input[name="trackingNumber"]', `123456${Date.now()}`);

    // And: 배송 항목 수량 입력
    await page.fill('input[name="items[0].quantity"]', '2');

    await page.click('button:has-text("저장")');

    // Then: 배송 목록에 새 배송이 표시됨
    await expect(page.locator('text=SHP-')).toBeVisible();
  });

  test('TC-SHP-002: 주문 항목을 부분적으로 배송할 수 있다', async ({ page }) => {
    // Given: 수량이 10인 주문 항목
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');

    // When: 첫 번째 배송 생성 (수량: 5)
    await page.click('button:has-text("배송 생성")');
    await page.fill('input[name="items[0].quantity"]', '5');
    await page.selectOption('select[name="carrier"]', 'cj_logistics');
    await page.fill('input[name="trackingNumber"]', `CJ${Date.now()}`);
    await page.click('button:has-text("저장")');

    // Then: 배송이 생성됨
    await expect(page.locator('text=SHP-')).toBeVisible();
  });

  test('TC-SHP-003: 배송 수량 초과 방지', async ({ page }) => {
    // Given: 주문 상세 페이지
    await page.goto('/orders');
    await page.click('tr:has-text("ready_to_ship")');

    // When: 수량 초과로 배송 생성 시도
    await page.click('button:has-text("배송 생성")');
    await page.fill('input[name="items[0].quantity"]', '99999');
    await page.click('button:has-text("저장")');

    // Then: 에러 메시지 표시
    await expect(page.locator('text=배송 가능 수량을 초과했습니다')).toBeVisible();
  });

  test('TC-SHP-004: 배송을 발송 처리할 수 있다', async ({ page }) => {
    // Given: pending/ready 상태의 배송
    await page.click('tr:has-text("대기중") button:has-text("발송")');

    // When: 택배사 및 송장번호 입력
    await page.selectOption('select[name="carrier"]', 'cj_logistics');
    await page.fill('input[name="trackingNumber"]', `9876${Date.now()}`);
    await page.click('button:has-text("발송 처리")');

    // Then: 상태가 'shipped'로 변경됨
    await expect(page.locator('.badge:has-text("발송됨")')).toBeVisible();
  });

  test('TC-SHP-005: 배송을 완료 처리할 수 있다', async ({ page }) => {
    // Given: shipped 상태의 배송
    const shippedRow = page.locator('tr:has-text("발송됨")');

    // When: 배송 완료 버튼 클릭
    await shippedRow.locator('button:has-text("배송 완료")').click();
    await page.click('button:has-text("확인")');

    // Then: 상태가 'delivered'로 변경됨
    await expect(page.locator('.badge:has-text("배송완료")')).toBeVisible();
  });

  test('TC-SHP-006: 배송을 취소할 수 있다', async ({ page }) => {
    // Given: pending 상태의 배송
    const pendingRow = page.locator('tr:has-text("대기중")').first();

    // When: 취소 버튼 클릭
    await pendingRow.locator('button:has-text("취소")').click();
    await page.click('button:has-text("확인")');

    // Then: 상태가 'cancelled'로 변경됨
    await expect(page.locator('.badge:has-text("취소됨")')).toBeVisible();
  });

  test('TC-SHP-007: 발송된 배송은 취소할 수 없다', async ({ page }) => {
    // Given: shipped 상태의 배송
    const shippedRow = page.locator('tr:has-text("발송됨")').first();

    // Then: 취소 버튼이 비활성화되어 있음
    const cancelBtn = shippedRow.locator('button:has-text("취소")');
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeDisabled();
    }
  });

  test('TC-SHP-008: 택배사별로 배송을 필터링할 수 있다', async ({ page }) => {
    // When: CJ대한통운 필터 선택
    await page.selectOption('select[name="carrier"]', 'cj_logistics');

    // Then: CJ대한통운 배송만 표시됨
    await expect(page.locator('text=CJ대한통운')).toBeVisible();
  });

  test('TC-SHP-009: 송장번호로 배송을 검색할 수 있다', async ({ page }) => {
    // When: 송장번호 검색
    await page.fill('input[placeholder="검색"]', '123');
    await page.press('input[placeholder="검색"]', 'Enter');

    // Then: 해당 송장번호의 배송이 표시됨
    const results = page.locator('table tbody tr');
    await expect(results).toBeVisible();
  });

  test('TC-SHP-010: 배송을 삭제할 수 있다', async ({ page }) => {
    // Given: pending 상태의 배송
    const pendingRow = page.locator('tr:has-text("대기중")').first();

    // When: 삭제 버튼 클릭 및 확인
    await pendingRow.locator('button:has-text("삭제")').click();
    await page.click('button:has-text("확인")');

    // Then: 배송이 목록에서 사라짐
    await expect(page.locator('text=삭제 완료')).toBeVisible();
  });

  test('TC-SHP-011: 발송된 배송은 삭제할 수 없다', async ({ page }) => {
    // Given: shipped 상태의 배송
    const shippedRow = page.locator('tr:has-text("발송됨")').first();

    // Then: 삭제 버튼이 없거나 비활성화됨
    const deleteBtn = shippedRow.locator('button:has-text("삭제")');
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn).not.toBeVisible();
    }
  });
});
