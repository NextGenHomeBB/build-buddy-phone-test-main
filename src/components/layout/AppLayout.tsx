import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { Bell, Settings, User, Menu, Search, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Task Completed",
      message: "Kitchen renovation phase completed",
      time: "2 min ago",
      type: "success",
      unread: true,
    },
    {
      id: 2,
      title: "Budget Alert",
      message: "Project budget 80% utilized",
      time: "10 min ago",
      type: "warning",
      unread: true,
    },
    {
      id: 3,
      title: "New Task Assigned",
      message: "Electrical work needs attention",
      time: "1 hour ago",
      type: "info",
      unread: true,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  useEffect(() => {
    const checkScreenSize = () => {
      // iPad breakpoint is typically around 768px to 1024px
      // We'll default to collapsed for tablet/iPad sizes (768px - 1023px)
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setDefaultOpen(!isTablet);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8">
            {/* Left Section - Menu & Search */}
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="lg:hidden" />
              
              {/* Search - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-2 max-w-sm flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects, tasks..."
                    className="pl-10 h-9 bg-muted/50"
                  />
                </div>
              </div>

              {/* Mobile Title */}
              <div className="md:hidden">
                <h1 className="text-lg font-semibold text-foreground">
                  Phase-Gate
                </h1>
              </div>
            </div>

            {/* Right Section - Actions & Profile */}
            <div className="flex items-center gap-2">
              {/* Search button for mobile */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => {
                      const getIcon = (type: string) => {
                        switch (type) {
                          case 'success':
                            return <CheckCircle className="h-4 w-4 text-green-500" />;
                          case 'warning':
                            return <AlertCircle className="h-4 w-4 text-orange-500" />;
                          default:
                            return <Clock className="h-4 w-4 text-blue-500" />;
                        }
                      };

                      return (
                        <DropdownMenuItem 
                          key={notification.id} 
                          className="p-3 cursor-pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-3 w-full">
                            {getIcon(notification.type)}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{notification.title}</p>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings - Hidden on mobile */}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Settings className="h-5 w-5" />
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt={profile?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem className="sm:hidden">Settings</DropdownMenuItem>
                  <DropdownMenuItem>Preferences</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={signOut}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden bg-muted/30">
            <div className="h-full px-4 py-6 lg:px-8 pb-20 lg:pb-6">
              {children}
            </div>
          </main>

          {/* Mobile Tab Bar */}
          <div className="lg:hidden">
            <MobileTabBar />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}