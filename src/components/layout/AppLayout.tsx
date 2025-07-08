import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-y-0 left-0 z-[10000] w-72 bg-card border-r border-border shadow-2xl">
              <AppSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 overflow-x-hidden bg-muted/30">
            <div className="h-full px-4 py-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* Mobile Tab Bar */}
          <div className="lg:hidden">
            <MobileTabBar />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}