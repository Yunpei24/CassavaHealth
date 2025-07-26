import { SupabaseService } from './SupabaseService';
import { useState, useEffect } from 'react';

  loading: boolean;
export interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
      setLoading(false);
        const currentUser = await SupabaseService.getCurrentUser();
        setUser(currentUser ? {
          id: currentUser.id,
          email: currentUser.email || '',
        } : null);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = SupabaseService.onAuthStateChange((authUser) => {
      setUser(authUser ? {
        id: authUser.id,
        email: authUser.email || '',
      } : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

      setLoading(false);
  const signUp = async (email: string, password: string) => {
    await SupabaseService.signUp(email, password);
  };

  const signIn = async (email: string, password: string) => {
    await SupabaseService.signIn(email, password);
  };

  const signOut = async () => {
    await SupabaseService.signOut();
  };

      loading,
  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}