import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';

interface SpeechToTextOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        setIsProcessing(true);
        stream.getTracks().forEach(track => track.stop());
        
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onload = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              
              const { data, error } = await supabase.functions.invoke('speech-to-text', {
                body: { audio: base64Audio }
              });
              
              if (error) throw error;
              
              if (data.text) {
                options.onResult?.(data.text);
                toast({
                  title: t("Speech recognized"),
                  description: t("Text has been transcribed successfully"),
                });
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : t("Unknown error");
              options.onError?.(errorMessage);
              toast({
                title: t("Transcription failed"),
                description: errorMessage,
                variant: "destructive",
              });
            } finally {
              setIsProcessing(false);
            }
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t("Unknown error");
          options.onError?.(errorMessage);
          setIsProcessing(false);
        }
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("Microphone access denied");
      options.onError?.(errorMessage);
      toast({
        title: t("Recording failed"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [options, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder, isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}