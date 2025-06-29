# Unit Testing Guide

## Overview

This directory contains unit tests using Vitest and React Testing Library. These tests verify individual components and utility functions work correctly in isolation.

## Test Structure

- `components/` - Component tests
- `lib/` - Utility function tests
- `setup.ts` - Test environment configuration

## Running Tests

### Local Development
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### CI/CD
Tests automatically run in the GitHub Actions pipeline with coverage reporting.

## Test Environment

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Environment**: jsdom
- **Mocking**: Vitest built-in mocks

## Mocking Strategy

### Supabase
All Supabase operations are mocked in `setup.ts` to avoid real database calls.

### Authentication
Auth context is mocked per test to simulate different user states.

### External APIs
External services (like Tavus.io) are mocked to ensure tests are deterministic.

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../MyComponent'

test('should render correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Utility Tests
```typescript
import { myUtility } from '../myUtility'

test('should process input correctly', () => {
  const result = myUtility('input')
  expect(result).toBe('expected output')
})
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Best Practices

1. Test behavior, not implementation
2. Use descriptive test names
3. Arrange, Act, Assert pattern
4. Mock external dependencies
5. Test error conditions
6. Keep tests focused and independent