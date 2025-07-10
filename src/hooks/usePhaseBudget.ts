import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseEstimateParams {
  phaseType: string;
  area: number; // m² or m³
  complexity: 'low' | 'medium' | 'high';
}

export interface CostEstimate {
  material: number;
  labour: number;
}

export function usePhaseBudget() {
  const [isEstimating, setIsEstimating] = useState(false);

  const estimateCosts = async (params: PhaseEstimateParams): Promise<CostEstimate> => {
    setIsEstimating(true);
    
    try {
      // Simple estimation algorithm based on phase type and complexity
      const baseRates = {
        foundation: { material: 150, labour: 100 },
        structure: { material: 200, labour: 150 },
        roofing: { material: 120, labour: 80 },
        electrical: { material: 80, labour: 120 },
        plumbing: { material: 90, labour: 110 },
        finishing: { material: 100, labour: 90 },
        landscaping: { material: 60, labour: 70 },
      };

      const complexityMultiplier = {
        low: 0.8,
        medium: 1.0,
        high: 1.3,
      };

      const rates = baseRates[params.phaseType as keyof typeof baseRates] || baseRates.structure;
      const multiplier = complexityMultiplier[params.complexity];

      const material = Math.round(rates.material * params.area * multiplier);
      const labour = Math.round(rates.labour * params.area * multiplier);

      return { material, labour };
    } finally {
      setIsEstimating(false);
    }
  };

  const updatePhaseCosts = async (phaseId: string, material_cost: number, labour_cost: number) => {
    const { error } = await supabase
      .from('project_phases')
      .update({ 
        material_cost, 
        labour_cost,
        updated_at: new Date().toISOString()
      })
      .eq('id', phaseId);

    if (error) throw error;
  };

  return {
    estimateCosts,
    updatePhaseCosts,
    isEstimating,
  };
}