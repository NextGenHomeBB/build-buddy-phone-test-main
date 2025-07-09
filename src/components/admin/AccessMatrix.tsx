
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Grid, List, Eye, EyeOff } from 'lucide-react';

interface AccessMatrixProps {
  projects: any[];
  userProjectRoles: any[];
  userPhaseRoles: any[];
  selectedUserId: string;
  onRoleChange: (projectId: string, role: string, enabled: boolean) => void;
  onPhaseRoleChange: (phaseId: string, role: string, enabled: boolean) => void;
}

export const AccessMatrix = ({
  projects,
  userProjectRoles,
  userPhaseRoles,
  selectedUserId,
  onRoleChange,
  onPhaseRoleChange
}: AccessMatrixProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);

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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasAnyRole = hasProjectRole(project.id, 'manager') || hasProjectRole(project.id, 'worker');
    const matchesRoleFilter = roleFilter === 'all' || 
      (roleFilter === 'manager' && hasProjectRole(project.id, 'manager')) ||
      (roleFilter === 'worker' && hasProjectRole(project.id, 'worker'));
    const matchesAssignedFilter = !showOnlyAssigned || hasAnyRole;
    
    return matchesSearch && matchesRoleFilter && matchesAssignedFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Advanced Project Access Matrix
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="manager">Manager Only</SelectItem>
              <SelectItem value="worker">Worker Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showOnlyAssigned ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyAssigned(!showOnlyAssigned)}
            className="flex items-center gap-2"
          >
            {showOnlyAssigned ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showOnlyAssigned ? 'Assigned Only' : 'Show All'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const projectManagerRole = hasProjectRole(project.id, 'manager');
            const projectWorkerRole = hasProjectRole(project.id, 'worker');
            
            return (
              <div key={project.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{project.name}</h3>
                    <div className="flex gap-2">
                      {projectManagerRole && <Badge variant="default">Manager</Badge>}
                      {projectWorkerRole && <Badge variant="secondary">Worker</Badge>}
                      {!projectManagerRole && !projectWorkerRole && (
                        <Badge variant="outline">No Access</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={projectManagerRole}
                        onChange={(e) => onRoleChange(project.id, 'manager', e.target.checked)}
                        className="rounded"
                      />
                      Manager
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={projectWorkerRole}
                        onChange={(e) => onRoleChange(project.id, 'worker', e.target.checked)}
                        className="rounded"
                      />
                      Worker
                    </label>
                  </div>
                </div>
                
                {/* Phase Access */}
                {project.phases && project.phases.length > 0 && (
                  <div className="ml-4 pl-4 border-l-2 border-muted">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Phase Access</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {project.phases.map((phase: any) => {
                        const phaseManagerRole = hasPhaseRole(phase.id, 'manager');
                        const phaseWorkerRole = hasPhaseRole(phase.id, 'worker');
                        
                        return (
                          <div key={phase.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm font-medium">{phase.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={phaseManagerRole}
                                  onChange={(e) => onPhaseRoleChange(phase.id, 'manager', e.target.checked)}
                                  className="rounded"
                                />
                                M
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={phaseWorkerRole}
                                  onChange={(e) => onPhaseRoleChange(phase.id, 'worker', e.target.checked)}
                                  className="rounded"
                                />
                                W
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects match your current filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
