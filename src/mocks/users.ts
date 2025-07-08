export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'team_member';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  avatar?: string;
  createdAt: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'admin',
    department: 'Engineering',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-01T09:00:00Z',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'manager',
    department: 'Design',
    status: 'active',
    lastLogin: '2024-01-14T16:45:00Z',
    createdAt: '2023-07-15T14:20:00Z',
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    role: 'team_member',
    department: 'Engineering',
    status: 'active',
    lastLogin: '2024-01-12T08:15:00Z',
    createdAt: '2023-08-10T11:30:00Z',
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily.chen@company.com',
    role: 'team_member',
    department: 'Marketing',
    status: 'pending',
    lastLogin: '',
    createdAt: '2024-01-10T13:45:00Z',
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@company.com',
    role: 'manager',
    department: 'Operations',
    status: 'inactive',
    lastLogin: '2023-12-20T09:30:00Z',
    createdAt: '2023-05-20T10:00:00Z',
  },
];