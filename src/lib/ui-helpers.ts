import { 
  ArrowDown, 
  ArrowRight, 
  ArrowUp, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  Pause, 
  XCircle,
  Calendar,
  Zap
} from 'lucide-react';

export const getPriorityIcon = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
  switch (priority) {
    case 'low':
      return ArrowDown;
    case 'medium':
      return ArrowRight;
    case 'high':
      return ArrowUp;
    case 'urgent':
      return Zap;
    default:
      return ArrowRight;
  }
};

export const getStatusColor = (status: 'todo' | 'in-progress' | 'review' | 'completed') => {
  switch (status) {
    case 'todo':
      return 'text-muted-foreground bg-muted';
    case 'in-progress':
      return 'text-primary bg-primary/10';
    case 'review':
      return 'text-warning bg-warning/10';
    case 'completed':
      return 'text-success bg-success/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

export const getPhaseStatusIcon = (phaseStatus: string) => {
  switch (phaseStatus) {
    case 'planning':
      return Calendar;
    case 'active':
      return PlayCircle;
    case 'on-hold':
      return Pause;
    case 'completed':
      return CheckCircle2;
    case 'cancelled':
      return XCircle;
    default:
      return Clock;
  }
};