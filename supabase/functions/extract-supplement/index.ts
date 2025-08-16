import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const { url, barcode, force_ocr, user_id } = await req.json() as ExtractionRequest

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
    const parsedProduct = {
      barcode,
      url: productUrl,
      brand: scrapedData.brand,
      name: scrapedData.name,
      category: determineCategory(scrapedData.name, ingredients),
      ingredients_raw: ingredients,
      supplement_facts: supplementFacts,
      serving_size: extractServingSize(supplementFacts),
      servings_per_container: extractServings(supplementFacts),
      price_usd: scrapedData.price,
      price_per_serving: scrapedData.price ? scrapedData.price / extractServings(supplementFacts) : null,
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
  return {
    brand: extractBrand(data.markdown),
    name: extractProductName(data.markdown),
    price: extractPrice(data.markdown),
    ingredients: extractIngredients(data.markdown),
    supplementFacts: extractSupplementFacts(data.html),
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
          results.facts = extractSupplementFactsFromText(text)
          results.ingredients = extractIngredientsFromText(text)
        }
      } catch (error) {
        console.error('OCR extraction failed:', error)
      }
    }
  }

  return results
}

async function analyzeProduct(product: any) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-opus',
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
            
            Be critical but fair. Cite specific concerns. Penalize proprietary blends heavily.`
        },
        {
          role: 'user',
          content: JSON.stringify(product)
        }
      ]
    })
  })

  const aiResponse = await response.json()
  const analysis = JSON.parse(aiResponse.choices[0].message.content)

  return {
    purity_score: analysis.purity_score,
    efficacy_score: analysis.efficacy_score,
    safety_score: analysis.safety_score,
    value_score: analysis.value_score,
    overall_score: Math.round(
      analysis.purity_score * 0.2 +
      analysis.efficacy_score * 0.35 +
      analysis.safety_score * 0.25 +
      analysis.value_score * 0.2
    ),
    evidence_summary: analysis.summary,
    warnings: analysis.warnings || [],
    clinical_evidence_grade: determineEvidenceGrade(analysis.efficacy_score)
  }
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

// Text extraction helpers (implement these based on actual HTML/text patterns)
function extractBrand(text: string): string {
  // Implement brand extraction logic
  return ''
}

function extractProductName(text: string): string {
  // Implement product name extraction logic
  return ''
}

function extractPrice(text: string): number | null {
  // Implement price extraction logic
  const priceMatch = text.match(/\$(\d+\.?\d*)/)
  return priceMatch ? parseFloat(priceMatch[1]) : null
}

function extractIngredients(text: string): string {
  // Implement ingredients extraction logic
  return ''
}

function extractSupplementFacts(html: string): any {
  // Implement supplement facts extraction from HTML
  return {}
}

function extractSupplementFactsFromText(text: string): any {
  // Implement supplement facts extraction from OCR text
  return {}
}

function extractIngredientsFromText(text: string): string {
  // Implement ingredients extraction from OCR text
  return ''
}

function extractServingSize(facts: any): string {
  return facts?.serving_size || ''
}

function extractServings(facts: any): number {
  return facts?.servings_per_container || 1
}
