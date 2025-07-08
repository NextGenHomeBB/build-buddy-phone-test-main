import { Task, TaskComment, TaskFilters } from '@/hooks/useTasks';
import { mockTasks, mockTaskComments } from '@/mocks/tasks';

/**
 * Task service for managing task-related operations
 * In a real application, this would connect to your backend API
 */
class TaskService {
  private tasks: Task[] = mockTasks;
  private comments: TaskComment[] = mockTaskComments;

  /**
   * Get tasks for a specific user with optional filters
   */
  async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredTasks = this.tasks.filter(task => task.assignedTo === userId);

    if (filters) {
      if (filters.status?.length) {
        filteredTasks = filteredTasks.filter(task => filters.status!.includes(task.status));
      }
      
      if (filters.priority?.length) {
        filteredTasks = filteredTasks.filter(task => filters.priority!.includes(task.priority));
      }
      
      if (filters.projectId) {
        filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.projectName.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.dueDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        filteredTasks = filteredTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          
          switch (filters.dueDate) {
            case 'overdue':
              return dueDate < today;
            case 'today':
              return dueDate.toDateString() === today.toDateString();
            case 'week':
              return dueDate <= weekFromNow;
            case 'month':
              return dueDate <= monthFromNow;
            default:
              return true;
          }
        });
      }
    }

    return filteredTasks.sort((a, b) => {
      // Sort by priority, then by due date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Update a task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    this.tasks[index] = { ...this.tasks[index], ...updates };
    return this.tasks[index];
  }

  /**
   * Add a comment to a task
   */
  async addComment(taskId: string, message: string, userId: string): Promise<TaskComment> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const comment: TaskComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      user: userId,
      message,
      createdAt: new Date().toISOString(),
    };
    
    this.comments.push(comment);
    
    // Update task to include the comment
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex >= 0) {
      this.tasks[taskIndex].comments = [
        ...(this.tasks[taskIndex].comments || []),
        comment
      ];
    }
    
    return comment;
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
    avgCompletionTime: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const userTasks = this.tasks.filter(task => task.assignedTo === userId);
    const now = new Date();
    
    const stats = {
      total: userTasks.length,
      completed: userTasks.filter(task => task.status === 'completed').length,
      inProgress: userTasks.filter(task => task.status === 'in-progress').length,
      overdue: userTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
      ).length,
      completionRate: 0,
      avgCompletionTime: 0,
    };
    
    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    
    // Calculate average completion time (mock calculation)
    const completedTasks = userTasks.filter(task => task.status === 'completed');
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((acc, task) => acc + (task.actualHours || 0), 0);
      stats.avgCompletionTime = totalTime / completedTasks.length;
    }
    
    return stats;
  }
}

export const taskService = new TaskService();