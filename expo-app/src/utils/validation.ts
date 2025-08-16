/**
 * Input validation utilities
 */

// Sanitize user input by removing dangerous characters
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[&]/g, '') // Remove ampersands
    .trim()
}

// Validate product URL
export const validateProductUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) {
    return { isValid: false, error: 'URL is required' }
  }

  try {
    const parsedUrl = new URL(url)
    
    // Must be HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use HTTPS' }
    }
    
    // Whitelist allowed domains
    const allowedDomains = [
      'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de',
      'gnc.com', 'bodybuilding.com', 'iherb.com', 'vitacost.com',
      'supplementfacts.org', 'examine.com', 'vitaminshoppes.com'
    ]
    
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    )
    
    if (!isAllowed) {
      return { isValid: false, error: 'Domain not supported' }
    }
    
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

// Validate barcode
export const validateBarcode = (barcode: string): { isValid: boolean; error?: string } => {
  if (!barcode) {
    return { isValid: false, error: 'Barcode is required' }
  }
  
  // Remove any non-digit characters
  const cleanBarcode = barcode.replace(/\D/g, '')
  
  // Check length (UPC/EAN barcodes are 8-14 digits)
  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    return { isValid: false, error: 'Barcode must be 8-14 digits' }
  }
  
  return { isValid: true }
}

// Validate search query
export const validateSearchQuery = (query: string): { isValid: boolean; error?: string } => {
  if (!query) {
    return { isValid: false, error: 'Search query is required' }
  }
  
  const sanitized = sanitizeInput(query)
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Search must be at least 2 characters' }
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Search query too long' }
  }
  
  return { isValid: true }
}

// Validate email
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true }
}

// Validate password
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password too long' }
  }
  
  return { isValid: true }
}

// Validate age
export const validateAge = (age: number): { isValid: boolean; error?: string } => {
  if (!age) {
    return { isValid: false, error: 'Age is required' }
  }
  
  if (age < 13 || age > 120) {
    return { isValid: false, error: 'Age must be between 13 and 120' }
  }
  
  return { isValid: true }
}

// Validate weight
export const validateWeight = (weight: number): { isValid: boolean; error?: string } => {
  if (!weight) {
    return { isValid: false, error: 'Weight is required' }
  }
  
  if (weight < 20 || weight > 500) {
    return { isValid: false, error: 'Weight must be between 20 and 500 kg' }
  }
  
  return { isValid: true }
}

// Validate height
export const validateHeight = (height: number): { isValid: boolean; error?: string } => {
  if (!height) {
    return { isValid: false, error: 'Height is required' }
  }
  
  if (height < 100 || height > 250) {
    return { isValid: false, error: 'Height must be between 100 and 250 cm' }
  }
  
  return { isValid: true }
}

// Generic validation schema type
export interface ValidationSchema<T> {
  [K in keyof T]: (value: T[K]) => { isValid: boolean; error?: string }
}

// Validate object against schema
export const validateObject = <T>(
  data: T, 
  schema: ValidationSchema<T>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {}
  let isValid = true
  
  for (const key in schema) {
    const validator = schema[key]
    const result = validator(data[key])
    
    if (!result.isValid) {
      errors[key] = result.error
      isValid = false
    }
  }
  
  return { isValid, errors }
}
