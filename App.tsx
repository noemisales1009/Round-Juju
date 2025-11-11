import React, { useState, useMemo, useContext, useEffect, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useParams, useLocation, Outlet, NavLink } from 'react-router-dom';
import { Patient, Category, Question, ChecklistAnswer, Answer, Device, Exam, Medication, Task, TaskStatus, PatientsContextType, TasksContextType, NotificationState, NotificationContextType, User, UserContextType, Theme, ThemeContextType } from './types';
import { PATIENTS as initialPatients, CATEGORIES, QUESTIONS, TASKS as initialTasks, DEVICE_TYPES, DEVICE_LOCATIONS, EXAM_STATUSES, RESPONSIBLES, ALERT_DEADLINES, INITIAL_USER } from './constants';
import { BackArrowIcon, PlusIcon, WarningIcon, ClockIcon, AlertIcon, CheckCircleIcon, BedIcon, UserIcon, PencilIcon, BellIcon, InfoIcon, EyeOffIcon, ClipboardIcon, FileTextIcon, LogOutIcon, ChevronRightIcon, MenuIcon, DashboardIcon, CpuIcon, PillIcon, BarChartIcon, AppleIcon, DropletIcon, HeartPulseIcon, BeakerIcon, LiverIcon, LungsIcon, DumbbellIcon, BrainIcon, ShieldIcon, UsersIcon, HomeIcon, CloseIcon, SettingsIcon, CameraIcon } from './components/icons';
import { useSupabasePatients } from './src/hooks/useSupabasePatients';
import { useSupabaseTasks } from './src/hooks/useSupabaseTasks';
import { QuestionsProvider, useQuestions } from './src/contexts/QuestionsContext';

// --- CONTEXT for Global State ---
const TasksContext = createContext<TasksContextType | null>(null);
const PatientsContext = createContext<PatientsContextType | null>(null);
const NotificationContext = createContext<NotificationContextType | null>(null);
const UserContext = createContext<UserContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);


// --- LOCAL STORAGE HELPERS for checklist completion ---

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const getCompletedChecklists = (): Record<string, Record<string, number[]>> => {
  try {
    const data = localStorage.getItem('completedChecklists');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse completed checklists from localStorage", error);
    return {};
  }
};

const saveCompletedChecklists = (data: Record<string, Record<string, number[]>>) => {
  try {
    localStorage.setItem('completedChecklists', JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save completed checklists to localStorage", error);
  }
};

const getCompletedCategoriesForPatient = (patientId: string): number[] => {
  const today = getTodayDateString();
  const allCompleted = getCompletedChecklists();
  return allCompleted[patientId]?.[today] || [];
};

const markCategoryAsCompletedForPatient = (patientId: string, categoryId: number) => {
  const today = getTodayDateString();
  const allCompleted = getCompletedChecklists();
  
  if (!allCompleted[patientId]) {
    allCompleted[patientId] = {};
  }
  if (!allCompleted[patientId][today]) {
    allCompleted[patientId][today] = [];
  }

  if (!allCompleted[patientId][today].includes(categoryId)) {
    allCompleted[patientId][today].push(categoryId);
  }

  saveCompletedChecklists(allCompleted);
};


// --- LAYOUT & NAVIGATION ---

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext)!;
    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
        { path: '/patients', label: 'Leitos', icon: BedIcon },
        { path: '/settings', label: 'Ajustes', icon: SettingsIcon },
    ];

    const activeLinkClass = "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200";
    const inactiveLinkClass = "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200";

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                <ClipboardIcon className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">Round Juju</span>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2.5 rounded-lg font-semibold transition ${
                                isActive ? activeLinkClass : inactiveLinkClass
                            }`
                        }
                    >
                        <item.icon className="w-6 h-6" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3 mb-4">
                     <img src={user.avatarUrl} alt="User avatar" className="w-12 h-12 rounded-full object-cover"/>
                     <div>
                         <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{user.title}</p>
                     </div>
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300 transition"
                >
                    <LogOutIcon className="w-5 h-5"/>
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

interface HeaderContextType {
    setTitle: (title: string) => void;
}
const HeaderContext = React.createContext<HeaderContextType | null>(null);

const useHeader = (title: string) => {
    const context = useContext(HeaderContext);
    useEffect(() => {
        if (context) {
            context.setTitle(title);
        }
        return () => {
            if (context) {
                context.setTitle('');
            }
        };
    }, [context, title]);
};

const Header: React.FC<{ title: string; onMenuClick: () => void }> = ({ title, onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const getBackPath = (): string | number => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (pathParts.length > 1) {
            if(pathParts[0] === 'status') {
                return '/dashboard';
            }
            if(pathParts[2] === 'history') {
                return `/patient/${pathParts[1]}`;
            }
            if(pathParts.includes('create-alert')) {
                 if(pathParts.includes('category')) {
                    return `/patient/${pathParts[1]}/round/category/${pathParts[3]}`;
                 }
                 return `/patient/${pathParts[1]}`;
            }
            if (pathParts.includes('category')) {
                return `/patient/${pathParts[1]}/round/categories`;
            }
            if (pathParts.includes('categories')) {
                return `/patient/${pathParts[1]}`;
            }
            if (pathParts[0] === 'patient') {
                return '/patients';
            }
        }
         if (location.pathname === '/patients' || location.pathname === '/settings' || location.pathname === '/dashboard') {
             return '/dashboard';
         }
        return -1;
    };
    
    const backPath = getBackPath();
    const showBackButton = backPath !== -1 && location.pathname !== '/dashboard';

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10 flex items-center shrink-0">
             <button
                onClick={showBackButton ? () => (typeof backPath === 'string' ? navigate(backPath) : navigate(-1)) : onMenuClick}
                className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition mr-2 lg:hidden"
            >
                {showBackButton ? <BackArrowIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
            <div className="hidden lg:block mr-4">
                 {showBackButton && (
                    <button onClick={() => typeof backPath === 'string' ? navigate(backPath) : navigate(-1)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                        <BackArrowIcon className="w-6 h-6" />
                    </button>
                 )}
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 truncate">{title}</h1>
        </header>
    );
};


const AppLayout: React.FC = () => {
    const [title, setTitle] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const contextValue = useMemo(() => ({ setTitle }), []);
    const { notification, hideNotification } = useContext(NotificationContext)!;
    
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <HeaderContext.Provider value={contextValue}>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
                {/* Mobile Sidebar */}
                <div className={`fixed inset-0 z-30 transition-opacity bg-black bg-opacity-50 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
                <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar />
                </div>
                
                {/* Desktop Sidebar */}
                <div className="hidden lg:flex lg:shrink-0">
                    <Sidebar />
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                    <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        <div className="max-w-4xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
            {notification && (
                 <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
            )}
        </HeaderContext.Provider>
    );
};

// --- Notification Component ---
const Notification: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    }[type];

    const icon = {
        success: <CheckCircleIcon className="w-6 h-6 text-white" />,
        error: <WarningIcon className="w-6 h-6 text-white" />,
        info: <InfoIcon className="w-6 h-6 text-white" />,
    }[type];

    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} animate-notification-in`}>
            {icon}
            <span className="ml-3 font-semibold">{message}</span>
        </div>
    );
};


// --- SCREENS ---

const LoginScreen: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/dashboard');
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full m-4">
                <div className="text-center mb-8">
                    <ClipboardIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Bem-vindo de volta!</h1>
                    <p className="text-slate-500 dark:text-slate-400">Faça login para continuar.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition text-lg flex items-center justify-center gap-2"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC = () => {
    useHeader('Dashboard');
    const navigate = useNavigate();
    const { tasks, loading } = useContext(TasksContext)!;

    const summaryData = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<TaskStatus, number>);
        return [
            { title: 'Alertas', count: counts.alerta || 0, icon: WarningIcon, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', status: 'alerta' },
            { title: 'No Prazo', count: counts.no_prazo || 0, icon: ClockIcon, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50', status: 'no_prazo' },
            { title: 'Fora do Prazo', count: counts.fora_do_prazo || 0, icon: AlertIcon, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50', status: 'fora_do_prazo' },
            { title: 'Concluídos', count: counts.concluido || 0, icon: CheckCircleIcon, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50', status: 'concluido' },
        ];
    }, [tasks]);

    const alertChartData = useMemo(() => {
        const counts = tasks.filter(t => t.status === 'alerta').reduce((acc, task) => {
            acc[task.categoryId] = (acc[task.categoryId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sorted = (Object.entries(counts) as [string, number][]).sort(([, countA], [, countB]) => countB - countA);
        const maxCount = Math.max(...sorted.map(([, count]) => count), 0);
        
        return sorted.map(([categoryId, count]) => {
            const category = CATEGORIES.find(c => c.id === Number(categoryId));
            return {
                name: category?.name || 'Desconhecido',
                count,
                percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
            };
        });
    }, [tasks]);

    if (loading) {
        return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Resumo do Dia</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summaryData.map(item => (
                        <div key={item.title} onClick={() => navigate(`/status/${item.status}`)} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center justify-center space-y-2">
                            <div className={`p-3 rounded-full ${item.bgColor}`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.title}</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{item.count}</p>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Alertas por Categoria</h2>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                    {alertChartData.length > 0 ? (
                        <div className="space-y-4">
                            {alertChartData.map(item => (
                                <div key={item.name}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhum alerta hoje.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const PatientListScreen: React.FC = () => {
    useHeader('Leitos');
    const { patients, loading } = useContext(PatientsContext)!;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = useMemo(() => {
        return patients.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.bedNumber.toString().includes(searchTerm)
        );
    }, [patients, searchTerm]);
    
    const calculateProgress = (patientId: number) => {
        const completed = getCompletedCategoriesForPatient(patientId.toString());
        return (completed.length / CATEGORIES.length) * 100;
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Carregando pacientes...</div>;
    }

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Buscar por nome ou leito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
            />
            <div className="space-y-3">
                {filteredPatients.map(patient => {
                     const progress = calculateProgress(patient.id);
                     return(
                        <Link to={`/patient/${patient.id}`} key={patient.id} className="block bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-full font-bold text-lg">
                                    {patient.bedNumber}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 break-words">{patient.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nasc: {new Date(patient.dob).toLocaleDateString('pt-BR')}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                        </Link>
                     );
                })}
            </div>
        </div>
    );
};

const formatHistoryDate = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    const [year, month, day] = dateString.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    
    const displayDate = new Date(dateString + 'T00:00:00');

    if (eventDate.getTime() === today.getTime()) {
        return `Hoje, ${displayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
    }
    if (eventDate.getTime() === yesterday.getTime()) {
        return `Ontem, ${displayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
    }
    return displayDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const PatientHistoryScreen: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const { patients } = useContext(PatientsContext)!;
    const { tasks } = useContext(TasksContext)!;
    const patient = patients.find(p => p.id.toString() === patientId);

    useHeader(patient ? `Histórico: ${patient.name}` : 'Histórico do Paciente');

    type TimelineEvent = {
        timestamp: string;
        icon: React.FC<{className?: string;}>;
        description: string;
        hasTime: boolean;
    };

    const patientHistory = useMemo(() => {
        if (!patient) return {};

        const events: TimelineEvent[] = [];

        patient.devices.forEach(device => {
            events.push({
                timestamp: new Date(device.startDate).toISOString(),
                icon: CpuIcon,
                description: `Dispositivo Inserido: ${device.name} em ${device.location}.`,
                hasTime: false,
            });
            if (device.removalDate) {
                events.push({
                    timestamp: new Date(device.removalDate).toISOString(),
                    icon: CpuIcon,
                    description: `Dispositivo Retirado: ${device.name}.`,
                    hasTime: false,
                });
            }
        });

        patient.medications.forEach(med => {
            events.push({
                timestamp: new Date(med.startDate).toISOString(),
                icon: PillIcon,
                description: `Início Medicação: ${med.name} (${med.dosage}).`,
                hasTime: false,
            });
            if (med.endDate) {
                events.push({
                    timestamp: new Date(med.endDate).toISOString(),
                    icon: PillIcon,
                    description: `Fim Medicação: ${med.name}.`,
                    hasTime: false,
                });
            }
        });

        patient.exams.forEach(exam => {
            events.push({
                timestamp: new Date(exam.date).toISOString(),
                icon: FileTextIcon,
                description: `Exame Realizado: ${exam.name} - Resultado: ${exam.result}.`,
                hasTime: false,
            });
        });

        const patientAlerts = tasks.filter(task => task.patientId === patient.id && task.status === 'alerta');
        patientAlerts.forEach(alert => {
            events.push({
                timestamp: alert.deadline,
                icon: BellIcon,
                description: `Alerta Criado: ${alert.description}.`,
                hasTime: true,
            });
        });
        
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const groupedEvents = events.reduce((acc, event) => {
            const dateKey = event.timestamp.split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {} as Record<string, TimelineEvent[]>);
        
        return groupedEvents;
    }, [patient, tasks]);

    const handleGeneratePdf = () => {
        if (!patient) return;

        const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');

        const generateDeviceList = () => patient.devices.map(d => `
            <li>
                <strong>${d.name} (${d.location})</strong><br>
                Início: ${formatDate(d.startDate)}
                ${d.removalDate ? `<br>Retirada: ${formatDate(d.removalDate)}` : ''}
            </li>
        `).join('');

        const generateMedicationList = () => patient.medications.map(m => `
            <li>
                <strong>${m.name} (${m.dosage})</strong><br>
                Início: ${formatDate(m.startDate)}
                ${m.endDate ? `<br>Fim: ${formatDate(m.endDate)}` : ''}
            </li>
        `).join('');
        
        const generateExamList = () => patient.exams.map(e => `
            <li>
                <strong>${e.name}</strong> - Resultado: ${e.result}<br>
                Data: ${formatDate(e.date)}
                ${e.observation ? `<br><em>Obs: ${e.observation}</em>` : ''}
            </li>
        `).join('');

        const generateHistoryList = () => Object.entries(patientHistory).map(([date, eventsOnDate]) => `
            <div class="history-group">
                <h3>${formatHistoryDate(date)}</h3>
                <ul>
                    ${(eventsOnDate as TimelineEvent[]).map(event => `
                        <li>
                            ${event.hasTime ? `[${new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}] ` : ''}
                            ${event.description}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        const htmlContent = `
            <html>
            <head>
                <title>Relatório do Paciente - ${patient.name}</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; color: #333; }
                    h1, h2, h3 { color: #00796b; border-bottom: 2px solid #e0f2f1; padding-bottom: 5px; }
                    h1 { font-size: 24px; }
                    h2 { font-size: 20px; margin-top: 30px; }
                    h3 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #e0f2f1; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #e0f2f1; }
                    ul { list-style-type: none; padding-left: 0; }
                    li { background-color: #f7f7f7; border: 1px solid #eee; padding: 10px; margin-bottom: 8px; border-radius: 4px; }
                    .history-group ul { padding-left: 20px; }
                    .history-group li { background-color: transparent; border: none; padding: 5px 0; margin-bottom: 0; border-bottom: 1px dotted #ccc; }
                </style>
            </head>
            <body>
                <h1>Relatório do Paciente</h1>
                
                <h2>Dados do Paciente</h2>
                <table>
                    <tr><th>Nome</th><td>${patient.name}</td></tr>
                    <tr><th>Leito</th><td>${patient.bedNumber}</td></tr>
                    <tr><th>Nascimento</th><td>${formatDate(patient.dob)}</td></tr>
                    <tr><th>Nome da Mãe</th><td>${patient.motherName}</td></tr>
                    <tr><th>CTD</th><td>${patient.ctd}</td></tr>
                </table>

                <h2>Dispositivos</h2>
                <ul>${generateDeviceList()}</ul>
                
                <h2>Medicações</h2>
                <ul>${generateMedicationList()}</ul>

                <h2>Exames</h2>
                <ul>${generateExamList()}</ul>

                <h2>Histórico de Eventos</h2>
                ${generateHistoryList()}

            </body>
            </html>
        `;

        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write(htmlContent);
            pdfWindow.document.close();
            pdfWindow.focus();
            setTimeout(() => {
                pdfWindow.print();
            }, 500);
        } else {
            alert('Por favor, habilite pop-ups para gerar o PDF.');
        }
    };


    if (!patient) {
        return <p>Paciente não encontrado.</p>;
    }

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                 <button
                    onClick={handleGeneratePdf}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
                 >
                    <FileTextIcon className="w-5 h-5" />
                    Gerar PDF
                </button>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                {Object.keys(patientHistory).length > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(patientHistory).map(([date, eventsOnDate]) => (
                            <div key={date}>
                                <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">{formatHistoryDate(date)}</h3>
                                <div className="space-y-3">
                                    {(eventsOnDate as TimelineEvent[]).map((event, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 rounded-full mt-1">
                                                <event.icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 dark:text-slate-200 text-sm">{event.description}</p>
                                                {event.hasTime && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhum histórico de eventos para este paciente.</p>
                )}
            </div>
        </div>
    );
};

const PatientDetailScreen: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const { patients, addRemovalDateToDevice, deleteDeviceFromPatient, addEndDateToMedication, deleteExamFromPatient } = useContext(PatientsContext)!;
    const patient = patients.find(p => p.id.toString() === patientId);
    
    useHeader(patient ? `Leito ${patient.bedNumber}` : 'Paciente não encontrado');

    const [activeTab, setActiveTab] = useState<'devices' | 'exams' | 'medications'>('devices');
    const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
    const [isAddExamModalOpen, setAddExamModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [isAddMedicationModalOpen, setAddMedicationModalOpen] = useState(false);
    const [isRemovalModalOpen, setRemovalModalOpen] = useState<number | null>(null);
    const [isEndDateModalOpen, setEndDateModalOpen] = useState<number | null>(null);

    const { showNotification } = useContext(NotificationContext)!;

    if (!patient) {
        return <p>Paciente não encontrado.</p>;
    }
    
    const handleDeleteDevice = (patientId: number, deviceId: number) => {
        deleteDeviceFromPatient(patientId, deviceId);
        showNotification({ message: 'Dispositivo arquivado, mantido no histórico.', type: 'info' });
    };

    const handleDeleteExam = (patientId: number, examId: number) => {
        deleteExamFromPatient(patientId, examId);
        showNotification({ message: 'Exame arquivado com sucesso.', type: 'info' });
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const calculateDays = (startDate: string) => {
        const start = new Date(startDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const tabs = [
        { id: 'devices', label: 'Dispositivos', icon: CpuIcon },
        { id: 'exams', label: 'Exames', icon: FileTextIcon },
        { id: 'medications', label: 'Medicações', icon: PillIcon },
    ];
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{patient.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 mt-2">
                    <span>{calculateAge(patient.dob)} anos</span>
                    <span>Mãe: {patient.motherName}</span>
                    <span>CTD: {patient.ctd}</span>
                </div>
            </div>

            <Link to={`/patient/${patient.id}/history`} className="w-full block text-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-lg transition text-md">
                <div className="flex items-center justify-center gap-2">
                    <BarChartIcon className="w-5 h-5" />
                    Ver Histórico Completo
                </div>
            </Link>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                <div className="border-b border-slate-200 dark:border-slate-800">
                    <nav className="-mb-px flex justify-around">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-4 px-1 text-center font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                <tab.icon className="w-5 h-5"/>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-4 space-y-3">
                    {activeTab === 'devices' && (
                        <>
                            {patient.devices.filter(device => !device.isArchived).map(device => (
                                <div key={device.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                     <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <CpuIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{device.name} - {device.location}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Início: {new Date(device.startDate).toLocaleDateString('pt-BR')}</p>
                                                {device.removalDate ? (
                                                     <p className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-md inline-block mt-1">Retirada: {new Date(device.removalDate).toLocaleDateString('pt-BR')}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Dias: {calculateDays(device.startDate)}</p>
                                                )}
                                            </div>
                                        </div>
                                         <div className="flex flex-col items-end gap-2">
                                            {!device.removalDate ? (
                                                <button onClick={() => setRemovalModalOpen(device.id)} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Registrar Retirada</button>
                                            ) : (
                                                <button onClick={() => handleDeleteDevice(patient.id, device.id)} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline">Apagar</button>
                                            )}
                                         </div>
                                     </div>
                                </div>
                            ))}
                             <button onClick={() => setAddDeviceModalOpen(true)} className="w-full mt-2 text-center bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold py-2.5 rounded-lg transition">Cadastrar Dispositivo</button>
                        </>
                    )}
                     {activeTab === 'exams' && (
                        <>
                            {patient.exams.filter(exam => !exam.isArchived).map(exam => (
                                <div key={exam.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                     <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <FileTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{exam.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Data: {new Date(exam.date).toLocaleDateString('pt-BR')} - {exam.result}</p>
                                                {exam.observation && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">Obs: {exam.observation}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                            <button onClick={() => setEditingExam(exam)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full transition" aria-label="Editar exame">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteExam(patient.id, exam.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition" aria-label="Arquivar exame">
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                     </div>
                                </div>
                            ))}
                            <button onClick={() => setAddExamModalOpen(true)} className="w-full mt-2 text-center bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold py-2.5 rounded-lg transition">Cadastrar Exame</button>
                        </>
                    )}
                     {activeTab === 'medications' && (
                        <>
                            {patient.medications.map(medication => (
                                <div key={medication.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <PillIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 break-words">{medication.name} - {medication.dosage}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Início: {new Date(medication.startDate).toLocaleDateString('pt-BR')}</p>
                                                {medication.endDate && <p className="text-sm text-slate-500 dark:text-slate-400">Fim: {new Date(medication.endDate).toLocaleDateString('pt-BR')}</p>}
                                            </div>
                                        </div>
                                        {!medication.endDate && <button onClick={() => setEndDateModalOpen(medication.id)} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex-shrink-0 ml-2">Registrar Fim</button>}
                                    </div>
                                </div>
                            ))}
                           <button onClick={() => setAddMedicationModalOpen(true)} className="w-full mt-2 text-center bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold py-2.5 rounded-lg transition">Cadastrar Medicação</button>
                        </>
                    )}
                </div>
            </div>

            <Link to={`/patient/${patient.id}/round/categories`} className="w-full block text-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-lg transition text-lg">
                <div className="flex items-center justify-center gap-2">
                    <ClipboardIcon className="w-6 h-6" />
                    Iniciar/Ver Round
                </div>
            </Link>
            
            {isAddDeviceModalOpen && <AddDeviceModal patientId={patient.id} onClose={() => setAddDeviceModalOpen(false)} />}
            {isAddExamModalOpen && <AddExamModal patientId={patient.id} onClose={() => setAddExamModalOpen(false)} />}
            {editingExam && <EditExamModal exam={editingExam} patientId={patient.id} onClose={() => setEditingExam(null)} />}
            {isAddMedicationModalOpen && <AddMedicationModal patientId={patient.id} onClose={() => setAddMedicationModalOpen(false)} />}
            {isRemovalModalOpen && <AddRemovalDateModal deviceId={isRemovalModalOpen} patientId={patient.id} onClose={() => setRemovalModalOpen(null)} />}
            {isEndDateModalOpen && <AddEndDateModal medicationId={isEndDateModalOpen} patientId={patient.id} onClose={() => setEndDateModalOpen(null)} />}
        </div>
    );
};

// Modals
const AddDeviceModal: React.FC<{ patientId: number; onClose: () => void;}> = ({ patientId, onClose }) => {
    const { addDeviceToPatient } = useContext(PatientsContext)!;
    const { showNotification } = useContext(NotificationContext)!;
    const [type, setType] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!type || !location || !startDate) {
            showNotification({ message: 'Preencha todos os campos.', type: 'error' });
            return;
        }
        try {
            console.log('🟢 Modal - Chamando addDeviceToPatient com:',

Perfeitamente correto! Você precisa criar essas tabelas no Supabase para funcionar com perguntas dinâmicas. Vou te ajudar a:

1. **Criar as tabelas no Supabase** (SQL pronto)
2. **Criar um hook para buscar perguntas do Supabase**
3. **Atualizar o código para usar perguntas dinâmicas**

---

### 1. SQL para criar as tabelas no Supabase

Copie e cole isso no **SQL Editor** do seu Supabase:

```sql
-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  icone TEXT NULL
);

-- Tabela de perguntas
CREATE TABLE IF NOT EXISTS public.perguntas (
  id SERIAL PRIMARY KEY,
  texto TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  ordem INTEGER NOT NULL
);

-- Inserir dados de exemplo (opcional)
INSERT INTO public.categorias (id, nome, icone) VALUES
(1, 'Sistema Nutricional', 'apple'),
(2, 'Hídrico', 'droplet'),
(3, 'Hemodinâmico', 'heart-pulse'),
(4, 'Hematológico', 'beaker'),
(5, 'Hepático', 'liver'),
(6, 'Respiratório', 'lungs'),
(7, 'Fisioterapia', 'dumbbell'),
(8, 'Neurológico', 'brain'),
(9, 'Farmácia', 'pill'),
(10, 'Gerenciamento de Risco', 'shield'),
(11, 'Família', 'users'),
(12, 'Avaliação de Alta', 'home');

INSERT INTO public.perguntas (texto, categoria_id, ordem) VALUES
-- Sistema Nutricional
('NUTRIÇÃO ADEQUADA? (INICIAR ORAL/ENTERAL/NPT)', 1, 1),
('TOLERÂNCIA À ALIMENTAÇÃO (VÔMITOS)?', 1, 2),
('RELATA DIARRÉIA OU CONSTIPAÇÃO?', 1, 3),
('GLICEMIA CONTROLADA? (DX 60-150)', 1, 4),
('NECESSIDADE DE PROFILAXIA PARA ÚLCERA DE ESTRESSE?', 1, 5),
('NECESSIDADE DE CONTROLE DE RESÍDUO GÁSTRICO?', 1, 6),
('FIXAÇÃO DE SNGE/SNE OK?', 1, 7),
('NECESSIDADE DE RX DE ABDOMEN PARA CHECAR SONDA?', 1, 8),
-- Hídrico
('HÁ SINAIS DE SOBRECARGA HÍDRICA CLÍNICA?', 2, 1),
('BH POSITIVO >3% NAS ÚLTIMAS 24 HORAS?', 2, 2),
-- Hemodinâmico
('APARELHO DE PANI ADEQUADO?', 3, 1),
-- Hematológico
('HEMOGRAMA OK?', 4, 1),
('HEMOGLOBINA OK?', 4, 2),
('PLAQUETAS OK?', 4, 3),
('TEMPO DE COAGULAÇÃO OK?', 4, 4),
('NECESSIDADE DE TRANSFUSÃO?', 4, 5),
-- Hepático
('BILIRRUBINAS OK?', 5, 1),
('TGO/TGP OK?', 5, 2),
('FOSFATASE ALCALINA OK?', 5, 3),
('TEMPO DE PROTROMBINA OK?', 5, 4),
-- Respiratório
('SATURAÇÃO OK?', 6, 1),
('ESFORÇO RESPIRATÓRIO OK?', 6, 2),
('VENTILAÇÃO OK?', 6, 3),
('NECESSIDADE DE SUÇÃO?', 6, 4),
('OXIGÊNIO OK?', 6, 5),
-- Fisioterapia
('FISIOTERAPIA REALIZADA?', 7, 1),
('NECESSIDADE DE FISIOTERAPIA?', 7, 2),
-- Neurológico
('ESCALA DE COMA OK?', 8, 1),
('PUPILAS OK?', 8, 2),
('MENINGISMO OK?', 8, 3),
('NECESSIDADE DE PROTEÇÃO NEUROLÓGICA?', 8, 4),
-- Farmácia
('MEDICAMENTOS OK?', 9, 1),
('INTERAÇÕES MEDICAMENTOSAS OK?', 9, 2),
('NECESSIDADE DE AJUSTE DE DOSAGEM?', 9, 3),
-- Gerenciamento de Risco
('QUEDA OK?', 10, 1),
('ÚLCERA POR PRESSÃO OK?', 10, 2),
('INFECÇÃO OK?', 10, 3),
-- Família
('FAMÍLIA PARTICIPATIVA?', 11, 1),
('ORIENTAÇÃO REALIZADA?', 11, 2),
-- Avaliação de Alta
('PRONÓSTICO OK?', 12, 1),
('ALTA PREVISTA?', 12, 2),
('NECESSIDADE DE ALTA DOMICILIAR?', 12, 3),
('NECESSIDADE DE ALTA PARA HOSPITAL DE REFERÊNCIA?', 12, 4);
```

---

### 2. Criar hook para buscar perguntas do Supabase

<dyad-write path="src/hooks/useSupabaseQuestions.ts" description="Criando hook para buscar perguntas do Supabase">
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