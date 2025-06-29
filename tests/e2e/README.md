# E2E Testing Guide

## Overview

This directory contains end-to-end tests using Playwright. These tests verify the complete user workflows and ensure the application works correctly from a user's perspective.

## Test Structure

- `auth.spec.ts` - Authentication flow tests
- `navigation.spec.ts` - Navigation and UI responsiveness tests
- `challenge-creator.spec.ts` - AI Challenge Creator functionality
- `accessibility.spec.ts` - Accessibility compliance tests
- `performance.spec.ts` - Performance and Core Web Vitals tests

## Running Tests

### Local Development
```bash
# Install Playwright browsers
npm run test:setup

# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### CI/CD
Tests automatically run in the GitHub Actions pipeline on:
- Push to main/develop branches
- Pull requests to main branch

## Test Data

Tests use mock data and don't require a real Supabase connection. Authentication states are mocked using `page.addInitScript()`.

## Browser Coverage

Tests run on:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Debugging Failed Tests

1. Check the test output for specific error messages
2. Review screenshots in `test-results/` directory
3. Use `--debug` flag to step through tests
4. Check the HTML report: `npx playwright show-report`

## Best Practices

1. Use data-testid attributes for reliable element selection
2. Wait for elements to be visible before interacting
3. Use page.waitForLoadState() for network-dependent operations
4. Mock external dependencies and API calls
5. Keep tests independent and idempotent