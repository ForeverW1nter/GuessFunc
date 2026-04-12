# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: story-flow.spec.ts >> Story Flow & Edge Cases >> should pass the first story level successfully
- Location: __tests__\e2e\story-flow.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div[role="dialog"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('div[role="dialog"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button "退出系统" [ref=e9] [cursor=pointer]:
          - img [ref=e10]
          - generic [ref=e12]: 退出系统
        - generic [ref=e13]:
          - button "关闭音乐" [ref=e15] [cursor=pointer]:
            - img [ref=e18]
          - generic [ref=e23] [cursor=pointer]:
            - img [ref=e24]
            - generic [ref=e27]: 官方路线
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e32]: 官方路线
          - generic [ref=e34] [cursor=pointer]:
            - generic [ref=e35]:
              - img [ref=e36]
              - generic [ref=e38]: 新手教程
            - generic [ref=e40]: tutorial_route
        - generic [ref=e41]: 请选择一条线路
  - paragraph [ref=e42]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Story Flow & Edge Cases', () => {
  4  |   test('should pass the first story level successfully', async ({ page }) => {
  5  |     await page.goto('/')
  6  |     await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
  7  | 
  8  |     const storyBtn = page.locator('#story-btn')
  9  |     await expect(storyBtn).toBeVisible({ timeout: 10000 })
  10 |     await storyBtn.click()
  11 | 
  12 |     const levelSelectModal = page.locator('div[role="dialog"]')
> 13 |     await expect(levelSelectModal).toBeVisible({ timeout: 10000 })
     |                                    ^ Error: expect(locator).toBeVisible() failed
  14 | 
  15 |     const exitBtn = levelSelectModal
  16 |       .locator('button')
  17 |       .filter({ has: page.locator('svg.lucide-arrow-left') })
  18 |     await expect(exitBtn).toBeVisible({ timeout: 5000 })
  19 |     await exitBtn.click()
  20 | 
  21 |     await expect(levelSelectModal).not.toBeVisible({ timeout: 5000 })
  22 |     await expect(page.locator('text=Loading Graph Engine...')).not.toBeVisible({ timeout: 10000 })
  23 | 
  24 |     const mathField = page.locator('.dcg-math-field').first()
  25 |     await expect(mathField).toBeVisible({ timeout: 10000 })
  26 | 
  27 |     await mathField.click()
  28 |     for (let i = 0; i < 10; i++) {
  29 |       await page.keyboard.press('Backspace')
  30 |     }
  31 | 
  32 |     await page.keyboard.type('x^2')
  33 | 
  34 |     const verifyBtn = page.getByTestId('verify-btn')
  35 |     await expect(verifyBtn).toBeVisible({ timeout: 5000 })
  36 |     await verifyBtn.click()
  37 | 
  38 |     await page.waitForTimeout(2000)
  39 | 
  40 |     const storageInfo = await page.evaluate(() => ({
  41 |       keys: Object.keys(localStorage),
  42 |       completedLevels: localStorage.getItem('completedLevels')
  43 |     }))
  44 | 
  45 |     expect(storageInfo.keys.length).toBeGreaterThan(0)
  46 |     if (storageInfo.completedLevels) {
  47 |       expect(storageInfo.completedLevels.length).toBeGreaterThan(2)
  48 |     }
  49 |   })
  50 | 
  51 |   test('should handle invalid URLs gracefully without crashing', async ({ page }) => {
  52 |     // Navigate to a completely invalid game route
  53 |     await page.goto('/#/game/invalid_route_id/invalid_chapter/invalid_level')
  54 | 
  55 |     // Should redirect to the random mode fallback or home
  56 |     await expect(page).toHaveURL(/\/#\/game\/random\/1\/1/)
  57 |     await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
  58 |   })
  59 | 
  60 |   test('should handle rapid navigation (edge case)', async ({ page }) => {
  61 |     await page.goto('/')
  62 |     await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
  63 | 
  64 |     // Rapidly toggle sidebar modes to simulate rapid clicking
  65 |     for (let i = 0; i < 5; i++) {
  66 |       await page.goto('/#/game/random/1/1')
  67 |       await page.goto('/#/workshop')
  68 |       await page.goto('/#/game/custom/1/JTdCJTIydCUyMiUzQSUyMnglNUUyJTIyJTJDJTIycCUyMiUzQSU3QiU3RCU3RA==')
  69 |     }
  70 | 
  71 |     // Finally go to home and verify it's still alive
  72 |     await page.goto('/')
  73 |     await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
  74 |     const mathField = page.locator('.dcg-math-field').first()
  75 |     await expect(mathField).toBeVisible({ timeout: 10000 })
  76 |   })
  77 | })
  78 | 
```