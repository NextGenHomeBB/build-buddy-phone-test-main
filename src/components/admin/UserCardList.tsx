import { User } from "@/mocks/users";
import { UserCard } from "./UserCard";

interface UserCardListProps {
  users: User[];
  onUpdateStatus: (userId: string, status: User['status']) => void;
}

export function UserCardList({ users, onUpdateStatus }: UserCardListProps) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard 
          key={user.id} 
          user={user} 
          onUpdateStatus={onUpdateStatus} 
        />
      ))}
    </div>
  );
}