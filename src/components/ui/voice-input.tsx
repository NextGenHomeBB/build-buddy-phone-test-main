import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function VoiceInput({ onTranscript, className, size = "default" }: VoiceInputProps) {
  const { isRecording, isProcessing, toggleRecording } = useSpeechToText({
    onResult: onTranscript,
  });

  const getButtonSize = () => {
    switch (size) {
      case "sm": return "h-8 w-8";
      case "lg": return "h-12 w-12";
      default: return "h-10 w-10";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3";
      case "lg": return "h-5 w-5";
      default: return "h-4 w-4";
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      className={cn(
        getButtonSize(),
        "shrink-0 transition-all duration-200",
        isRecording && "animate-pulse",
        className
      )}
      onClick={toggleRecording}
      disabled={isProcessing}
      aria-label={isRecording ? t("Stop recording") : t("Start recording")}
    >
      {isProcessing ? (
        <Loader2 className={cn(getIconSize(), "animate-spin")} />
      ) : isRecording ? (
        <MicOff className={getIconSize()} />
      ) : (
        <Mic className={getIconSize()} />
      )}
    </Button>
  );
}