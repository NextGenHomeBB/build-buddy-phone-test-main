import { useState } from "react";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ShiftCard } from "@/components/dashboard/ShiftCard";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAccessibleProjects } from "@/hooks/useProjects";
export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    canCreateProject,
    isWorker
  } = useRoleAccess();

  // Fetch real projects data
  const {
    data: projects = [],
    isLoading,
    error
  } = useAccessibleProjects();

  // Transform database projects to match ProjectCard interface
  const transformedProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description || "",
    status: project.status as "planning" | "active" | "on-hold" | "completed" | "cancelled",
    progress: project.progress,
    dueDate: new Date(project.end_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    teamSize: project.user_project_roles?.length || 0,
    currentPhase: project.phases?.[0]?.name || "Not started",
    urgentTasks: project.tasks?.filter(task => task.priority === 'urgent' && task.status !== 'completed')?.length || 0
  }));
  const filteredProjects = transformedProjects.filter(project => project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.description.toLowerCase().includes(searchQuery.toLowerCase()));
  if (error) {
    return <div className="space-y-6 lg:space-y-8">
        <div className="text-center py-12">
          <p className="text-destructive">Error loading projects: {error.message}</p>
        </div>
      </div>;
  }
  return <div className="space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {isWorker() ? 'My Work Dashboard' : 'Project Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isWorker() ? 'Track your assigned tasks and projects' : 'Monitor and manage your construction projects'}
          </p>
        </div>
        
        {canCreateProject() && <Button size="lg" className="sm:w-auto w-full bg-green-500 hover:bg-green-400 text-gray-950">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>}
      </div>

      {/* Shift Card - Only for workers */}
      {isWorker() && <div className="max-w-sm">
          <ShiftCard />
        </div>}

      {/* Stats Grid */}
      <StatsGrid />

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Active Projects
          </h2>
          
          <div className="relative sm:w-80 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? <div className="text-center py-12">
            <p className="text-muted-foreground">Loading projects...</p>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredProjects.map(project => <ProjectCard key={project.id} project={project} />)}
          </div>}

        {!isLoading && filteredProjects.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground">
              {projects.length === 0 ? 'No projects available.' : 'No projects found matching your search.'}
            </p>
          </div>}
      </div>
    </div>;
}