import React, { useState, useMemo, useContext, useEffect, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useParams, useLocation, Outlet, NavLink, Navigate } from 'react-router-dom';
import { Patient, Category, Question, ChecklistAnswer, Answer, Device, Exam, Medication, Task, TaskStatus, PatientsContextType, TasksContextType, NotificationState, NotificationContextType, User, UserContextType, Theme, ThemeContextType } from './types';
import { PATIENTS as initialPatients, CATEGORIES, QUESTIONS, TASKS as initialTasks, DEVICE_TYPES, DEVICE_LOCATIONS, EXAM_STATUSES, RESPONSIBLES, ALERT_DEADLINES, INITIAL_USER } from './constants';
import { BackArrowIcon, PlusIcon, WarningIcon, ClockIcon, AlertIcon, CheckCircleIcon, BedIcon, UserIcon, PencilIcon, BellIcon, InfoIcon, EyeOffIcon, ClipboardIcon, FileTextIcon, LogOutIcon, ChevronRightIcon, MenuIcon, DashboardIcon, CpuIcon, PillIcon, BarChartIcon, AppleIcon, DropletIcon, HeartPulseIcon, BeakerIcon, LiverIcon, LungsIcon, DumbbellIcon, BrainIcon, ShieldIcon, UsersIcon, HomeIcon, CloseIcon, SettingsIcon, CameraIcon } from './components/icons';
import { useSupabasePatients } from './src/hooks/useSupabasePatients';
import { useSupabaseTasks } from './src/hooks/useSupabaseTasks';
import { QuestionsProvider, useQuestions } from './src/contexts/QuestionsContext';
import { ChecklistProvider, useChecklistContext } from './src/contexts/ChecklistContext';
import { supabase } from './src/integrations/supabase/client';
import { useUser, UserProvider } from './src/contexts/UserContext';
import type { Session } from '@supabase/supabase-js';

// --- CONTEXT for Global State ---
const TasksContext = createContext<TasksContextType | null>(null);
const PatientsContext = createContext<PatientsContextType | null>(null);
const NotificationContext = createContext<NotificationContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);

// ... (restante do código permanece o mesmo)

// No final do arquivo, antes de export default Root:
const App: React.FC = () => {
    const { session, loading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (session) {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        }
    }, [session, loading, navigate]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    return (
        <Routes>
            <Route path="/" element={
                <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full m-4">
                        <div className="text-center mb-8">
                            <ClipboardIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Bem-vindo!</h1>
                            <p className="text-slate-500 dark:text-slate-400">Faça login para continuar.</p>
                        </div>
                        <LoginForm />
                    </div>
                </div>
            } />
            <Route path="/" element={session ? <AppLayout /> : <Navigate to="/" />}>
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="patients" element={<PatientListScreen />} />
                <Route path="patient/:patientId" element={<PatientDetailScreen />} />
                <Route path="patient/:patientId/history" element={<PatientHistoryScreen />} />
                <Route path="patient/:patientId/round/categories" element={<RoundCategoryListScreen />} />
                <Route path="patient/:patientId/round/category/:categoryId" element={<ChecklistScreen />} />
                <Route path="patient/:patientId/round/category/:categoryId/create-alert" element={<CreateAlertScreen />} />
                <Route path="patient/:patientId/create-alert" element={<CreateAlertScreen />} />
                <Route path="status/:status" element={<TaskStatusScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
            </Route>
        </Routes>
    );
}

// Componente de formulário de login simples (substituindo o LoginForm ausente)
const LoginForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          alert('Conta criada com sucesso! Faça login.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200"
        />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition">
        {isSignUp ? 'Cadastrar' : 'Entrar'}
      </button>
      <div className="text-center mt-4">
        <button 
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem uma conta? Cadastre-se'}
        </button>
      </div>
    </form>
  );
};

const Root: React.FC = () => (
    <HashRouter>
        <NotificationProvider>
            <ThemeProvider>
                <UserProvider>
                    <PatientsProvider>
                        <TasksProvider>
                            <QuestionsProvider>
                                <ChecklistProvider>
                                    <App />
                                </ChecklistProvider>
                            </QuestionsProvider>
                        </TasksProvider>
                    </PatientsProvider>
                </UserProvider>
            </ThemeProvider>
        </NotificationProvider>
    </HashRouter>
);

export default Root;