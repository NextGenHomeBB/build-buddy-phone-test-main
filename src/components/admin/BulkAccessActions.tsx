
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, CheckSquare } from 'lucide-react';

interface BulkAccessActionsProps {
  selectedProjects: string[];
  onBulkAssign: (projects: string[], role: 'manager' | 'worker') => void;
  onBulkRemove: (projects: string[]) => void;
  onClearSelection: () => void;
}

export const BulkAccessActions = ({ 
  selectedProjects, 
  onBulkAssign, 
  onBulkRemove, 
  onClearSelection 
}: BulkAccessActionsProps) => {
  const [bulkRole, setBulkRole] = useState<'manager' | 'worker'>('worker');

  if (selectedProjects.length === 0) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          Bulk Actions ({selectedProjects.length} selected)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={bulkRole} onValueChange={(value: 'manager' | 'worker') => setBulkRole(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => onBulkAssign(selectedProjects, bulkRole)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Assign Role
          </Button>
          
          <Button
            onClick={() => onBulkRemove(selectedProjects)}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Remove Access
          </Button>
          
          <Button
            onClick={onClearSelection}
            variant="outline"
            size="sm"
          >
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
