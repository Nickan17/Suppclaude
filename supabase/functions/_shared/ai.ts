/*
  Shared AI utilities for Supabase Edge Functions
  Centralizes OpenRouter interactions, analysis scoring, and helper logic
*/

// Default to free model, but allow override via environment variable
const MODEL = Deno.env.get('AI_MODEL') || 'openai/gpt-3.5-turbo'

// Generic helper to call OpenRouter with retries and strict validation
export async function callOpenRouterWithRetry(payload: any, retries = 2, backoffMs = 1000): Promise<any> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }
  
  console.log(`[OpenRouter] Using model: ${payload.model}`)
  console.log(`[OpenRouter] API key available: ${!!OPENROUTER_API_KEY}, key length: ${OPENROUTER_API_KEY.length}`)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`[OpenRouter] HTTP ${res.status} error:`, errorText)
        
        if (res.status === 401) {
          throw new Error(`OpenRouter authentication failed. Please check your API key.`)
        } else if (res.status === 400) {
          throw new Error(`OpenRouter bad request: ${errorText}`)
        } else {
          throw new Error(`OpenRouter HTTP error ${res.status}: ${errorText}`)
        }
      }

      let data: any
      try {
        data = await res.json()
      } catch (_) {
        throw new Error('OpenRouter response was not valid JSON')
      }

      const content = data?.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string') {
        throw new Error('OpenRouter response missing expected content field')
      }

      try {
        return JSON.parse(content)
      } catch (_) {
        throw new Error('Malformed JSON content from OpenRouter')
      }
    } catch (err) {
      console.error(`[openrouter] Attempt ${attempt + 1} failed:`, err)
      if (attempt >= retries) throw err
      await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)))
    }
  }
  throw new Error('OpenRouter call failed after retries')
}

// Analyze full product and return scores + summary
export async function analyzeProduct(product: any): Promise<any> {
  // Truncate large content to fit within token limits
  const truncatedProduct = {
    ...product,
    ingredients_raw: product.ingredients_raw ? 
      product.ingredients_raw.substring(0, 2000) : product.ingredients_raw,
    supplementFacts: product.supplementFacts?.raw ? 
      { raw: product.supplementFacts.raw.substring(0, 3000) } : product.supplementFacts
  }
  
  return await callOpenRouterWithRetry({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a supplement analysis expert. Analyze the following product and provide:
          1. Purity score (0-100): Check for fillers, artificial ingredients, proprietary blends
          2. Efficacy score (0-100): Clinical dosing, proven ingredients, scientific evidence
          3. Safety score (0-100): Third-party testing, banned substances, interactions
          4. Value score (0-100): Price per effective serving, compared to alternatives
          5. Overall score (weighted average)
          6. Summary of key findings
          7. Warnings if any
          
          Return result strictly as JSON.`
      },
      {
        role: 'user',
        content: JSON.stringify(truncatedProduct)
      }
    ]
  })
}

// Parse raw ingredients list into structured array
export async function parseIngredientsAI(rawIngredients: string): Promise<any[]> {
  return await callOpenRouterWithRetry({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Parse this supplement ingredients list into structured data. For each ingredient, extract:
          - name (standardized)
          - amount (with unit if present)
          - is_active (vs filler/other)
          - is_proprietary_blend_component
          
          Return strictly as JSON array.`
      },
      {
        role: 'user',
        content: rawIngredients
      }
    ]
  })
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}
