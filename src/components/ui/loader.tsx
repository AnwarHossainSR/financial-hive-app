import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?:
    | "spinner"
    | "dots"
    | "pulse"
    | "wave"
    | "orbit"
    | "morphing"
    | "gradient"
    | "bounce"
    | "ripple"
    | "particle";
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "error";
}

export const Loader = ({
  className,
  size = "md",
  variant = "spinner",
  color = "primary",
}: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerSizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const colorClasses = {
    primary: "border-primary bg-primary text-primary",
    secondary: "border-secondary bg-secondary text-secondary",
    accent: "border-accent bg-accent text-accent",
    success: "border-green-500 bg-green-500 text-green-500",
    warning: "border-yellow-500 bg-yellow-500 text-yellow-500",
    error: "border-red-500 bg-red-500 text-red-500",
  };

  // Original Spinner - Enhanced
  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "animate-spin border-2 border-t-transparent rounded-full transition-all duration-300",
          sizeClasses[size],
          colorClasses[color].split(" ")[0],
          className
        )}
        style={{
          animationDuration: "0.8s",
          filter: "drop-shadow(0 0 6px currentColor)",
        }}
      />
    );
  }

  // Enhanced Dots with wave animation
  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full animate-bounce",
              colorClasses[color].split(" ")[1],
              size === "sm"
                ? "w-1.5 h-1.5"
                : size === "md"
                ? "w-2.5 h-2.5"
                : "w-3.5 h-3.5"
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.6s",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />
        ))}
      </div>
    );
  }

  // Enhanced Pulse with breathing effect
  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "rounded animate-pulse",
          sizeClasses[size],
          `${colorClasses[color].split(" ")[1]}/20`,
          className
        )}
        style={{
          animationDuration: "1.5s",
          boxShadow: `0 0 20px ${colorClasses[color].split(" ")[1]}`,
        }}
      />
    );
  }

  // Wave Loader
  if (variant === "wave") {
    return (
      <div className={cn("flex items-end space-x-1", className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse",
              colorClasses[color].split(" ")[1],
              size === "sm" ? "w-0.5" : size === "md" ? "w-1" : "w-1.5"
            )}
            style={{
              height: size === "sm" ? "12px" : size === "md" ? "24px" : "36px",
              animationDelay: `${i * 0.1}s`,
              animationDuration: "1.2s",
              transformOrigin: "bottom",
            }}
          />
        ))}
      </div>
    );
  }

  // Orbit Loader
  if (variant === "orbit") {
    return (
      <div className={cn("relative", containerSizes[size], className)}>
        <div
          className={cn(
            "absolute inset-0 border-2 border-transparent rounded-full animate-spin",
            `border-t-${colorClasses[color].split("-")[1]}-500`
          )}
          style={{ animationDuration: "1s" }}
        />
        <div
          className={cn(
            "absolute inset-2 border-2 border-transparent rounded-full animate-spin",
            `border-r-${colorClasses[color].split("-")[1]}-400`
          )}
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        />
        <div
          className={cn(
            "absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2",
            colorClasses[color].split(" ")[1]
          )}
        />
      </div>
    );
  }

  // Morphing Loader
  if (variant === "morphing") {
    return (
      <div
        className={cn(
          "rounded-full animate-ping",
          sizeClasses[size],
          colorClasses[color].split(" ")[1],
          className
        )}
        style={{
          animationDuration: "1.5s",
        }}
      >
        <div
          className={cn(
            "w-full h-full rounded-full animate-pulse",
            `${colorClasses[color].split(" ")[1]}/60`
          )}
          style={{ animationDuration: "2s" }}
        />
      </div>
    );
  }

  // Gradient Spinner
  if (variant === "gradient") {
    return (
      <div
        className={cn(
          "animate-spin rounded-full",
          sizeClasses[size],
          className
        )}
        style={{
          background: `conic-gradient(from 0deg, transparent, ${
            colorClasses[color].includes("primary") ? "#3b82f6" : "#6366f1"
          })`,
          animationDuration: "1s",
        }}
      >
        <div className="w-3/4 h-3/4 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }

  // Bounce Loader
  if (variant === "bounce") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full",
              colorClasses[color].split(" ")[1],
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{
              animation: `bounce 1.4s ${i * 0.16}s infinite ease-in-out both`,
              transform: "scale(0.8)",
            }}
          />
        ))}
      </div>
    );
  }

  // Ripple Loader
  if (variant === "ripple") {
    return (
      <div className={cn("relative", containerSizes[size], className)}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 border-2 rounded-full animate-ping",
              `border-${colorClasses[color].split("-")[1]}-500/40`
            )}
            style={{
              animationDelay: `${i * 0.5}s`,
              animationDuration: "2s",
            }}
          />
        ))}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2",
            colorClasses[color].split(" ")[1]
          )}
        />
      </div>
    );
  }

  // Particle Loader
  if (variant === "particle") {
    return (
      <div className={cn("relative", containerSizes[size], className)}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 rounded-full",
              colorClasses[color].split(" ")[1]
            )}
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 45}deg) translateY(-${
                size === "sm" ? "12px" : size === "md" ? "24px" : "36px"
              })`,
              animation: `fade 1.2s ${i * 0.15}s infinite linear`,
              transformOrigin: "0 24px",
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

// Add these keyframes to your global CSS file
const loaderStyles = `
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes fade {
  0%, 39%, 100% {
    opacity: 0;
    transform: rotateY(0deg);
  }
  40% {
    opacity: 1;
  }
}
`;
