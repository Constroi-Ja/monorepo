interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = "Carregando...", fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 bg-orange-50 ${
        fullScreen ? "min-h-screen" : "py-16"
      }`}
    >
      <div className="w-9 h-9 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
