import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';

const materialsData = [
  { 
    material: 'Concrete', 
    planned: 500, 
    actual: 520, 
    variance: 4, 
    category: 'Structural',
    status: 'over'
  },
  { 
    material: 'Steel Rebar', 
    planned: 300, 
    actual: 285, 
    variance: -5, 
    category: 'Structural',
    status: 'under'
  },
  { 
    material: 'Drywall', 
    planned: 200, 
    actual: 210, 
    variance: 5, 
    category: 'Interior',
    status: 'over'
  },
  { 
    material: 'Paint', 
    planned: 50, 
    actual: 45, 
    variance: -10, 
    category: 'Finishing',
    status: 'under'
  },
  { 
    material: 'Insulation', 
    planned: 150, 
    actual: 155, 
    variance: 3.3, 
    category: 'Interior',
    status: 'over'
  },
];

const categoryData = [
  { category: 'Structural', concrete: 520, steel: 285, lumber: 180 },
  { category: 'Interior', drywall: 210, insulation: 155, flooring: 95 },
  { category: 'Finishing', paint: 45, fixtures: 120, hardware: 65 },
  { category: 'Electrical', wiring: 85, panels: 45, outlets: 30 },
];

export default function ReportsMaterials() {
  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 2) return 'bg-success text-success-foreground';
    if (Math.abs(variance) <= 5) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getVarianceIcon = (variance: number) => {
    return variance > 0 ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Materials Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Material usage and variance analysis
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Materials</div>
                  <div className="text-lg font-semibold">24</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Over Budget</div>
                  <div className="text-lg font-semibold">3</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Under Budget</div>
                  <div className="text-lg font-semibold">2</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle>Material Variance Analysis</CardTitle>
            <CardDescription>
              Planned vs actual material usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Material</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Planned</th>
                    <th className="text-right p-2">Actual</th>
                    <th className="text-right p-2">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {materialsData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{item.material}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{item.planned} units</td>
                      <td className="p-2 text-right">{item.actual} units</td>
                      <td className="p-2 text-right">
                        <Badge className={getVarianceColor(item.variance)}>
                          <span className="flex items-center gap-1">
                            {getVarianceIcon(item.variance)}
                            {Math.abs(item.variance)}%
                          </span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Materials by Category</CardTitle>
            <CardDescription>
              Stacked view of material usage across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="concrete" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="steel" stackId="a" fill="hsl(var(--secondary))" />
                <Bar dataKey="lumber" stackId="a" fill="hsl(var(--accent))" />
                <Bar dataKey="drywall" stackId="a" fill="hsl(var(--muted))" />
                <Bar dataKey="insulation" stackId="a" fill="hsl(var(--warning))" />
                <Bar dataKey="flooring" stackId="a" fill="hsl(var(--success))" />
                <Bar dataKey="paint" stackId="a" fill="hsl(var(--destructive))" />
                <Bar dataKey="fixtures" stackId="a" fill="hsl(var(--primary)/0.7)" />
                <Bar dataKey="hardware" stackId="a" fill="hsl(var(--secondary)/0.7)" />
                <Bar dataKey="wiring" stackId="a" fill="hsl(var(--accent)/0.7)" />
                <Bar dataKey="panels" stackId="a" fill="hsl(var(--muted)/0.7)" />
                <Bar dataKey="outlets" stackId="a" fill="hsl(var(--warning)/0.7)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}