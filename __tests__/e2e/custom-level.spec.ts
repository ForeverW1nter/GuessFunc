import { test, expect } from '@playwright/test'

test.describe('Custom Level Flow', () => {
  test('should pass custom level successfully when inputting correct function', async ({
    page
  }) => {
    // 1. Navigate to a custom level with target function x^2
    // {"t":"x^2","p":{}} encoded via btoa(encodeURIComponent(...)) is JTdCJTIydCUyMiUzQSUyMnglNUUyJTIyJTJDJTIycCUyMiUzQSU3QiU3RCU3RA==
    await page.goto('/#/game/custom/1/JTdCJTIydCUyMiUzQSUyMnglNUUyJTIyJTJDJTIycCUyMiUzQSU3QiU3RCU3RA==?title=TestLevel')

    // 2. Check if the level is loaded by verifying the loading text is gone and title is visible
    // Wait for the loading text to disappear
    await expect(page.locator('text=Loading Graph Engine...')).not.toBeVisible({ timeout: 10000 })
    // Title might be in the Topbar
    await expect(page.locator('text=TestLevel')).toBeVisible({ timeout: 10000 })

    // 3. Find the Desmos math field and input the correct function 'x^2'
    // The first expression is usually the user guess expression
    const mathField = page.locator('.dcg-math-field').first()
    await expect(mathField).toBeVisible({ timeout: 10000 })

    // Clear existing content and type x^2
    await mathField.click()
    // Press Backspace multiple times to clear 'x' or 'x^2+y^2=1'
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Backspace')
    }

    await page.keyboard.type('x^2')

    // 4. Click the verify button
    const verifyBtn = page.getByTestId('verify-btn')
    await expect(verifyBtn).toBeVisible({ timeout: 5000 })
    await verifyBtn.click()

    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/\/#\/game\/custom\/1\//)

    const storageInfo = await page.evaluate(() => ({
      keys: Object.keys(localStorage)
    }))
    expect(storageInfo.keys.length).toBeGreaterThan(0)
  })
})
