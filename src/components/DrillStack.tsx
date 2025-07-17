import React from 'react';
import { cn } from '@/lib/utils';

interface DrillStackProps {
  level: 0 | 1 | 2 | 3;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export function DrillStack({ level, isActive, children, className }: DrillStackProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full transition-transform duration-200 ease-out",
        isActive ? "translate-x-0" : level <= 1 ? "-translate-x-full" : "translate-x-full",
        className
      )}
      style={{
        zIndex: isActive ? 10 : level,
      }}
    >
      {children}
    </div>
  );
}