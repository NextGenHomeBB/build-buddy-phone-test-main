// Database compatibility fixes for mismatched schemas
// This file provides helper functions to handle database schema mismatches

export function getProgressValue(): number {
  // Since progress field doesn't exist, always return 0
  return 0;
}

export function getUserId(profile: any): string {
  // Handle both user_id and auth_user_id fields
  return profile.auth_user_id || profile.id || profile.user_id;
}

export function getChecklistItems(): any[] {
  // Since items column doesn't exist in checklists, return empty array
  return [];
}

export function getProjectType(project: any): string {
  // Since type field doesn't exist, use description or default
  return project.description || 'Residential';
}

export function getTotalHours(entry: any): number {
  // Use hours_worked instead of total_hours
  return entry.hours_worked || 0;
}

export function disableNonExistentTables() {
  return {
    project_materials: [],
    project_checklists: [],
    user_phase_role: [],
    timesheets: [],
    schedule_items: [],
    project_documents: []
  };
}