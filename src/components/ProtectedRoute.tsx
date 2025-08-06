import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, checkSession } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      try {
        await checkSession();
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
  }, [checkSession]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="text-primary" size="md" variant="ripple" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
