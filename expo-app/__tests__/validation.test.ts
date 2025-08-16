import {
  validateProductUrl,
  validateBarcode,
  validateSearchQuery,
  validateEmail,
  validatePassword,
  sanitizeInput,
} from '../src/utils/validation'

describe('URL Validation', () => {
  it('blocks internal IPs', () => {
    expect(validateProductUrl('https://localhost/product')).toEqual({
      isValid: false,
      error: 'Domain not supported'
    })
    expect(validateProductUrl('https://192.168.1.1/product')).toEqual({
      isValid: false,
      error: 'Domain not supported'
    })
    expect(validateProductUrl('https://127.0.0.1/product')).toEqual({
      isValid: false,
      error: 'Domain not supported'
    })
  })

  it('allows whitelisted domains', () => {
    expect(validateProductUrl('https://amazon.com/dp/123')).toEqual({
      isValid: true
    })
    expect(validateProductUrl('https://www.amazon.com/dp/123')).toEqual({
      isValid: true
    })
    expect(validateProductUrl('https://gnc.com/product/123')).toEqual({
      isValid: true
    })
  })

  it('enforces HTTPS', () => {
    expect(validateProductUrl('http://amazon.com/dp/123')).toEqual({
      isValid: false,
      error: 'URL must use HTTPS'
    })
  })

  it('blocks non-whitelisted domains', () => {
    expect(validateProductUrl('https://evil.com/product')).toEqual({
      isValid: false,
      error: 'Domain not supported'
    })
  })

  it('handles invalid URLs', () => {
    expect(validateProductUrl('not-a-url')).toEqual({
      isValid: false,
      error: 'Invalid URL format'
    })
  })
})

describe('Barcode Validation', () => {
  it('accepts valid barcodes', () => {
    expect(validateBarcode('123456789012')).toEqual({ isValid: true })
    expect(validateBarcode('12345678')).toEqual({ isValid: true })
    expect(validateBarcode('12345678901234')).toEqual({ isValid: true })
  })

  it('rejects short barcodes', () => {
    expect(validateBarcode('1234567')).toEqual({
      isValid: false,
      error: 'Barcode must be 8-14 digits'
    })
  })

  it('rejects long barcodes', () => {
    expect(validateBarcode('123456789012345')).toEqual({
      isValid: false,
      error: 'Barcode must be 8-14 digits'
    })
  })

  it('handles non-numeric input', () => {
    expect(validateBarcode('abc123def456')).toEqual({
      isValid: false,
      error: 'Barcode must be 8-14 digits'
    })
  })

  it('requires barcode', () => {
    expect(validateBarcode('')).toEqual({
      isValid: false,
      error: 'Barcode is required'
    })
  })
})

describe('Search Query Validation', () => {
  it('accepts valid search queries', () => {
    expect(validateSearchQuery('protein powder')).toEqual({ isValid: true })
    expect(validateSearchQuery('whey')).toEqual({ isValid: true })
  })

  it('rejects too short queries', () => {
    expect(validateSearchQuery('a')).toEqual({
      isValid: false,
      error: 'Search must be at least 2 characters'
    })
  })

  it('rejects too long queries', () => {
    const longQuery = 'a'.repeat(101)
    expect(validateSearchQuery(longQuery)).toEqual({
      isValid: false,
      error: 'Search query too long'
    })
  })

  it('requires search query', () => {
    expect(validateSearchQuery('')).toEqual({
      isValid: false,
      error: 'Search query is required'
    })
  })
})

describe('Email Validation', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('test@example.com')).toEqual({ isValid: true })
    expect(validateEmail('user.name@domain.co.uk')).toEqual({ isValid: true })
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('invalid-email')).toEqual({
      isValid: false,
      error: 'Invalid email format'
    })
    expect(validateEmail('test@')).toEqual({
      isValid: false,
      error: 'Invalid email format'
    })
    expect(validateEmail('@domain.com')).toEqual({
      isValid: false,
      error: 'Invalid email format'
    })
  })

  it('requires email', () => {
    expect(validateEmail('')).toEqual({
      isValid: false,
      error: 'Email is required'
    })
  })
})

describe('Password Validation', () => {
  it('accepts valid passwords', () => {
    expect(validatePassword('password123')).toEqual({ isValid: true })
    expect(validatePassword('MySecurePassword!')).toEqual({ isValid: true })
  })

  it('rejects short passwords', () => {
    expect(validatePassword('short')).toEqual({
      isValid: false,
      error: 'Password must be at least 8 characters'
    })
  })

  it('rejects very long passwords', () => {
    const longPassword = 'a'.repeat(129)
    expect(validatePassword(longPassword)).toEqual({
      isValid: false,
      error: 'Password too long'
    })
  })

  it('requires password', () => {
    expect(validatePassword('')).toEqual({
      isValid: false,
      error: 'Password is required'
    })
  })
})

describe('Input Sanitization', () => {
  it('removes dangerous characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script')
    expect(sanitizeInput('search & destroy')).toBe('search  destroy')
    expect(sanitizeInput('quote "test" quote')).toBe('quote test quote')
    expect(sanitizeInput("single 'test' quote")).toBe('single test quote')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  test  ')).toBe('test')
    expect(sanitizeInput('\ntest\n')).toBe('test')
  })

  it('handles empty input', () => {
    expect(sanitizeInput('')).toBe('')
    expect(sanitizeInput('   ')).toBe('')
  })
})
