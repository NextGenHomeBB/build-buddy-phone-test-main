import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { useProjectChecklists } from '@/hooks/useProjectChecklists';
import { AppLayout } from '@/components/layout/AppLayout';
import { useState } from 'react';

export default function ChecklistDetail() {
  const { projectId, checklistId } = useParams<{ projectId: string; checklistId: string }>();
  const { data: projectChecklists = [], isLoading } = useProjectChecklists(projectId!);
  
  const checklist = projectChecklists.find(c => c.id === checklistId);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!checklist) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="font-medium mb-2">Checklist not found</h3>
              <p className="text-muted-foreground mb-4">
                The requested checklist could not be found.
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const items = Array.isArray(checklist.items) ? checklist.items : [];
  const completedCount = completedItems.size;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleItemToggle = (index: number) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedItems(newCompleted);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{checklist.name}</h1>
            {checklist.description && (
              <p className="text-muted-foreground">{checklist.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>
                  {completedCount} of {totalCount} items completed
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="w-full" />
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Checklist Items</h2>
          
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No items in this checklist</h3>
                <p className="text-muted-foreground">
                  This checklist template doesn't have any items yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const isCompleted = completedItems.has(index);
                return (
                  <Card key={index} className={`transition-colors ${isCompleted ? 'bg-muted/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleItemToggle(index)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {typeof item === 'string' ? item : (item as any)?.title || item?.toString() || 'Unnamed item'}
                          </p>
                          {typeof item === 'object' && item !== null && (item as any)?.description && (
                            <p className={`text-sm text-muted-foreground mt-1 ${isCompleted ? 'line-through' : ''}`}>
                              {(item as any).description}
                            </p>
                          )}
                        </div>
                        {isCompleted ? (
                          <CheckSquare className="h-5 w-5 text-green-500" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}