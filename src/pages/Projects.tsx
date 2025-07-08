import { AppLayout } from "@/components/layout/AppLayout";

export default function Projects() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your construction projects
          </p>
        </div>
        
        <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border">
          <p className="text-muted-foreground">Projects page - Coming soon</p>
        </div>
      </div>
    </AppLayout>
  );
}