import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it as fallback
        console.log('Profile not found, creating new profile for user:', userId);
        await createProfile(userId);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata?.name || 
                     userData.user?.user_metadata?.full_name || 
                     userData.user?.email?.split('@')[0] || 
                     'User';

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          auth_user_id: userId,
          name: userName,
          role: 'worker',
          is_placeholder: false,
          organization_id: '00000000-0000-0000-0000-000000000000' // Will be set by RLS/trigger
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
        console.log('Profile created successfully:', data);
      } else {
        console.error('Error creating profile:', error);
      }
    } catch (error) {
      console.error('Error in createProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid potential deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      return { error };
    }

    return {};
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    console.log('Starting signup process for:', email, name);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    console.log('Signup result:', { data, error });
    
    if (error) {
      console.error('Signup error:', error);
      setLoading(false);
      return { error };
    }

    // If signup successful but user not confirmed, try to create profile manually
    if (data.user && !data.user.email_confirmed_at) {
      console.log('User created but not confirmed, attempting to create profile manually');
      try {
        await createProfile(data.user.id);
      } catch (profileError) {
        console.error('Manual profile creation failed:', profileError);
      }
    }

    console.log('Signup completed successfully');
    return {};
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const updateProfile = async (updates: any) => {
    if (!user || !profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    
    if (!error) {
      setProfile({ ...profile, ...updates });
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}