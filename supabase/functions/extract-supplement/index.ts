import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireEnv } from "../_shared/env.ts"
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