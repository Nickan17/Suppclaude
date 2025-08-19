/*
  Shared environment variable validation utilities
  Provides safe, clear error handling for missing configuration
  
  Available environment variables:
  - OPENROUTER_API_KEY: Required for AI functionality
  - AI_MODEL: Optional, defaults to 'openai/gpt-oss-20b:free' if not set
*/

export function requireEnv(key: string): string {
  const value = Deno.env.get(key)
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable '${key}' is missing or empty. Please set it in your Supabase secrets.`)
  }
  return value
}

export function requireEnvOptional(key: string): string | undefined {
  return Deno.env.get(key)
}

// Helper to validate multiple required env vars at once
export function validateRequiredEnv(keys: string[]): void {
  const missing: string[] = []
  
  for (const key of keys) {
    if (!Deno.env.get(key)) {
      missing.push(key)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please set them in your Supabase secrets.`)
  }
}
