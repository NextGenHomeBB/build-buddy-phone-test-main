import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Timesheet {
  id: string
  user_id: string
  schedule_item_id?: string
  project_id?: string
  phase_id?: string
  start_time: string
  end_time?: string
  duration_generated?: number
  approved: boolean
  created_at: string
  updated_at: string
}

export const useActiveShift = () => {
  return useQuery({
    queryKey: ['activeShift'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .is('end_time', null)
        .gte('start_time', `${today}T00:00:00Z`)
        .lt('start_time', `${today}T23:59:59Z`)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data as Timesheet | null
    },
  })
}

export const useStartShift = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (scheduleItemId?: string) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      // Get schedule item details if provided
      let projectId, phaseId
      if (scheduleItemId) {
        const { data: scheduleItem } = await supabase
          .from('schedule_items')
          .select('project_id')
          .eq('id', scheduleItemId)
          .single()
        
        if (scheduleItem) {
          projectId = scheduleItem.project_id
          // Get phase from project
          const { data: phases } = await supabase
            .from('project_phases')
            .select('id')
            .eq('project_id', scheduleItem.project_id)
            .limit(1)
          
          if (phases && phases.length > 0) {
            phaseId = phases[0].id
          }
        }
      }

      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          user_id: user.user.id,
          schedule_item_id: scheduleItemId,
          project_id: projectId,
          phase_id: phaseId,
          start_time: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onMutate: async (scheduleItemId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['activeShift'] })
      const previousShift = queryClient.getQueryData(['activeShift'])
      
      const optimisticShift: Timesheet = {
        id: 'temp-' + Date.now(),
        user_id: 'current-user',
        schedule_item_id: scheduleItemId,
        start_time: new Date().toISOString(),
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      queryClient.setQueryData(['activeShift'], optimisticShift)
      return { previousShift }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['activeShift'], context?.previousShift)
      toast({
        title: "Error",
        description: "Failed to start shift. Please try again.",
        variant: "destructive"
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['activeShift'], data)
      toast({
        title: "Shift Started",
        description: "Your shift has been started successfully.",
      })
    },
  })
}

export const useEndShift = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (shiftId: string) => {
      console.log('Attempting to end shift:', shiftId);
      
      // First verify the user is authenticated
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('Not authenticated')
      }
      
      console.log('User authenticated:', user.user.id);

      const { data, error } = await supabase
        .from('timesheets')
        .update({ end_time: new Date().toISOString() })
        .eq('id', shiftId)
        .select()
        .single()

      if (error) {
        console.error('Error ending shift:', error);
        throw error;
      }
      
      console.log('Shift ended successfully:', data);
      return data as Timesheet
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['activeShift'], null)
      const hours = data.duration_generated || 0
      toast({
        title: "Shift Ended",
        description: `Shift completed. Duration: ${hours.toFixed(2)} hours`,
      })
    },
    onError: (error: any) => {
      console.error('End shift mutation error:', error);
      const errorMessage = error?.message || error?.details || "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to end shift: ${errorMessage}`,
        variant: "destructive"
      })
    },
  })
}