import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  icon,
  iconPosition = "right",
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = "px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-orange-100 text-orange-500 border border-orange-300 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "bg-white text-orange-500 border border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
};
