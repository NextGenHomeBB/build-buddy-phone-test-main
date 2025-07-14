import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateFeedback } from '@/hooks/feedback'

const feedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'ui', 'other'], {
    required_error: 'Please select a category'
  }),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be less than 120 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters'),
  attachment_url: z.string().url().optional().or(z.literal(''))
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

export function SubmitFeedbackForm() {
  const createFeedback = useCreateFeedback()

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: undefined,
      title: '',
      message: '',
      attachment_url: ''
    }
  })

  const onSubmit = async (data: FeedbackFormData) => {
    await createFeedback.mutateAsync({
      category: data.category,
      title: data.title,
      message: data.message,
      attachment_url: data.attachment_url || undefined
    })
    
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="ui">UI/UX Improvement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                What type of feedback are you providing?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief summary of your feedback" {...field} />
              </FormControl>
              <FormDescription>
                A clear, concise title (5-120 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide detailed information about your feedback..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed description of your feedback (10-2000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attachment_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachment URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/screenshot.png" {...field} />
              </FormControl>
              <FormDescription>
                Link to screenshots, documents, or other relevant files
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createFeedback.isPending}>
          {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>
    </Form>
  )
}