/**
 * Utility functions for calculating progress percentages safely
 */

/**
 * Calculates a safe progress percentage, handling division by zero
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Progress percentage (0-100), defaults to 0 if total is 0
 */
export function calculateProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  const progress = (completed / total) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}

/**
 * Calculates budget usage percentage safely
 * @param spent - Amount spent
 * @param budget - Total budget
 * @returns Budget usage percentage (0-100+), defaults to 0 if budget is 0
 */
export function calculateBudgetProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  const progress = (spent / budget) * 100;
  return Math.max(progress, 0); // Allow over 100% for over-budget scenarios
}

/**
 * Formats progress for display
 * @param progress - Progress percentage
 * @returns Formatted progress string with % symbol
 */
export function formatProgress(progress: number): string {
  return `${progress.toFixed(1)}%`;
}