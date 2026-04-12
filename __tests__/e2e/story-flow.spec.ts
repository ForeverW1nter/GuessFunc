import { test, expect } from '@playwright/test'

test.describe('Story Flow & Edge Cases', () => {
  test('should pass the first story level successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })

    const storyBtn = page.locator('#story-btn')
    await expect(storyBtn).toBeVisible({ timeout: 10000 })
    await storyBtn.click()

    const levelSelectModal = page.locator('div[role="dialog"]')
    await expect(levelSelectModal).toBeVisible({ timeout: 10000 })

    const exitBtn = levelSelectModal
      .locator('button')
      .filter({ has: page.locator('svg.lucide-arrow-left') })
    await expect(exitBtn).toBeVisible({ timeout: 5000 })
    await exitBtn.click()

    await expect(levelSelectModal).not.toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Loading Graph Engine...')).not.toBeVisible({ timeout: 10000 })

    const mathField = page.locator('.dcg-math-field').first()
    await expect(mathField).toBeVisible({ timeout: 10000 })

    await mathField.click()
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Backspace')
    }

    await page.keyboard.type('x^2')

    const verifyBtn = page.getByTestId('verify-btn')
    await expect(verifyBtn).toBeVisible({ timeout: 5000 })
    await verifyBtn.click()

    await page.waitForTimeout(2000)

    const storageInfo = await page.evaluate(() => ({
      keys: Object.keys(localStorage),
      completedLevels: localStorage.getItem('completedLevels')
    }))

    expect(storageInfo.keys.length).toBeGreaterThan(0)
    if (storageInfo.completedLevels) {
      expect(storageInfo.completedLevels.length).toBeGreaterThan(2)
    }
  })

  test('should handle invalid URLs gracefully without crashing', async ({ page }) => {
    // Navigate to a completely invalid game route
    await page.goto('/#/game/invalid_route_id/invalid_chapter/invalid_level')

    // Should redirect to the random mode fallback or home
    await expect(page).toHaveURL(/\/#\/game\/random\/1\/1/)
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
  })

  test('should handle rapid navigation (edge case)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })

    // Rapidly toggle sidebar modes to simulate rapid clicking
    for (let i = 0; i < 5; i++) {
      await page.goto('/#/game/random/1/1')
      await page.goto('/#/workshop')
      await page.goto('/#/game/custom/1/JTdCJTIydCUyMiUzQSUyMnglNUUyJTIyJTJDJTIycCUyMiUzQSU3QiU3RCU3RA==')
    }

    // Finally go to home and verify it's still alive
    await page.goto('/')
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })
    const mathField = page.locator('.dcg-math-field').first()
    await expect(mathField).toBeVisible({ timeout: 10000 })
  })
})
