import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // Se não encontrar perfil, cria um básico
        await createUserProfile(user);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const createUserProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            user_id: user.id,
            nome: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email,
            funcao: 'Profissional de Saúde',
            ativo: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil do usuário:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Erro ao criar perfil do usuário:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return {
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut
  };
};