import { test, expect } from '@playwright/test';

test.describe('Dashboard Module - 대시보드 및 통계', () => {
  test('TC-DASH-001: 대시보드 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // Given & When: 대시보드 페이지 접속
    await page.goto('/');

    // Then: 주요 KPI가 표시됨
    await expect(page.locator('text=오늘 주문')).toBeVisible();
    await expect(page.locator('text=어제 대비')).toBeVisible();
  });

  test('TC-DASH-002: 일별 주문 추이 차트가 표시된다', async ({ page }) => {
    // Given: 대시보드 페이지
    await page.goto('/');

    // Then: 차트가 표시됨
    await expect(page.locator('.daily-chart, [data-testid="daily-chart"], .recharts-responsive-container')).toBeVisible();
    await expect(page.locator('text=최근 7일')).toBeVisible();
  });

  test('TC-DASH-003: 채널별 주문 현황이 표시된다', async ({ page }) => {
    // Given: 대시보드 페이지
    await page.goto('/');

    // Then: 채널별 통계가 표시됨
    await expect(page.locator('text=채널별 현황')).toBeVisible();
  });

  test('TC-DASH-004: 주문 상태별 카운트가 표시된다', async ({ page }) => {
    // Given: 대시보드 페이지
    await page.goto('/');

    // Then: 상태별 카운트가 표시됨
    await expect(page.locator('text=대기중').or(page.locator('text=pending'))).toBeVisible();
    await expect(page.locator('text=출고준비').or(page.locator('text=ready_to_ship'))).toBeVisible();
  });

  test('TC-DASH-005: 인기 상품 목록이 표시된다', async ({ page }) => {
    // Given: 대시보드 페이지
    await page.goto('/');

    // Then: 인기 상품 목록이 표시됨
    await expect(page.locator('text=인기 상품')).toBeVisible();
    await expect(page.locator('.top-products-list, [data-testid="top-products"]')).toBeVisible();
  });

  test('TC-DASH-006: 어제 대비 변화율이 표시된다', async ({ page }) => {
    // Given: 대시보드 페이지
    await page.goto('/');

    // Then: 변화율이 표시됨 (양수/음수/0)
    await expect(page.locator('.change-rate, [data-testid="change-rate"]')).toBeVisible();
  });

  test('TC-DASH-007: 날짜 범위를 설정하여 통계를 조회할 수 있다', async ({ page }) => {
    // Given: 통계 페이지
    await page.goto('/statistics');

    // When: 날짜 범위 설정
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("조회")');

    // Then: 해당 기간 통계가 표시됨
    await expect(page.locator('text=2024-01-01')).toBeVisible();
  });

  test('TC-DASH-008: 통계 페이지에서 상세 분석을 할 수 있다', async ({ page }) => {
    // Given: 통계 페이지
    await page.goto('/statistics');

    // Then: 상세 통계 섹션들이 표시됨
    await expect(page.locator('text=상품별 판매 현황')).toBeVisible();
    await expect(page.locator('text=채널별 판매 현황')).toBeVisible();
  });
});
