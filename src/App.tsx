import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAccess } from "@/components/auth/RequireAccess";
import { Suspense, lazy } from "react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProjectTeamTab = lazy(() => import("./pages/ProjectTeamTab"));
const PhaseDetail = lazy(() => import("./pages/PhaseDetail"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const TimeSheet = lazy(() => import("./pages/TimeSheet"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportsOverview = lazy(() => import("./pages/Reports/Overview"));
const ReportsMaterials = lazy(() => import("./pages/Reports/Materials"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const ProjectSettings = lazy(() => import("./pages/admin/ProjectSettings"));
const AdminChecklists = lazy(() => import("./pages/admin/Checklists"));
const AdminMaterials = lazy(() => import("./pages/admin/Materials"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminUserAccess = lazy(() => import("./pages/AdminUserAccess"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EasyPhaseChecklist = lazy(() => import("./pages/EasyPhaseChecklist"));
const ChecklistCreator = lazy(() => import("./pages/ChecklistCreator"));
const SubcontractorPage = lazy(() => import("./pages/SubcontractorPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const Onboarding = lazy(() => import("./pages/auth/Onboarding"));
const FeedbackHome = lazy(() => import("./pages/feedback/FeedbackHome"));
const FeedbackAdminList = lazy(() => import("./pages/feedback/FeedbackAdminList"));
const ScheduleDayView = lazy(() => import("./pages/schedule/ScheduleDayView"));
const SchedulePlanner = lazy(() => import("./pages/schedule-planner/SchedulePlanner"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Wrapper components to access route params for RequireAccess
const ProjectDetailWrapper = () => {
  const { id } = useParams();
  return (
    <RequireAccess projectId={id}>
      <ProjectDetail />
    </RequireAccess>
  );
};

const PhaseDetailWrapper = () => {
  const { id, phaseId } = useParams();
  return (
    <RequireAccess projectId={id} phaseId={phaseId}>
      <PhaseDetail />
    </RequireAccess>
  );
};

const ProjectTeamWrapper = () => {
  const { id } = useParams();
  return (
    <RequireAccess projectId={id}>
      <ProjectTeamTab projectId={id!} />
    </RequireAccess>
  );
};

const TeamPageWrapper = () => {
  const { id } = useParams();
  return (
    <RequireAccess projectId={id}>
      <TeamPage />
    </RequireAccess>
  );
};

const EasyPhaseChecklistWrapper = () => {
  const { phaseId } = useParams();
  return (
    <RequireAccess phaseId={phaseId} rolesAllowed={['manager']}>
      <EasyPhaseChecklist />
    </RequireAccess>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              
              {/* Protected routes */}
              <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth><Index /></RequireAuth>} />
              <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
              <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
              
              {/* Project routes with access control */}
              <Route path="/projects/:id" element={<RequireAuth><ProjectDetailWrapper /></RequireAuth>} />
              <Route path="/projects/:id/team" element={<RequireAuth><ProjectTeamWrapper /></RequireAuth>} />
              <Route path="/projects/:id/phase/:phaseId" element={<RequireAuth><PhaseDetailWrapper /></RequireAuth>} />
              
              {/* Phase routes with access control */}
              <Route path="/phases/:phaseId/checklist" element={<RequireAuth><EasyPhaseChecklistWrapper /></RequireAuth>} />
              
              <Route path="/checklists/new" element={<RequireAuth roles={['admin', 'manager']}><ChecklistCreator /></RequireAuth>} />
              <Route path="/subcontractors/:id" element={<RequireAuth><SubcontractorPage /></RequireAuth>} />
              <Route path="/my-tasks" element={<RequireAuth><MyTasks /></RequireAuth>} />
              <Route path="/time-sheet" element={<RequireAuth><TimeSheet /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth roles={['admin', 'manager']}><Settings /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth roles={['admin', 'manager']}><Reports /></RequireAuth>} />
              <Route path="/reports/overview" element={<RequireAuth roles={['admin', 'manager']}><ReportsOverview /></RequireAuth>} />
              <Route path="/reports/materials" element={<RequireAuth roles={['admin', 'manager']}><ReportsMaterials /></RequireAuth>} />
              
              {/* Feedback routes */}
              <Route path="/feedback" element={<RequireAuth><FeedbackHome /></RequireAuth>} />
              
              {/* Schedule routes */}
              <Route path="/schedule" element={<RequireAuth><ScheduleDayView /></RequireAuth>} />
              
              {/* Admin routes - Admin only */}
              <Route path="/admin/schedule-planner" element={<RequireAuth roles={['admin', 'manager']}><SchedulePlanner /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
              <Route path="/admin/users" element={<RequireAuth roles={['admin']}><UserManagement /></RequireAuth>} />
              <Route path="/admin/projects" element={<RequireAuth roles={['admin']}><ProjectSettings /></RequireAuth>} />
              <Route path="/admin/checklists" element={<RequireAuth roles={['admin']}><AdminChecklists /></RequireAuth>} />
              <Route path="/admin/materials" element={<RequireAuth roles={['admin']}><AdminMaterials /></RequireAuth>} />
              <Route path="/admin/reports" element={<RequireAuth roles={['admin']}><AdminReports /></RequireAuth>} />
              <Route path="/admin/access" element={<RequireAuth roles={['admin']}><AdminUserAccess /></RequireAuth>} />
              <Route path="/admin/feedback" element={<RequireAuth roles={['admin']}><FeedbackAdminList /></RequireAuth>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
