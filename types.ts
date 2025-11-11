import React from 'react';

export interface Device {
  id: string;
  patient_id: string;
  name: string;
  location: string;
  startDate: string; // "YYYY-MM-DD"
  removalDate?: string; // "YYYY-MM-DD"
  isArchived?: boolean;
}

export interface Exam {
  id: string;
  patient_id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  result: 'Pendente' | 'Normal' | 'Alterado' | string;
  observation?: string;
  isArchived?: boolean;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  isArchived?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  bedNumber: number;
  motherName: string;
  dob: string; // "YYYY-MM-DD"
  ctd: string;
  devices: Device[];
  exams: Exam[];
  medications: Medication[];
}

export interface Category {
  id: number;
  name:string;
  icon?: React.FC<{className?: string;}>;
}

export interface Question {
  id: number;
  text: string;
  categoryId: number;
}

export type Answer = 'sim' | 'não' | 'nao_se_aplica';

export interface ChecklistAnswer {
  [questionId: number]: Answer;
}

export interface Alert {
  id: number;
  text: string;
  categoryId: number;
  patientId: number;
}

export type TaskStatus = 'alerta' | 'no_prazo' | 'fora_do_prazo' | 'concluido' | string;

export interface Task {
  id: string;
  patientId: string;
  categoryId: number;
  description: string;
  responsible: string;
  deadline: string; // ISO String for date and time
  status: TaskStatus;
  justification?: string;
}

// --- USER & THEME ---
export interface User {
    name: string;
    title: string;
    avatarUrl: string;
}

export type Theme = 'light' | 'dark';


// --- CONTEXT TYPE DEFINITIONS ---

export interface TasksContextType {
  tasks: Task[];
  updateTaskJustification: (taskId: string, justification: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (taskData: Omit<Task, 'id' | 'status' | 'justification'>) => void;
  loading: boolean;
}

export interface PatientsContextType {
    patients: Patient[];
    addDeviceToPatient: (patientId: string, device: Omit<Device, 'id' | 'patient_id'>) => void;
    addExamToPatient: (patientId: string, exam: Omit<Exam, 'id' | 'patient_id'>) => void;
    addMedicationToPatient: (patientId: string, medication: Omit<Medication, 'id' | 'patient_id'>) => void;
    addRemovalDateToDevice: (patientId: string, deviceId: string, removalDate: string) => void;
    deleteDeviceFromPatient: (patientId: string, deviceId: string) => void;
    addEndDateToMedication: (patientId: string, medicationId: string, endDate: string) => void;
    deleteMedicationFromPatient: (patientId: string, medicationId: string) => void;
    updateExamInPatient: (patientId: string, examData: Pick<Exam, 'id' | 'result' | 'observation'>) => void;
    deleteExamFromPatient: (patientId: string, examId: string) => void;
    loading: boolean;
}

// --- NOTIFICATION TYPES ---
export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface NotificationContextType {
  notification: NotificationState | null;
  showNotification: (notification: NotificationState) => void;
  hideNotification: () => void;
}

export interface UserContextType {
    user: User;
    updateUser: (userData: Partial<User>) => void;
}

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}