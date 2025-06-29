import { describe, it, expect, beforeEach, vi } from 'vitest'
import { securityManager } from '../../lib/security'

describe('SecurityManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'test-user'
      
      // First request should be allowed
      expect(securityManager.checkRateLimit(identifier)).toBe(true)
      
      // Subsequent requests within limit should be allowed
      for (let i = 0; i < 50; i++) {
        expect(securityManager.checkRateLimit(identifier)).toBe(true)
      }
    })

    it('should block requests exceeding rate limit', () => {
      const identifier = 'test-user-2'
      
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        securityManager.checkRateLimit(identifier)
      }
      
      // Next request should be blocked
      expect(securityManager.checkRateLimit(identifier)).toBe(false)
    })
  })

  describe('Login Attempt Tracking', () => {
    it('should allow successful login attempts', () => {
      const identifier = 'test-user'
      
      expect(securityManager.recordLoginAttempt(identifier, true)).toBe(true)
      expect(securityManager.isAccountLocked(identifier)).toBe(false)
    })

    it('should track failed login attempts', () => {
      const identifier = 'test-user-3'
      
      // Record failed attempts
      for (let i = 0; i < 4; i++) {
        expect(securityManager.recordLoginAttempt(identifier, false)).toBe(true)
        expect(securityManager.isAccountLocked(identifier)).toBe(false)
      }
      
      // 5th failed attempt should lock account
      expect(securityManager.recordLoginAttempt(identifier, false)).toBe(false)
      expect(securityManager.isAccountLocked(identifier)).toBe(true)
    })

    it('should reset attempts on successful login', () => {
      const identifier = 'test-user-4'
      
      // Record some failed attempts
      securityManager.recordLoginAttempt(identifier, false)
      securityManager.recordLoginAttempt(identifier, false)
      
      // Successful login should reset
      expect(securityManager.recordLoginAttempt(identifier, true)).toBe(true)
      expect(securityManager.isAccountLocked(identifier)).toBe(false)
    })
  })

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      const validFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      const result = securityManager.validateFile(validFile)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject disallowed file types', () => {
      const invalidFile = new File(['content'], 'malware.exe', { type: 'application/x-executable' })
      const result = securityManager.validateFile(invalidFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })

    it('should reject files exceeding size limit', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024) // 11MB
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      const result = securityManager.validateFile(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum')
    })

    it('should detect suspicious file names', () => {
      const suspiciousFile = new File(['content'], 'script.js', { type: 'text/javascript' })
      const result = securityManager.validateFile(suspiciousFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('suspicious')
    })
  })

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongP@ssw0rd123'
      const result = securityManager.validatePassword(strongPassword)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      const weakPassword = 'weak'
      const result = securityManager.validatePassword(weakPassword)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should require minimum length', () => {
      const shortPassword = '1234567'
      const result = securityManager.validatePassword(shortPassword)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should require uppercase letters', () => {
      const noUppercase = 'password123!'
      const result = securityManager.validatePassword(noUppercase)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should require lowercase letters', () => {
      const noLowercase = 'PASSWORD123!'
      const result = securityManager.validatePassword(noLowercase)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should require numbers', () => {
      const noNumbers = 'Password!'
      const result = securityManager.validatePassword(noNumbers)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should require special characters', () => {
      const noSpecial = 'Password123'
      const result = securityManager.validatePassword(noSpecial)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should reject common passwords', () => {
      const commonPassword = 'password'
      const result = securityManager.validatePassword(commonPassword)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is too common and easily guessable')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const sanitized = securityManager.sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('Hello')
    })

    it('should escape special characters', () => {
      const input = 'Test & "quotes" <tags>'
      const sanitized = securityManager.sanitizeInput(input)
      
      expect(sanitized).toContain('&amp;')
      expect(sanitized).toContain('&quot;')
      expect(sanitized).toContain('&lt;')
      expect(sanitized).toContain('&gt;')
    })
  })

  describe('Client Fingerprinting', () => {
    it('should generate consistent fingerprints', () => {
      const fingerprint1 = securityManager.getClientFingerprint()
      const fingerprint2 = securityManager.getClientFingerprint()
      
      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toHaveLength(32)
    })
  })
})