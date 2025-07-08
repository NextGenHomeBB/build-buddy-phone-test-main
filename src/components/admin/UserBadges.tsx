import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/services/userService";

export const getRoleBadge = (role: UserProfile['role']) => {
  const colors = {
    admin: "destructive",
    manager: "default",
    worker: "secondary",
    viewer: "outline"
  } as const;
  
  return (
    <Badge variant={colors[role]}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};