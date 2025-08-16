/**
 * Product parsing helper functions
 * Extracts structured data from scraped HTML/text
 */

export const parseProductName = (html: string, url: string): string => {
  // Try multiple selectors for product name
  const selectors = [
    'h1[data-automation-id="product-title"]', // Amazon
    'h1.product-title',
    'h1[itemprop="name"]',
    '.product-name h1',
    'h1.x-large',
    '.pdp-product-name',
    '#product-title h1'
  ]

  for (const selector of selectors) {
    const regex = new RegExp(`<[^>]*class[^>]*${selector.replace('.', '').replace('#', '')}[^>]*>([^<]+)<`, 'i')
    const match = html.match(regex)
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
  }

  // Try h1 tags in general
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match && h1Match[1]) {
    const title = h1Match[1].trim()
    if (title.length > 10 && title.length < 200) {
      return title.replace(/\s+/g, ' ')
    }
  }

  // Fallback to URL parsing
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    // Extract from Amazon-style URLs: /dp/B08XXX/product-name
    const amazonMatch = pathname.match(/\/dp\/[A-Z0-9]+\/([^\/]+)/)
    if (amazonMatch) {
      return amazonMatch[1].replace(/-/g, ' ').replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )
    }
  } catch (error) {
    // Ignore URL parsing errors
  }

  return 'Unknown Product'
}

export const parseBrand = (html: string): string => {
  // Try multiple selectors for brand
  const patterns = [
    /<span[^>]*itemprop="brand"[^>]*>([^<]+)<\/span>/i,
    /<meta[^>]*property="product:brand"[^>]*content="([^"]+)"/i,
    /<div[^>]*class[^>]*brand[^>]*>([^<]+)<\/div>/i,
    /<span[^>]*class[^>]*brand[^>]*>([^<]+)<\/span>/i,
    /<a[^>]*class[^>]*brand[^>]*>([^<]+)<\/a>/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const brand = match[1].trim()
      if (brand.length > 1 && brand.length < 50) {
        return brand
      }
    }
  }

  return 'Unknown Brand'
}

export const parseIngredients = (text: string): string[] => {
  // Look for ingredients section
  const patterns = [
    /Ingredients:\s*([^\.]+(?:\.[^\.]*(?:acid|extract|powder|blend)[^\.]*)*)/i,
    /Other Ingredients:\s*([^\.]+(?:\.[^\.]*(?:acid|extract|powder|blend)[^\.]*)*)/i,
    /Contains:\s*([^\.]+)/i,
    /Supplement Facts[^:]*:\s*([^\.]+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const ingredientsText = match[1].trim()
      
      // Split by common delimiters
      const ingredients = ingredientsText
        .split(/[,;]\s*/)
        .map(ingredient => ingredient.trim())
        .filter(ingredient => 
          ingredient.length > 2 && 
          ingredient.length < 100 &&
          !ingredient.toLowerCase().includes('contains less than') &&
          !ingredient.toLowerCase().includes('daily value')
        )
        .map(ingredient => {
          // Clean up formatting
          return ingredient
            .replace(/^\d+\.?\s*/, '') // Remove numbering
            .replace(/\([^)]*\)/g, '') // Remove parentheses content
            .trim()
        })
        .filter(ingredient => ingredient.length > 0)

      if (ingredients.length > 0) {
        return ingredients.slice(0, 20) // Limit to 20 ingredients
      }
    }
  }

  return []
}

export const parseServingSize = (text: string): string => {
  const patterns = [
    /Serving Size:\s*([^,\n]+)/i,
    /Per Serving:\s*([^,\n]+)/i,
    /Serving:\s*([^,\n]+)/i,
    /Servings Per Container:\s*\d+[^,\n]*Serving Size:\s*([^,\n]+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const serving = match[1].trim()
      if (serving.length > 1 && serving.length < 50) {
        return serving
      }
    }
  }

  return 'Not specified'
}

export const parseServingsPerContainer = (text: string): number | null => {
  const patterns = [
    /Servings Per Container:\s*(\d+)/i,
    /(\d+)\s*Servings/i,
    /Container Size:\s*(\d+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const servings = parseInt(match[1])
      if (servings > 0 && servings < 1000) {
        return servings
      }
    }
  }

  return null
}

export const parsePrice = (html: string): number | null => {
  // Try multiple price selectors
  const patterns = [
    /<span[^>]*class[^>]*price[^>]*>[\$£€]?([0-9,]+\.?\d*)<\/span>/i,
    /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
    /<span[^>]*itemprop="price"[^>]*>[\$£€]?([0-9,]+\.?\d*)<\/span>/i,
    /<div[^>]*class[^>]*price[^>]*>[\$£€]?([0-9,]+\.?\d*)<\/div>/i,
    /\$([0-9,]+\.?\d*)/g
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const priceStr = match[1].replace(/,/g, '')
      const price = parseFloat(priceStr)
      if (price > 0 && price < 10000) {
        return price
      }
    }
  }

  return null
}

export const parseSupplementFacts = (html: string): any => {
  const facts: any = {}
  
  // Look for supplement facts table
  const tableMatch = html.match(/<table[^>]*supplement[^>]*>[\s\S]*?<\/table>/i)
  if (!tableMatch) {
    return facts
  }
  
  const tableHtml = tableMatch[0]
  
  // Extract rows
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi)
  if (!rowMatches) {
    return facts
  }

  const nutrients: any = {}
  
  for (const row of rowMatches) {
    // Extract nutrient name and amount
    const cells = row.match(/<td[^>]*>([^<]+)<\/td>/gi)
    if (cells && cells.length >= 2) {
      const nutrient = cells[0].replace(/<[^>]*>/g, '').trim()
      const amount = cells[1].replace(/<[^>]*>/g, '').trim()
      
      if (nutrient.length > 0 && amount.length > 0) {
        nutrients[nutrient] = amount
      }
    }
  }
  
  if (Object.keys(nutrients).length > 0) {
    facts.nutrients = nutrients
  }
  
  return facts
}

export const parseSupplementFactsFromText = (text: string): any => {
  const facts: any = {}
  
  // Look for supplement facts section
  const factsMatch = text.match(/Supplement Facts[\s\S]*?(?=Ingredients|Other Ingredients|$)/i)
  if (!factsMatch) {
    return facts
  }
  
  const factsText = factsMatch[0]
  const nutrients: any = {}
  
  // Parse serving size
  const servingMatch = factsText.match(/Serving Size:\s*([^\n]+)/i)
  if (servingMatch) {
    facts.serving_size = servingMatch[1].trim()
  }
  
  // Parse servings per container
  const servingsMatch = factsText.match(/Servings Per Container:\s*(\d+)/i)
  if (servingsMatch) {
    facts.servings_per_container = parseInt(servingsMatch[1])
  }
  
  // Parse nutrients (look for pattern: Name Amount % Daily Value)
  const nutrientLines = factsText.split('\n')
  for (const line of nutrientLines) {
    const nutrientMatch = line.match(/([A-Za-z\s]+?)\s+([0-9,]+\.?\d*\s*[a-zA-Z]*)\s*(\d+%)?/i)
    if (nutrientMatch && nutrientMatch[1] && nutrientMatch[2]) {
      const name = nutrientMatch[1].trim()
      const amount = nutrientMatch[2].trim()
      
      if (name.length > 2 && name.length < 50) {
        nutrients[name] = {
          amount,
          daily_value: nutrientMatch[3] || null
        }
      }
    }
  }
  
  if (Object.keys(nutrients).length > 0) {
    facts.nutrients = nutrients
  }
  
  return facts
}

export const parseIngredientsFromText = (text: string): string => {
  const ingredients = parseIngredients(text)
  return ingredients.join(', ')
}

export const determineCategory = (name: string, ingredients: string): string => {
  const lowerName = name.toLowerCase()
  const lowerIngredients = ingredients?.toLowerCase() || ''

  if (lowerName.includes('protein') || lowerName.includes('whey') || lowerIngredients.includes('protein')) {
    return 'protein'
  }
  if (lowerName.includes('pre-workout') || lowerName.includes('preworkout') || lowerIngredients.includes('caffeine')) {
    return 'pre_workout'
  }
  if (lowerName.includes('vitamin') || lowerName.includes('multivitamin')) {
    return 'vitamins'
  }
  if (lowerName.includes('creatine') || lowerIngredients.includes('creatine')) {
    return 'creatine'
  }
  if (lowerName.includes('omega') || lowerName.includes('fish oil')) {
    return 'omega'
  }
  if (lowerName.includes('probiotic')) {
    return 'probiotics'
  }
  if (lowerIngredients.includes('nootropic') || lowerName.includes('brain') || lowerName.includes('focus')) {
    return 'nootropics'
  }
  
  return 'other'
}
