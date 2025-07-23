import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
}

export const Loader = ({ 
  className, 
  size = "md", 
  variant = "spinner" 
}: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  if (variant === "spinner") {
    return (
      <div 
        className={cn(
          "animate-spin border-2 border-primary border-t-transparent rounded-full",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-full animate-pulse",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : "w-3 h-3"
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div 
        className={cn(
          "bg-primary/20 rounded animate-pulse",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return null;
};