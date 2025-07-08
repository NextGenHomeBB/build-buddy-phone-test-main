import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Active Projects",
    value: "12",
    change: "+2 from last month",
    variant: "primary" as const,
  },
  {
    title: "Completed Phases",
    value: "47",
    change: "+5 this week",
    variant: "success" as const,
  },
  {
    title: "Pending Tasks",
    value: "23",
    change: "3 urgent",
    variant: "warning" as const,
  },
  {
    title: "Total Workers",
    value: "156",
    change: "+8 new hires",
    variant: "secondary" as const,
  },
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div 
                className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  stat.variant === 'primary' ? 'bg-primary/10' :
                  stat.variant === 'success' ? 'bg-success/10' :
                  stat.variant === 'warning' ? 'bg-warning/10' :
                  'bg-secondary/10'
                }`}
              >
                <div 
                  className={`h-4 w-4 rounded ${
                    stat.variant === 'primary' ? 'bg-primary/30 border border-primary/50' :
                    stat.variant === 'success' ? 'bg-success/30 border border-success/50' :
                    stat.variant === 'warning' ? 'bg-warning/30 border border-warning/50' :
                    'bg-secondary/30 border border-secondary/50'
                  }`}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </div>
          </CardContent>
          
          {/* Subtle gradient overlay */}
          <div 
            className={`absolute inset-0 opacity-5 ${
              stat.variant === 'primary' ? 'bg-gradient-to-br from-primary/20 to-transparent' :
              stat.variant === 'success' ? 'bg-gradient-to-br from-success/20 to-transparent' :
              stat.variant === 'warning' ? 'bg-gradient-to-br from-warning/20 to-transparent' :
              'bg-gradient-to-br from-secondary/20 to-transparent'
            }`}
          />
        </Card>
      ))}
    </div>
  );
}