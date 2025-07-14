import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { WorkerSummary } from '@/hooks/useTasks';

interface StackedAvatarsProps {
  workers: WorkerSummary[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const StackedAvatars = React.memo(({ 
  workers, 
  maxVisible = 3, 
  size = 'sm' 
}: StackedAvatarsProps) => {
  if (!workers || workers.length === 0) return null;

  const visibleWorkers = workers.slice(0, maxVisible);
  const remainingCount = workers.length - maxVisible;
  const primaryWorker = workers.find(w => w.is_primary);

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  const avatarSize = sizeClasses[size];

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1">
        {visibleWorkers.map((worker, index) => (
          <Avatar 
            key={worker.id} 
            className={`${avatarSize} border-2 border-background ${
              worker.is_primary ? 'ring-2 ring-primary ring-offset-1' : ''
            }`}
            style={{ zIndex: visibleWorkers.length - index }}
          >
            <AvatarImage src={worker.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {worker.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {remainingCount > 0 && (
          <div 
            className={`${avatarSize} rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground font-medium`}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      
      {primaryWorker && workers.length > 1 && (
        <Badge variant="secondary" className="ml-2 text-xs">
          Primary: {primaryWorker.name}
        </Badge>
      )}
      
      {workers.length > 1 && (
        <Badge variant="outline" className="ml-1 text-xs">
          +{workers.length - 1} helper{workers.length > 2 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
});

StackedAvatars.displayName = 'StackedAvatars';

export { StackedAvatars };