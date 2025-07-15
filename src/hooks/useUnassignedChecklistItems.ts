import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnassignedChecklistItem {
  id: string;
  title: string;
  description?: string;
  project: { name: string } | null;
  checklist: { name: string } | null;
  priority?: string;
  projectChecklistId: string;
}

export function useUnassignedChecklistItems(projectId: string) {
  return useQuery({
    queryKey: ['unassigned-checklist-items', projectId],
    queryFn: async () => {
      console.log('🔍 Fetching unassigned checklist items for project:', projectId);
      
      const { data, error } = await supabase
        .from('project_checklists')
        .select(`
          id,
          completed_items,
          checklist:checklists(
            id,
            name,
            items
          ),
          project:projects(
            id,
            name
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Error fetching project checklists:', error);
        throw error;
      }

      console.log('📋 Project checklists result:', data);

      // Transform checklist items into unassigned items
      const unassignedItems: UnassignedChecklistItem[] = [];
      
      data?.forEach((projectChecklist) => {
        const checklist = projectChecklist.checklist;
        const completedItems = projectChecklist.completed_items as any || {};
        
        if (checklist?.items) {
          const items = Array.isArray(checklist.items) ? checklist.items : [];
          
          items.forEach((item: any, index: number) => {
            const itemId = item.id || `item-${index}`;
            const completedItem = completedItems[itemId];
            
            // Only include items that are not assigned to anyone
            if (!completedItem?.assigned_to) {
              unassignedItems.push({
                id: itemId,
                title: item.title || item.text || 'Untitled Item',
                description: item.description,
                project: projectChecklist.project,
                checklist: { name: checklist.name },
                priority: item.priority || 'medium',
                projectChecklistId: projectChecklist.id
              });
            }
          });
        }
      });

      console.log('🎯 Unassigned checklist items:', unassignedItems);
      return unassignedItems;
    },
    enabled: !!projectId,
  });
}