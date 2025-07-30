// Simplified Material Cost Sheet component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface MaterialCostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string;
}

export function MaterialCostSheet({ open, onOpenChange, phaseId }: MaterialCostSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <Card>
        <CardHeader>
          <CardTitle>Material Cost Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Material cost tracking functionality is being updated.
            This feature will be available again soon.
          </p>
        </CardContent>
      </Card>
    </BottomSheet>
  );
}