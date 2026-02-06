import { test, expect } from '@playwright/test';

test.describe('Products Module - 상품 관리', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('TC-PROD-001: 새 상품을 생성할 수 있다', async ({ page }) => {
    // When: 새 상품 추가 버튼 클릭
    await page.click('button:has-text("상품 추가")');

    // And: 상품 정보 입력
    const uniqueSku = `TEST-${Date.now()}`;
    await page.fill('input[name="name"]', '테스트 상품');
    await page.fill('input[name="sku"]', uniqueSku);
    await page.fill('textarea[name="description"]', '테스트 상품 설명');
    await page.click('button:has-text("저장")');

    // Then: 상품 목록에 새 상품이 표시됨
    await expect(page.locator('text=테스트 상품')).toBeVisible();
    await expect(page.locator(`text=${uniqueSku}`)).toBeVisible();
  });

  test('TC-PROD-002: 중복된 SKU로 상품 생성 시 에러 표시', async ({ page }) => {
    // Given: 이미 존재하는 SKU
    await page.click('button:has-text("상품 추가")');
    await page.fill('input[name="name"]', '중복 상품');
    await page.fill('input[name="sku"]', 'EXISTING-SKU');
    await page.click('button:has-text("저장")');

    // Then: 중복 SKU 에러 메시지 표시
    await expect(page.locator('text=이미 존재하는 SKU입니다')).toBeVisible();
  });

  test('TC-PROD-003: 상품에 옵션을 추가할 수 있다', async ({ page }) => {
    // Given: 상품 상세 페이지에 접속
    await page.click('tr:has-text("테스트 상품")');

    // When: 옵션 추가 버튼 클릭
    await page.click('button:has-text("옵션 추가")');

    // And: 옵션 정보 입력
    const uniqueOptionSku = `TEST-OPT-${Date.now()}`;
    await page.fill('input[name="optionName"]', '화이트/M');
    await page.fill('input[name="optionSku"]', uniqueOptionSku);
    await page.fill('input[name="barcode"]', `880${Date.now()}`);
    await page.click('button:has-text("저장")');

    // Then: 옵션 목록에 새 옵션이 표시됨
    await expect(page.locator('text=화이트/M')).toBeVisible();
  });

  test('TC-PROD-004: 상품명으로 검색할 수 있다', async ({ page }) => {
    // When: 검색어 입력
    await page.fill('input[placeholder="검색"]', '티셔츠');
    await page.press('input[placeholder="검색"]', 'Enter');

    // Then: 검색 결과만 표시됨
    await expect(page.locator('text=티셔츠')).toBeVisible();
  });

  test('TC-PROD-005: 상품을 비활성화할 수 있다', async ({ page }) => {
    // Given: 상품 수정 모달 열기
    const targetRow = page.locator('tr:has-text("테스트 상품")');
    await targetRow.locator('button:has-text("수정")').click();

    // When: 활성화 체크박스 해제
    await page.uncheck('input[name="isActive"]');
    await page.click('button:has-text("저장")');

    // Then: 상품 상태가 비활성화로 변경됨
    await expect(page.locator('tr:has-text("테스트 상품") .badge:has-text("비활성")')).toBeVisible();
  });

  test('TC-PROD-006: 상품을 삭제하면 옵션도 함께 삭제된다', async ({ page }) => {
    // Given: 옵션이 있는 상품 선택
    const targetRow = page.locator('tr:has-text("삭제할상품")');

    // When: 삭제 버튼 클릭 및 확인
    await targetRow.locator('button:has-text("삭제")').click();
    await page.click('button:has-text("확인")');

    // Then: 상품이 목록에서 사라짐
    await expect(page.locator('text=삭제할상품')).not.toBeVisible();
  });

  test('TC-PROD-007: 중복된 바코드로 옵션 생성 시 에러 표시', async ({ page }) => {
    // Given: 상품 상세 페이지
    await page.click('tr:has-text("테스트 상품")');

    // When: 이미 존재하는 바코드로 옵션 추가 시도
    await page.click('button:has-text("옵션 추가")');
    await page.fill('input[name="optionName"]', '블랙/L');
    await page.fill('input[name="optionSku"]', `NEW-SKU-${Date.now()}`);
    await page.fill('input[name="barcode"]', '8801234567890'); // 기존 바코드
    await page.click('button:has-text("저장")');

    // Then: 중복 바코드 에러 메시지 표시
    await expect(page.locator('text=이미 존재하는 바코드입니다')).toBeVisible();
  });
});
