import { AppLayout } from "@/components/layout/AppLayout";

export default function ProjectSettings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Project Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure project templates and settings
          </p>
        </div>
        
        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border">
          <p className="text-muted-foreground">Project settings - Coming soon</p>
        </div>
      </div>
    </AppLayout>
  );
}