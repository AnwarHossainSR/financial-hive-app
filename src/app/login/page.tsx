"use client";

import Link from "next/link";
import { Suspense } from "react";

import { AuthLayout } from "@/components/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Loader2,
  MailCheck,
} from "lucide-react";
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

const inputClass = (invalid: boolean) =>
  cn(
    "h-11 rounded-xl",
    invalid && "border-destructive focus-visible:ring-destructive",
  );

// Submit button component using useFormStatus
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-11 w-full gap-2 rounded-xl font-semibold shadow-primary"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4 order-last" />
      )}
      {label}
    </Button>
  );
}

function Field({
  id,
  label,
  error,
  action,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" className="rounded-xl py-2.5">
      <AlertDescription className="text-sm">{message}</AlertDescription>
    </Alert>
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect in useEffect
  }

  if (view === "forgot-password") {
    return (
      <AuthLayout>
        <button
          type="button"
          onClick={() => setView("auth")}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
        <div className="mb-8 space-y-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="pt-2 text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a link to choose a new
            password.
          </p>
        </div>
        <form action={forgotPasswordAction} className="space-y-5">
          <Field
            id="reset-email"
            label="Email"
            error={forgotPasswordForm.formState.errors.email?.message}
          >
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...forgotPasswordForm.register("email")}
              className={inputClass(!!forgotPasswordForm.formState.errors.email)}
              aria-invalid={!!forgotPasswordForm.formState.errors.email}
              aria-describedby="reset-email-error"
            />
          </Field>
          <FormError
            message={
              forgotPasswordForm.formState.errors.root?.message ??
              forgotPasswordState?.error
            }
          />
          <SubmitButton label="Send reset link" />
        </form>
      </AuthLayout>
    );
  }

  if (view === "reset-sent") {
    return (
      <AuthLayout>
        <div className="space-y-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-income/10 text-income">
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 className="pt-2 text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">
              {forgotPasswordForm.watch("email")}
            </span>
            .
          </p>
        </div>
        <p className="mt-6 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or try again with a
          different address.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setView("forgot-password")}
            className="h-11 flex-1 rounded-xl"
          >
            Try again
          </Button>
          <Button
            onClick={() => setView("auth")}
            className="h-11 flex-1 rounded-xl"
          >
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome to Financial Hive
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your cashbooks, or create an account in under a minute.
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
          <TabsTrigger
            value="signin"
            className="rounded-lg text-sm font-semibold data-[state=active]:shadow-sm"
          >
            Sign in
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-lg text-sm font-semibold data-[state=active]:shadow-sm"
          >
            Create account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-0">
          <form action={signInAction} className="space-y-5">
            <Field
              id="signin-email"
              label="Email"
              error={signInForm.formState.errors.email?.message}
            >
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...signInForm.register("email")}
                className={inputClass(!!signInForm.formState.errors.email)}
                aria-invalid={!!signInForm.formState.errors.email}
                aria-describedby="signin-email-error"
              />
            </Field>

            <Field
              id="signin-password"
              label="Password"
              error={signInForm.formState.errors.password?.message}
              action={
                <button
                  type="button"
                  onClick={() => setView("forgot-password")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              }
            >
              <PasswordInput
                id="signin-password"
                placeholder="Your password"
                autoComplete="current-password"
                {...signInForm.register("password")}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                error={signInForm.formState.errors.password?.message}
                className={cn(
                  inputClass(!!signInForm.formState.errors.password),
                  "pr-10",
                )}
                aria-describedby="signin-password-error"
              />
            </Field>

            <FormError
              message={
                signInForm.formState.errors.root?.message ?? signInState?.error
              }
            />
            <SubmitButton label="Sign in" />
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <form action={signUpAction} className="space-y-4">
            <Field
              id="signup-name"
              label="Your name"
              error={signUpForm.formState.errors.displayName?.message}
            >
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Anwar Hossain"
                {...signUpForm.register("displayName")}
                className={inputClass(!!signUpForm.formState.errors.displayName)}
                aria-invalid={!!signUpForm.formState.errors.displayName}
                aria-describedby="signup-name-error"
              />
            </Field>

            <Field
              id="signup-email"
              label="Email"
              error={signUpForm.formState.errors.email?.message}
            >
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...signUpForm.register("email")}
                className={inputClass(!!signUpForm.formState.errors.email)}
                aria-invalid={!!signUpForm.formState.errors.email}
                aria-describedby="signup-email-error"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="signup-password"
                label="Password"
                error={signUpForm.formState.errors.password?.message}
              >
                <PasswordInput
                  id="signup-password"
                  placeholder="6+ characters"
                  autoComplete="new-password"
                  {...signUpForm.register("password")}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  error={signUpForm.formState.errors.password?.message}
                  className={cn(
                    inputClass(!!signUpForm.formState.errors.password),
                    "pr-10",
                  )}
                  aria-describedby="signup-password-error"
                />
              </Field>

              <Field
                id="signup-confirm"
                label="Confirm password"
                error={signUpForm.formState.errors.confirmPassword?.message}
              >
                <PasswordInput
                  id="signup-confirm"
                  placeholder="Repeat it"
                  autoComplete="new-password"
                  {...signUpForm.register("confirmPassword")}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  error={signUpForm.formState.errors.confirmPassword?.message}
                  className={cn(
                    inputClass(!!signUpForm.formState.errors.confirmPassword),
                    "pr-10",
                  )}
                  aria-describedby="signup-confirm-error"
                />
              </Field>
            </div>

            <FormError
              message={
                signUpForm.formState.errors.root?.message ?? signUpState?.error
              }
            />
            <SubmitButton label="Create account" />
          </form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
