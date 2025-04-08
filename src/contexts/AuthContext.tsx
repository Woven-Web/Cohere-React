
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, UserProfile } from '@/lib/supabase-client';
import { typedDataResponse } from '@/lib/supabase-helpers';
import { toast } from 'sonner';

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  isSubmitter: boolean;
  isCurator: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSubmitter, setIsSubmitter] = useState(false);
  const [isCurator, setIsCurator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setIsSubmitter(false);
          setIsCurator(false);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load user profile when auth state changes
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      // Use the typedDataResponse helper to properly type the data
      const typedProfile = typedDataResponse<UserProfile>(data);
      setUserProfile(typedProfile);
      
      // Set role flags
      setIsSubmitter(['submitter', 'curator', 'admin'].includes(typedProfile.role));
      setIsCurator(['curator', 'admin'].includes(typedProfile.role));
      setIsAdmin(typedProfile.role === 'admin');
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setIsSubmitter(false);
    setIsCurator(false);
    setIsAdmin(false);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await logout();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isSubmitter,
    isCurator,
    isAdmin,
    loading,
    login,
    logout,
    signIn,
    signUp,
    signOut,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
