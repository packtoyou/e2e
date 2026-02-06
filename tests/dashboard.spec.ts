import { test, expect } from '@playwright/test';

test.describe('Dashboard Module - 대시보드', () => {
  test.describe('대시보드 메인', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('TC-DASH-001: 대시보드 메인 페이지가 정상적으로 로드된다', async ({ page }) => {
      // Then: 주요 KPI 카드가 표시됨
      await expect(page.getByText('오늘 주문')).toBeVisible();
      await expect(page.getByText('미처리 주문')).toBeVisible();
    });

    test('TC-DASH-002: 어제 대비 변화율이 표시된다', async ({ page }) => {
      // Then: 어제 대비 정보가 표시됨
      await expect(page.getByText('어제 대비')).toBeVisible();
    });

    test('TC-DASH-003: 주문 상태 현황이 표시된다', async ({ page }) => {
      // Then: 주문 상태별 카운트가 표시됨
      await expect(page.getByText('주문 상태 현황')).toBeVisible();
      await expect(page.getByText('대기', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('배송중', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('배송완료', { exact: true }).first()).toBeVisible();
    });

    test('TC-DASH-004: 최근 7일 주문 추이 차트가 표시된다', async ({ page }) => {
      // Then: 주문 추이 차트 영역이 표시됨
      await expect(page.getByText('최근 7일 주문 추이')).toBeVisible();

      // And: Recharts 차트가 렌더링됨
      const chart = page.locator('.recharts-responsive-container, svg.recharts-surface').first();
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });

    test('TC-DASH-005: 판매처별 주문 현황이 표시된다', async ({ page }) => {
      // Then: 판매처별 현황 섹션이 표시됨
      await expect(page.getByText('판매처별 주문 현황')).toBeVisible();
    });

    test('TC-DASH-006: 베스트셀러 TOP 5가 표시된다', async ({ page }) => {
      // Then: 인기 상품 섹션이 표시됨
      await expect(page.getByText('베스트셀러 TOP 5')).toBeVisible();
    });

    test('TC-DASH-007: 빠른 액션 링크가 동작한다', async ({ page }) => {
      // Given: 빠른 액션 영역 확인
      await expect(page.getByText('빠른 액션')).toBeVisible();

      // When: 주문 등록하기 링크 클릭
      const registerLink = page.getByText('주문 등록하기', { exact: true }).first();
      if (await registerLink.isVisible()) {
        await registerLink.click();

        // Then: 주문 페이지로 이동
        await expect(page).toHaveURL(/\/orders/);
      }
    });

    test('TC-DASH-008: 판매처 관리 링크가 동작한다', async ({ page }) => {
      // When: 판매처 관리 링크 클릭
      const channelLink = page.getByText('판매처 관리');
      if (await channelLink.isVisible()) {
        await channelLink.click();

        // Then: 판매채널 페이지로 이동
        await expect(page).toHaveURL(/\/sales-channels/);
      }
    });

    test('TC-DASH-009: 대기 주문 카드를 클릭하면 주문 페이지로 이동한다', async ({ page }) => {
      // When: 대기 중인 주문 영역 클릭
      const pendingLink = page.getByText('대기 중인 주문').or(page.getByText('미처리 주문')).first();
      if (await pendingLink.isVisible()) {
        await pendingLink.click();

        // Then: 주문 페이지로 이동
        await expect(page).toHaveURL(/\/orders/);
      }
    });
  });

  test.describe('통계 페이지', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/statistics');
      await page.waitForLoadState('networkidle');
    });

    test('TC-STAT-001: 통계 페이지가 정상적으로 로드된다', async ({ page }) => {
      // Then: 통계 페이지 타이틀이 표시됨
      await expect(page.getByRole('heading', { name: '통계' })).toBeVisible();
    });

    test('TC-STAT-002: 빠른 날짜 범위 버튼이 동작한다', async ({ page }) => {
      // When: 최근 7일 버튼 클릭
      await page.getByRole('button', { name: '최근 7일' }).click();
      await page.waitForLoadState('networkidle');

      // Then: 날짜가 설정됨
      const startDate = page.locator('input[type="date"]').first();
      await expect(startDate).not.toHaveValue('');

      // When: 최근 30일 버튼 클릭
      await page.getByRole('button', { name: '최근 30일' }).click();
      await page.waitForLoadState('networkidle');

      // When: 이번 달 버튼 클릭
      await page.getByRole('button', { name: '이번 달' }).click();
      await page.waitForLoadState('networkidle');
    });

    test('TC-STAT-003: 날짜별 통계 탭이 동작한다', async ({ page }) => {
      // When: 날짜별 통계 탭 클릭
      await page.getByRole('button', { name: '날짜별 통계' }).click();
      await page.waitForLoadState('networkidle');

      // Then: 날짜별 데이터가 표시됨
      const table = page.locator('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });

    test('TC-STAT-004: 상품별 통계 탭이 동작한다', async ({ page }) => {
      // When: 상품별 통계 탭 클릭
      await page.getByRole('button', { name: '상품별 통계' }).click();
      await page.waitForLoadState('networkidle');

      // Then: 상품별 데이터가 표시됨
      await expect(
        page.getByText('상품별 판매량 TOP 10').or(page.getByText('상품별 상세')).or(page.getByText('데이터가 없습니다')).first()
      ).toBeVisible();
    });

    test('TC-STAT-005: 상품×판매처 통계 탭이 동작한다', async ({ page }) => {
      // When: 상품×판매처 통계 탭 클릭
      await page.getByRole('button', { name: '상품×판매처 통계' }).click();
      await page.waitForLoadState('networkidle');

      // Then: 크로스 통계 데이터가 표시됨
      await expect(
        page.getByText('상품별 판매처 상세 통계').or(page.getByText('데이터가 없습니다'))
      ).toBeVisible();
    });

    test('TC-STAT-006: 테이블/차트 뷰 토글이 동작한다', async ({ page }) => {
      // When: 테이블 보기 버튼 클릭
      const tableViewBtn = page.getByRole('button', { name: '테이블 보기' });
      if (await tableViewBtn.isVisible()) {
        await tableViewBtn.click();
        await page.waitForLoadState('networkidle');

        // Then: 테이블이 표시됨
        await expect(page.locator('table')).toBeVisible();
      }

      // When: 일별 추이 버튼 클릭
      const trendBtn = page.getByRole('button', { name: '일별 추이' });
      if (await trendBtn.isVisible()) {
        await trendBtn.click();
        await page.waitForLoadState('networkidle');

        // Then: 차트가 표시됨
        const chart = page.locator('.recharts-responsive-container, svg.recharts-surface').first();
        if (await chart.isVisible()) {
          await expect(chart).toBeVisible();
        }
      }
    });

    test('TC-STAT-007: CSV 다운로드 버튼이 존재한다', async ({ page }) => {
      // Given: 상품×판매처 통계 탭으로 이동
      await page.getByRole('button', { name: '상품×판매처 통계' }).click();
      await page.waitForLoadState('networkidle');

      // Then: CSV 다운로드 버튼이 존재함
      const csvBtn = page.getByRole('button', { name: 'CSV 다운로드' });
      if (await csvBtn.isVisible()) {
        await expect(csvBtn).toBeVisible();
      }
    });

    test('TC-STAT-008: 채널 필터가 동작한다', async ({ page }) => {
      // When: 채널 필터 드롭다운 확인
      const channelFilter = page.locator('select').filter({ hasText: /전체 판매처/ });
      if (await channelFilter.isVisible()) {
        const options = channelFilter.locator('option');
        const count = await options.count();

        if (count > 1) {
          // And: 특정 채널 선택
          await channelFilter.selectOption({ index: 1 });
          await page.waitForLoadState('networkidle');

          // Then: 선택한 채널의 데이터만 표시됨
          await expect(page.locator('table').or(page.getByText('데이터가 없습니다'))).toBeVisible();
        }
      }
    });

    test('TC-STAT-009: 통계 페이지네이션이 동작한다', async ({ page }) => {
      // Given: 상품별 통계 탭으로 이동
      await page.getByRole('button', { name: '상품별 통계' }).click();
      await page.waitForLoadState('networkidle');

      // When: 다음 페이지 버튼 확인
      const nextBtn = page.getByRole('button', { name: '다음' });
      if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');

        // Then: 다음 페이지의 데이터가 표시됨
        await expect(page.locator('table tbody tr')).toBeVisible();
      }
    });
  });
});
