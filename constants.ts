import { Category, Question, User } from './types';
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

export const QUESTIONS: Question[] = [
  // Sistema Nutricional
  { id: 1, categoryId: 1, text: 'NUTRIÇÃO ADEQUADA? (INICIAR ORAL/ENTERAL/NPT)' },
  { id: 2, categoryId: 1, text: 'TOLERÂNCIA À ALIMENTAÇÃO (VÔMITOS)?' },
  { id: 3, categoryId: 1, text: 'RELATA DIARRÉIA OU CONSTIPAÇÃO?' },
  { id: 4, categoryId: 1, text: 'GLICEMIA CONTROLADA? (DX 60-150)' },
  { id: 5, categoryId: 1, text: 'NECESSIDADE DE PROFILAXIA PARA ÚLCERA DE ESTRESSE?' },
  { id: 6, categoryId: 1, text: 'NECESSIDADE DE CONTROLE DE RESÍDUO GÁSTRICO?' },
  { id: 7, categoryId: 1, text: 'FIXAÇÃO DE SNGE/SNE OK?' },
  { id: 8, categoryId: 1, text: 'NECESSIDADE DE RX DE ABDOMEN PARA CHECAR SONDA?' },
  // Hídrico
  { id: 9, categoryId: 2, text: 'HÁ SINAIS DE SOBRECARGA HÍDRICA CLÍNICA?' },
  { id: 10, categoryId: 2, text: 'BH POSITIVO >3% NAS ÚLTIMAS 24 HORAS?' },
  // Hemodinâmico
  { id: 11, categoryId: 3, text: 'APARELHO DE PANI ADEQUADO?' },
  // ... add more questions for other categories
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

export const ALERT_DEADLINES: string[] = [
    '1 hora', 
    '2 horas', 
    '3 horas', 
    '4 horas'
];

export const INITIAL_USER: User = {
    name: 'Usuário',
    title: 'Cargo',
    avatarUrl: 'https://i.pravatar.cc/150',
};