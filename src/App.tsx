import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import PhaseDetail from "./pages/PhaseDetail";
import MyTasks from "./pages/MyTasks";
import TimeSheet from "./pages/TimeSheet";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import ReportsOverview from "./pages/Reports/Overview";
import ReportsMaterials from "./pages/Reports/Materials";
import UserManagement from "./pages/admin/UserManagement";
import ProjectSettings from "./pages/admin/ProjectSettings";
import AdminChecklists from "./pages/admin/Checklists";
import AdminMaterials from "./pages/admin/Materials";
import AdminReports from "./pages/admin/Reports";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/AdminLogin";
import Onboarding from "./pages/auth/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected routes */}
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
            <Route path="/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
            <Route path="/projects/:id/phase/:phaseId" element={<RequireAuth><PhaseDetail /></RequireAuth>} />
            <Route path="/my-tasks" element={<RequireAuth><MyTasks /></RequireAuth>} />
            <Route path="/time-sheet" element={<RequireAuth><TimeSheet /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth roles={['admin', 'manager']}><Settings /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth roles={['admin', 'manager']}><Reports /></RequireAuth>} />
            <Route path="/reports/overview" element={<RequireAuth roles={['admin', 'manager']}><ReportsOverview /></RequireAuth>} />
            <Route path="/reports/materials" element={<RequireAuth roles={['admin', 'manager']}><ReportsMaterials /></RequireAuth>} />
            
            {/* Admin routes - Admin only */}
            <Route path="/admin/users" element={<RequireAuth roles={['admin']}><UserManagement /></RequireAuth>} />
            <Route path="/admin/projects" element={<RequireAuth roles={['admin']}><ProjectSettings /></RequireAuth>} />
            <Route path="/admin/checklists" element={<RequireAuth roles={['admin']}><AdminChecklists /></RequireAuth>} />
            <Route path="/admin/materials" element={<RequireAuth roles={['admin']}><AdminMaterials /></RequireAuth>} />
            <Route path="/admin/reports" element={<RequireAuth roles={['admin']}><AdminReports /></RequireAuth>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
