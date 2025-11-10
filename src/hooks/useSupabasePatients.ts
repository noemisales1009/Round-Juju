import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Patient, Device, Exam, Medication } from '../../types';

// Mapa para armazenar a relação entre bed_number e UUID
const patientUuidMap = new Map<number, string>();

export const useSupabasePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar pacientes do Supabase
  const loadPatients = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Iniciando carregamento de pacientes...');
      
      // Buscar pacientes
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('bed_number');

      if (patientsError) {
        console.error('❌ Erro ao buscar pacientes:', patientsError);
        throw patientsError;
      }

      console.log('✅ Pacientes do Supabase:', patientsData);
      console.log('📊 Total de pacientes:', patientsData?.length || 0);

      // Limpar e popular o mapa de UUIDs
      patientUuidMap.clear();
      (patientsData || []).forEach(p => {
        console.log(`📌 Mapeando bed_number ${p.bed_number} -> UUID ${p.id}`);
        patientUuidMap.set(p.bed_number, p.id);
      });

      console.log('🗺️ Mapa de pacientes:', Array.from(patientUuidMap.entries()));

      // Buscar dispositivos (não arquivados)
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (devicesError) {
        console.error('❌ Erro ao buscar dispositivos:', devicesError);
        throw devicesError;
      }

      console.log('✅ Dispositivos do Supabase:', devicesData);
      console.log('📊 Total de dispositivos:', devicesData?.length || 0);

      // Buscar exames (não arquivados)
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('is_archived', false)
        .order('date', { ascending: false });

      if (examsError) {
        console.error('❌ Erro ao buscar exames:', examsError);
        throw examsError;
      }

      console.log('✅ Exames do Supabase:', examsData);
      console.log('📊 Total de exames:', examsData?.length || 0);

      // Buscar medicações
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .order('start_date', { ascending: false });

      if (medicationsError) {
        console.error('❌ Erro ao buscar medicações:', medicationsError);
        throw medicationsError;
      }

      console.log('✅ Medicações do Supabase:', medicationsData);
      console.log('📊 Total de medicações:', medicationsData?.length || 0);

      // Combinar dados
      const patientsWithRelations: Patient[] = (patientsData || []).map((p, index) => {
        const patientDevices = (devicesData || [])
          .filter(d => d.patient_id === p.id)
          .map((d, dIndex) => ({
            id: dIndex + 1,
            name: d.name,
            location: d.location,
            startDate: d.start_date,
            removalDate: d.removal_date || undefined,
            isArchived: d.is_archived || false,
          }));

        const patientExams = (examsData || [])
          .filter(e => e.patient_id === p.id)
          .map((e, eIndex) => ({
            id: eIndex + 1,
            name: e.name,
            date: e.date,
            result: e.result as 'Pendente' | 'Normal' | 'Alterado',
            observation: e.observation || undefined,
            isArchived: e.is_archived || false,
          }));

        const patientMedications = (medicationsData || [])
          .filter(m => m.patient_id === p.id)
          .map((m, mIndex) => ({
            id: mIndex + 1,
            name: m.name,
            dosage: m.dosage,
            startDate: m.start_date,
            endDate: m.end_date || undefined,
          }));

        console.log(`👤 Paciente ${p.name}:`, {
          devices: patientDevices.length,
          exams: patientExams.length,
          medications: patientMedications.length
        });

        return {
          id: index + 1, // Usar índice sequencial
          name: p.name,
          bedNumber: p.bed_number,
          motherName: p.mother_name,
          dob: p.dob,
          ctd: p.ctd,
          devices: patientDevices,
          exams: patientExams,
          medications: patientMedications,
        };
      });

      console.log('✅ Pacientes processados:', patientsWithRelations);
      console.log('📊 Total final de pacientes:', patientsWithRelations.length);
      
      setPatients(patientsWithRelations);
    } catch (error) {
      console.error('❌ Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
      console.log('✅ Carregamento finalizado');
    }
  };

  useEffect(() => {
    console.log('🚀 Hook useSupabasePatients montado');
    loadPatients();
  }, []);

  // Adicionar dispositivo
  const addDeviceToPatient = async (patientId: number, device: Omit<Device, 'id'>) => {
    try {
      console.log('🔵 Iniciando addDeviceToPatient...');
      console.log('📝 patientId recebido:', patientId);
      console.log('📝 device recebido:', device);
      console.log('📝 Lista de pacientes atual:', patients);
      
      const patient = patients.find(p => p.id === patientId);
      
      if (!patient) {
        console.error('❌ Paciente não encontrado na lista:', patientId);
        console.error('📋 Pacientes disponíveis:', patients.map(p => ({ id: p.id, bedNumber: p.bedNumber })));
        throw new Error('Paciente não encontrado');
      }

      console.log('✅ Paciente encontrado:', patient);
      console.log('🔍 Buscando UUID para bed_number:', patient.bedNumber);

      // Buscar o UUID do paciente usando o bed_number
      const patientUuid = patientUuidMap.get(patient.bedNumber);
      
      console.log('🗺️ Mapa atual:', Array.from(patientUuidMap.entries()));
      console.log('🔑 UUID encontrado:', patientUuid);
      
      if (!patientUuid) {
        console.error('❌ UUID do paciente não encontrado para bed_number:', patient.bedNumber);
        throw new Error('UUID do paciente não encontrado');
      }

      const insertData = {
        patient_id: patientUuid,
        name: device.name,
        location: device.location,
        start_date: device.startDate,
      };

      console.log('📤 Inserindo dispositivo no Supabase:', insertData);

      const { data, error } = await supabase
        .from('devices')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase ao inserir dispositivo:', error);
        console.error('📋 Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Dispositivo inserido com sucesso:', data);
      console.log('🔄 Recarregando pacientes...');
      await loadPatients();
    } catch (error) {
      console.error('❌ Erro ao adicionar dispositivo:', error);
      throw error;
    }
  };

  // Adicionar data de retirada
  const addRemovalDateToDevice = async (patientId: number, deviceId: number, removalDate: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      // Buscar todos os dispositivos do paciente
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .eq('patient_id', patientUuid)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      const device = (devicesData || [])[deviceId - 1];
      if (!device) return;

      const { error } = await supabase
        .from('devices')
        .update({ removal_date: removalDate })
        .eq('id', device.id);

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao adicionar data de retirada:', error);
      throw error;
    }
  };

  // Deletar dispositivo (arquivar)
  const deleteDeviceFromPatient = async (patientId: number, deviceId: number) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .eq('patient_id', patientUuid)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      const device = (devicesData || [])[deviceId - 1];
      if (!device) return;

      const { error } = await supabase
        .from('devices')
        .update({ is_archived: true })
        .eq('id', device.id);

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao arquivar dispositivo:', error);
      throw error;
    }
  };

  // Adicionar exame
  const addExamToPatient = async (patientId: number, exam: Omit<Exam, 'id'>) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { error } = await supabase
        .from('exams')
        .insert({
          patient_id: patientUuid,
          name: exam.name,
          date: exam.date,
          result: exam.result,
          observation: exam.observation,
        });

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao adicionar exame:', error);
      throw error;
    }
  };

  // Atualizar exame
  const updateExamInPatient = async (patientId: number, examData: Pick<Exam, 'id' | 'result' | 'observation'>) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { data: examsDataList } = await supabase
        .from('exams')
        .select('*')
        .eq('patient_id', patientUuid)
        .eq('is_archived', false)
        .order('date', { ascending: false });

      const exam = (examsDataList || [])[examData.id - 1];
      if (!exam) return;

      const { error } = await supabase
        .from('exams')
        .update({
          result: examData.result,
          observation: examData.observation,
        })
        .eq('id', exam.id);

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao atualizar exame:', error);
      throw error;
    }
  };

  // Deletar exame (arquivar)
  const deleteExamFromPatient = async (patientId: number, examId: number) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { data: examsDataList } = await supabase
        .from('exams')
        .select('*')
        .eq('patient_id', patientUuid)
        .eq('is_archived', false)
        .order('date', { ascending: false});

      const exam = (examsDataList || [])[examId - 1];
      if (!exam) return;

      const { error } = await supabase
        .from('exams')
        .update({ is_archived: true })
        .eq('id', exam.id);

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao arquivar exame:', error);
      throw error;
    }
  };

  // Adicionar medicação
  const addMedicationToPatient = async (patientId: number, medication: Omit<Medication, 'id'>) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { error } = await supabase
        .from('medications')
        .insert({
          patient_id: patientUuid,
          name: medication.name,
          dosage: medication.dosage,
          start_date: medication.startDate,
        });

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao adicionar medicação:', error);
      throw error;
    }
  };

  // Adicionar data de fim da medicação
  const addEndDateToMedication = async (patientId: number, medicationId: number, endDate: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const patientUuid = patientUuidMap.get(patient.bedNumber);
      if (!patientUuid) return;

      const { data: medicationsDataList } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientUuid)
        .order('start_date', { ascending: false });

      const medication = (medicationsDataList || [])[medicationId - 1];
      if (!medication) return;

      const { error } = await supabase
        .from('medications')
        .update({ end_date: endDate })
        .eq('id', medication.id);

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao adicionar data de fim:', error);
      throw error;
    }
  };

  return {
    patients,
    loading,
    addDeviceToPatient,
    addRemovalDateToDevice,
    deleteDeviceFromPatient,
    addExamToPatient,
    updateExamInPatient,
    deleteExamFromPatient,
    addMedicationToPatient,
    addEndDateToMedication,
  };
};