import React, { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  options: { value: string; label: string }[];
  showRequired?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, error, options, showRequired, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}{showRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 rounded-lg border appearance-none
              ${icon ? "pl-10" : ""}
              pr-10
              ${error ? "border-red-500" : "border-gray-300"}
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
              bg-white
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
