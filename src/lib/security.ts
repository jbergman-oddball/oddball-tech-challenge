// Enterprise Security Utilities
import { supabase } from './supabase'

export interface SecurityConfig {
  sessionTimeout: number // minutes
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  passwordMinLength: number
  requireMFA: boolean
  allowedFileTypes: string[]
  maxFileSize: number // bytes
  rateLimitRequests: number
  rateLimitWindow: number // minutes
}

export const SECURITY_CONFIG: SecurityConfig = {
  sessionTimeout: 60, // 1 hour
  maxLoginAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  passwordMinLength: 8,
  requireMFA: false, // Can be enabled for enterprise
  allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  rateLimitRequests: 100,
  rateLimitWindow: 15 // 15 minutes
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'role_change' | 'file_upload' | 'suspicious_activity'
  userId?: string
  ipAddress?: string
  userAgent?: string
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
}

export class SecurityManager {
  private static instance: SecurityManager
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map()
  private rateLimits: Map<string, { count: number; windowStart: Date }> = new Map()

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Rate limiting
  checkRateLimit(identifier: string): boolean {
    const now = new Date()
    const limit = this.rateLimits.get(identifier)

    if (!limit) {
      this.rateLimits.set(identifier, { count: 1, windowStart: now })
      return true
    }

    const windowElapsed = now.getTime() - limit.windowStart.getTime()
    const windowMs = SECURITY_CONFIG.rateLimitWindow * 60 * 1000

    if (windowElapsed > windowMs) {
      // Reset window
      this.rateLimits.set(identifier, { count: 1, windowStart: now })
      return true
    }

    if (limit.count >= SECURITY_CONFIG.rateLimitRequests) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { reason: 'rate_limit_exceeded', identifier },
        severity: 'medium',
        timestamp: now.toISOString()
      })
      return false
    }

    limit.count++
    return true
  }

  // Login attempt tracking
  recordLoginAttempt(identifier: string, success: boolean): boolean {
    const now = new Date()
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now }

    // Check if account is locked
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return false // Account is locked
    }

    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(identifier)
      return true
    }

    // Increment failed attempts
    attempts.count++
    attempts.lastAttempt = now

    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
      attempts.lockedUntil = new Date(now.getTime() + SECURITY_CONFIG.lockoutDuration * 60 * 1000)
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { reason: 'account_locked', identifier, attempts: attempts.count },
        severity: 'high',
        timestamp: now.toISOString()
      })
    }

    this.loginAttempts.set(identifier, attempts)
    return attempts.lockedUntil ? false : true
  }

  // Check if account is locked
  isAccountLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier)
    if (!attempts?.lockedUntil) return false
    
    const now = new Date()
    if (now >= attempts.lockedUntil) {
      // Lock expired, clean up
      this.loginAttempts.delete(identifier)
      return false
    }
    
    return true
  }

  // Get remaining lockout time
  getLockoutTimeRemaining(identifier: string): number {
    const attempts = this.loginAttempts.get(identifier)
    if (!attempts?.lockedUntil) return 0
    
    const now = new Date()
    const remaining = attempts.lockedUntil.getTime() - now.getTime()
    return Math.max(0, Math.ceil(remaining / 60000)) // minutes
  }

  // File validation
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > SECURITY_CONFIG.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${SECURITY_CONFIG.maxFileSize / 1024 / 1024}MB`
      }
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!SECURITY_CONFIG.allowedFileTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type ${fileExtension} is not allowed. Allowed types: ${SECURITY_CONFIG.allowedFileTypes.join(', ')}`
      }
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.(js|vbs|ps1|sh)$/i,
      /<script/i,
      /javascript:/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        details: { reason: 'suspicious_filename', filename: file.name },
        severity: 'high',
        timestamp: new Date().toISOString()
      })
      return {
        valid: false,
        error: 'File name contains suspicious content'
      }
    }

    return { valid: true }
  }

  // Password validation
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`)
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Log security events
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase
        .from('security_events')
        .insert({
          event_type: event.type,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details || {},
          severity: event.severity,
          created_at: event.timestamp
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  // Session timeout management
  setupSessionTimeout(onTimeout: () => void): () => void {
    let timeoutId: NodeJS.Timeout
    let warningId: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)

      // Warning 5 minutes before timeout
      warningId = setTimeout(() => {
        const shouldExtend = confirm('Your session will expire in 5 minutes. Do you want to extend it?')
        if (shouldExtend) {
          resetTimeout()
        }
      }, (SECURITY_CONFIG.sessionTimeout - 5) * 60 * 1000)

      // Actual timeout
      timeoutId = setTimeout(() => {
        onTimeout()
      }, SECURITY_CONFIG.sessionTimeout * 60 * 1000)
    }

    // Activity listeners to reset timeout
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    const resetTimeoutThrottled = this.throttle(resetTimeout, 30000) // Reset at most once per 30 seconds

    events.forEach(event => {
      document.addEventListener(event, resetTimeoutThrottled, true)
    })

    resetTimeout() // Initial setup

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutThrottled, true)
      })
    }
  }

  // Utility: Throttle function
  private throttle(func: Function, limit: number): (...args: any[]) => void {
    let inThrottle: boolean
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Get client fingerprint for additional security
  getClientFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx!.textBaseline = 'top'
    ctx!.font = '14px Arial'
    ctx!.fillText('Security fingerprint', 2, 2)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')

    return btoa(fingerprint).slice(0, 32)
  }

  // Sanitize input to prevent XSS
  sanitizeInput(input: string): string {
    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
}

export const securityManager = SecurityManager.getInstance()