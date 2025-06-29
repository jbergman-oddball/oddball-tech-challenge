import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page for unauthenticated users', async ({ page }) => {
    await expect(page.getByText("Oddball's Tech Challenge")).toBeVisible()
    await expect(page.getByText('Simplified Interview Platform')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should open auth modal when Get Started is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    await expect(page.getByText('Sign In')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
  })

  test('should switch between sign in and sign up forms', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Should start with sign in form
    await expect(page.getByText('Sign In')).toBeVisible()
    
    // Switch to sign up
    await page.getByText("Don't have an account? Sign up").click()
    await expect(page.getByText('Create Account')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your full name')).toBeVisible()
    
    // Switch back to sign in
    await page.getByText('Already have an account? Sign in').click()
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    await expect(page.getByText('Please fill in all required fields')).toBeVisible()
  })

  test('should validate password length', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    await page.getByPlaceholder('Enter your email').fill('test@example.com')
    await page.getByPlaceholder('Enter your password').fill('123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    await expect(page.getByText('Password must be at least 6 characters long')).toBeVisible()
  })

  test('should close modal when X is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    
    await expect(page.getByText('Sign In')).toBeVisible()
    
    await page.locator('button').filter({ hasText: '×' }).click()
    
    await expect(page.getByText('Sign In')).not.toBeVisible()
  })

  test('should show sign up form validation', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    await page.getByText("Don't have an account? Sign up").click()
    
    // Try to submit without full name
    await page.getByPlaceholder('Enter your email').fill('test@example.com')
    await page.getByPlaceholder('Create a password').fill('password123')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    await expect(page.getByText('Please enter your full name')).toBeVisible()
  })

  test('should display pending approval message for sign up', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click()
    await page.getByText("Don't have an account? Sign up").click()
    
    await expect(page.getByText('Your account will be reviewed by an administrator')).toBeVisible()
  })
})