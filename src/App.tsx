import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader } from "@/components/ui/loader";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { queryClient } from "./lib/query";
import Users from "./pages/Users";

const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const BookDetails = lazy(() => import("./pages/BookDetails"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <Loader className="text-primary" size="lg" variant="ripple" />
                </div>
              }
            >
              <Routes>
                <Route
                  path="/auth"
                  element={
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                      <Auth />
                    </div>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                      <ResetPassword />
                    </div>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <Index />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <Profile />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <Settings />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book/:bookId"
                  element={
                    <ProtectedRoute>
                      <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <BookDetails />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <Users />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-300">
                      <NotFound />
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
