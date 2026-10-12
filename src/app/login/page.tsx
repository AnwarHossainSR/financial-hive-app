"use client";

import Link from "next/link";
import { Suspense } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z
  .object({
    displayName: z.string().min(1, "Display name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// Submit button component using useFormStatus
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
      disabled={pending}
      aria-label={label}
    >
      {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {label}
    </Button>
  );
}

function LoginContent() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<"auth" | "forgot-password" | "reset-sent">(
    "auth"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract redirect URL from query params
  const redirectParam = searchParams?.get("redirect");
  // Only same-site paths, so ?redirect= can't bounce users to another domain
  const redirectTo =
    redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : "/dashboard";
  const initialTab = searchParams?.get("tab") === "signup" ? "signup" : "signin";

  // Form instances with react-hook-form
  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Auto-fill email from query params if available
  useEffect(() => {
    const email = searchParams?.get("email");
    if (email) {
      signInForm.setValue("email", email);
      signUpForm.setValue("email", email);
      forgotPasswordForm.setValue("email", email);
    }
  }, [searchParams, signInForm, signUpForm, forgotPasswordForm]);

  // React 19 useActionState for sign-in
  const [signInState, signInAction] = useActionState(
    async (_: any, formData: FormData) => {
      try {
        const data = signInSchema.parse({
          email: formData.get("email"),
          password: formData.get("password"),
        });
        const { error } = await signIn(data.email, data.password);
        if (error) {
          signInForm.setError("root", { message: error.message });
          toast({
            title: "Sign-in failed",
            description: error.message,
            variant: "destructive",
          });
          return { error: error.message };
        }
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        router.push(redirectTo);
        return { success: true };
      } catch (err: any) {
        const message = err.message || "An unexpected error occurred";
        signInForm.setError("root", { message });
        toast({
          title: "Sign-in error",
          description: message,
          variant: "destructive",
        });
        return { error: message };
      }
    },
    null
  );

  // React 19 useActionState for sign-up
  const [signUpState, signUpAction] = useActionState(
    async (_: any, formData: FormData) => {
      try {
        const data = signUpSchema.parse({
          displayName: formData.get("displayName"),
          email: formData.get("email"),
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        });
        const { error } = await signUp(
          data.email,
          data.password,
          data.displayName
        );
        if (error) {
          signUpForm.setError("root", { message: error.message });
          toast({
            title: "Sign-up failed",
            description: error.message,
            variant: "destructive",
          });
          return { error: error.message };
        }
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        // Stay on auth but maybe show a message or redirect to a wait page
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return { success: true };
      } catch (err: any) {
        const message = err.message || "An unexpected error occurred";
        signUpForm.setError("root", { message });
        toast({
          title: "Sign-up error",
          description: message,
          variant: "destructive",
        });
        return { error: message };
      }
    },
    null
  );

  // React 19 useActionState for forgot password
  const [forgotPasswordState, forgotPasswordAction] = useActionState(
    async (_: any, formData: FormData) => {
      try {
        const data = forgotPasswordSchema.parse({
          email: formData.get("email"),
        });
        const { error } = await resetPassword(data.email);
        if (error) {
          forgotPasswordForm.setError("root", { message: error.message });
          toast({
            title: "Password reset failed",
            description: error.message,
            variant: "destructive",
          });
          return { error: error.message };
        }
        setView("reset-sent");
        toast({
          title: "Reset link sent!",
          description: "Check your email for password reset instructions.",
        });
        return { success: true };
      } catch (err: any) {
        const message = err.message || "An unexpected error occurred";
        forgotPasswordForm.setError("root", { message });
        toast({
          title: "Password reset error",
          description: message,
          variant: "destructive",
        });
        return { error: message };
      }
    },
    null
  );

  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in useEffect
  }

  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("auth")}
                className="absolute left-4 top-4 p-2"
                aria-label="Back to authentication"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Reset Password
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form action={forgotPasswordAction} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="reset-email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    {...forgotPasswordForm.register("email")}
                    className={`h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary ${
                      forgotPasswordForm.formState.errors.email
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    aria-invalid={!!forgotPasswordForm.formState.errors.email}
                    aria-describedby="reset-email-error"
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p id="reset-email-error" className="text-sm text-red-600">
                      {forgotPasswordForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {forgotPasswordForm.formState.errors.root && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {forgotPasswordForm.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}
                {forgotPasswordState?.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {forgotPasswordState.error}
                    </AlertDescription>
                  </Alert>
                )}

                <SubmitButton label="Send Reset Link" />
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "reset-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Check Your Email
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                We've sent a password reset link to{" "}
                <strong>{forgotPasswordForm.watch("email")}</strong>
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-blue-800">
                    Didn't receive the email? Check your spam folder or try
                    again with a different email address.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setView("forgot-password")}
                    className="flex-1"
                    aria-label="Try again"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => setView("auth")}
                    className="flex-1"
                    aria-label="Back to sign in"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-md">
              <img
                src="/cheque.png"
                className="w-6 h-6 text-white"
                alt="CashBook Logo"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">CashBook</h1>
          </Link>
        </div>

        <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-lg p-1">
                <TabsTrigger
                  value="signin"
                  className="py-2 text-sm font-medium"
                  aria-label="Sign in tab"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="py-2 text-sm font-medium"
                  aria-label="Sign up tab"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form action={signInAction} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signInForm.register("email")}
                      className={`h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary ${
                        signInForm.formState.errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      aria-invalid={!!signInForm.formState.errors.email}
                      aria-describedby="signin-email-error"
                    />
                    {signInForm.formState.errors.email && (
                      <p
                        id="signin-email-error"
                        className="text-sm text-red-600"
                      >
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="signin-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setView("forgot-password")}
                        className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                        aria-label="Forgot password"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <PasswordInput
                      id="signin-password"
                      placeholder="Enter your password"
                      {...signInForm.register("password")}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      error={signInForm.formState.errors.password?.message}
                      aria-describedby="signin-password-error"
                    />
                    {signInForm.formState.errors.password && (
                      <p
                        id="signin-password-error"
                        className="text-sm text-red-600"
                      >
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {signInForm.formState.errors.root && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {signInForm.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  {signInState?.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {signInState.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <SubmitButton label="Sign In" />
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form action={signUpAction} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Display Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your name"
                      {...signUpForm.register("displayName")}
                      className={`h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary ${
                        signUpForm.formState.errors.displayName
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpForm.formState.errors.displayName}
                      aria-describedby="signup-name-error"
                    />
                    {signUpForm.formState.errors.displayName && (
                      <p
                        id="signup-name-error"
                        className="text-sm text-red-600"
                      >
                        {signUpForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      {...signUpForm.register("email")}
                      className={`h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary ${
                        signUpForm.formState.errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpForm.formState.errors.email}
                      aria-describedby="signup-email-error"
                    />
                    {signUpForm.formState.errors.email && (
                      <p
                        id="signup-email-error"
                        className="text-sm text-red-600"
                      >
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <PasswordInput
                      id="signup-password"
                      placeholder="Choose a password (min. 6 characters)"
                      {...signUpForm.register("password")}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      error={signUpForm.formState.errors.password?.message}
                      aria-describedby="signup-password-error"
                    />
                    {signUpForm.formState.errors.password && (
                      <p
                        id="signup-password-error"
                        className="text-sm text-red-600"
                      >
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-confirm"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </Label>
                    <PasswordInput
                      id="signup-confirm"
                      placeholder="Confirm your password"
                      {...signUpForm.register("confirmPassword")}
                      showPassword={showConfirmPassword}
                      onTogglePassword={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      error={
                        signUpForm.formState.errors.confirmPassword?.message
                      }
                      aria-describedby="signup-confirm-error"
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <p
                        id="signup-confirm-error"
                        className="text-sm text-red-600"
                      >
                        {signUpForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {signUpForm.formState.errors.root && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {signUpForm.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  {signUpState?.error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {signUpState.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <SubmitButton label="Create Account" />
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
