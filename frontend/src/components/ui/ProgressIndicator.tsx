import React from "react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index + 1 <= currentStep
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        Etapa {currentStep} de {totalSteps}
      </span>
    </div>
  );
};
