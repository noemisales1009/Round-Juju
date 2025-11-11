import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { ChecklistAnswer, Answer } from '../../types';

// Mapa para otimizar a conversão de ID sequencial para UUID
const patientIdToUuidMap = new Map<number, string>();

export const useChecklist = () => {
  // Respostas para o checklist atualmente aberto
  const [currentAnswers, setCurrentAnswers] = useState<ChecklistAnswer>({});
  // Dados de conclusão para todos os pacientes no dia de hoje
  const [completionData, setCompletionData] = useState<Record<number, number[]>>({}); // { patientId: [catId1, catId2] }
  const [loading, setLoading] = useState(true);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const populatePatientMap = async () => {
    if (patientIdToUuidMap.size > 0) return; // Evita buscas repetidas
    const { data: patientsData, error } = await supabase
      .from('patients')
      .select('id, bed_number')
      .order('bed_number');
    
    if (error) {
      console.error("Erro ao buscar pacientes para mapeamento de UUID:", error);
      return;
    }
    // Assumindo que o ID sequencial (1, 2, 3...) corresponde à ordem dos leitos
    patientsData?.forEach((patient, index) => {
        patientIdToUuidMap.set(index + 1, patient.id);
    });
  };

  // Carrega os dados de conclusão de checklist para todos os pacientes
  const loadAllCompletionData = useCallback(async () => {
    setLoading(true);
    try {
      await populatePatientMap();
      const today = getTodayDateString();
      const { data, error } = await supabase
        .from('checklist_answers')
        .select('patient_id, category_id')
        .eq('date', today);

      if (error) throw error;

      const uuidToIdMap = new Map<string, number>();
      patientIdToUuidMap.forEach((uuid, id) => uuidToIdMap.set(uuid, id));

      const newCompletionData: Record<number, number[]> = {};
      data.forEach(item => {
        const patientId = uuidToIdMap.get(item.patient_id);
        if (patientId) {
          if (!newCompletionData[patientId]) {
            newCompletionData[patientId] = [];
          }
          if (!newCompletionData[patientId].includes(item.category_id)) {
            newCompletionData[patientId].push(item.category_id);
          }
        }
      });
      setCompletionData(newCompletionData);
    } catch (error) {
      console.error("Erro ao carregar dados de conclusão:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega as respostas para uma tela de checklist específica
  const loadAnswersForChecklist = useCallback(async (patientId: number, categoryId: number) => {
    setLoading(true);
    setCurrentAnswers({}); // Limpa respostas anteriores
    try {
      await populatePatientMap();
      const patientUuid = patientIdToUuidMap.get(patientId);
      if (!patientUuid) throw new Error("UUID do paciente não encontrado");
      
      const today = getTodayDateString();
      const { data, error } = await supabase
        .from('checklist_answers')
        .select('question_id, answer')
        .eq('patient_id', patientUuid)
        .eq('category_id', categoryId)
        .eq('date', today);

      if (error) throw error;

      const loadedAnswers: ChecklistAnswer = {};
      data.forEach(item => {
        loadedAnswers[item.question_id] = item.answer as Answer;
      });
      setCurrentAnswers(loadedAnswers);
    } catch (error) {
      console.error(`Erro ao carregar respostas para paciente ${patientId}, categoria ${categoryId}:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salva (insere ou atualiza) uma resposta no banco de dados
  const saveAnswer = async (
    patientId: number, 
    categoryId: number, 
    questionId: number, 
    answer: Answer
  ) => {
    try {
        await populatePatientMap();
        const patientUuid = patientIdToUuidMap.get(patientId);
        if (!patientUuid) throw new Error("UUID do paciente não encontrado");

        const today = getTodayDateString();

        const { error } = await supabase
            .from('checklist_answers')
            .upsert({
                patient_id: patientUuid,
                category_id: categoryId,
                question_id: questionId,
                answer: answer,
                date: today
            }, {
                onConflict: 'patient_id,category_id,question_id,date'
            });

        if (error) throw error;

        // Atualiza o estado local para refletir a mudança instantaneamente
        setCurrentAnswers(prev => ({ ...prev, [questionId]: answer }));
        setCompletionData(prev => {
            const patientCompletion = prev[patientId] || [];
            if (!patientCompletion.includes(categoryId)) {
                return {
                    ...prev,
                    [patientId]: [...patientCompletion, categoryId]
                };
            }
            return prev;
        });

    } catch (error) {
        console.error("Erro ao salvar resposta:", error);
        throw error;
    }
  };

  return {
    currentAnswers,
    completionData,
    loading,
    loadAllCompletionData,
    loadAnswersForChecklist,
    saveAnswer,
  };
};