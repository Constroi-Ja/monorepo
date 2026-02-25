import React from "react";

interface InfoBoxProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "info" | "warning";
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  icon,
  children,
  variant = "info",
}) => {
  const bgColor = variant === "warning" ? "bg-yellow-50" : "bg-blue-50";
  const iconColor = variant === "warning" ? "text-red-500" : "text-blue-500";

  return (
    <div className={`${bgColor} rounded-lg p-4 flex gap-3 items-start`}>
      {icon && <div className={iconColor}>{icon}</div>}
      <p className="text-sm text-gray-700 flex-1">{children}</p>
    </div>
  );
};
