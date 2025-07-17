import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateFeedback } from '@/hooks/feedback'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Upload, X } from 'lucide-react'

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
  const { toast } = useToast()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: undefined,
      title: '',
      message: '',
      attachment_url: ''
    }
  })

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `feedback-attachments/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      const url = await uploadFile(file)
      form.setValue('attachment_url', url)
      setUploadedFile(file)
      toast({
        title: "File uploaded",
        description: "Screenshot uploaded successfully"
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    form.setValue('attachment_url', '')
    setUploadedFile(null)
  }

  const onSubmit = async (data: FeedbackFormData) => {
    await createFeedback.mutateAsync({
      category: data.category,
      title: data.title,
      message: data.message,
      attachment_url: data.attachment_url || undefined
    })
    
    form.reset()
    setUploadedFile(null)
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

        <FormItem>
          <FormLabel>Screenshot (Optional)</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {!uploadedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <div className="text-sm text-gray-600 mb-2">
                    Upload a screenshot of the problem
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file)
                      }
                    }}
                    disabled={uploading}
                    className="w-full"
                  />
                  {uploading && (
                    <div className="mt-2 text-sm text-blue-600">
                      Uploading...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{uploadedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>
            Upload a screenshot to help us understand the issue better
          </FormDescription>
        </FormItem>

        <Button type="submit" disabled={createFeedback.isPending}>
          {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>
    </Form>
  )
}