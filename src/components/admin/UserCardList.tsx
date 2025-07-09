import { UserProfile } from "@/services/userService";
import { UserCard } from "./UserCard";

interface UserCardListProps {
  users: UserProfile[];
  onUpdateRole: (userId: string, role: UserProfile['role']) => void;
  onUserUpdated: () => void;
}

export function UserCardList({ users, onUpdateRole, onUserUpdated }: UserCardListProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard 
          key={user.id} 
          user={user} 
          onUpdateRole={onUpdateRole}
          onUserUpdated={onUserUpdated}
        />
      ))}
    </div>
  );
}