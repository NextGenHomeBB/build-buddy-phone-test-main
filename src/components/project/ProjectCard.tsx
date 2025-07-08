import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Users, AlertTriangle } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: "planning" | "active" | "review" | "completed" | "delayed";
    progress: number;
    dueDate: string;
    teamSize: number;
    currentPhase: string;
    urgentTasks: number;
  };
  onClick?: () => void;
}

const statusConfig = {
  planning: { label: "Planning", variant: "secondary" as const, color: "bg-muted" },
  active: { label: "Active", variant: "default" as const, color: "bg-primary" },
  review: { label: "In Review", variant: "outline" as const, color: "bg-warning" },
  completed: { label: "Completed", variant: "secondary" as const, color: "bg-success" },
  delayed: { label: "Delayed", variant: "destructive" as const, color: "bg-destructive" },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const status = statusConfig[project.status];

  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-md border border-border/60 ${
        isPressed ? 'scale-95 shadow-lg' : 'hover:border-border'
      }`}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold text-foreground truncate">
              {project.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          
          <Badge variant={status.variant} className="shrink-0">
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Current Phase */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Current Phase</span>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${status.color}`} />
            <span className="text-sm font-medium text-foreground">
              {project.currentPhase}
            </span>
          </div>
        </div>

        {/* Project Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{project.dueDate}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{project.teamSize}</span>
          </div>
          
          {project.urgentTasks > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-warning font-medium">{project.urgentTasks}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          View Details
        </Button>
      </CardContent>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/5 pointer-events-none rounded-lg" />
    </Card>
  );
}