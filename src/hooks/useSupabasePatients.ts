import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Patient, Device, Exam, Medication } from '../../types';

export const useSupabasePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar pacientes do Supabase
  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Buscar pacientes
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('bed_number');

      if (patientsError) throw patientsError;

      console.log('Pacientes do Supabase:', patientsData);

      // Buscar dispositivos
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (devicesError) throw devicesError;

      console.log('Dispositivos do Supabase:', devicesData);

      // Buscar exames
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .order('date', { ascending: false });

      if (examsError) throw examsError;

      // Buscar medicações
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .order('start_date', { ascending: false });

      if (medicationsError) throw medicationsError;

      // Combinar dados
      const patientsWithRelations: Patient[] = (patientsData || []).map((p, index) => ({
        id: index + 1, // Usar índice sequencial ao invés de converter UUID
        name: p.name,
        bedNumber: p.bed_number,
        motherName: p.mother_name,
        dob: p.dob,
        ctd: p.ctd,
        devices: (devicesData || [])
          .filter(d => d.patient_id === p.id)
          .map((d, dIndex) => ({
            id: dIndex + 1,
            name: d.name,
            location: d.location,
            startDate: d.start_date,
            removalDate: d.removal_date || undefined,
            isArchived: d.is_archived || false,
          })),
        exams: (examsData || [])
          .filter(e => e.patient_id === p.id)
          .map((e, eIndex) => ({
            id: eIndex + 1,
            name: e.name,
            date: e.date,
            result: e.result as 'Pendente' | 'Normal' | 'Alterado',
            observation: e.observation || undefined,
            isArchived: e.is_archived || false,
          })),
        medications: (medicationsData || [])
          .filter(m => m.patient_id === p.id)
          .map((m, mIndex) => ({
            id: mIndex + 1,
            name: m.name,
            dosage: m.dosage,
            startDate: m.start_date,
            endDate: m.end_date || undefined,
          })),
      }));

      console.log('Pacientes processados:', patientsWithRelations);
      setPatients(patientsWithRelations);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Adicionar dispositivo
  const addDeviceToPatient = async (patientId: number, device: Omit<Device, 'id'>) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      // Buscar o UUID real do paciente pelo bed_number
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('bed_number', patient.bedNumber)
        .single();

      if (!patientData) return;

      const { data, error } = await supabase
        .from('devices')
        .insert({
          patient_id: patientData.id,
          name: device.name,
          location: device.location,
          start_date: device.startDate,
        })
        .select()
        .single();

      if (error) throw error;

      await loadPatients();
    } catch (error) {
      console.error('Erro ao adicionar dispositivo:', error);
      throw error;
    }
  };

  // Adicionar data de retirada
  const addRemovalDateToDevice = async (patientId: number, deviceId: number, removalDate: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      // Buscar o device real pelo patient_id e índice
      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      const patientDevices = (devicesData || []).filter(d => {
        // Comparar pelo bed_number do paciente
        return true; // Precisamos melhorar essa lógica
      });

      const device = patientDevices[deviceId - 1];
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

      const { data: devicesData } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      const patientDevices = (devicesData || []).filter(d => {
        return true;
      });

      const device = patientDevices[deviceId - 1];
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

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('bed_number', patient.bedNumber)
        .single();

      if (!patientData) return;

      const { error } = await supabase
        .from('exams')
        .insert({
          patient_id: patientData.id,
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

      const { data: examsDataList } = await supabase
        .from('exams')
        .select('*')
        .order('date', { ascending: false });

      const patientExams = (examsDataList || []).filter(e => {
        return true;
      });

      const exam = patientExams[examData.id - 1];
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

      const { data: examsDataList } = await supabase
        .from('exams')
        .select('*')
        .order('date', { ascending: false });

      const patientExams = (examsDataList || []).filter(e => {
        return true;
      });

      const exam = patientExams[examId - 1];
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

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('bed_number', patient.bedNumber)
        .single();

      if (!patientData) return;

      const { error } = await supabase
        .from('medications')
        .insert({
          patient_id: patientData.id,
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

      const { data: medicationsDataList } = await supabase
        .from('medications')
        .select('*')
        .order('start_date', { ascending: false });

      const patientMedications = (medicationsDataList || []).filter(m => {
        return true;
      });

      const medication = patientMedications[medicationId - 1];
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