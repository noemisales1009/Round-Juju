import React, { useState, useMemo, useContext, useEffect, createContext, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useParams, useLocation, Outlet, NavLink } from 'react-router-dom';
import { Patient, Category, Question, ChecklistAnswer, Answer, Device, Exam, Medication, Task, TaskStatus, PatientsContextType, TasksContextType, NotificationState, NotificationContextType, User, UserContextType, Theme, ThemeContextType } from './types';
import { PATIENTS as initialPatients, CATEGORIES, QUESTIONS, TASKS as initialTasks, DEVICE_TYPES, DEVICE_LOCATIONS, EXAM_STATUSES, RESPONSIBLES, ALERT_DEADLINES, INITIAL_USER } from './constants';
import { BackArrowIcon, PlusIcon, WarningIcon, ClockIcon, AlertIcon, CheckCircleIcon, BedIcon, UserIcon, PencilIcon, BellIcon, InfoIcon, EyeOffIcon, ClipboardIcon, FileTextIcon, LogOutIcon, ChevronRightIcon, MenuIcon, DashboardIcon, CpuIcon, PillIcon, BarChartIcon, AppleIcon, DropletIcon, HeartPulseIcon, BeakerIcon, LiverIcon, LungsIcon, DumbbellIcon, BrainIcon, ShieldIcon, UsersIcon, HomeIcon, CloseIcon, SettingsIcon, CameraIcon } from './components/icons';
import { useSupabasePatients } from './src/hooks/useSupabasePatients';
import { useSupabaseTasks } from './src/hooks/useSupabaseTasks';

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

    console.log('🔍 PatientListScreen - patients:', patients);
    console.log('🔍 PatientListScreen - loading:', loading);

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

// ... (resto do código continua igual, vou pular para economizar espaço)

// --- PROVIDERS for Global State ---

const PatientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const supabaseHook = useSupabasePatients();
    
    console.log('🔵 PatientsProvider - supabaseHook:', supabaseHook);

    return <PatientsContext.Provider value={supabaseHook as PatientsContextType}>{children}</PatientsContext.Provider>;
};


const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const supabaseHook = useSupabaseTasks();
    
    console.log('🔵 TasksProvider - supabaseHook:', supabaseHook);

    return <TasksContext.Provider value={supabaseHook as TasksContextType}>{children}</TasksContext.Provider>;
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

    const updateUser = (userData: Partial<User>) => {
        setUser(prev => ({ ...prev, ...userData }));
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
    return (
        <HashRouter>
            <NotificationProvider>
                <ThemeProvider>
                <UserProvider>
                <PatientsProvider>
                <TasksProvider>
                    <Routes>
                        <Route path="/" element={<LoginScreen />} />
                        <Route path="/" element={<AppLayout />}>
                            <Route path="dashboard" element={<DashboardScreen />} />
                            <Route path="patients" element={<PatientListScreen />} />
                            {/* ... outras rotas ... */}
                        </Route>
                    </Routes>
                </TasksProvider>
                </PatientsProvider>
                </UserProvider>
                </ThemeProvider>
            </NotificationProvider>
        </HashRouter>
    );
}

export default App;