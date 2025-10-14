import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { suppressResizeObserverErrors } from "@/lib/resize-observer-polyfill";

import Layout from "@/components/Layout";
import Login from "./pages/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import GroupBookings from "./pages/GroupBookings";
import Transport from "./pages/Transport";
import Activities from "./pages/Activities";
import Hotels from "./pages/Hotels";
import DailyActivityReport from "./pages/DailyActivityReport";
import Equipment from "./pages/Equipment";
import Staff from "./pages/Staff";
import TestAutoStatus from "./pages/TestAutoStatus";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Suppress ResizeObserver errors from Radix UI components
suppressResizeObserverErrors();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/group-bookings" element={
              <ProtectedRoute>
                <Layout>
                  <GroupBookings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transport" element={
              <ProtectedRoute>
                <Layout>
                  <Transport />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/activities" element={
              <ProtectedRoute>
                <Layout>
                  <Activities />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/hotels" element={
              <ProtectedRoute>
                <Layout>
                  <Hotels />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <DailyActivityReport />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/equipment" element={
              <ProtectedRoute>
                <Layout>
                  <Equipment />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <Staff />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/test-auto-status" element={
              <ProtectedRoute>
                <Layout>
                  <TestAutoStatus />
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <ProtectedRoute>
                <Layout>
                  <NotFound />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
