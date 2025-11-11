import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseQuestions } from '../hooks/useSupabaseQuestions';
import type { QuestionsContextType, Question, DynamicCategory } from '../../types';

const QuestionsContext = React.createContext<QuestionsContextType | null>(null);

export const QuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { questions, loading } = useSupabaseQuestions();
  
  // Mapear categorias dinâmicas
  const categories: DynamicCategory[] = [
    { id: 1, nome: 'Sistema Nutricional', icone: 'apple' },
    { id: 2, nome: 'Hídrico', icone: 'droplet' },
    { id: 3, nome: 'Hemodinâmico', icone: 'heart-pulse' },
    { id: 4, nome: 'Hematológico', icone: 'beaker' },
    { id: 5, nome: 'Hepático', icone: 'liver' },
    { id: 6, nome: 'Respiratório', icone: 'lungs' },
    { id: 7, nome: 'Fisioterapia', icone: 'dumbbell' },
    { id: 8, nome: 'Neurológico', icone: 'brain' },
    { id: 9, nome: 'Farmácia', icone: 'pill' },
    { id: 10, nome: 'Gerenciamento de Risco', icone: 'shield' },
    { id: 11, nome: 'Família', icone: 'users' },
    { id: 12, nome: 'Avaliação de Alta', icone: 'home' },
  ];

  return (
    <QuestionsContext.Provider value={{ questions, loading, categories }}>
      {children}
    </QuestionsContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestions deve ser usado dentro de um QuestionsProvider');
  }
  return context;
};