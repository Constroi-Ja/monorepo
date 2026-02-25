import React from "react";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  tagline?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showTagline = false,
  tagline = "Crie sua conta",
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-end justify-center mb-2">
        <div className="flex items-end gap-1">
          <div className="w-6 h-8 bg-orange-500 rounded-t"></div>
          <div className="w-6 h-12 bg-orange-400 rounded-t"></div>
          <div className="relative">
            <div className="w-6 h-16 bg-orange-500 rounded-t"></div>
            <svg
              className="absolute -right-2 top-0 w-4 h-4 text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-orange-500 mb-1">ConstróiJa</h1>
      {showTagline && (
        <p className="text-sm text-gray-600">{tagline}</p>
      )}
    </div>
  );
};
