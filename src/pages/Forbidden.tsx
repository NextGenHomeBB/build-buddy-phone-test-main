import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4">
      <div className="text-center space-y-4">
        <LockKeyhole className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-semibold text-foreground">
          You don't have permission to view this.
        </h1>
      </div>
      
      <Button onClick={handleGoHome} variant="default">
        ← Go Home
      </Button>
    </div>
  );
}