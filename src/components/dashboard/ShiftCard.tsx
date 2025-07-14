import { useState, useEffect } from 'react'
import { Clock, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useActiveShift, useStartShift, useEndShift } from '@/hooks/shift'
import { format } from 'date-fns'

export const ShiftCard = () => {
  const { data: activeShift, isLoading } = useActiveShift()
  const startShiftMutation = useStartShift()
  const endShiftMutation = useEndShift()
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('')

  // Update elapsed time every second
  useEffect(() => {
    if (!activeShift?.start_time) return

    const interval = setInterval(() => {
      const startTime = new Date(activeShift.start_time)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeShift?.start_time])

  const handleStartShift = () => {
    startShiftMutation.mutate(undefined)
  }

  const handleEndShift = () => {
    if (activeShift) {
      endShiftMutation.mutate(activeShift.id)
      setShowEndDialog(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">Loading shift status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Shift Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!activeShift ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No active shift</p>
              <Button 
                onClick={handleStartShift}
                disabled={startShiftMutation.isPending}
                className="w-full"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {startShiftMutation.isPending ? 'Starting...' : 'Start Shift'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-primary">
                  {elapsedTime}
                </div>
                <p className="text-xs text-muted-foreground">
                  Started at {format(new Date(activeShift.start_time), 'HH:mm')}
                </p>
              </div>
              <Button 
                onClick={() => setShowEndDialog(true)}
                variant="destructive"
                className="w-full"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                End Shift
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to end your shift? Current time: {format(new Date(), 'HH:mm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEndShift}
              disabled={endShiftMutation.isPending}
            >
              {endShiftMutation.isPending ? 'Ending...' : 'Clock Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}