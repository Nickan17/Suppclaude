import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { parseProductPage } from "./parser.ts"
import { analyzeProduct, scoreToGrade } from "../_shared/ai.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse( 'method_not_allowed' }),
      { status: 405, headers: corsHeaders }
    )
  }

  try {
    // Check for required environment variables
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
    const OCR_SPACE_API_KEY = Deno.env.get('OCR_SPACE_API_KEY')
    const SCRAPFLY_API_KEY = Deno.env.get('SCRAPFLY_API_KEY')
    // OPENROUTER_API_KEY presence will be validated inside shared AI utils

    if (!FIRECRAWL_API_KEY) {
      return createErrorResponse( 'config', message: 'FIRECRAWL_API_KEY not configured' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Scrapfly API key is used as fallback, so check it early
    if (!SCRAPFLY_API_KEY) {
      console.warn('[firecrawl-extract] Warning: SCRAPFLY_API_KEY not configured, fallback scraping will be unavailable')
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (e) {
      return createErrorResponse( 'invalid_json', message: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate URL parameter
    if (!body?.url || typeof body.url !== 'string') {
      return createErrorResponse( 'missing_url', message: 'URL parameter is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const url = body.url.trim()
    console.log(`[firecrawl-extract] Processing URL: ${url}`)

    // Try Firecrawl first
    let html = ''
    let scrapingSource = 'firecrawl'
    let secondPass = false

    try {
      console.log('[firecrawl-extract] Starting Firecrawl scrape (main content only)...')
      let firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown'],
          onlyMainContent: true,
          timeout: 35000,
        }),
      })

      if (firecrawlResponse.ok) {
        const firecrawlData = await firecrawlResponse.json()
        const firstPassTokens = (firecrawlData.data?.html || firecrawlData.data?.markdown || '').split(/\s+/).length
        console.log(`[firecrawl-extract] Firecrawl first pass tokens: ${firstPassTokens}`)

        if (firstPassTokens < 2) {
          console.log('[firecrawl-extract] First pass had minimal content, trying second pass...')
          secondPass = true
          
          firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['html', 'markdown'],
              onlyMainContent: false,
              timeout: 35000,
            }),
          })

          if (firecrawlResponse.ok) {
            const secondPassData = await firecrawlResponse.json()
            html = secondPassData.data?.html || `<article>${secondPassData.data?.markdown || ''}</article>`
          }
        } else {
          html = firecrawlData.data?.html || `<article>${firecrawlData.data?.markdown || ''}</article>`
        }

        if (html.length > 100) {
          console.log(`[firecrawl-extract] Firecrawl successful, HTML length: ${html.length}`)
        } else {
          throw new Error('Firecrawl returned minimal content')
        }
      } else {
        throw new Error(`Firecrawl API error: ${firecrawlResponse.status}`)
      }
    } catch (firecrawlError) {
      console.log(`[firecrawl-extract] Firecrawl failed: ${firecrawlError.message}, trying Scrapfly...`)
      
      try {
        // Check if Scrapfly API key is available for fallback
        if (!SCRAPFLY_API_KEY) {
          throw new Error('SCRAPFLY_API_KEY not configured for fallback scraping')
        }
        
        const scrapflyResponse = await fetch('https://api.scrapfly.io/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: SCRAPFLY_API_KEY,
            url: url,
            render_js: true,
            wait: 3000,
            country: 'US',
            format: 'html',
            timeout: 35000,
            asp: true,
            session: "scrapfly-magnum"
          }),
        })

        if (!scrapflyResponse.ok) {
          throw new Error(`Scrapfly API error: ${scrapflyResponse.status}`)
        }

        const scrapflyData = await scrapflyResponse.json()
        html = scrapflyData.result?.content || ''
        scrapingSource = 'scrapfly'
        console.log(`[firecrawl-extract] Scrapfly successful, HTML length: ${html.length}`)
        
        // Scrapfly with better JS rendering for dynamic content

        if (html.length < 100) {
          throw new Error('Scrapfly returned minimal content')
        }
      } catch (scrapflyError) {
        console.error(`[firecrawl-extract] Both Firecrawl and Scrapfly failed: ${scrapflyError.message}`)
        return createErrorResponse( 'scraping_failed', 
            message: 'Unable to scrape the page with any available service',
            details: {
              firecrawl_error: firecrawlError.message,
              scrapfly_error: scrapflyError.message
            }
          }),
          { status: 502, headers: corsHeaders }
        )
      }
    }

    // Parse the product page
    console.log('[firecrawl-extract] Starting product page parsing...')
    const parsed = await parseProductPage(html, url, null, { OCR_SPACE_API_KEY })
    console.log('[firecrawl-extract] Parsing completed, OCR debug:', parsed._meta?.ocrCandidates)

    // Check if content is substantial enough
    const factsTokens = (parsed.supplementFacts?.raw || '').split(/\s+/).length
    const hasIngredients = (parsed.ingredients || []).length > 0
    const hasTitle = (parsed.title || '').length > 0

    console.log(`[firecrawl-extract] Parse results - factsTokens: ${factsTokens}, hasIngredients: ${hasIngredients}, hasTitle: ${hasTitle}`)

    if (factsTokens < 2 && !hasIngredients && !hasTitle) {
      return createErrorResponse( 'empty_parse',
          message: 'Unable to extract meaningful product information from the page',
          _meta: parsed._meta || {}
        }),
        { status: 422, headers: corsHeaders }
      )
    }

    // Run AI analysis on extracted product
    console.log('[firecrawl-extract] Running AI analysis via OpenRouter...')
    const analysis = await analyzeProduct({
      title: parsed.title,
      ingredients: parsed.ingredients,
      ingredients_raw: parsed.ingredients_raw,
      supplementFacts: parsed.supplementFacts?.raw || '',
      warnings: parsed.warnings,
      url
    })

    // Build successful response
    const response = {
      title: parsed.title,
      ingredients: parsed.ingredients,
      ingredients_raw: parsed.ingredients_raw,
      supplementFacts: { raw: parsed.supplementFacts?.raw || '' },
      warnings: parsed.warnings,
      analysis: {
        purity_score: analysis.purity_score,
        efficacy_score: analysis.efficacy_score,
        safety_score: analysis.safety_score,
        value_score: analysis.value_score,
        overall_score: analysis.overall_score,
        summary: analysis.summary,
        warnings: analysis.warnings,
        grade: scoreToGrade(analysis.overall_score)
      },
      _meta: {
        chain: parsed._meta?.chain || 'unknown',
        scrapingSource,
        secondPass,
        factsTokens,
        factsSource: parsed._meta?.factsSource || 'unknown',
        ocrTried: parsed._meta?.ocrTried || false,
        ocrPicked: parsed._meta?.ocrPicked || false,
        facts_kind: parsed._meta?.facts_kind || 'none',
        ingredients_source: parsed._meta?.ingredients_source || 'unknown',
        pageTitleRaw: parsed._meta?.pageTitleRaw || '',
        titleSource: parsed._meta?.titleSource || 'unknown',
        ocrDebug: parsed._meta?.ocrDebug || null,
        ...parsed._meta
      }
    }

    console.log(`[firecrawl-extract] Success! Returning parsed data`)
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('[firecrawl-extract] Unexpected error:', error)
    return createErrorResponse( 'internal_error',
        message: 'An unexpected error occurred',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})

// shared AI utilities now imported, helper functions removed
