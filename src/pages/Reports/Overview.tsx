import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

const progressData = [
  { month: 'Jan', progress: 10, planned: 15 },
  { month: 'Feb', progress: 25, planned: 30 },
  { month: 'Mar', progress: 45, planned: 45 },
  { month: 'Apr', progress: 60, planned: 60 },
  { month: 'May', progress: 70, planned: 75 },
  { month: 'Jun', progress: 85, planned: 90 },
];

const budgetData = [
  { project: 'Office Tower', spent: 450, budget: 500 },
  { project: 'Mall Renovation', spent: 320, budget: 400 },
  { project: 'Warehouse', spent: 180, budget: 200 },
  { project: 'Residential', spent: 890, budget: 950 },
];

export default function ReportsOverview() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Reports Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Project progress and financial analytics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Progress</div>
                  <div className="text-lg font-semibold">68%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Budget Used</div>
                  <div className="text-lg font-semibold">$1.84M</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">On Schedule</div>
                  <div className="text-lg font-semibold">75%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress vs Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Progress vs Time</CardTitle>
            <CardDescription>
              Actual progress compared to planned timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Actual Progress"
                />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Planned Progress"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost vs Budget Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost vs Budget</CardTitle>
            <CardDescription>
              Spending comparison across active projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="spent" 
                  fill="hsl(var(--primary))" 
                  name="Spent ($k)"
                />
                <Bar 
                  dataKey="budget" 
                  fill="hsl(var(--muted))" 
                  name="Budget ($k)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}