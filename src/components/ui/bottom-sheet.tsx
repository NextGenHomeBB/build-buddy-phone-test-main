import * as React from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

interface BottomSheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function BottomSheet({ children, open, onOpenChange, trigger }: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <div className="flex-1 overflow-hidden p-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}