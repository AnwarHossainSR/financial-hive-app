import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";

const Auth = () => {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } =
    useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"auth" | "forgot-password" | "reset-sent">(
    "auth"
  );

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // In a real app, this would navigate to dashboard
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">You are already signed in.</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signIn(signInData.email, signInData.password);

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(
        signUpData.email,
        signUpData.password,
        signUpData.displayName
      );

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!forgotPasswordEmail) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(forgotPasswordEmail);

      if (error) {
        setError(error.message);
      } else {
        setView("reset-sent");
        toast({
          title: "Reset link sent!",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(error.message);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred during social login");
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "forgot-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("auth")}
                className="absolute left-4 top-4 p-2"
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
              <div onSubmit={handleForgotPassword} className="space-y-4">
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
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleForgotPassword}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Send Reset Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "reset-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
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
                <strong>{forgotPasswordEmail}</strong>
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
                  >
                    Try Again
                  </Button>
                  <Button onClick={() => setView("auth")} className="flex-1">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-md">
              <img
                src="/cheque.png"
                className="w-6 h-6 text-white"
                alt="CashBook"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">CashBook</h1>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Social Login Buttons */}
            <div className="flex gap-4 mb-6">
              <Button
                variant="outline"
                className="flex-1 h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator className="w-full bg-gray-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-lg p-1">
                <TabsTrigger
                  value="signin"
                  className="py-2 text-sm font-medium"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="py-2 text-sm font-medium"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div onSubmit={handleSignIn} className="space-y-5">
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
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                    />
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
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) =>
                        setSignInData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSignIn}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div onSubmit={handleSignUp} className="space-y-5">
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
                      value={signUpData.displayName}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                    />
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
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Choose a password (min. 6 characters)"
                      value={signUpData.password}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-confirm"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="h-11 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSignUp}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
