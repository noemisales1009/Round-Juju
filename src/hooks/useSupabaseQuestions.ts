import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { Question } from '../../types';

export const useSupabaseQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando perguntas do Supabase...');

      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias')
        .select('*')
        .order('id');

      if (categoriesError) {
        console.error('❌ Erro ao buscar categorias:', categoriesError);
        throw categoriesError;
      }

      // Buscar perguntas
      const { data: questionsData, error: questionsError } = await supabase
        .from('perguntas')
        .select('*')
        .order('ordem');

      if (questionsError) {
        console.error('❌ Erro ao buscar perguntas:', questionsError);
        throw questionsError;
      }

      console.log('✅ Categorias do Supabase:', categoriesData);
      console.log('✅ Perguntas do Supabase:', questionsData);

      // Mapear perguntas com categoria
      const mappedQuestions: Question[] = (questionsData || []).map((q, index) => {
        const category = categoriesData?.find(c => c.id === q.categoria_id);
        return {
          id: index + 1,
          text: q.texto,
          categoryId: category?.id || 0,
        };
      });

      console.log('✅ Perguntas mapeadas:', mappedQuestions);
      setQuestions(mappedQuestions);
    } catch (error) {
      console.error('❌ Erro ao carregar perguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  return {
    questions,
    loading,
    loadQuestions,
  };
};