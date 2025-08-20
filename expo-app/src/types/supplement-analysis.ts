export interface SupplementAnalysis {
  // Decision-first data
  verdict: string; // Plain English summary
  grade: number;
  deltas: {
    transparency: number;
    efficacy: number; 
    safety: number;
    purity: number;
    value: number;
  };
  
  // Aha moment data
  doseFlags: Array<{
    nutrient: string;
    unit: string;
    perServing: number;
    clinicalMin: number;
    status: 'underdosed' | 'optimal' | 'overdosed';
    servingsForClinical: number;
  }>;
  
  cost: {
    price: number;
    servingsPerContainer: number;
    costPerServing: number;
    costPerEffectiveServing: number;
    industryAvg: number;
    annualCost: number;
    annualSavingsVsBest: number;
  };
  
  transparency: {
    proprietaryBlends: Array<{name: string; totalMg?: number}>;
    disclosedActivesPct: number;
  };
  
  safety: {
    allergens: string[];
    stimulants: string[];
    sweeteners: string[];
    warningCopy?: string[];
  };
  
  alternatives: Array<{
    name: string;
    url: string;
    headlineGain: string;
    price?: number;
    grade: number;
  }>;
  
  citations: Array<{
    claim: string;
    source: string;
    pubmedId?: string;
  }>;
}
