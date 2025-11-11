import React, { useState, useMemo, useContext, useEffect, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useParams, useLocation, Outlet, NavLink, Navigate } from 'react-router-dom';
import { Patient, Category, Question, ChecklistAnswer, Answer, Device, Exam, Medication, Task, TaskStatus, PatientsContextType, TasksContextType, NotificationState, NotificationContextType, User, UserContextType, Theme, ThemeContextType, DbChecklistAnswer, ChecklistContextType } from './types';
import { CATEGORIES, QUESTIONS, DEVICE_TYPES, DEVICE_LOCATIONS, EXAM_STATUSES, RESPONSIBLES, ALERT_DEADLINES, INITIAL_USER } from './constants';
import { BackArrowIcon, PlusIcon, WarningIcon, ClockIcon, AlertIcon, CheckCircleIcon, BedIcon, UserIcon, PencilIcon, BellIcon, InfoIcon, EyeOffIcon, ClipboardIcon, FileTextIcon, LogOutIcon, ChevronRightIcon, MenuIcon, DashboardIcon, CpuIcon, PillIcon, BarChartIcon, AppleIcon, DropletIcon, HeartPulseIcon, BeakerIcon, LiverIcon, LungsIcon, DumbbellIcon, BrainIcon, ShieldIcon, UsersIcon, HomeIcon, CloseIcon, SettingsIcon, CameraIcon } from './components/icons';
import { supabase } from './src/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

// --- CONTEXT for Global State ---
const TasksContext = createContext<TasksContextType | null>(null);
const PatientsContext = createContext<PatientsContextType | null>(null);
const NotificationContext = createContext<NotificationContextType | null>(null);
const UserContext = createContext<UserContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);
const ChecklistContext = createContext<ChecklistContextType | null>(null);


// --- LAYOUT & NAVIGATION ---

const Sidebar: React.FC = () => {
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
                    onClick={async () => {
                        const { error } = await supabase.auth.signOut();
                        if (error) console.error('Erro ao sair:', error.message);
                    }} 
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
                    return `/patient/${pathParts[1]}/round/category/${pathParts[3]}`; // Go back to checklist
                 }
                 return `/patient/${pathParts[1]}`; // Go back to patient detail
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

const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name
                        }
                    }
                });
                if (error) throw error;
                alert('Cadastro realizado! Verifique seu email para confirmar sua conta.');
                setIsLogin(true);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full m-4">
                <div className="text-center mb-8">
                    <ClipboardIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{isLogin ? 'Faça login para continuar.' : 'Preencha os campos para se cadastrar.'}</p>
                </div>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                                required
                            />
                        </div>
                    )}
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
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>
                <div className="text-center mt-6">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC = () => {
    useHeader('Dashboard');
    const navigate = useNavigate();

    const [summary, setSummary] = useState<any>(null);
    const [alertChartData, setAlertChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // Fetch summary counts
            const { data: summaryData, error: summaryError } = await supabase
                .from('dashboard_summary')
                .select('*')
                .single();

            if (summaryError) {
                console.error('Error fetching dashboard summary:', summaryError);
            }

            // Fetch active alerts for the chart
            const { data: activeAlerts, error: alertsError } = await supabase
                .from('tasks_status_view')
                .select('category_id')
                .eq('original_status', 'alerta')
                .neq('live_status', 'concluido');

            if (alertsError) {
                console.error('Error fetching active alerts:', alertsError);
            }

            // Process summary data
            setSummary(summaryData || { total_alertas: 0, total_no_prazo: 0, total_fora_do_prazo: 0, total_concluidos: 0 });

            // Process chart data
            if (activeAlerts) {
                const counts = activeAlerts.reduce((acc, task) => {
                    acc[task.category_id] = (acc[task.category_id] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const sorted = (Object.entries(counts) as [string, number][]).sort(([, countA], [, countB]) => countB - countA);
                const maxCount = Math.max(...sorted.map(([, count]) => count), 0);
                
                const chartData = sorted.map(([categoryId, count]) => {
                    const category = CATEGORIES.find(c => c.id === Number(categoryId));
                    return {
                        name: category?.name || 'Desconhecido',
                        count,
                        percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
                    };
                });
                setAlertChartData(chartData);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const summaryCards = useMemo(() => {
        if (!summary) return [];
        return [
            { title: 'Alertas', count: summary.total_alertas || 0, icon: WarningIcon, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50', status: 'alerta' },
            { title: 'No Prazo', count: summary.total_no_prazo || 0, icon: ClockIcon, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50', status: 'no_prazo' },
            { title: 'Fora do Prazo', count: summary.total_fora_do_prazo || 0, icon: AlertIcon, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50', status: 'fora_do_prazo' },
            { title: 'Concluídos', count: summary.total_concluidos || 0, icon: CheckCircleIcon, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50', status: 'concluido' },
        ];
    }, [summary]);

    if (loading) {
        return <div className="text-center p-8">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Resumo do Dia</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summaryCards.map(item => (
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
    const { getCompletedCategories, loading: checklistLoading } = useContext(ChecklistContext)!;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = useMemo(() => {
        return patients.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.bedNumber.toString().includes(searchTerm)
        );
    }, [patients, searchTerm]);
    
    const calculateProgress = (patientId: string) => {
        const completed = getCompletedCategories(patientId);
        return (completed.length / CATEGORIES.length) * 100;
    };

    if (loading || checklistLoading) {
        return <div className="text-center p-8">Carregando pacientes...</div>;
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
    const patient = patients.find(p => p.id === patientId);

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
    const { patients, deleteDeviceFromPatient, deleteExamFromPatient, deleteMedicationFromPatient } = useContext(PatientsContext)!;
    const patient = patients.find(p => p.id === patientId);
    
    useHeader(patient ? `Leito ${patient.bedNumber}` : 'Paciente não encontrado');

    const [activeTab, setActiveTab] = useState<'devices' | 'exams' | 'medications'>('devices');
    const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
    const [isAddExamModalOpen, setAddExamModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [isAddMedicationModalOpen, setAddMedicationModalOpen] = useState(false);
    const [isRemovalModalOpen, setRemovalModalOpen] = useState<string | null>(null);
    const [isEndDateModalOpen, setEndDateModalOpen] = useState<string | null>(null);

    const { showNotification } = useContext(NotificationContext)!;

    if (!patient) {
        return <p>Paciente não encontrado.</p>;
    }
    
    const handleDeleteDevice = (patientId: string, deviceId: string) => {
        deleteDeviceFromPatient(patientId, deviceId);
        showNotification({ message: 'Dispositivo arquivado, mantido no histórico.', type: 'info' });
    };

    const handleDeleteExam = (patientId: string, examId: string) => {
        deleteExamFromPatient(patientId, examId);
        showNotification({ message: 'Exame arquivado com sucesso.', type: 'info' });
    };

    const handleDeleteMedication = (patientId: string, medicationId: string) => {
        deleteMedicationFromPatient(patientId, medicationId);
        showNotification({ message: 'Medicação arquivada com sucesso.', type: 'info' });
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
                            {patient.medications.filter(medication => !medication.isArchived).map(medication => (
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
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                            {!medication.endDate ? (
                                                <button onClick={() => setEndDateModalOpen(medication.id)} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Registrar Fim</button>
                                            ) : (
                                                <button onClick={() => handleDeleteMedication(patient.id, medication.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition" aria-label="Arquivar medicação">
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
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
const AddDeviceModal: React.FC<{ patientId: string; onClose: () => void;}> = ({ patientId, onClose }) => {
    const { addDeviceToPatient } = useContext(PatientsContext)!;
    const { showNotification } = useContext(NotificationContext)!;
    const [type, setType] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!type || !location || !startDate) return;
        addDeviceToPatient(patientId, { name: type, location, startDate });
        showNotification({ message: 'Dispositivo cadastrado com sucesso!', type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Cadastrar Dispositivo</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200">
                            <option value="" disabled>Select...</option>
                            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Local</label>
                         <select value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200">
                            <option value="" disabled>Select...</option>
                            {DEVICE_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dia da inserção</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Cadastrar</button>
                </form>
            </div>
        </div>
    );
};

const AddExamModal: React.FC<{ patientId: string; onClose: () => void;}> = ({ patientId, onClose }) => {
    const { addExamToPatient } = useContext(PatientsContext)!;
    const { showNotification } = useContext(NotificationContext)!;
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [result, setResult] = useState<'Pendente' | 'Normal' | 'Alterado'>('Pendente');
    const [observation, setObservation] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !date || !result) return;
        addExamToPatient(patientId, { name, date, result, observation });
        showNotification({ message: 'Exame cadastrado com sucesso!', type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Cadastrar Exame</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Exame</label>
                        <input type="text" placeholder="Ex: Hemograma" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                         <select value={result} onChange={e => setResult(e.target.value as any)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200">
                            {EXAM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observação (Opcional)</label>
                        <textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Digite aqui..." className="mt-1 block w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200" rows={3}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Cadastrar</button>
                </form>
            </div>
        </div>
    );
};

const EditExamModal: React.FC<{ exam: Exam; patientId: string; onClose: () => void;}> = ({ exam, patientId, onClose }) => {
    const { updateExamInPatient } = useContext(PatientsContext)!;
    const { showNotification } = useContext(NotificationContext)!;
    
    const [result, setResult] = useState(exam.result);
    const [observation, setObservation] = useState(exam.observation || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateExamInPatient(patientId, { id: exam.id, result, observation });
        showNotification({ message: 'Exame atualizado com sucesso!', type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Editar Exame</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /></button>
                </div>
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{exam.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data: {new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                         <select value={result} onChange={e => setResult(e.target.value as any)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200">
                            {EXAM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Observação (Opcional)</label>
                        <textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Digite aqui..." className="mt-1 block w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200" rows={3}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar Alterações</button>
                </form>
            </div>
        </div>
    );
};

const AddMedicationModal: React.FC<{ patientId: string; onClose: () => void;}> = ({ patientId, onClose }) => {
    const { addMedicationToPatient } = useContext(PatientsContext)!;
     const { showNotification } = useContext(NotificationContext)!;
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !dosage || !startDate) return;
        addMedicationToPatient(patientId, { name, dosage, startDate });
        showNotification({ message: 'Medicação cadastrada com sucesso!', type: 'success' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Cadastrar Medicação</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Medicamento</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dosagem</label>
                        <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Cadastrar</button>
                </form>
            </div>
        </div>
    );
};

const AddRemovalDateModal: React.FC<{ deviceId: string, patientId: string, onClose: () => void }> = ({ deviceId, patientId, onClose }) => {
    const { addRemovalDateToDevice } = useContext(PatientsContext)!;
    const [removalDate, setRemovalDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addRemovalDateToDevice(patientId, deviceId, removalDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Registrar Data de Retirada</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data da Retirada</label>
                        <input type="date" value={removalDate} onChange={e => setRemovalDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const AddEndDateModal: React.FC<{ medicationId: string, patientId: string, onClose: () => void }> = ({ medicationId, patientId, onClose }) => {
    const { addEndDateToMedication } = useContext(PatientsContext)!;
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addEndDateToMedication(patientId, medicationId, endDate);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Registrar Data de Fim</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Data de Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RoundCategoryListScreen: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const { patients } = useContext(PatientsContext)!;
    const { getCompletedCategories } = useContext(ChecklistContext)!;
    const patient = patients.find(p => p.id === patientId);

    useHeader('Round: Categorias');
    
    if (!patientId || !patient) return <p>Paciente não encontrado.</p>;

    const completedCategories = getCompletedCategories(patientId);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(category => {
                const isCompleted = completedCategories.includes(category.id);
                return (
                    <Link
                        key={category.id}
                        to={`/patient/${patientId}/round/category/${category.id}`}
                        className={`p-4 rounded-xl shadow-sm text-center font-semibold transition flex flex-col items-center justify-center gap-2 ${
                            isCompleted 
                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {category.icon && <category.icon className={`w-8 h-8 ${isCompleted ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />}
                        <span className={isCompleted ? 'text-white' : 'text-slate-700 dark:text-slate-300'}>{category.name}</span>
                    </Link>
                )
            })}
        </div>
    );
};

const ChecklistScreen: React.FC = () => {
    const { patientId, categoryId: categoryIdStr } = useParams<{ patientId: string, categoryId: string }>();
    const { patients } = useContext(PatientsContext)!;
    const { getAnswersForChecklist, saveAnswers } = useContext(ChecklistContext)!;
    
    const patient = patients.find(p => p.id === patientId);
    const categoryId = categoryIdStr ? parseInt(categoryIdStr) : undefined;
    const category = categoryId ? CATEGORIES.find(c => c.id === categoryId) : undefined;
    const questions = categoryId ? QUESTIONS.filter(q => q.categoryId === categoryId) : [];
    const navigate = useNavigate();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useHeader(category ? `Checklist: ${category.name}` : 'Checklist');

    const [answers, setAnswers] = useState<ChecklistAnswer>({});

    useEffect(() => {
        if (patientId && categoryId) {
            setAnswers(getAnswersForChecklist(patientId, categoryId));
        }
    }, [patientId, categoryId, getAnswersForChecklist]);

    const handleAnswer = (questionId: number, answer: Answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };
    
    const handleSave = async () => {
        if (!patientId || !categoryId) return;
        await saveAnswers(patientId, categoryId, answers);
        navigate(`/patient/${patientId}/round/categories`);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSave();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    if (!patient || !category || questions.length === 0) {
        return <p>Paciente, categoria ou perguntas não encontrados.</p>;
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="relative pb-24">
            <div className="bg-blue-500 dark:bg-blue-700 text-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col max-w-lg mx-auto">
                <div className="bg-black/10 text-xs font-bold px-3 py-1 rounded-full self-start mb-6">
                    Pergunta {currentQuestionIndex + 1}/{questions.length}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 min-h-[6rem] flex items-center justify-center">
                    {currentQuestion.text}
                </h2>
                <div className="space-y-3">
                    {(['sim', 'não', 'nao_se_aplica'] as Answer[]).map(answer => (
                        <button
                            key={answer}
                            onClick={() => handleAnswer(currentQuestion.id, answer)}
                            className={`w-full py-3.5 px-4 rounded-lg font-bold text-lg transition-all transform active:scale-95 ${
                                answers[currentQuestion.id] === answer
                                    ? 'bg-white text-blue-600 shadow-md ring-2 ring-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {answer.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-white text-blue-600 font-bold py-2 px-6 rounded-lg shadow-md hover:bg-slate-100 transition"
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Salvar' : 'Próximo'}
                    </button>
                </div>
            </div>
            
            <button
                onClick={() => navigate(`/patient/${patientId}/round/category/${categoryId}/create-alert`)}
                className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-yellow-400 hover:bg-yellow-500 text-slate-800 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-20 transition transform active:scale-90"
                aria-label="Criar Alerta"
            >
                <BellIcon className="w-8 h-8"/>
            </button>
        </div>
    );
};

const CreateAlertScreen: React.FC = () => {
    const { patientId, categoryId } = useParams<{ patientId: string, categoryId?: string }>();
    const { patients } = useContext(PatientsContext)!;
    const { addTask } = useContext(TasksContext)!;
    const { showNotification } = useContext(NotificationContext)!;
    const navigate = useNavigate();
    
    const patient = patients.find(p => p.id === patientId);
    const category = categoryId ? CATEGORIES.find(c => c.id.toString() === categoryId) : null;

    const [description, setDescription] = useState('');
    const [responsible, setResponsible] = useState('');
    const [deadline, setDeadline] = useState('');

    useHeader(category ? `Alerta: ${category.name}` : 'Criar Alerta');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !description || !responsible || !deadline) return;

        const deadlineHours = parseInt(deadline.split(' ')[0]);
        const deadlineDate = new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();

        const success = await addTask({
            patientId: patientId,
            categoryId: category ? category.id : null,
            description,
            responsible,
            deadline: deadlineDate,
        });

        if (success) {
            showNotification({ message: 'Alerta criado com sucesso!', type: 'success' });
            
            if (categoryId) {
                navigate(`/patient/${patientId}/round/category/${categoryId}`);
            } else {
                navigate(`/patient/${patientId}`);
            }
        }
    };
    
    if (!patient) {
        return <p>Paciente não encontrado</p>;
    }


    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl overflow-hidden max-w-md mx-auto shadow-lg">
            <div className="p-6 bg-blue-500 dark:bg-blue-600 text-white text-center">
                <h2 className="text-xl font-bold">{patient.name}</h2>
                {category && <p className="text-blue-100">{category.name}</p>}
            </div>
            <div className="p-6 bg-white dark:bg-slate-800">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alerta</label>
                        <input
                          type="text"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Digite o alerta identificado..."
                          required
                          className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                        <select value={responsible} onChange={e => setResponsible(e.target.value)} required className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200">
                            <option value="" disabled>Selecione...</option>
                            {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione a hora</label>
                        <select value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200">
                            <option value="" disabled>Selecione...</option>
                            {ALERT_DEADLINES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition text-lg flex items-center justify-center gap-2"
                    >
                        <PencilIcon className="w-5 h-5"/>
                        Criar alerta
                    </button>
                </form>
            </div>
        </div>
    );
};

const TaskStatusScreen: React.FC = () => {
    const { status } = useParams<{ status: TaskStatus }>();
    const { tasks, updateTaskJustification, updateTaskStatus } = useContext(TasksContext)!;
    const { patients } = useContext(PatientsContext)!;

    const [justificationModal, setJustificationModal] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => {
        if (!status) return [];
        if (status === 'alerta') {
            // The dashboard counts alerts that are not yet concluded.
            return tasks.filter(t => t.status === 'alerta' && t.live_status !== 'concluido');
        }
        // For other statuses, we filter by the live, calculated status.
        return tasks.filter((t: Task) => t.live_status === status);
    }, [tasks, status]);
    
    const statusConfig = {
        alerta: { title: 'Alertas', icon: WarningIcon, color: 'yellow' },
        no_prazo: { title: 'No Prazo', icon: ClockIcon, color: 'blue' },
        fora_do_prazo: { title: 'Fora do Prazo', icon: AlertIcon, color: 'red' },
        concluido: { title: 'Concluídos', icon: CheckCircleIcon, color: 'green' },
    };

    const config = statusConfig[status as TaskStatus];
    useHeader(config ? config.title : 'Tarefas');

    const handleJustify = (task: Task, justification: string) => {
        updateTaskJustification(task.id, justification);
        setJustificationModal(null);
    };
    
    const handleCompleteTask = (taskId: string) => {
        if(window.confirm('Tem certeza que deseja marcar esta tarefa como concluída?')){
            updateTaskStatus(taskId, 'concluido');
        }
    };

    if (!config) return <p>Status inválido.</p>;

    return (
        <div className="space-y-4">
            {filteredTasks.map((task: Task) => {
                const patient = patients.find((p: Patient) => p.id === task.patientId);
                const category = task.categoryId ? CATEGORIES.find(c => c.id === task.categoryId) : null;
                const currentTaskConfig = statusConfig[task.live_status as TaskStatus] || config;

                return (
                    <div key={task.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border-l-4 border-${currentTaskConfig.color}-500`}>
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{task.description}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    <Link to={`/patient/${patient?.id}`} className="hover:underline font-semibold">{patient?.name}</Link> - Leito {patient?.bedNumber}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Responsável: {task.responsible} | Categoria: {category?.name || 'Geral'}</p>
                                {task.justification && <p className="text-xs italic text-blue-600 dark:text-blue-400 mt-1">Justificativa: {task.justification}</p>}
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prazo:</p>
                                <p className={`text-sm font-bold text-${currentTaskConfig.color}-600 dark:text-${currentTaskConfig.color}-400`}>
                                    {new Date(task.deadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        {task.live_status === 'fora_do_prazo' && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                <button onClick={() => setJustificationModal(task)} className="text-xs bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-semibold px-3 py-1.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900">Justificar Atraso</button>
                                <button onClick={() => handleCompleteTask(task.id)} className="text-xs bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-300 font-semibold px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900">Concluir</button>
                            </div>
                        )}
                        {task.live_status !== 'concluido' && task.live_status !== 'fora_do_prazo' && (
                             <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                 <button onClick={() => handleCompleteTask(task.id)} className="text-xs bg-green-100 dark:bg-green-900/80 text-green-700 dark:text-green-300 font-semibold px-3 py-1.5 rounded-md hover:bg-green-200 dark:hover:bg-green-900">Marcar como Concluída</button>
                             </div>
                        )}
                    </div>
                );
            })}
             {justificationModal && <JustificationModal task={justificationModal} onClose={() => setJustificationModal(null)} onSave={handleJustify} />}
        </div>
    );
};

const JustificationModal: React.FC<{ task: Task, onClose: () => void, onSave: (task: Task, justification: string) => void }> = ({ task, onClose, onSave }) => {
    const [justification, setJustification] = useState(task.justification || '');
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Justificar Atraso</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{task.description}</p>
                <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    rows={4}
                    placeholder="Digite a justificativa..."
                />
                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={() => onSave(task, justification)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const SettingsScreen: React.FC = () => {
    useHeader('Ajustes');
    const { user, updateUser } = useContext(UserContext)!;
    const { theme, toggleTheme } = useContext(ThemeContext)!;
    const { showNotification } = useContext(NotificationContext)!;

    const [name, setName] = useState(user.name);
    const [title, setTitle] = useState(user.title);
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user.name);
        setTitle(user.title);
        setAvatarPreview(user.avatarUrl);
    }, [user]);

    const handleSave = () => {
        updateUser({ name, title, avatarUrl: avatarPreview });
        showNotification({ message: 'Perfil salvo com sucesso!', type: 'success' });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 max-w-lg mx-auto">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Perfil</h2>
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <img src={avatarPreview} alt="User avatar" className="w-24 h-24 rounded-full object-cover"/>
                            <button
                                onClick={handleAvatarClick}
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                                aria-label="Mudar foto de perfil"
                            >
                                <CameraIcon className="w-8 h-8 text-white" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition">
                        Salvar Perfil
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Aparência</h2>
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Modo Escuro</span>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                            theme === 'dark' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PROVIDERS for Global State ---

const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [todaysAnswers, setTodaysAnswers] = useState<DbChecklistAnswer[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useContext(NotificationContext)!;

    const getTodayDateString = () => new Date().toISOString().split('T')[0];

    const fetchTodaysAnswers = async () => {
        setLoading(true);
        const today = getTodayDateString();
        const { data, error } = await supabase
            .from('checklist_answers')
            .select('*')
            .eq('date', today);

        if (error) {
            console.error("Error fetching today's checklist answers:", error);
            showNotification({ message: 'Erro ao carregar checklists.', type: 'error' });
        } else {
            setTodaysAnswers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTodaysAnswers();
    }, []);

    const getCompletedCategories = (patientId: string): number[] => {
        const patientAnswers = todaysAnswers.filter(a => a.patient_id === patientId);
        const answersByCat = patientAnswers.reduce((acc, answer) => {
            acc[answer.category_id] = (acc[answer.category_id] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const completed: number[] = [];
        for (const catId in answersByCat) {
            const questionsForCat = QUESTIONS.filter(q => q.categoryId === Number(catId));
            if (answersByCat[catId] >= questionsForCat.length) {
                completed.push(Number(catId));
            }
        }
        return completed;
    };

    const getAnswersForChecklist = (patientId: string, categoryId: number): ChecklistAnswer => {
        const checklistAnswers = todaysAnswers.filter(a => a.patient_id === patientId && a.category_id === categoryId);
        return checklistAnswers.reduce((acc, answer) => {
            acc[answer.question_id] = answer.answer;
            return acc;
        }, {} as ChecklistAnswer);
    };

    const saveAnswers = async (patientId: string, categoryId: number, answers: ChecklistAnswer) => {
        const today = getTodayDateString();
        const questionsForCategory = QUESTIONS.filter(q => q.categoryId === categoryId);

        const upsertData = questionsForCategory
            .filter(q => answers[q.id]) // Only upsert questions that have an answer
            .map(q => ({
                patient_id: patientId,
                category_id: categoryId,
                question_id: q.id,
                date: today,
                answer: answers[q.id],
            }));

        if (upsertData.length === 0) return;

        const { error } = await supabase.from('checklist_answers').upsert(upsertData, {
            onConflict: 'patient_id,category_id,question_id,date',
        });

        if (error) {
            console.error("Error saving checklist answers:", error);
            showNotification({ message: 'Erro ao salvar checklist.', type: 'error' });
        } else {
            await fetchTodaysAnswers();
        }
    };

    const value = {
        todaysAnswers,
        saveAnswers,
        getCompletedCategories,
        getAnswersForChecklist,
        loading,
    };

    return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
};

const PatientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        setLoading(true);
        const { data: patientsData, error: patientsError } = await supabase.from('patients').select('*');
        if (patientsError) {
            console.error("Error fetching patients:", patientsError);
            setLoading(false);
            return;
        }

        const { data: devicesData, error: devicesError } = await supabase.from('devices').select('*');
        if (devicesError) console.error("Error fetching devices:", devicesError);

        const { data: examsData, error: examsError } = await supabase.from('exams').select('*');
        if (examsError) console.error("Error fetching exams:", examsError);

        const { data: medicationsData, error: medicationsError } = await supabase.from('medications').select('*');
        if (medicationsError) console.error("Error fetching medications:", medicationsError);

        const combinedData = patientsData.map(p => ({
            ...p,
            bedNumber: p.bed_number,
            motherName: p.mother_name,
            devices: devicesData?.filter(d => d.patient_id === p.id).map(d => ({...d, startDate: d.start_date, removalDate: d.removal_date, isArchived: d.is_archived})) || [],
            exams: examsData?.filter(e => e.patient_id === p.id).map(e => ({...e, isArchived: e.is_archived})) || [],
            medications: medicationsData?.filter(m => m.patient_id === p.id).map(m => ({...m, startDate: m.start_date, endDate: m.end_date, isArchived: m.is_archived})) || [],
        }));

        setPatients(combinedData);
        setLoading(false);
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const addDeviceToPatient = async (patientId: string, device: Omit<Device, 'id' | 'patient_id'>) => {
        const { data, error } = await supabase.from('devices').insert([{ ...device, patient_id: patientId, start_date: device.startDate }]).select();
        if (error) console.error("Error adding device:", error);
        else if (data) fetchPatients();
    };

    const addExamToPatient = async (patientId: string, exam: Omit<Exam, 'id' | 'patient_id'>) => {
        const { data, error } = await supabase.from('exams').insert([{ ...exam, patient_id: patientId }]).select();
        if (error) console.error("Error adding exam:", error);
        else if (data) fetchPatients();
    };

    const addMedicationToPatient = async (patientId: string, medication: Omit<Medication, 'id' | 'patient_id'>) => {
        const { data, error } = await supabase.from('medications').insert([{ ...medication, patient_id: patientId, start_date: medication.startDate }]).select();
        if (error) console.error("Error adding medication:", error);
        else if (data) fetchPatients();
    };

    const addRemovalDateToDevice = async (patientId: string, deviceId: string, removalDate: string) => {
        const { error } = await supabase.from('devices').update({ removal_date: removalDate }).eq('id', deviceId);
        if (error) console.error("Error updating device:", error);
        else fetchPatients();
    };
    
    const deleteDeviceFromPatient = async (patientId: string, deviceId: string) => {
        const { error } = await supabase.from('devices').update({ is_archived: true }).eq('id', deviceId);
        if (error) console.error("Error archiving device:", error);
        else fetchPatients();
    };

    const addEndDateToMedication = async (patientId: string, medicationId: string, endDate: string) => {
        const { error } = await supabase.from('medications').update({ end_date: endDate }).eq('id', medicationId);
        if (error) console.error("Error updating medication:", error);
        else fetchPatients();
    };
    
    const deleteMedicationFromPatient = async (patientId: string, medicationId: string) => {
        const { error } = await supabase.from('medications').update({ is_archived: true }).eq('id', medicationId);
        if (error) console.error("Error archiving medication:", error);
        else fetchPatients();
    };
    
    const updateExamInPatient = async (patientId: string, examData: Pick<Exam, 'id' | 'result' | 'observation'>) => {
        const { error } = await supabase.from('exams').update({ result: examData.result, observation: examData.observation }).eq('id', examData.id);
        if (error) console.error("Error updating exam:", error);
        else fetchPatients();
    };

    const deleteExamFromPatient = async (patientId: string, examId: string) => {
        const { error } = await supabase.from('exams').update({ is_archived: true }).eq('id', examId);
        if (error) console.error("Error archiving exam:", error);
        else fetchPatients();
    };


    const value = {
        patients,
        addDeviceToPatient,
        addExamToPatient,
        addMedicationToPatient,
        addRemovalDateToDevice,
        deleteDeviceFromPatient,
        addEndDateToMedication,
        deleteMedicationFromPatient,
        updateExamInPatient,
        deleteExamFromPatient,
        loading,
    };

    return <PatientsContext.Provider value={value as PatientsContextType}>{children}</PatientsContext.Provider>;
};


const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useContext(NotificationContext)!;

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks_status_view').select('*');
        if (error) {
            console.error("Error fetching tasks:", error);
            showNotification({ message: 'Erro ao carregar tarefas.', type: 'error' });
        } else {
            const formattedTasks = data.map(t => ({
                ...t,
                patientId: t.patient_id,
                categoryId: t.category_id,
            }));
            setTasks(formattedTasks);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateTaskJustification = async (taskId: string, justification: string) => {
        const { error } = await supabase.from('tasks').update({ justification }).eq('id', taskId);
        if (error) {
            console.error("Error updating task justification:", error);
            showNotification({ message: 'Erro ao salvar justificativa.', type: 'error' });
        } else {
            showNotification({ message: 'Justificativa salva com sucesso!', type: 'success' });
            fetchTasks();
        }
    };
    
     const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
        const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
        if (error) {
            console.error("Error updating task status:", error);
            showNotification({ message: 'Erro ao concluir tarefa.', type: 'error' });
        } else {
            showNotification({ message: 'Tarefa concluída com sucesso!', type: 'success' });
            fetchTasks();
        }
    };

    const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'justification' | 'live_status'>): Promise<boolean> => {
        const { error } = await supabase.from('tasks').insert([{
            patient_id: taskData.patientId,
            category_id: taskData.categoryId,
            description: taskData.description,
            responsible: taskData.responsible,
            deadline: taskData.deadline,
            status: 'alerta'
        }]);
        if (error) {
            console.error("Error adding task:", error);
            showNotification({ message: `Erro ao criar alerta: ${error.message}`, type: 'error' });
            return false;
        } else {
            fetchTasks();
            return true;
        }
    };

    const value = {
        tasks,
        updateTaskJustification,
        updateTaskStatus,
        addTask,
        loading,
    };

    return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<NotificationState | null>(null);

    const showNotification = (notification: NotificationState) => {
        setNotification(notification);
    };

    const hideNotification = () => {
        setNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(INITIAL_USER);

    const fetchUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
            if (error) {
                console.error("Error fetching user profile:", error);
            } else if (data) {
                setUser({
                    name: data.name || 'Usuário',
                    title: data.role || 'Cargo',
                    avatarUrl: data.foto || `https://i.pravatar.cc/150?u=${data.id}`,
                });
            }
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const updateUser = async (userData: Partial<User>) => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { error } = await supabase.from('users').update({
            name: userData.name,
            role: userData.title,
            foto: userData.avatarUrl,
        }).eq('id', authUser.id);

        if (error) {
            console.error("Error updating user profile:", error);
        } else {
            setUser(prev => ({ ...prev, ...userData }));
        }
    };

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};


// --- MAIN APP ---

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    return (
        <HashRouter>
            <NotificationProvider>
                <ThemeProvider>
                <UserProvider>
                <PatientsProvider>
                <TasksProvider>
                <ChecklistProvider>
                    <Routes>
                        {!session ? (
                            <Route path="*" element={<AuthScreen />} />
                        ) : (
                            <Route path="/" element={<AppLayout />}>
                                <Route index element={<Navigate to="/dashboard" replace />} />
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
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Route>
                        )}
                    </Routes>
                </ChecklistProvider>
                </TasksProvider>
                </PatientsProvider>
                </UserProvider>
                </ThemeProvider>
            </NotificationProvider>
        </HashRouter>
    );
}

export default App;