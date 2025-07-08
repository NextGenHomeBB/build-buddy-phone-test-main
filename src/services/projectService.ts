import { mockProjects, mockPhases, Project, Phase } from '@/mocks/projects';

/**
 * Project service for handling project-related API calls
 * Currently returns mock data, will be replaced with real API calls later
 */
class ProjectService {
  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProjects;
  }

  /**
   * Get project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockProjects.find(p => p.id === id) || null;
  }

  /**
   * Get phases for a project
   */
  async getProjectPhases(projectId: string): Promise<Phase[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPhases.filter(p => p.projectId === projectId);
  }

  /**
   * Get phase by ID
   */
  async getPhase(phaseId: string): Promise<Phase | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPhases.find(p => p.id === phaseId) || null;
  }

  /**
   * Update checklist item completion status
   */
  async updateChecklistItem(phaseId: string, itemId: string, completed: boolean, completedBy?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const phase = mockPhases.find(p => p.id === phaseId);
    if (phase) {
      const item = phase.checklist.find(i => i.id === itemId);
      if (item) {
        item.completed = completed;
        if (completed && completedBy) {
          item.completedBy = completedBy;
          item.completedAt = new Date().toISOString();
        } else {
          item.completedBy = undefined;
          item.completedAt = undefined;
        }
      }
    }
  }

  /**
   * Create new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'phases' | 'materials' | 'labour' | 'documents' | 'activities'>): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      phases: [],
      materials: [],
      labour: [],
      documents: [],
      activities: []
    };

    mockProjects.push(newProject);
    return newProject;
  }

  /**
   * Update project
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockProjects.findIndex(p => p.id === id);
    if (index >= 0) {
      mockProjects[index] = { ...mockProjects[index], ...updates };
      return mockProjects[index];
    }
    return null;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockProjects.findIndex(p => p.id === id);
    if (index >= 0) {
      mockProjects.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const projectService = new ProjectService();