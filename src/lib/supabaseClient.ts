/**
 * Mock Supabase client for development
 * This will be replaced with real Supabase integration later
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  avatar_url?: string;
}

export interface AuthSession {
  user: User | null;
  access_token?: string;
}

// Mock user data for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@buildbuddy.com',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2', 
    email: 'worker@buildbuddy.com',
    name: 'Worker User',
    role: 'worker'
  },
  {
    id: '3',
    email: 'manager@buildbuddy.com', 
    name: 'Manager User',
    role: 'manager'
  }
];

class MockSupabaseClient {
  private currentUser: User | null = null;

  /**
   * Mock sign in with email and password
   */
  async signInWithPassword(credentials: { email: string; password: string }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (user && credentials.password === 'password123') {
      this.currentUser = user;
      localStorage.setItem('auth-user', JSON.stringify(user));
      return {
        data: { user, session: { user, access_token: 'mock-token' } },
        error: null
      };
    }

    return {
      data: { user: null, session: null },
      error: { message: 'Invalid email or password' }
    };
  }

  /**
   * Mock sign up with email and password
   */
  async signUp(credentials: { email: string; password: string; name?: string }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const existingUser = mockUsers.find(u => u.email === credentials.email);
    if (existingUser) {
      return {
        data: { user: null, session: null },
        error: { message: 'User already exists' }
      };
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: credentials.email,
      name: credentials.name || 'New User',
      role: 'worker' // Default role
    };

    mockUsers.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem('auth-user', JSON.stringify(newUser));

    return {
      data: { user: newUser, session: { user: newUser, access_token: 'mock-token' } },
      error: null
    };
  }

  /**
   * Mock sign out
   */
  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('auth-user');
    return { error: null };
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: AuthSession | null }, error: null }> {
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.currentUser = user;
      return {
        data: { session: { user, access_token: 'mock-token' } },
        error: null
      };
    }
    
    return {
      data: { session: null },
      error: null
    };
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Mock auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    // Initial call with current session
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      callback('SIGNED_IN', { user });
    } else {
      callback('SIGNED_OUT', null);
    }

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }
}

export const supabase = new MockSupabaseClient();