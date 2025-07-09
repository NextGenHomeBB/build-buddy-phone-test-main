import { useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Project {
  id: string;
  name: string;
  phases: Phase[];
}

interface Phase {
  id: string;
  name: string;
  project_id: string;
}

interface UserProjectRole {
  id: string;
  user_id: string;
  project_id: string;
  role: 'manager' | 'worker';
}

interface UserPhaseRole {
  id: string;
  upr_id: string;
  phase_id: string;
  role: 'manager' | 'worker';
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function AdminUserAccess() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users by email
  const { data: users = [] } = useQuery({
    queryKey: ['users', searchEmail],
    queryFn: async () => {
      if (!searchEmail) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .ilike('name', `%${searchEmail}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Convert to User format
      return data.map(profile => ({
        id: profile.user_id,
        email: profile.name || '', // This would need to be properly mapped from auth.users
        name: profile.name
      }));
    },
    enabled: searchEmail.length > 2,
  });

  // Get all projects with phases
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-with-phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          phases:project_phases(id, name, project_id)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Project[];
    },
  });

  // Mock user project roles (since tables don't exist yet)
  const { data: userProjectRoles = [] } = useQuery({
    queryKey: ['user-project-roles', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      // Mock data for demonstration - in real implementation this would query user_project_role table
      console.warn('user_project_role table not yet implemented, using mock data');
      return [] as UserProjectRole[];
    },
    enabled: !!selectedUser,
  });

  // Mock user phase roles (since tables don't exist yet)
  const { data: userPhaseRoles = [] } = useQuery({
    queryKey: ['user-phase-roles', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      // Mock data for demonstration - in real implementation this would query user_phase_role table
      console.warn('user_phase_role table not yet implemented, using mock data');
      return [] as UserPhaseRole[];
    },
    enabled: !!selectedUser,
  });

  // Debounced upsert for project roles
  const useDebouncedUpsert = () => {
    const mutation = useMutation({
      mutationFn: async ({ 
        userId, 
        projectId, 
        role, 
        enabled 
      }: { 
        userId: string; 
        projectId: string; 
        role: 'manager' | 'worker'; 
        enabled: boolean;
      }) => {
        // Mock implementation - in real implementation this would upsert to user_project_role table
        console.log('Would upsert project role:', { userId, projectId, role, enabled });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (Math.random() > 0.8) {
          throw new Error('Simulated error for testing');
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-project-roles'] });
        toast({
          title: "Success",
          description: "User access updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update user access",
          variant: "destructive",
        });
        console.error('Access update error:', error);
      },
    });

    const debouncedMutate = useCallback(
      debounce((variables: Parameters<typeof mutation.mutate>[0]) => {
        mutation.mutate(variables);
      }, 500),
      [mutation]
    );

    return { mutate: debouncedMutate };
  };

  // Debounced upsert for phase roles
  const useDebouncedPhaseUpsert = () => {
    const mutation = useMutation({
      mutationFn: async ({ 
        uprId, 
        phaseId, 
        role, 
        enabled 
      }: { 
        uprId: string; 
        phaseId: string; 
        role: 'manager' | 'worker'; 
        enabled: boolean;
      }) => {
        // Mock implementation - in real implementation this would upsert to user_phase_role table
        console.log('Would upsert phase role:', { uprId, phaseId, role, enabled });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (Math.random() > 0.8) {
          throw new Error('Simulated error for testing');
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-phase-roles'] });
        toast({
          title: "Success",
          description: "Phase access updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update phase access",
          variant: "destructive",
        });
        console.error('Phase access update error:', error);
      },
    });

    const debouncedMutate = useCallback(
      debounce((variables: Parameters<typeof mutation.mutate>[0]) => {
        mutation.mutate(variables);
      }, 500),
      [mutation]
    );

    return { mutate: debouncedMutate };
  };

  const projectRoleUpsert = useDebouncedUpsert();
  const phaseRoleUpsert = useDebouncedPhaseUpsert();

  // Helper functions
  const hasProjectRole = (projectId: string, role: 'manager' | 'worker') => {
    return userProjectRoles.some(
      upr => upr.project_id === projectId && upr.role === role
    );
  };

  const hasPhaseRole = (phaseId: string, role: 'manager' | 'worker') => {
    const projectRole = userProjectRoles.find(upr => 
      projects.find(p => p.id === upr.project_id)?.phases.some(ph => ph.id === phaseId)
    );
    
    if (!projectRole) return false;
    
    return userPhaseRoles.some(
      upr => upr.upr_id === projectRole.id && upr.phase_id === phaseId && upr.role === role
    );
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectRoleChange = (projectId: string, role: 'manager' | 'worker', enabled: boolean) => {
    if (!selectedUser) return;
    
    projectRoleUpsert.mutate({
      userId: selectedUser.id,
      projectId,
      role,
      enabled
    });
  };

  const handlePhaseRoleChange = (phaseId: string, role: 'manager' | 'worker', enabled: boolean) => {
    if (!selectedUser) return;
    
    const projectRole = userProjectRoles.find(upr => 
      projects.find(p => p.id === upr.project_id)?.phases.some(ph => ph.id === phaseId)
    );
    
    if (!projectRole) return;
    
    phaseRoleUpsert.mutate({
      uprId: projectRole.id,
      phaseId,
      role,
      enabled
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Access Management</h1>
      </div>

      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant={selectedUser?.id === user.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedUser(user)}
                >
                  {user.email} {user.name && `(${user.name})`}
                </Button>
              ))}
            </div>
          )}
          
          {selectedUser && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">Selected: {selectedUser.email}</p>
              {selectedUser.name && <p className="text-sm text-muted-foreground">{selectedUser.name}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Access Grid */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Project Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => {
                const isExpanded = expandedProjects.has(project.id);
                
                return (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProjectExpansion(project.id)}
                          className="p-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="font-medium">{project.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={hasProjectRole(project.id, 'manager')}
                            onCheckedChange={(checked) => 
                              handleProjectRoleChange(project.id, 'manager', !!checked)
                            }
                          />
                          <label className="text-sm">Manager</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={hasProjectRole(project.id, 'worker')}
                            onCheckedChange={(checked) => 
                              handleProjectRoleChange(project.id, 'worker', !!checked)
                            }
                          />
                          <label className="text-sm">Worker</label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Phase Access */}
                    {isExpanded && project.phases && project.phases.length > 0 && (
                      <div className="mt-4 ml-6 space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Phases</h4>
                        {project.phases.map((phase) => (
                          <div key={phase.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                            <span className="text-sm">{phase.name}</span>
                            
                            <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={hasPhaseRole(phase.id, 'manager')}
                                  onCheckedChange={(checked) => 
                                    handlePhaseRoleChange(phase.id, 'manager', !!checked)
                                  }
                                />
                                <label className="text-sm">Manager</label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={hasPhaseRole(phase.id, 'worker')}
                                  onCheckedChange={(checked) => 
                                    handlePhaseRoleChange(phase.id, 'worker', !!checked)
                                  }
                                />
                                <label className="text-sm">Worker</label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Note about missing tables */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This interface is ready but requires the <code>user_project_role</code> and <code>user_phase_role</code> tables to be created in the database. 
            Currently using mock data for demonstration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}