import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [delayed, setDelayed] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayed(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (loading || delayed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="text-primary" size="md" variant="ripple" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
