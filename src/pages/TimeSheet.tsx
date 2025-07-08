import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTimeSheet } from '@/hooks/useTimeSheet';
import { CalendarIcon, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TimeSheet() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { data: entries, addEntry, updateEntry, deleteEntry } = useTimeSheet(selectedDate);

  const handleSubmit = () => {
    if (!hours) return;
    
    if (editingId) {
      updateEntry(editingId, { hours: parseFloat(hours), notes });
      setEditingId(null);
    } else {
      addEntry({
        date: selectedDate,
        hours: parseFloat(hours),
        notes,
        projectId: 'mock-project-1' // In real app, this would be selected
      });
    }
    
    setHours('');
    setNotes('');
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setHours(entry.hours.toString());
    setNotes(entry.notes);
  };

  const numpadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handleNumpadClick = (value: string) => {
    if (value === '⌫') {
      setHours(hours.slice(0, -1));
    } else if (value === '.' && !hours.includes('.')) {
      setHours(hours + value);
    } else if (value !== '.') {
      setHours(hours + value);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Time Sheet
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your daily hours and tasks
          </p>
        </div>

        {/* Date Picker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Time Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {editingId ? 'Edit Entry' : 'Add Time Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={hours}
                placeholder="0.0"
                readOnly
                className="text-center text-2xl font-mono"
              />
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {numpadButtons.map((button) => (
                <Button
                  key={button}
                  variant="outline"
                  className="h-12 text-lg"
                  onClick={() => handleNumpadClick(button)}
                >
                  {button}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
                className="min-h-[80px]"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Update Entry' : 'Add Entry'}
            </Button>

            {editingId && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingId(null);
                  setHours('');
                  setNotes('');
                }} 
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Today's Entries */}
        <Card>
          <CardHeader>
            <CardTitle>
              Entries for {format(selectedDate, 'PPP')}
            </CardTitle>
            <CardDescription>
              Total: {entries?.reduce((sum, entry) => sum + entry.hours, 0) || 0} hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries?.length ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{entry.hours} hours</div>
                      {entry.notes && (
                        <div className="text-sm text-muted-foreground">{entry.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No entries for this date
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}