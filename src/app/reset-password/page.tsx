"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const { updatePassword, user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if user is in password recovery mode
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if no user session
      router.push("/login");
    }
  }, [user, loading, router]);

  const handlePasswordUpdate = async () => {
    setIsLoading(true);
    setError("");

    // Validation
    if (passwords.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(passwords.password);

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        toast({
          title: "Password updated!",
          description: "Your password has been successfully updated.",
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Updated!
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Your password has been successfully updated. You will be
                redirected to the dashboard shortly.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Set New Password
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter your new password below.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={passwords.password}
                  onChange={(e) =>
                    setPasswords((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handlePasswordUpdate}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
                  disabled={
                    isLoading ||
                    !passwords.password ||
                    !passwords.confirmPassword
                  }
                >
                  {isLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Update Password
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="w-full h-10 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
                >
                  Back to Sign In
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Password Requirements:</strong>
                  <br />• Minimum 6 characters
                  <br />• Make it unique and secure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
