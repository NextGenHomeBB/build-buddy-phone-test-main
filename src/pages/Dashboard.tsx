import { useState } from "react";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { useRoleAccess } from "@/hooks/useRoleAccess";

// Mock data for demonstration
const mockProjects = [
  {
    id: "1",
    name: "Downtown Office Complex",
    description: "Modern 15-story office building with sustainable design features and underground parking.",
    status: "active" as const,
    progress: 67,
    dueDate: "Mar 2024",
    teamSize: 24,
    currentPhase: "Foundation & Structure",
    urgentTasks: 3,
  },
  {
    id: "2", 
    name: "Riverside Residential Towers",
    description: "Twin residential towers with 200 units each, featuring modern amenities and river views.",
    status: "review" as const,
    progress: 89,
    dueDate: "Jan 2024",
    teamSize: 18,
    currentPhase: "Final Inspections",
    urgentTasks: 1,
  },
  {
    id: "3",
    name: "Metro Station Renovation",
    description: "Complete renovation of historic metro station with accessibility improvements.",
    status: "planning" as const,
    progress: 23,
    dueDate: "Jun 2024",
    teamSize: 12,
    currentPhase: "Design Review",
    urgentTasks: 0,
  },
  {
    id: "4",
    name: "Industrial Warehouse Complex",
    description: "Large-scale warehouse facility with automated systems and distribution capabilities.",
    status: "delayed" as const,
    progress: 45,
    dueDate: "Feb 2024",
    teamSize: 31,
    currentPhase: "Electrical Systems",
    urgentTasks: 7,
  },
];

const recentActivities = [
  {
    id: "1",
    action: "Phase completed",
    project: "Downtown Office Complex",
    user: "Sarah Johnson",
    time: "2 hours ago",
    type: "success" as const,
  },
  {
    id: "2", 
    action: "Material delivery delayed",
    project: "Industrial Warehouse Complex",
    user: "Mike Rodriguez",
    time: "4 hours ago",
    type: "warning" as const,
  },
  {
    id: "3",
    action: "Inspection scheduled",
    project: "Riverside Residential Towers", 
    user: "Emily Chen",
    time: "6 hours ago",
    type: "info" as const,
  },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { canCreateProject, isWorker } = useRoleAccess();

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 lg:space-y-8">
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
        
        {canCreateProject() && (
          <Button size="lg" className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

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
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => {
                // Navigation to project details would go here
                console.log(`Navigate to project ${project.id}`);
              }}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your search.</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div 
                  className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                    activity.type === 'success' ? 'bg-success' :
                    activity.type === 'warning' ? 'bg-warning' :
                    'bg-primary'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.project} • {activity.user}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}