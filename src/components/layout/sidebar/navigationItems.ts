import { Home, FolderOpen, CheckSquare, BarChart3, Users, Settings, Shield, Package, MessageSquarePlus, CalendarDays, ClipboardList } from "lucide-react";

export const navigationItems = [
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
    badge: "12",
  },
  {
    title: "My Tasks",
    url: "/my-tasks",
    icon: CheckSquare,
    badge: "3",
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

export const adminItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
    badge: "5",
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
    badge: null,
  },
  {
    title: "Schedule Planner",
    url: "/admin/schedule-planner",
    icon: CalendarDays,
    badge: null,
  },
];