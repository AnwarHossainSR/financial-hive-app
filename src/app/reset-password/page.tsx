"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-income/10 text-income">
            <CheckCircle className="h-5 w-5" />
          </span>
          <h1 className="pt-2 text-2xl font-semibold tracking-tight">
            Password updated
          </h1>
          <p className="text-sm text-muted-foreground">
            You&apos;re all set. Taking you to your dashboard…
          </p>
        </div>
      </AuthLayout>
    );
  }

  const tooShort = passwords.password.length > 0 && passwords.password.length < 6;
  const mismatch =
    passwords.confirmPassword.length > 0 &&
    passwords.password !== passwords.confirmPassword;

  return (
    <AuthLayout>
      <div className="mb-8 space-y-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="pt-2 text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          At least 6 characters. Make it one you don&apos;t use anywhere else.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handlePasswordUpdate();
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="6+ characters"
            value={passwords.password}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, password: e.target.value }))
            }
            className="h-11 rounded-xl"
            minLength={6}
            aria-invalid={tooShort}
          />
          {tooShort && (
            <p className="text-xs text-muted-foreground">
              {6 - passwords.password.length} more character
              {6 - passwords.password.length === 1 ? "" : "s"} to go
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat it"
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className="h-11 rounded-xl"
            aria-invalid={mismatch}
          />
          {mismatch && (
            <p className="text-xs text-destructive">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl py-2.5">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="h-11 w-full gap-2 rounded-xl font-semibold shadow-primary"
          disabled={
            isLoading || !passwords.password || !passwords.confirmPassword
          }
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/login")}
          className="h-10 w-full rounded-xl"
        >
          Back to sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
