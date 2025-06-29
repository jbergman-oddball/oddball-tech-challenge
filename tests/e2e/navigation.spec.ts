import { test, expect } from '@playwright/test'

test.describe('Navigation and UI', () => {
  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle("Oddball's Tech Challenge Lite")
  })

  test('should display main branding elements', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    await expect(page.getByText('Simplified Interview Platform')).toBeVisible()
    await expect(page.getByText('Powered by Supabase')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')
    
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.goto('/')
    
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
    await page.goto('/')
    
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should have proper contrast and accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading structure
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    // Check for proper button accessibility
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toBeEnabled()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Tab to the Get Started button
    await page.keyboard.press('Tab')
    
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    await expect(getStartedButton).toBeFocused()
    
    // Press Enter to activate
    await page.keyboard.press('Enter')
    
    await expect(page.getByText('Sign In')).toBeVisible()
  })
})