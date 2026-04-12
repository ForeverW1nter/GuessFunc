import { test, expect } from '@playwright/test'

test.describe('Offline Flow', () => {
  test('should work offline', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 10000 })

    // Wait for math field to be visible before setting offline
    const mathField = page.locator('.dcg-math-field').first()
    await expect(mathField).toBeVisible({ timeout: 15000 })

    // Set offline mode
    await context.setOffline(true)

    // Test basic interaction while offline
    await mathField.click()
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Backspace')
    }
    await page.keyboard.type('x')

    const verifyBtn = page.getByTestId('verify-btn')
    await expect(verifyBtn).toBeVisible({ timeout: 5000 })
    await verifyBtn.click()

    // Ensure the app didn't crash and still shows the main UI
    await expect(page.locator('.app-container, main')).toBeVisible({ timeout: 5000 })

    await context.setOffline(false)
  })
})
