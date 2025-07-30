// Phase costs service - temporarily disabled due to missing tables
export interface MaterialCost {
  id: string;
  phase_id: string;
  category: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface LabourCost {
  id: string;
  phase_id: string;
  task: string;
  subcontractor_id: string | null;
  hours: number;
  rate: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseCosts {
  materialCosts: MaterialCost[];
  labourCosts: LabourCost[];
  totalMaterialCost: number;
  totalLabourCost: number;
  totalCost: number;
}

export class PhaseCostsService {
  async getPhaseCosts(phaseId: string): Promise<PhaseCosts> {
    console.warn('Phase costs service temporarily disabled - missing tables');
    return {
      materialCosts: [],
      labourCosts: [],
      totalMaterialCost: 0,
      totalLabourCost: 0,
      totalCost: 0
    };
  }

  async updatePhaseCosts(phaseId: string, costs: Partial<PhaseCosts>): Promise<void> {
    console.warn('Phase costs service temporarily disabled - missing tables');
  }
}

export const phaseCostsService = new PhaseCostsService();

// Placeholder hooks for compatibility
export function usePhaseCosts(phaseId: string) {
  return {
    data: null,
    isLoading: false,
    error: null
  };
}

export function useInsertLabourCost() {
  return {
    mutate: () => console.warn('Labour cost insertion temporarily disabled'),
    isLoading: false
  };
}

export function useInsertMaterialCost() {
  return {
    mutate: () => console.warn('Material cost insertion temporarily disabled'),
    isLoading: false
  };
}

export function useEstimatePhaseCosts() {
  return {
    mutate: () => console.warn('Phase cost estimation temporarily disabled'),
    isLoading: false
  };
}