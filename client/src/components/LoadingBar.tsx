import React from "react";

interface LoadingBarProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

const LoadingBar: React.FC<LoadingBarProps> = ({ text, size = "large" }) => {
  const spinnerSizeClasses = {
    small: "w-8 h-8 border-2",
    medium: "w-12 h-12 border-3",
    large: "w-16 h-16 border-4",
  };

  const textSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  const currentSpinnerClasses =
    spinnerSizeClasses[size] || spinnerSizeClasses.large;
  const currentTextClasses = textSizeClasses[size] || textSizeClasses.large;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-12 px-4 rounded-lg">
      <div
        className={`${currentSpinnerClasses} border-primary border-t-transparent rounded-full animate-spin`}
        style={{
          borderColor: "var(--color-primary, #3B82F6)",
          borderTopColor: "transparent",
        }}
      ></div>

      <p className={`mt-4 text-muted-foreground ${currentTextClasses}`}>
        {text ? `Loading ${text}...` : "Loading..."}
      </p>
    </div>
  );
};

export default LoadingBar;
