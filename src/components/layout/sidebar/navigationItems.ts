import { Home, FolderOpen, CheckSquare, BarChart3, Users, Settings, Shield, Package, MessageSquarePlus, CalendarDays, ClipboardList } from "lucide-react";

interface NavigationCounts {
  projectsCount: number;
  myTasksCount: number;
  usersCount: number;
  pendingFeedbackCount: number;
}

export const getNavigationItems = (counts: NavigationCounts) => [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    badge: null,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
    badge: counts.projectsCount > 0 ? counts.projectsCount.toString() : null,
  },
  {
    title: "My Tasks",
    url: "/my-tasks",
    icon: CheckSquare,
    badge: counts.myTasksCount > 0 ? counts.myTasksCount.toString() : null,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: CalendarDays,
    badge: null,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Feedback",
    url: "/feedback",
    icon: MessageSquarePlus,
    badge: null,
  },
];

export const getAdminItems = (counts: NavigationCounts) => [
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
    badge: counts.usersCount > 0 ? counts.usersCount.toString() : null,
  },
  {
    title: "User Access",
    url: "/admin/access",
    icon: Shield,
    badge: null,
  },
  {
    title: "Checklists",
    url: "/admin/checklists",
    icon: ClipboardList,
    badge: null,
  },
  {
    title: "Materials",
    url: "/admin/materials",
    icon: Package,
    badge: null,
  },
  {
    title: "Project Settings",
    url: "/admin/projects",
    icon: Settings,
    badge: null,
  },
  {
    title: "Feedback Admin",
    url: "/admin/feedback",
    icon: MessageSquarePlus,
    badge: counts.pendingFeedbackCount > 0 ? counts.pendingFeedbackCount.toString() : null,
  },
  {
    title: "Schedule Planner",
    url: "/admin/schedule-planner",
    icon: CalendarDays,
    badge: null,
  },
];