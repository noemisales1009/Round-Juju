import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Task, TaskStatus } from '../../types';

export const useSupabaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando tarefas do Supabase...');

      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar tarefas:', error);
        throw error;
      }

      console.log('✅ Tarefas do Supabase:', tasksData);

      const formattedTasks: Task[] = (tasksData || []).map((t, index) => ({
        id: index + 1,
        patientId: 0, // Será mapeado depois
        categoryId: t.category_id,
        description: t.description,
        responsible: t.responsible,
        deadline: t.deadline,
        status: t.status as TaskStatus,
        justification: t.justification || undefined,
      }));

      console.log('✅ Tarefas formatadas:', formattedTasks);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const updateTaskJustification = async (taskId: number, justification: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      const supabaseTask = (tasksData || [])[taskId - 1];
      if (!supabaseTask) return;

      const { error } = await supabase
        .from('tasks')
        .update({ justification })
        .eq('id', supabaseTask.id);

      if (error) throw error;

      await loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar justificativa:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      const supabaseTask = (tasksData || [])[taskId - 1];
      if (!supabaseTask) return;

      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', supabaseTask.id);

      if (error) throw error;

      await loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'justification'>) => {
    try {
      // Buscar o UUID do paciente
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .order('bed_number');

      const patient = (patientsData || [])[taskData.patientId - 1];
      if (!patient) {
        throw new Error('Paciente não encontrado');
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          patient_id: patient.id,
          category_id: taskData.categoryId,
          description: taskData.description,
          responsible: taskData.responsible,
          deadline: taskData.deadline,
          status: 'alerta',
        });

      if (error) throw error;

      await loadTasks();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  };

  return {
    tasks,
    loading,
    updateTaskJustification,
    updateTaskStatus,
    addTask,
  };
};