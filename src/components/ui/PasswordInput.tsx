import { Eye, EyeOff } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

// Password Input Component
export const PasswordInput = ({
  id,
  placeholder,
  showPassword,
  onTogglePassword,
  error,
  ...props
}: {
  id: string;
  placeholder: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <Input
      id={id}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      className={`h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary pr-10 ${
        error ? "border-red-300 focus:ring-red-500" : ""
      }`}
      {...props}
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
      onClick={onTogglePassword}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4 text-gray-400" />
      ) : (
        <Eye className="h-4 w-4 text-gray-400" />
      )}
    </Button>
  </div>
);
