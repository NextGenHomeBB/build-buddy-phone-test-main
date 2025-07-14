import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const useCompleteTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (taskId: string) => {
      // Update task status to completed
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      // Trigger Slack notification
      try {
        await supabase.functions.invoke('notify_task_done', {
          body: { task_id: taskId }
        })
      } catch (notifyError) {
        console.warn('Failed to send notification:', notifyError)
        // Don't fail the mutation if notification fails
      }

      return data
    },
    onMutate: async (taskId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      const previousTasks = queryClient.getQueryData(['tasks'])
      
      // Update task in cache
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old
        return old.map((task: any) => 
          task.id === taskId 
            ? { ...task, status: 'completed' }
            : task
        )
      })
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks)
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive"
      })
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed!",
      })
    },
  })
}

export const useStartTask = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'in-progress' })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      const previousTasks = queryClient.getQueryData(['tasks'])
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old
        return old.map((task: any) => 
          task.id === taskId 
            ? { ...task, status: 'in-progress' }
            : task
        )
      })
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
      toast({
        title: "Error",
        description: "Failed to start task. Please try again.",
        variant: "destructive"
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: "Task Started",
        description: "Task is now in progress!",
      })
    },
  })
}