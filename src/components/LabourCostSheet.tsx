// Simplified Labour Cost Sheet component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface LabourCostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string;
}

export function LabourCostSheet({ open, onOpenChange, phaseId }: LabourCostSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader>
          <CardTitle>Labour Cost Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Labour cost tracking functionality is being updated.
            This feature will be available again soon.
          </p>
        </CardContent>
      </Card>
    </BottomSheet>
  );
}