import { Category, User } from './types';
import { 
    AppleIcon, 
    DropletIcon,
    HeartPulseIcon,
    BeakerIcon,
    LiverIcon,
    LungsIcon,
    DumbbellIcon,
    BrainIcon,
    PillIcon,
    ShieldIcon,
    UsersIcon,
    HomeIcon
} from './components/icons';

export const DEVICE_TYPES: string[] = ['CVC 1', 'CVC 2', 'PICC1', 'PICC2', 'AVP1', 'AVP2', 'TOT', 'SVD', 'DVE', 'SNE'];
export const DEVICE_LOCATIONS: string[] = ['VJID', 'VJIE', 'VSD', 'VSE', 'VFD', 'VFE', 'Nasal', 'Braço Esquerdo', 'Braço Direito'];
export const EXAM_STATUSES: Array<'Pendente' | 'Normal' | 'Alterado'> = ['Pendente', 'Normal', 'Alterado'];

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Sistema Nutricional', icon: AppleIcon },
  { id: 2, name: 'Hídrico', icon: DropletIcon },
  { id: 3, name: 'Hemodinâmico', icon: HeartPulseIcon },
  { id: 4, name: 'Hematológico', icon: BeakerIcon },
  { id: 5, name: 'Hepático', icon: LiverIcon },
  { id: 6, name: 'Respiratório', icon: LungsIcon },
  { id: 7, name: 'Fisioterapia', icon: DumbbellIcon },
  { id: 8, name: 'Neurológico', icon: BrainIcon },
  { id: 9, name: 'Farmácia', icon: PillIcon },
  { id: 10, name: 'Gerenciamento de Risco', icon: ShieldIcon },
  { id: 11, name: 'Família', icon: UsersIcon },
  { id: 12, name: 'Avaliação de Alta', icon: HomeIcon },
];

export const RESPONSIBLES: string[] = [
    'Médico', 
    'Enfermeiro', 
    'Fisioterapeuta', 
    'Farmacêutico', 
    'Odontólogo', 
    'Médico / Enfermeiro', 
    'Médico / Fisioterapeuta'
];

export const ALERT_DEADLINES: string[] = Array.from({ length: 24 }, (_, i) => `${i + 1} hora${i > 0 ? 's' : ''}`);

export const INITIAL_USER: User = {
    name: 'Usuário',
    title: 'Cargo',
    avatarUrl: 'https://i.pravatar.cc/150',
};