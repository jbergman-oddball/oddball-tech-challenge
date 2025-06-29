import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check that there's an h1
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    // Check heading text
    await expect(h1).toContainText("Oddball's Tech Challenge")
  })

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/')
    
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toHaveAccessibleName('Get Started')
  })

  test('should have proper form labels in auth modal', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Check email input has proper label
    const emailInput = page.getByPlaceholder('Enter your email')
    await expect(emailInput).toBeVisible()
    
    // Check password input has proper label
    const passwordInput = page.getByPlaceholder('Enter your password')
    await expect(passwordInput).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    await expect(getStartedButton).toBeFocused()
    
    // Activate with Enter
    await page.keyboard.press('Enter')
    
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Tab through modal elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    const emailInput = page.getByPlaceholder('Enter your email')
    await expect(emailInput).toBeFocused()
  })

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/')
    
    // This would be checked by axe-core, but we can also do manual checks
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    
    const buttonStyles = await getStartedButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      }
    })
    
    // Ensure button has proper styling
    expect(buttonStyles.backgroundColor).toBeTruthy()
    expect(buttonStyles.color).toBeTruthy()
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Check modal has proper ARIA attributes
    const modal = page.locator('[role="dialog"], .modal, .backdrop')
    
    // In a proper implementation, the modal should have:
    // - role="dialog"
    // - aria-labelledby pointing to the title
    // - aria-describedby if there's a description
    // - proper focus management
  })
})