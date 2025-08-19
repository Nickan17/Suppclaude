import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { analyzeProduct as aiAnalyzeProduct, scoreToGrade } from '../_shared/ai.ts'
import { 
  parseProductName, 
  parseBrand, 
  parseIngredients, 
  parsePrice,
  parseServingSize,
  parseServingsPerContainer,
  parseSupplementFacts,
  parseSupplementFactsFromText,
  parseIngredientsFromText,
  determineCategory
} from './lib/parser.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client with service role for privileged operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// API configurations
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!
const OCR_SPACE_API_KEY = Deno.env.get('OCR_SPACE_API_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

interface ExtractionRequest {
  url?: string
  barcode?: string
  force_ocr?: boolean
  user_id?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify JWT token with anon key client
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const { url, barcode, force_ocr, user_id } = await req.json() as ExtractionRequest
    
    // Ensure user_id matches authenticated user
    if (user_id && user_id !== user.id) {
      throw new Error('User ID mismatch')
    }

    // 1. Check if product already exists in database
    if (barcode) {
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single()

      if (existing && !isStale(existing.last_analysis)) {
        return new Response(
          JSON.stringify({ product: existing, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 2. Lookup barcode if provided
    let productUrl = url
    if (barcode && !url) {
      productUrl = await lookupBarcode(barcode)
      if (!productUrl) {
        throw new Error('Product not found for barcode')
      }
    }

    // 3. Validate URL for security
    if (productUrl) {
      const validatedUrl = validateProductUrl(productUrl)
      if (!validatedUrl) {
        throw new Error('Invalid or unsafe product URL')
      }
      productUrl = validatedUrl
    }

    // 3. Scrape product page
    const scrapedData = await scrapeProductPage(productUrl!)

    // 4. Extract supplement facts via OCR if needed
    let supplementFacts = scrapedData.supplementFacts
    let ingredients = scrapedData.ingredients

    if (!supplementFacts || force_ocr) {
      const ocrResults = await extractViaOCR(scrapedData.images)
      supplementFacts = ocrResults.facts || supplementFacts
      ingredients = ocrResults.ingredients || ingredients
    }

    // 5. Parse and structure the data
    const servings = parseServingsPerContainer(ingredients + ' ' + JSON.stringify(supplementFacts)) || 1
    const parsedProduct = {
      barcode,
      url: productUrl,
      brand: scrapedData.brand,
      name: scrapedData.name,
      category: determineCategory(scrapedData.name, ingredients),
      ingredients_raw: ingredients,
      supplement_facts: supplementFacts,
      serving_size: parseServingSize(ingredients + ' ' + JSON.stringify(supplementFacts)),
      servings_per_container: servings,
      price_usd: scrapedData.price,
      price_per_serving: scrapedData.price ? scrapedData.price / servings : null,
      extraction_method: force_ocr ? 'ocr' : 'web_scrape',
      extraction_confidence: 0.85,
      raw_extraction_data: scrapedData
    }

    // 6. Analyze with AI
    const analysis = await analyzeProduct(parsedProduct)

    // 7. Store in database
    const { data: savedProduct, error } = await supabase
      .from('products')
      .upsert({
        ...parsedProduct,
        ...analysis,
        last_analysis: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // 8. Find alternatives
    const alternatives = await findAlternatives(savedProduct, user_id)

    // 9. Log analytics event if user_id provided
    if (user_id) {
      await supabase
        .from('analytics_events')
        .insert({
          user_id,
          event_type: 'scan',
          event_data: { product_id: savedProduct.id, barcode }
        })
    }

    return new Response(
      JSON.stringify({
        product: savedProduct,
        alternatives,
        analysis: {
          summary: analysis.summary,
          warnings: analysis.warnings,
          grade: scoreToGrade(analysis.overall_score)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extraction error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper functions

function validateProductUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    
    // 1. Enforce HTTPS only
    if (parsedUrl.protocol !== 'https:') {
      return null
    }
    
    // 2. Whitelist allowed domains
    const allowedDomains = [
      'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de',
      'gnc.com', 'bodybuilding.com', 'iherb.com', 'vitacost.com',
      'supplementfacts.org', 'examine.com', 'vitaminshoppes.com',
      'muscleandstrength.com', 'tigerfitness.com', 'a1supplements.com'
    ]
    
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    )
    
    if (!isAllowed) {
      return null
    }
    
    // 3. Block internal/private IP addresses
    const hostname = parsedUrl.hostname
    const ipPatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd00:/
    ]
    
    if (ipPatterns.some(pattern => pattern.test(hostname))) {
      return null
    }
    
    // 4. Validate URL structure (must have path)
    if (parsedUrl.pathname === '/') {
      return null
    }
    
    return url
  } catch (error) {
    return null
  }
}

function isStale(lastAnalysis: string | null): boolean {
  if (!lastAnalysis) return true
  const daysSince = (Date.now() - new Date(lastAnalysis).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > 30 // Re-analyze after 30 days
}

async function lookupBarcode(barcode: string): Promise<string | null> {
  // Try UPC Database first
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
    const data = await response.json()
    if (data.items?.[0]?.offers?.[0]?.link) {
      return data.items[0].offers[0].link
    }
  } catch (error) {
    console.error('UPC lookup failed:', error)
  }

  // Fallback to Open Food Facts
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()
    if (data.product?.url) {
      return data.product.url
    }
  } catch (error) {
    console.error('Open Food Facts lookup failed:', error)
  }

  return null
}

async function scrapeProductPage(url: string) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['html', 'markdown'],
      onlyMainContent: true,
      waitFor: 2000,
      screenshot: true,
      extractImages: true,
    })
  })

  const data = await response.json()
  
  // Extract key information from scraped data
  const fullText = data.markdown || data.html || ''
  return {
    brand: parseBrand(data.html || ''),
    name: parseProductName(data.html || '', url),
    price: parsePrice(data.html || ''),
    ingredients: parseIngredientsFromText(fullText),
    supplementFacts: parseSupplementFacts(data.html || ''),
    images: data.images || []
  }
}

async function extractViaOCR(images: string[]) {
  const results = { facts: null, ingredients: null }

  for (const imageUrl of images) {
    if (imageUrl.includes('supplement') || imageUrl.includes('facts') || imageUrl.includes('ingredients')) {
      try {
        const formData = new FormData()
        formData.append('url', imageUrl)
        formData.append('apikey', OCR_SPACE_API_KEY)
        formData.append('language', 'eng')
        formData.append('isTable', 'true')

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        const text = data.ParsedResults?.[0]?.ParsedText

        if (text) {
          results.facts = parseSupplementFactsFromText(text)
          results.ingredients = parseIngredientsFromText(text)
        }
      } catch (error) {
        console.error('OCR extraction failed:', error)
      }
    }
  }

  return results
}

// Helper: robust OpenRouter call with validation & automatic retries
async function callOpenRouterWithRetry(payload: any, retries = 2, backoffMs = 1000): Promise<any> {
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

      // Validate HTTP status
      if (!res.ok) {
        throw new Error(`OpenRouter HTTP error ${res.status}`)
      }

      // Validate JSON body
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

      // Validate that content is JSON and parse it
      try {
        return JSON.parse(content)
      } catch (_) {
        throw new Error('OpenRouter content was not valid JSON')
      }
    } catch (err) {
      console.error(`[openrouter] Attempt ${attempt + 1} failed:`, err)
      if (attempt >= retries) throw err
      // Exponential backoff between retries
      await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)))
    }
  }
  throw new Error('OpenRouter call failed after retries') // Fallback (should not reach)
}

// Use shared AI analysis util
async function analyzeProduct(product: any) {
  return await aiAnalyzeProduct(product)
}

async function findAlternatives(product: any, userId?: string) {
  let userGoals = []
  
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('goals, price_sensitivity')
      .eq('id', userId)
      .single()
    
    userGoals = profile?.goals || []
  }

  const { data: alternatives } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .gt('overall_score', product.overall_score)
    .order('overall_score', { ascending: false })
    .limit(5)

  return alternatives || []
}

// Utility functions
function determineCategory(name: string, ingredients: string): string {
  const lowerName = name.toLowerCase()
  const lowerIngredients = ingredients?.toLowerCase() || ''

  if (lowerName.includes('protein') || lowerName.includes('whey')) return 'protein'
  if (lowerName.includes('pre-workout') || lowerName.includes('preworkout')) return 'pre_workout'
  if (lowerName.includes('vitamin') || lowerName.includes('multivitamin')) return 'vitamins'
  if (lowerName.includes('creatine')) return 'creatine'
  if (lowerIngredients.includes('nootropic') || lowerName.includes('brain')) return 'nootropics'
  
  return 'other'
}

function scoreToGrade(score: number): string {
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

function determineEvidenceGrade(efficacyScore: number): string {
  if (efficacyScore >= 90) return 'A'
  if (efficacyScore >= 80) return 'B'
  if (efficacyScore >= 70) return 'C'
  if (efficacyScore >= 60) return 'D'
  return 'F'
}

// Use the parsing helpers from lib/parser.ts
