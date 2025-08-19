import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireEnv } from "../_shared/env.ts"
import { parseIngredientsAI, callOpenRouterWithRetry } from '../_shared/ai.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const PUBMED_API_KEY = Deno.env.get('PUBMED_API_KEY')

interface AnalysisRequest {
  product_id: string
  user_id?: string
  deep_analysis?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { product_id, user_id, deep_analysis } = await req.json() as AnalysisRequest

    // Fetch product details
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (error || !product) {
      throw new Error('Product not found')
    }

    // Parse ingredients
    const ingredients = await parseIngredients(product.ingredients_raw)

    // Check ingredient safety and efficacy
    const ingredientAnalysis = await analyzeIngredients(ingredients)

    // Search PubMed for scientific evidence
    const pubmedResults = deep_analysis ? await searchPubMedEvidence(ingredients, product.category) : []

    // Calculate detailed scores
    const scores = calculateDetailedScores({
      product,
      ingredients,
      ingredientAnalysis,
      pubmedResults
    })

    // Generate personalized insights if user_id provided
    let personalizedInsights = null
    if (user_id) {
      personalizedInsights = await generatePersonalizedInsights(product, scores, user_id)
    }

    // Find and rank alternatives
    const alternatives = await findRankedAlternatives(product, user_id)

    // Update product with new analysis
    await supabase
      .from('products')
      .update({
        ...scores,
        pubmed_references: pubmedResults,
        last_analysis: new Date().toISOString()
      })
      .eq('id', product_id)

    return new Response(JSON.stringify({
      analysis: {
          scores,
          ingredients: ingredientAnalysis,
          scientific_evidence: pubmedResults,
          personalized_insights: personalizedInsights
        },
        alternatives
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Use shared ingredient parsing via Claude-3 Opus
async function parseIngredients(rawIngredients: string): Promise<any[]> {
  return await parseIngredientsAI(rawIngredients)
}

async function analyzeIngredients(ingredients: any[]): Promise<any> {
  const analysis = {
    active_ingredients: [],
    fillers: [],
    concerns: [],
    proprietary_blend_found: false,
    banned_substances: [],
    allergens: []
  }

  for (const ingredient of ingredients) {
    // Check our ingredient database
    const { data: knownIngredient } = await supabase
      .from('ingredients')
      .select('*')
      .eq('name', ingredient.name)
      .single()

    if (knownIngredient) {
      if (knownIngredient.is_banned_substance) {
        analysis.banned_substances.push(ingredient.name)
      }

      if (knownIngredient.safety_rating === 'possibly_unsafe' || knownIngredient.safety_rating === 'likely_unsafe') {
        analysis.concerns.push({
          ingredient: ingredient.name,
          reason: `Safety rating: ${knownIngredient.safety_rating}`,
          severity: 'high'
        })
      }

      // Check if dosage is effective
      if (ingredient.amount && knownIngredient.effective_dose_mg) {
        const amountMg = convertToMg(ingredient.amount, ingredient.unit)
        if (amountMg < knownIngredient.effective_dose_mg) {
          analysis.concerns.push({
            ingredient: ingredient.name,
            reason: `Underdosed: ${amountMg}mg vs ${knownIngredient.effective_dose_mg}mg effective dose`,
            severity: 'medium'
          })
        }
      }
    }

    if (ingredient.is_proprietary_blend_component) {
      analysis.proprietary_blend_found = true
    }

    if (ingredient.is_active) {
      analysis.active_ingredients.push(ingredient)
    } else {
      analysis.fillers.push(ingredient)
    }
  }

  return analysis
}

async function searchPubMedEvidence(ingredients: any[], category: string): Promise<any[]> {
  const studies = []
  const activeIngredients = ingredients.filter(i => i.is_active).slice(0, 5) // Top 5 active ingredients

  for (const ingredient of activeIngredients) {
    try {
      const query = `${ingredient.name} ${category} supplement clinical trial`
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&sort=relevance`
      
      const searchResponse = await fetch(url)
      const searchData = await searchResponse.json()
      
      if (searchData.esearchresult?.idlist?.length > 0) {
        const ids = searchData.esearchresult.idlist.join(',')
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`
        
        const summaryResponse = await fetch(summaryUrl)
        const summaryData = await summaryResponse.json()
        
        for (const id of searchData.esearchresult.idlist) {
          const study = summaryData.result[id]
          if (study) {
            studies.push({
              ingredient: ingredient.name,
              pmid: id,
              title: study.title,
              authors: study.authors?.map((a: any) => a.name).join(', '),
              year: study.pubdate?.split(' ')[0],
              journal: study.source
            })
          }
        }
      }
    } catch (error) {
      console.error(`PubMed search failed for ${ingredient.name}:`, error)
    }
  }

  return studies
}

function calculateDetailedScores(data: any): any {
  const { product, ingredients, ingredientAnalysis, pubmedResults } = data

  // Purity Score (0-100)
  let purityScore = 100
  
  // Deduct for proprietary blends
  if (ingredientAnalysis.proprietary_blend_found) {
    purityScore -= 25
  }
  
  // Deduct for fillers
  const fillerRatio = ingredientAnalysis.fillers.length / ingredients.length
  purityScore -= Math.round(fillerRatio * 20)
  
  // Deduct for artificial ingredients
  const artificialCount = ingredients.filter((i: any) => 
    i.name.toLowerCase().includes('artificial') || 
    i.name.toLowerCase().includes('color') ||
    i.name.toLowerCase().includes('flavor')
  ).length
  purityScore -= artificialCount * 5

  // Efficacy Score (0-100)
  let efficacyScore = 50 // Start at 50, can go up or down
  
  // Boost for clinical evidence
  const studiesPerIngredient = pubmedResults.length / ingredientAnalysis.active_ingredients.length
  efficacyScore += Math.min(studiesPerIngredient * 10, 30)
  
  // Boost for proper dosing
  const properlyDosedCount = ingredientAnalysis.active_ingredients.filter((i: any) => 
    !ingredientAnalysis.concerns.some((c: any) => 
      c.ingredient === i.name && c.reason.includes('Underdosed')
    )
  ).length
  const properDoseRatio = properlyDosedCount / ingredientAnalysis.active_ingredients.length
  efficacyScore += Math.round(properDoseRatio * 20)

  // Safety Score (0-100)
  let safetyScore = 100
  
  // Major deduction for banned substances
  safetyScore -= ingredientAnalysis.banned_substances.length * 50
  
  // Deduct for safety concerns
  const highConcerns = ingredientAnalysis.concerns.filter((c: any) => c.severity === 'high').length
  const mediumConcerns = ingredientAnalysis.concerns.filter((c: any) => c.severity === 'medium').length
  safetyScore -= (highConcerns * 15) + (mediumConcerns * 5)
  
  // Boost for third-party testing
  if (product.third_party_tested) {
    safetyScore = Math.min(safetyScore + 10, 100)
  }

  // Value Score (0-100)
  let valueScore = 70 // Start at 70, adjust based on price analysis
  
  // This would need market data to properly calculate
  // For now, use price per serving and ingredient quality
  if (product.price_per_serving) {
    if (product.price_per_serving < 1) valueScore += 15
    else if (product.price_per_serving < 2) valueScore += 10
    else if (product.price_per_serving > 5) valueScore -= 20
  }
  
  // Adjust for ingredient quality
  valueScore += Math.round((efficacyScore - 50) / 5) // Better efficacy = better value

  // Ensure all scores are within bounds
  purityScore = Math.max(0, Math.min(100, purityScore))
  efficacyScore = Math.max(0, Math.min(100, efficacyScore))
  safetyScore = Math.max(0, Math.min(100, safetyScore))
  valueScore = Math.max(0, Math.min(100, valueScore))

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    purityScore * 0.2 +
    efficacyScore * 0.35 +
    safetyScore * 0.25 +
    valueScore * 0.2
  )

  return {
    purity_score: purityScore,
    efficacy_score: efficacyScore,
    safety_score: safetyScore,
    value_score: valueScore,
    overall_score: overallScore,
    proprietary_blend_penalty: ingredientAnalysis.proprietary_blend_found ? 25 : 0,
    warnings: [
      ...ingredientAnalysis.banned_substances.map((s: string) => `Contains banned substance: ${s}`),
      ...ingredientAnalysis.concerns.filter((c: any) => c.severity === 'high').map((c: any) => c.reason)
    ]
  }
}

async function generatePersonalizedInsights(product: any, scores: any, userId: string): Promise<any> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const insights = {
    goal_alignment: [],
    warnings: [],
    recommendations: []
  }

  // Check goal alignment
  for (const goal of profile.goals || []) {
    switch (goal) {
      case 'muscle_gain':
        if (product.category === 'protein' || product.category === 'creatine') {
          insights.goal_alignment.push({
            goal: 'Muscle Gain',
            alignment: 'high',
            reason: `${product.category} supplements support muscle growth`
          })
        }
        break
      case 'fat_loss':
        if (product.category === 'fat_burner' || product.category === 'thermogenic') {
          insights.goal_alignment.push({
            goal: 'Fat Loss',
            alignment: 'medium',
            reason: 'May support metabolism, but diet is more important'
          })
        }
        break
      // Add more goal checks...
    }
  }

  // Check against user preferences
  const avoidIngredients = profile.avoid_ingredients || []
  for (const avoided of avoidIngredients) {
    if (product.ingredients_raw?.toLowerCase().includes(avoided.toLowerCase())) {
      insights.warnings.push(`Contains ${avoided}, which you prefer to avoid`)
    }
  }

  // Price sensitivity check
  if (profile.price_sensitivity >= 4 && scores.value_score < 70) {
    insights.recommendations.push('Consider more budget-friendly alternatives with similar benefits')
  }

  return insights
}

async function findRankedAlternatives(product: any, userId?: string): Promise<any[]> {
  let userProfile = null
  if (userId) {
    const { data } = await supabase
      .from('profiles')
      .select('goals, price_sensitivity, avoid_ingredients')
      .eq('id', userId)
      .single()
    userProfile = data
  }

  // Find alternatives with better scores
  const { data: alternatives } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .gt('overall_score', product.overall_score)
    .order('overall_score', { ascending: false })
    .limit(10)

  if (!alternatives) return []

  // Rank alternatives based on user preferences
  const rankedAlternatives = alternatives.map(alt => {
    let relevanceScore = alt.overall_score - product.overall_score

    if (userProfile) {
      // Boost if price is better for price-sensitive users
      if (userProfile.price_sensitivity >= 3 && alt.price_per_serving < product.price_per_serving) {
        relevanceScore += 10
      }

      // Penalize if contains avoided ingredients
      for (const avoided of userProfile.avoid_ingredients || []) {
        if (alt.ingredients_raw?.toLowerCase().includes(avoided.toLowerCase())) {
          relevanceScore -= 20
        }
      }
    }

    return {
      product: alt,
      improvement_score: alt.overall_score - product.overall_score,
      price_difference: product.price_per_serving - alt.price_per_serving,
      relevance_score: relevanceScore,
      reasons: generateAlternativeReasons(product, alt, userProfile)
    }
  })

  // Sort by relevance and return top 5
  return rankedAlternatives
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5)
}

function generateAlternativeReasons(original: any, alternative: any, userProfile: any): string[] {
  const reasons = []

  if (alternative.overall_score > original.overall_score) {
    reasons.push(`${alternative.overall_score - original.overall_score} points higher overall score`)
  }

  if (alternative.proprietary_blend_penalty === 0 && original.proprietary_blend_penalty > 0) {
    reasons.push('No proprietary blends - full transparency')
  }

  if (alternative.third_party_tested && !original.third_party_tested) {
    reasons.push('Third-party tested for purity')
  }

  if (alternative.price_per_serving < original.price_per_serving) {
    const savings = ((original.price_per_serving - alternative.price_per_serving) * 30).toFixed(2)
    reasons.push(`Save $${savings}/month`)
  }

  return reasons
}

function convertToMg(amount: number, unit: string): number {
  switch (unit?.toLowerCase()) {
    case 'g':
      return amount * 1000
    case 'mg':
      return amount
    case 'mcg':
    case 'ug':
      return amount / 1000
    default:
      return amount
  }
}
