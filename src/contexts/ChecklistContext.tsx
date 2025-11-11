import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useChecklist } from '../hooks/useChecklist';
import { ChecklistAnswer, Answer, ChecklistContextType } from '../../types';

const ChecklistContext = createContext<ChecklistContextType | null>(null);

export const ChecklistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const checklistHook = useChecklist();
  const { loadAllCompletionData } = checklistHook;

  // Carrega os dados de conclusão de todos os pacientes ao iniciar o app
  useEffect(() => {
    loadAllCompletionData();
  }, [loadAllCompletionData]);

  return (
    <ChecklistContext.Provider value={checklistHook}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklistContext = () => {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error('useChecklistContext deve ser usado dentro de um ChecklistProvider');
  }
  return context;
};