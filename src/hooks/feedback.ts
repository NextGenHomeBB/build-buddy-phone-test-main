import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export interface Feedback {
  id: string
  user_id: string
  project_id: string | null
  category: 'bug' | 'feature' | 'ui' | 'other'
  title: string
  message: string
  attachment_url: string | null
  status: 'open' | 'in_progress' | 'resolved'
  external_issue_url: string | null
  created_at: string
  updated_at: string
}

export interface CreateFeedbackData {
  project_id?: string
  category: 'bug' | 'feature' | 'ui' | 'other'
  title: string
  message: string
  attachment_url?: string
}

export function useFeedbackList({ all = false }: { all?: boolean } = {}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['feedback', all ? 'all' : 'user'],
    queryFn: async () => {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (!all) {
        query = query.eq('user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!user
  })
}

export function useCreateFeedback() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFeedbackData) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('feedback')
        .insert({
          ...data,
          user_id: user.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We\'ll review it soon.'
      })
    },
    onError: (error) => {
      toast({
        title: 'Error submitting feedback',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'in_progress' | 'resolved' }) => {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] })
      toast({
        title: 'Status updated',
        description: 'Feedback status has been updated successfully.'
      })
    },
    onError: (error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive'
      })
    }
  })
}