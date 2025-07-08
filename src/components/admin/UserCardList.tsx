import { UserProfile } from "@/services/userService";
import { UserCard } from "./UserCard";

interface UserCardListProps {
  users: UserProfile[];
  onUpdateRole: (userId: string, role: UserProfile['role']) => void;
}

export function UserCardList({ users, onUpdateRole }: UserCardListProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard 
          key={user.id} 
          user={user} 
          onUpdateRole={onUpdateRole} 
        />
      ))}
    </div>
  );
}