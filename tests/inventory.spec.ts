import { test, expect } from '@playwright/test';

test.describe('Inventory Module - 재고 관리', () => {
  test.describe('창고 관리', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/warehouses');
    });

    test('TC-INV-001: 새 창고를 생성할 수 있다', async ({ page }) => {
      // When: 새 창고 추가 버튼 클릭
      await page.click('button:has-text("창고 추가")');

      // And: 창고 정보 입력
      const uniqueCode = `WH-${Date.now()}`;
      await page.fill('input[name="name"]', '서울 물류센터');
      await page.fill('input[name="code"]', uniqueCode);
      await page.fill('input[name="address"]', '서울시 강남구');
      await page.click('button:has-text("저장")');

      // Then: 창고 목록에 새 창고가 표시됨
      await expect(page.locator('text=서울 물류센터')).toBeVisible();
    });

    test('TC-INV-002: 창고에 위치를 추가할 수 있다', async ({ page }) => {
      // Given: 창고 상세 페이지로 이동
      await page.click('tr:has-text("물류센터")');

      // When: 위치 추가 버튼 클릭
      await page.click('button:has-text("위치 추가")');

      // And: 위치 정보 입력
      const uniqueCode = `A-01-${Date.now().toString().slice(-4)}`;
      await page.fill('input[name="name"]', uniqueCode);
      await page.fill('input[name="code"]', uniqueCode);
      await page.fill('input[name="zone"]', 'A');
      await page.fill('input[name="aisle"]', '01');
      await page.click('button:has-text("저장")');

      // Then: 위치 목록에 새 위치가 표시됨
      await expect(page.locator(`text=${uniqueCode}`)).toBeVisible();
    });
  });

  test.describe('재고 관리', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/inventory');
    });

    test('TC-INV-003: 상품 옵션에 대한 재고를 등록할 수 있다', async ({ page }) => {
      // When: 재고 추가 버튼 클릭
      await page.click('button:has-text("재고 추가")');

      // And: 재고 정보 입력
      await page.selectOption('select[name="productOption"]', { index: 1 });
      await page.selectOption('select[name="location"]', { index: 1 });
      await page.fill('input[name="quantity"]', '100');
      await page.fill('input[name="lowStockThreshold"]', '10');
      await page.click('button:has-text("저장")');

      // Then: 재고 목록에 새 재고가 표시됨
      await expect(page.locator('text=100')).toBeVisible();
    });

    test('TC-INV-004: 재고를 입고 처리할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 입고 버튼 클릭
      await page.click('button:has-text("입고")');

      // And: 입고 정보 입력
      await page.fill('input[name="quantity"]', '50');
      await page.fill('input[name="reason"]', '정기 입고');
      await page.click('button:has-text("확인")');

      // Then: 수량이 증가됨
      await expect(page.locator('text=입고 완료')).toBeVisible();
    });

    test('TC-INV-005: 재고를 출고 처리할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 출고 버튼 클릭
      await page.click('button:has-text("출고")');

      // And: 출고 정보 입력
      await page.fill('input[name="quantity"]', '20');
      await page.fill('input[name="reason"]', '주문 출고');
      await page.click('button:has-text("확인")');

      // Then: 수량이 감소됨
      await expect(page.locator('text=출고 완료')).toBeVisible();
    });

    test('TC-INV-006: 가용 수량을 초과하여 출고할 수 없다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 가용 수량 초과 출고 시도
      await page.click('button:has-text("출고")');
      await page.fill('input[name="quantity"]', '999999');
      await page.click('button:has-text("확인")');

      // Then: 에러 메시지 표시
      await expect(page.locator('text=가용 수량이 부족합니다')).toBeVisible();
    });

    test('TC-INV-007: 재고를 예약할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 예약 버튼 클릭
      await page.click('button:has-text("예약")');

      // And: 예약 정보 입력
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="reason"]', '주문 예약');
      await page.click('button:has-text("확인")');

      // Then: 예약 수량이 증가됨
      await expect(page.locator('text=예약: 10')).toBeVisible();
    });

    test('TC-INV-008: 예약된 재고를 해제할 수 있다', async ({ page }) => {
      // Given: 예약이 있는 재고 행 선택
      await page.click('tr:has-text("예약:")');

      // When: 예약 해제 버튼 클릭
      await page.click('button:has-text("예약 해제")');

      // And: 해제 정보 입력
      await page.fill('input[name="quantity"]', '5');
      await page.fill('input[name="reason"]', '주문 취소');
      await page.click('button:has-text("확인")');

      // Then: 예약 수량이 감소됨
      await expect(page.locator('text=예약 해제 완료')).toBeVisible();
    });

    test('TC-INV-009: 재고 실사 결과를 반영할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 조정 버튼 클릭
      await page.click('button:has-text("조정")');

      // And: 조정 정보 입력
      await page.fill('input[name="newQuantity"]', '95');
      await page.fill('input[name="reason"]', '실사 결과 반영');
      await page.click('button:has-text("확인")');

      // Then: 수량이 조정됨
      await expect(page.locator('text=95')).toBeVisible();
    });

    test('TC-INV-010: 재고를 다른 위치로 이동할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 이동 버튼 클릭
      await page.click('button:has-text("이동")');

      // And: 이동 정보 입력
      await page.selectOption('select[name="toLocation"]', { index: 1 });
      await page.fill('input[name="quantity"]', '30');
      await page.fill('input[name="reason"]', '창고 정리');
      await page.click('button:has-text("확인")');

      // Then: 이동 완료 메시지
      await expect(page.locator('text=이동 완료')).toBeVisible();
    });

    test('TC-INV-011: 재고 이동 이력을 조회할 수 있다', async ({ page }) => {
      // Given: 재고 행 선택
      await page.click('tr:has-text("화이트")');

      // When: 이력 탭 클릭
      await page.click('button:has-text("이동 이력")');

      // Then: 이동 이력 목록이 표시됨
      await expect(page.locator('text=INBOUND').or(page.locator('text=입고'))).toBeVisible();
    });

    test('TC-INV-012: 저재고 상품만 필터링할 수 있다', async ({ page }) => {
      // When: 저재고 필터 체크
      await page.check('input[name="lowStock"]');

      // Then: 저재고 상품만 표시됨
      await expect(page.locator('.low-stock-badge, [data-testid="low-stock"]')).toBeVisible();
    });

    test('TC-INV-013: 상품 > 옵션 > 위치 트리 구조로 재고를 조회할 수 있다', async ({ page }) => {
      // When: 상품 확장 버튼 클릭
      await page.click('tr:has-text("티셔츠") .expand-button');

      // Then: 옵션 목록이 펼쳐짐
      await expect(page.locator('text=화이트/M')).toBeVisible();

      // When: 옵션 확장 버튼 클릭
      await page.click('tr:has-text("화이트/M") .expand-button');

      // Then: 위치별 재고가 표시됨
      await expect(page.locator('text=A-01')).toBeVisible();
    });
  });
});
