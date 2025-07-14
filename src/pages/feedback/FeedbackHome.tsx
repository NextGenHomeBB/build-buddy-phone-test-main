import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SubmitFeedbackForm } from './SubmitFeedbackForm'
import { MyFeedbackList } from './MyFeedbackList'

export default function FeedbackHome() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">
          Share your thoughts, report bugs, or suggest new features
        </p>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="history">My Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Feedback</CardTitle>
              <CardDescription>
                Help us improve by sharing your feedback, reporting bugs, or suggesting new features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmitFeedbackForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>My Feedback History</CardTitle>
              <CardDescription>
                View the status of your previously submitted feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyFeedbackList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}