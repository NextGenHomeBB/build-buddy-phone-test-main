import { useState, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Users, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { accessService } from '@/services/access.service';
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
  user_id: string;
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
  const [searchName, setSearchName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search users by name
  const { data: users = [] } = useQuery({
    queryKey: ['users', searchName],
    queryFn: async () => {
      if (!searchName) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .ilike('name', `%${searchName}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Convert to User format
      return data.map(profile => ({
        id: profile.user_id,
        email: `${profile.name}@user.local`, // Placeholder since email isn't available
        name: profile.name
      }));
    },
    enabled: searchName.length > 2,
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

  // Get user project roles
  const { data: userProjectRoles = [] } = useQuery({
    queryKey: ['user-project-roles', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from('user_project_role')
        .select('*')
        .eq('user_id', selectedUser.id);
      
      if (error) throw error;
      return data as UserProjectRole[];
    },
    enabled: !!selectedUser,
  });

  // Get user phase roles
  const { data: userPhaseRoles = [] } = useQuery({
    queryKey: ['user-phase-roles', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from('user_phase_role')
        .select('*')
        .eq('user_id', selectedUser.id);
      
      if (error) throw error;
      return data as UserPhaseRole[];
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
        if (enabled) {
          await accessService.upsertUserProjectRole(userId, projectId, role);
        } else {
          await accessService.removeUserProjectRole(userId, projectId, role);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-project-roles', selectedUser?.id] });
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
        userId, 
        phaseId, 
        role, 
        enabled 
      }: { 
        userId: string; 
        phaseId: string; 
        role: 'manager' | 'worker'; 
        enabled: boolean;
      }) => {
        if (enabled) {
          await accessService.upsertUserPhaseRole(userId, phaseId, role);
        } else {
          await accessService.removeUserPhaseRole(userId, phaseId, role);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-phase-roles', selectedUser?.id] });
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
    return userPhaseRoles.some(
      upr => upr.phase_id === phaseId && upr.role === role
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
    
    phaseRoleUpsert.mutate({
      userId: selectedUser.id,
      phaseId,
      role,
      enabled
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Access Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage project and phase access for users
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </Link>
        </Button>
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
              placeholder="Search user by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
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
                  {user.name}
                </Button>
              ))}
            </div>
          )}
          
          {selectedUser && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">Selected: {selectedUser.name}</p>
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
      
    </div>
  );
}