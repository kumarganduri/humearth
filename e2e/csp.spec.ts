import { expect, test } from '@playwright/test';

// Production's Content-Security-Policy (public/_headers) is also served by the test server (vite.config.ts),
// so anything the policy blocks shows up here. Found on the hum-v2 preview deploy: the policy blocked the
// race's inline style attributes, leaving the data-centre bar at zero width.
for (const path of ['/', '/how-we-know.html', '/question']) {
  test(`no Content-Security-Policy violations on ${path}, and the bars have width`, async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (m) => {
      if (/Content Security Policy/i.test(m.text())) violations.push(m.text().slice(0, 160));
    });
    const res = await page.goto(path);
    expect(res!.headers()['content-security-policy']).toContain("style-src 'self'");
    if (path === '/') {
      await expect(page.locator('#slider')).toBeEnabled({ timeout: 10_000 });
      const w = await page.locator('.row.dc .fill').evaluate((el) => el.getBoundingClientRect().width);
      expect(w).toBeGreaterThan(20);
      await page.locator('#slider').fill('2035'); // the slider path must also stay within the policy
      await expect(page.locator('.row.dc .band')).toHaveCount(1);
      const bw = await page.locator('.row.dc .band').evaluate((el) => el.getBoundingClientRect().width);
      expect(bw).toBeGreaterThan(20);
    }
    expect(violations).toEqual([]);
  });
}
