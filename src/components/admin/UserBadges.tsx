import { Badge } from "@/components/ui/badge";
import { User } from "@/mocks/users";

export const getStatusBadge = (status: User['status']) => {
  const variants = {
    active: "default",
    inactive: "secondary", 
    pending: "outline"
  } as const;
  
  return (
    <Badge variant={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getRoleBadge = (role: User['role']) => {
  const colors = {
    admin: "destructive",
    manager: "default",
    team_member: "secondary"
  } as const;
  
  return (
    <Badge variant={colors[role]}>
      {role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
};