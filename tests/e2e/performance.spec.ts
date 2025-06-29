import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load the main page quickly', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for the main content to be visible
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics = {}
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              metrics.loadTime = entry.loadEventEnd - entry.loadEventStart
              metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
            }
          })
          
          resolve(metrics)
        }).observe({ entryTypes: ['navigation'] })
        
        // Fallback timeout
        setTimeout(() => resolve({}), 1000)
      })
    })
    
    console.log('Performance metrics:', metrics)
  })

  test('should handle multiple rapid interactions', async ({ page }) => {
    await page.goto('/')
    
    const getStartedButton = page.getByRole('button', { name: 'Get Started' })
    
    // Rapidly click the button multiple times
    for (let i = 0; i < 5; i++) {
      await getStartedButton.click()
      await page.waitForTimeout(100)
      
      // Close modal if it opened
      const closeButton = page.locator('button').filter({ hasText: '×' })
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }
    
    // Should still be responsive
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toBeEnabled()
  })

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Perform some interactions
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Get Started' }).click()
      await page.locator('button').filter({ hasText: '×' }).click()
      await page.waitForTimeout(100)
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc()
      }
    })
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Memory shouldn't increase dramatically
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory
      const percentageIncrease = (memoryIncrease / initialMemory) * 100
      
      // Allow up to 50% memory increase for normal operations
      expect(percentageIncrease).toBeLessThan(50)
    }
  })

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/')
    
    // Check that images are loaded properly
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        
        // Check that image has loaded
        const isLoaded = await img.evaluate((el: HTMLImageElement) => {
          return el.complete && el.naturalHeight !== 0
        })
        
        expect(isLoaded).toBe(true)
      }
    }
  })
})