import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserStatsGrid } from "@/components/admin/UserStatsGrid";
import { UserFilters } from "@/components/admin/UserFilters";
import { UserTable } from "@/components/admin/UserTable";
import { UserCardList } from "@/components/admin/UserCardList";
import { AddUserDialog } from "@/components/admin/AddUserDialog";

export default function UserManagement() {
  const isMobile = useIsMobile();
  const {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    isAddUserOpen,
    setIsAddUserOpen,
    handleAddUser,
    handleUpdateStatus,
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
          
          <AddUserDialog 
            isOpen={isAddUserOpen}
            onOpenChange={setIsAddUserOpen}
            onAddUser={handleAddUser}
          />
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
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            {/* Responsive User Display */}
            {!isMobile ? (
              <UserTable 
                users={filteredUsers} 
                onUpdateStatus={handleUpdateStatus} 
              />
            ) : (
              <UserCardList 
                users={filteredUsers} 
                onUpdateStatus={handleUpdateStatus} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}