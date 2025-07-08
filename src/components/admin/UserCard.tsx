import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit } from "lucide-react";
import { User } from "@/mocks/users";
import { getStatusBadge, getRoleBadge } from "./UserBadges";

interface UserCardProps {
  user: User;
  onUpdateStatus: (userId: string, status: User['status']) => void;
}

export function UserCard({ user, onUpdateStatus }: UserCardProps) {
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
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="touch-target">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Role</div>
          {getRoleBadge(user.role)}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          {getStatusBadge(user.status)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Department</div>
          <div className="text-sm">{user.department}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Last Login</div>
          <div className="text-sm">
            {user.lastLogin ? 
              new Date(user.lastLogin).toLocaleDateString() : 
              'Never'
            }
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Select
          value={user.status}
          onValueChange={(value) => 
            onUpdateStatus(user.id, value as User['status'])
          }
        >
          <SelectTrigger className="w-32 h-9 touch-target">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}