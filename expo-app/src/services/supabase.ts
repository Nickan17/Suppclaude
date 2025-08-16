import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Types for our database
export interface Profile {
  id: string
  email: string
  created_at: string
  age?: number
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  weight_kg?: number
  height_cm?: number
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'athlete'
  monthly_spend_usd?: number
  current_supplement_count?: number
  years_taking_supplements?: number
  purchase_channels?: string[]
  goals?: string[]
  avoid_ingredients?: string[]
  preferred_forms?: string[]
  price_sensitivity?: number
  onboarding_completed: boolean
  onboarding_responses?: any
  last_active?: string
  scan_count: number
  products_saved: number
}

export interface Product {
  id: string
  barcode?: string
  url?: string
  brand?: string
  name: string
  category?: string
  ingredients_raw?: string
  supplement_facts?: any
  serving_size?: string
  servings_per_container?: number
  price_usd?: number
  price_per_serving?: number
  overall_score?: number
  purity_score?: number
  efficacy_score?: number
  safety_score?: number
  value_score?: number
  proprietary_blend_penalty?: number
  third_party_tested?: boolean
  gmp_certified?: boolean
  banned_substances_free?: boolean
  heavy_metals_tested?: boolean
  pubmed_references?: any
  clinical_evidence_grade?: 'A' | 'B' | 'C' | 'D' | 'F'
  evidence_summary?: string
  warnings?: string[]
  allergens?: string[]
  drug_interactions?: string[]
  created_at: string
  updated_at: string
  last_analysis?: string
  extraction_method?: string
  extraction_confidence?: number
  raw_extraction_data?: any
}

export interface UserProduct {
  id: string
  user_id: string
  product_id: string
  scanned_at: string
  is_owned: boolean
  rating?: number
  notes?: string
  repurchase_intent?: boolean
  reported_effects?: string[]
}

export interface ProductAlternative {
  id: string
  original_product_id: string
  alternative_product_id: string
  reason_for_recommendation: string
  improvement_areas: string[]
  score_improvement: number
  price_difference: number
  user_segment: string[]
  confidence: number
  created_at: string
}

// Helper functions
export const scoreToGrade = (score: number): string => {
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

export const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return '#4ECDC4'
  if (grade.startsWith('B')) return '#95E1D3'
  if (grade.startsWith('C')) return '#FFE66D'
  if (grade.startsWith('D')) return '#FFAB76'
  return '#FF6B6B'
}
