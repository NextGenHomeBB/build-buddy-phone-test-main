
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseDagschema, type ParsedSchedule } from '@/lib/parseDagschema';
import { useUpsertSchedule } from '@/hooks/schedule';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle, Clock, Users, MapPin } from 'lucide-react';
import { ScheduleCategoryBadge } from '@/components/ui/ScheduleCategoryBadge';
import { useToast } from '@/hooks/use-toast';

interface PasteScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasteScheduleModal({ open, onOpenChange }: PasteScheduleModalProps) {
  const [scheduleText, setScheduleText] = useState('');
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  const upsertSchedule = useUpsertSchedule();
  const { toast } = useToast();

  const handleParseSchedule = () => {
    console.log('🔍 Parsing schedule text:', scheduleText.length, 'characters');
    try {
      const parsed = parseDagschema(scheduleText);
      console.log('✅ Schedule parsed successfully:', parsed);
      setParsedSchedule(parsed);
      setParseError(null);
      toast({
        title: "Schedule parsed successfully",
        description: `Found ${parsed.items.length} schedule items and ${parsed.absences.length} absences`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to parse schedule';
      console.error('❌ Parse error:', error);
      setParseError(errorMsg);
      setParsedSchedule(null);
      toast({
        title: "Parse error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleImportSchedule = async () => {
    if (!parsedSchedule) {
      console.log('❌ No parsed schedule to import');
      return;
    }

    console.log('🚀 Starting schedule import...', parsedSchedule);
    
    try {
      await upsertSchedule.mutateAsync(parsedSchedule);
      console.log('✅ Schedule imported successfully');
      
      toast({
        title: "Schedule imported successfully",
        description: `Imported ${parsedSchedule.items.length} schedule items for ${format(parsedSchedule.workDate, 'MMM d, yyyy')}`,
      });
      
      // Reset form and close modal
      handleClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to import schedule';
      console.error('❌ Import error:', error);
      setParseError(errorMsg);
      toast({
        title: "Import failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    console.log('🔄 Closing modal and resetting form');
    onOpenChange(false);
    setScheduleText('');
    setParsedSchedule(null);
    setParseError(null);
  };

  // Debug logging
  console.log('🔍 Modal state:', {
    open,
    hasScheduleText: !!scheduleText.trim(),
    hasParsedSchedule: !!parsedSchedule,
    isImporting: upsertSchedule.isPending,
    parseError
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paste Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule Text</label>
            <Textarea
              placeholder="Paste your Dagschema text here..."
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleParseSchedule}
              disabled={!scheduleText.trim()}
              variant="outline"
            >
              Parse Schedule
            </Button>
            
            {parsedSchedule && (
              <Button 
                onClick={handleImportSchedule}
                disabled={upsertSchedule.isPending}
                className="ml-auto"
              >
                {upsertSchedule.isPending ? 'Importing...' : 'Import Schedule'}
              </Button>
            )}
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {parsedSchedule && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Schedule parsed successfully! Preview the results below before importing.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Schedule Preview
                    <Badge variant="outline">
                      {format(parsedSchedule.workDate, 'EEEE, MMMM d, yyyy')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{parsedSchedule.items.length} locations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {parsedSchedule.items.reduce((sum, item) => sum + item.workers.length, 0)} workers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{parsedSchedule.absences.length} absences</span>
                    </div>
                  </div>

                  {parsedSchedule.items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Schedule Items</h4>
                      {parsedSchedule.items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.address}</span>
                              <ScheduleCategoryBadge category={item.category} />
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {item.startTime} - {item.endTime}
                            </div>
                          </div>
                          
                          {item.workers.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.workers.map((worker, workerIndex) => (
                                <Badge 
                                  key={workerIndex}
                                  variant={worker.isAssistant ? "outline" : "secondary"}
                                  className="text-xs"
                                >
                                  {worker.name}
                                  {worker.isAssistant && ' (assist)'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {parsedSchedule.absences.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Absences</h4>
                      <div className="flex flex-wrap gap-1">
                        {parsedSchedule.absences.map((absence, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {absence.workerName}
                            {absence.reason && ` (${absence.reason})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
