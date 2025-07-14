import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw } from 'lucide-react';

interface SignatureDialogProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SignatureDialog({ taskId, open, onClose, onSuccess }: SignatureDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const handleApprove = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before approving.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the signature as compressed JPEG (70% size reduction)
      const canvas = sigCanvasRef.current.getCanvas();
      const compressedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.6); // 60% quality for optimal compression
      });

      // Upload signature to Supabase Storage
      const fileName = `signature_${taskId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Failed",
          description: "Failed to upload signature. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      // Update the task with approval information
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          signature_url: urlData.publicUrl,
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Approval Failed",
          description: "Failed to approve task. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Trigger notification edge function
      try {
        await supabase.functions.invoke('notify_task_approved', {
          body: {
            task_id: taskId,
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
          },
        });
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the approval for notification errors
      }

      toast({
        title: "Task Approved",
        description: "The task has been successfully approved with your signature.",
      });

      onSuccess();
    } catch (error) {
      console.error('Approval process error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Task with Signature</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please provide your digital signature to approve this task.
          </p>
          
          <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                width: 400,
                height: 200,
                className: 'signature-canvas w-full h-full bg-background rounded border',
                style: { width: '100%', height: '200px' }
              }}
              backgroundColor="rgb(255, 255, 255)"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={clearSignature}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <span className="text-xs text-muted-foreground self-center">
              Sign above to approve
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Approve Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}