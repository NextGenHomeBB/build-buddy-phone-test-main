import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserStatsGrid } from "@/components/admin/UserStatsGrid";
import { UserFilters } from "@/components/admin/UserFilters";
import { UserTable } from "@/components/admin/UserTable";
import { UserCardList } from "@/components/admin/UserCardList";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function UserManagement() {
  const isMobile = useIsMobile();
  const {
    filteredUsers,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    isAddUserOpen,
    setIsAddUserOpen,
    handleAddUser,
    handleUpdateRole,
    stats
  } = useUserManagement();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/access">
                <Shield className="w-4 h-4 mr-2" />
                Project Access
              </Link>
            </Button>
            <AddUserDialog 
              isOpen={isAddUserOpen}
              onOpenChange={setIsAddUserOpen}
              onAddUser={handleAddUser}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsGrid stats={stats} />

        {/* Filters and Users */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts, roles, and access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
            />

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              /* Responsive User Display */
              !isMobile ? (
                <UserTable 
                  users={filteredUsers} 
                  onUpdateRole={handleUpdateRole} 
                />
              ) : (
                <UserCardList 
                  users={filteredUsers} 
                  onUpdateRole={handleUpdateRole} 
                />
              )
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}