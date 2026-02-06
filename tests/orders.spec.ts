import { test, expect } from '@playwright/test';

test.describe('Orders Module - 주문 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
  });

  test('TC-ORD-001: 수동으로 주문을 생성할 수 있다', async ({ page }) => {
    // When: 새 주문 추가 버튼 클릭
    await page.click('button:has-text("주문 추가")');

    // And: 고객 정보 입력
    await page.fill('input[name="customerName"]', '홍길동');
    await page.fill('input[name="customerEmail"]', 'hong@example.com');
    await page.fill('input[name="customerPhone"]', '010-1234-5678');

    // And: 배송 주소 입력
    await page.fill('input[name="zipCode"]', '12345');
    await page.fill('input[name="address1"]', '서울시 강남구');
    await page.fill('input[name="address2"]', '테헤란로 123');

    // And: 상품 추가
    await page.click('button:has-text("상품 추가")');
    await page.selectOption('select[name="product"]', { index: 1 });
    await page.selectOption('select[name="option"]', { index: 1 });
    await page.fill('input[name="quantity"]', '2');

    // And: 저장
    await page.click('button:has-text("저장")');

    // Then: 주문 목록에 새 주문이 표시됨
    await expect(page.locator('text=홍길동')).toBeVisible();
    await expect(page.locator('.badge:has-text("대기중")')).toBeVisible();
  });

  test('TC-ORD-002: 주문 상태로 필터링할 수 있다', async ({ page }) => {
    // When: 상태 필터에서 'pending' 선택
    await page.selectOption('select[name="status"]', 'pending');

    // Then: pending 상태의 주문만 표시됨
    await expect(page.locator('.badge:has-text("대기중")')).toBeVisible();
    await expect(page.locator('.badge:has-text("출고준비")')).not.toBeVisible();
  });

  test('TC-ORD-003: 날짜 범위로 주문을 필터링할 수 있다', async ({ page }) => {
    // When: 날짜 범위 설정
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("검색")');

    // Then: 필터가 적용됨
    await expect(page.locator('table tbody tr')).toBeVisible();
  });

  test('TC-ORD-004: 재고 할당 미리보기를 확인할 수 있다', async ({ page }) => {
    // When: 재고 할당 미리보기 버튼 클릭
    await page.click('button:has-text("재고 할당 미리보기")');

    // Then: 미리보기 결과가 모달에 표시됨
    await expect(page.locator('text=할당 가능:')).toBeVisible();
    await expect(page.locator('text=스킵 예정:')).toBeVisible();
  });

  test('TC-ORD-005: 재고 할당을 실행할 수 있다', async ({ page }) => {
    // Given: 재고 할당 미리보기 확인 후
    await page.click('button:has-text("재고 할당 미리보기")');

    // When: 재고 할당 실행 버튼 클릭
    await page.click('button:has-text("재고 할당 실행")');

    // Then: 진행 상황이 표시되고 완료 메시지가 나타남
    await expect(page.locator('text=재고 할당 완료')).toBeVisible({ timeout: 60000 });
  });

  test('TC-ORD-006: 재고 할당 진행 상황을 실시간으로 확인할 수 있다', async ({ page }) => {
    // Given: 재고 할당 실행
    await page.click('button:has-text("재고 할당 실행")');

    // Then: 진행률이 실시간으로 업데이트됨
    await expect(page.locator('text=처리중')).toBeVisible();
    await expect(page.locator('.progress-bar, [role="progressbar"]')).toBeVisible();

    // And: 완료될 때까지 대기
    await expect(page.locator('text=완료')).toBeVisible({ timeout: 120000 });
  });

  test('TC-ORD-007: 재고 부족으로 스킵된 주문 사유를 확인할 수 있다', async ({ page }) => {
    // Given: 재고 할당 완료 후
    await page.click('button:has-text("재고 할당 실행")');
    await expect(page.locator('text=재고 할당 완료')).toBeVisible({ timeout: 60000 });

    // When: 스킵된 주문 상세 보기 클릭
    const skippedBtn = page.locator('button:has-text("스킵된 주문 보기")');
    if (await skippedBtn.isVisible()) {
      await skippedBtn.click();

      // Then: 스킵 사유가 표시됨
      await expect(page.locator('text=재고 부족')).toBeVisible();
    }
  });

  test('TC-ORD-008: 주문 상세 정보를 조회할 수 있다', async ({ page }) => {
    // When: 특정 주문 클릭
    await page.click('tr:has-text("ORD-")');

    // Then: 주문 상세 페이지로 이동
    await expect(page).toHaveURL(/\/orders\/\d+/);
    await expect(page.locator('text=주문 상세')).toBeVisible();
    await expect(page.locator('text=주문 항목')).toBeVisible();
  });

  test('TC-ORD-009: 주문 정보를 수정할 수 있다', async ({ page }) => {
    // Given: 주문 상세 페이지로 이동
    await page.click('tr:has-text("ORD-")');

    // When: 수정 버튼 클릭
    await page.click('button:has-text("수정")');

    // And: 메모 수정
    await page.fill('textarea[name="note"]', '수정된 메모');
    await page.click('button:has-text("저장")');

    // Then: 수정된 내용이 반영됨
    await expect(page.locator('text=수정된 메모')).toBeVisible();
  });

  test('TC-ORD-010: 주문을 삭제할 수 있다', async ({ page }) => {
    // Given: 삭제할 주문 선택
    const targetRow = page.locator('tr:has-text("삭제할주문")');

    // When: 삭제 버튼 클릭 및 확인
    await targetRow.locator('button:has-text("삭제")').click();
    await page.click('button:has-text("확인")');

    // Then: 주문이 목록에서 사라짐
    await expect(page.locator('text=삭제할주문')).not.toBeVisible();
  });

  test('TC-ORD-011: 주문번호로 검색할 수 있다', async ({ page }) => {
    // When: 검색어 입력
    await page.fill('input[placeholder="검색"]', 'ORD-');
    await page.press('input[placeholder="검색"]', 'Enter');

    // Then: 해당 주문이 표시됨
    await expect(page.locator('text=ORD-')).toBeVisible();
  });
});
