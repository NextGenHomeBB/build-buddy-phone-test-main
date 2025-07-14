import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useActiveShift, useStartShift } from '@/hooks/shift'
import { format } from 'date-fns'

const ShiftScreen = () => {
  const navigate = useNavigate()
  const { data: activeShift, isLoading } = useActiveShift()
  const startShiftMutation = useStartShift()

  const handleStartShift = async () => {
    try {
      await startShiftMutation.mutateAsync(undefined)
      // Navigate to tasks after starting shift
      navigate('/my-tasks')
    } catch (error) {
      console.error('Failed to start shift:', error)
    }
  }

  // If shift is already active, redirect to tasks
  useEffect(() => {
    if (activeShift) {
      navigate('/my-tasks')
    }
  }, [activeShift, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Clock className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Good {getTimeOfDayGreeting()}!</h1>
            <p className="text-muted-foreground">
              Ready to start your shift?
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Today's Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {format(new Date(), 'EEEE, MMMM d')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(), 'yyyy')}
                </div>
              </div>

              <Button 
                onClick={handleStartShift}
                disabled={startShiftMutation.isPending}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <Clock className="h-5 w-5 mr-2" />
                {startShiftMutation.isPending ? 'Starting Shift...' : 'Start Shift'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your shift will be automatically tracked and you'll be taken to your tasks.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default ShiftScreen;