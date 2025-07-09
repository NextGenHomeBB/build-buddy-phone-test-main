import * as React from "react";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: { title: string; description?: string }[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({ 
  steps, 
  currentStep, 
  orientation = "horizontal", 
  className 
}: StepperProps) {
  return (
    <div className={cn(
      "flex",
      orientation === "horizontal" ? "flex-row items-center justify-between" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={index}>
            <div className={cn(
              "flex items-center",
              orientation === "horizontal" ? "flex-col text-center" : "flex-row space-x-3"
            )}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-background text-primary",
                isUpcoming && "border-muted-foreground/30 bg-background text-muted-foreground"
              )}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5 fill-current" />
                )}
              </div>
              
              <div className={cn(
                orientation === "horizontal" ? "mt-2" : ""
              )}>
                <p className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-primary",
                  isCurrent && "text-primary",
                  isUpcoming && "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            
            {orientation === "horizontal" && index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4",
                index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}