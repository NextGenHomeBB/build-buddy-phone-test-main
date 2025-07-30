import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit } from "lucide-react";
import { UserProfile } from "@/services/userService";
import { getRoleBadge } from "./UserBadges";
import { EditUserDialog } from "./EditUserDialog";

interface UserCardProps {
  user: UserProfile;
  onUpdateRole: (userId: string, role: UserProfile['role']) => void;
  onUserUpdated: () => void;
}

export function UserCard({ user, onUpdateRole, onUserUpdated }: UserCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
          </div>
        </div>
        <EditUserDialog user={user} onUserUpdated={onUserUpdated}>
          <Button variant="ghost" size="sm" className="touch-target">
            <Edit className="h-4 w-4" />
          </Button>
        </EditUserDialog>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Role</div>
          {getRoleBadge(user.role)}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Phone</div>
          <div className="text-sm">{user.phone || 'Not provided'}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Created</div>
          <div className="text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Updated</div>
          <div className="text-sm">{new Date(user.updated_at).toLocaleDateString()}</div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Select
          value={user.role}
          onValueChange={(value) => 
            onUpdateRole(user.id, value as UserProfile['role'])
          }
        >
          <SelectTrigger className="w-32 h-9 touch-target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="worker">Worker</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}