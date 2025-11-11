import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../../types';

interface UserContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, userProfile, loading, signIn, signUp, signOut } = useAuth();

  // Converter o perfil do Supabase para o formato esperado pela aplicação
  const user: User | null = userProfile ? {
    name: userProfile.nome,
    title: userProfile.funcao,
    avatarUrl: userProfile.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.nome)}&background=random`
  } : null;

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};