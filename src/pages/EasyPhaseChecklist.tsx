import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Search, Trash2, Edit, Check, X, Camera, ScanLine, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/layout/AppLayout';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { t } from '@/lib/i18n';
import { getPriorityIcon } from '@/lib/ui-helpers';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  category: string;
  estimated_time: number;
  dependencies: string[];
}

interface PhaseChecklist {
  id: string;
  checklist_id: string;
  project_id: string;
  completed_items: string[];
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

export default function EasyPhaseChecklist() {
  const { phaseId } = useParams<{ phaseId: string }>();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock data for demo - replace with actual Supabase query
  const mockItems: ChecklistItem[] = [
    {
      id: "1",
      title: "Foundation Inspection",
      description: "Inspect foundation for cracks and structural integrity",
      priority: "high",
      completed: false,
      category: "Safety",
      estimated_time: 30,
      dependencies: []
    },
    {
      id: "2", 
      title: "Material Delivery Check",
      description: "Verify all materials have been delivered according to schedule",
      priority: "medium",
      completed: true,
      category: "Materials",
      estimated_time: 15,
      dependencies: []
    },
    {
      id: "3",
      title: "Safety Equipment Review",
      description: "Ensure all safety equipment is present and functional",
      priority: "high", 
      completed: false,
      category: "Safety",
      estimated_time: 20,
      dependencies: []
    },
    {
      id: "4",
      title: "Electrical Rough-in",
      description: "Complete electrical rough-in installation",
      priority: "medium",
      completed: false,
      category: "Electrical",
      estimated_time: 120,
      dependencies: ["Foundation Inspection"]
    }
  ];

  const { data: checklist, refetch } = useOfflineQuery(
    ["phaseChecks", phaseId],
    async () => {
      // Mock implementation - replace with actual Supabase query
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: "checklist-1",
        checklist_id: "template-1", 
        project_id: phaseId || "",
        completed_items: ["2"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: mockItems
      };
    }
  );

  const handleItemToggle = async (itemId: string, completed: boolean) => {
    if (!checklist) return;

    try {
      const updatedCompletedItems = completed 
        ? [...checklist.completed_items, itemId]
        : checklist.completed_items.filter(id => id !== itemId);

      // Mock update - replace with actual Supabase update
      checklist.completed_items = updatedCompletedItems;
      checklist.items = checklist.items.map(item =>
        item.id === itemId ? { ...item, completed } : item
      );

      refetch();
      toast({
        title: completed ? t("Item completed") : t("Item marked incomplete"),
        description: t("Checklist updated successfully"),
      });
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update checklist item"),
        variant: "destructive",
      });
    }
  };

  const handleMarkAllDone = async () => {
    if (!checklist || isUpdating) return;

    setIsUpdating(true);
    try {
      const allItemIds = checklist.items.map(item => item.id);
      
      // Mock update - replace with actual Supabase update  
      checklist.completed_items = allItemIds;
      checklist.items = checklist.items.map(item => ({ ...item, completed: true }));

      refetch();
      toast({
        title: t("All items completed!"),
        description: t("Phase checklist marked as complete"),
      });
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to mark all items as done"),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLongPressStart = (item: ChecklistItem) => {
    const timer = setTimeout(() => {
      setSelectedItem(item);
      setIsBottomSheetOpen(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  if (!checklist) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("Loading checklist...")}</p>
        </div>
      </div>
    );
  }

  // Update items with completion status from checklist
  const itemsWithStatus = checklist.items.map(item => ({
    ...item,
    completed: checklist.completed_items.includes(item.id)
  }));

  const completedCount = itemsWithStatus.filter(item => item.completed).length;
  const totalCount = itemsWithStatus.length;
  const allCompleted = completedCount === totalCount;

  // Group items by category
  const groupedItems = itemsWithStatus.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("Phase Checklist")}</h1>
          <Badge variant={allCompleted ? "default" : "secondary"}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-4 space-y-4">
        <Accordion type="multiple" defaultValue={Object.keys(groupedItems)}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t(category)}</span>
                  <Badge variant="outline">
                    {items.filter(item => item.completed).length}/{items.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-h-[44px]"
                      onTouchStart={() => handleLongPressStart(item)}
                      onTouchEnd={handleLongPressEnd}
                      onMouseDown={() => handleLongPressStart(item)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => handleItemToggle(item.id, !!checked)}
                        className="min-w-[20px] min-h-[20px]"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = getPriorityIcon(item.priority);
                            return <Icon className="h-4 w-4" />;
                          })()}
                          <span className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {t(item.title)}
                          </span>
                        </div>
                        
                        {item.estimated_time > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t("{{time}} min", { time: item.estimated_time })}
                            </span>
                          </div>
                        )}
                      </div>

                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {t(item.priority)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
        <Button
          onClick={handleMarkAllDone}
          disabled={allCompleted || isUpdating}
          className="w-full min-h-[44px]"
          variant="default"
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              {t("Updating...")}
            </>
          ) : allCompleted ? (
            t("All Items Completed!")
          ) : (
            t("Mark All Done")
          )}
        </Button>
      </div>

      {/* Bottom Sheet for Item Details */}
      <BottomSheet open={isBottomSheetOpen} onOpenChange={setIsBottomSheetOpen}>
        {selectedItem && (
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = getPriorityIcon(selectedItem.priority);
                  return <Icon className="h-4 w-4" />;
                })()}
                {t(selectedItem.title)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t("Description")}</h4>
                <p className="text-muted-foreground">{t(selectedItem.description)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">{t("Priority")}</h4>
                  <Badge variant={getPriorityColor(selectedItem.priority) as any}>
                    {t(selectedItem.priority)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">{t("Estimated Time")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.estimated_time} {t("minutes")}
                  </p>
                </div>
              </div>

              {selectedItem.dependencies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t("Dependencies")}</h4>
                  <div className="space-y-1">
                    {selectedItem.dependencies.map((dep, index) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                        {t(dep)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setIsBottomSheetOpen(false)}
                className="w-full min-h-[44px]"
                variant="outline"
              >
                {t("Close")}
              </Button>
            </CardContent>
          </Card>
        )}
      </BottomSheet>
    </div>
  );
}