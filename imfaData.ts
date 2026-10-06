export type ApplicationStatus = 'nova' | 'analise' | 'pendente' | 'aprovada' | 'rejeitada';

export type DocStatus = 'validado' | 'verificacao' | 'ilegivel' | 'falta';

export interface CandidateDocument {
  id: string;
  title: string;
  filename: string;
  size: string;
  type: 'pdf' | 'image';
  status: DocStatus;
  fileStorageUrl?: string;
  auditedBy?: string;
  auditedAt?: string;
  notes?: string;
  warningNote?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor?: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'error';
}

export type CourseId =
  | 'bs'
  | 'cg'
  | 'fin'
  | 'ge'
  | 'grh'
  | 'gcm'
  | 'gsi'
  | 'inf'
  | 'ig'
  | 'sm';

export interface Candidate {
  id: string;
  priorityLabel: string;
  fullName: string;
  biNumber: string;
  biValidity: string;
  birthDate: string;
  age: number;
  gender: 'Masculino' | 'Feminino';
  naturalidade: string;
  phonePrimary: string;
  phoneAlt: string;
  contactNote: string;
  email: string;
  address: string;
  municipality: 'belas' | 'luanda' | 'cazenga' | 'viana' | 'talatona' | 'cacuaco' | 'outras';
  municipalityLabel: string;
  nee: string;
  photoUrl: string;
  initials: string;
  previousSchool: string;
  completionYear: string;
  averageGrade: number;
  grades: {
    matematica: number;
    portugues: number;
    fisica: number;
    quimica: number;
  };
  courseId: CourseId;
  courseName: string;
  courseCode: string;
  classCode: string;
  shift: string;
  submittedDate: string;
  submittedTime: string;
  relativeTime: string;
  status: ApplicationStatus;
  docSummaryLabel: string;
  docSubLabel: string;
  documents: CandidateDocument[];
  checklist: {
    ageValid: boolean;
    certReadable: boolean;
    biValid: boolean;
    guardianConfirmed: boolean;
    gradeAboveCutoff: boolean;
  };
  dispatchNote: string;
  auditLogs: AuditLogEntry[];
}

export interface CourseInfo {
  id: CourseId;
  code: string;
  classCode: string;
  name: string;
  shortName: string;
  area: string;
  shift: string;
  totalSpots: number;
  enrolledCount: number;
  approvedCount: number;
  cutoffGrade: number;
  coordinator: string;
  colorHex: string;
  badgeClass: string;
}

export const IMFA_LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <defs>
    <path id="topArc" d="M 32,124 A 88,88 0 1,1 208,124" />
  </defs>
  <circle cx="120" cy="120" r="116" fill="#f7f7f2" stroke="#d4a017" stroke-width="5"/>
  <circle cx="120" cy="120" r="110" fill="#fbfbf7" stroke="#0d2538" stroke-width="4"/>
  <circle cx="120" cy="120" r="76" fill="#fbfbf7" stroke="#0d2538" stroke-width="3.5"/>
  <text fill="#0d2538" font-family="Arial, sans-serif" font-size="15.5" font-weight="900" letter-spacing="1">
    <textPath href="#topArc" startOffset="50%" text-anchor="middle">INSTITUTO MÉDIO DE GESTÃO QUINEUS</textPath>
  </text>
  <g transform="translate(80,76)" fill="#226699" stroke="#0d2538" stroke-width="2">
    <circle cx="0" cy="0" r="11"/>
    <circle cx="0" cy="0" r="4.5" fill="#fbfbf7"/>
    <g stroke="#0d2538" stroke-width="3">
      <line x1="0" y1="-14" x2="0" y2="-11"/><line x1="0" y1="11" x2="0" y2="14"/>
      <line x1="-14" y1="0" x2="-11" y2="0"/><line x1="11" y1="0" x2="14" y2="0"/>
      <line x1="-10" y1="-10" x2="-8" y2="-8"/><line x1="8" y1="8" x2="10" y2="10"/>
      <line x1="10" y1="-10" x2="8" y2="-8"/><line x1="-8" y1="8" x2="-10" y2="10"/>
    </g>
  </g>
  <g transform="translate(66,97)" fill="#226699" stroke="#0d2538" stroke-width="2">
    <circle cx="0" cy="0" r="8.5"/>
    <circle cx="0" cy="0" r="3.5" fill="#fbfbf7"/>
  </g>
  <g stroke="#0d2538" stroke-width="2" stroke-linejoin="round">
    <rect x="100" y="88" width="6" height="8" fill="#2e856e"/>
    <rect x="109" y="81" width="6" height="15" fill="#2e856e"/>
    <rect x="118" y="74" width="6" height="22" fill="#2e856e"/>
    <rect x="127" y="65" width="6" height="31" fill="#2e856e"/>
    <path d="M 100,82 L 112,70 L 117,74 L 131,56" fill="none" stroke="#0d2538" stroke-width="3" stroke-linecap="round"/>
    <polygon points="133,54 125,56 131,62" fill="#0d2538"/>
  </g>
  <g transform="translate(145,66)">
    <rect x="0" y="0" width="26" height="26" rx="3" fill="#226699" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="5" y1="-5" x2="5" y2="0" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="11" y1="-5" x2="11" y2="0" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="16" y1="-5" x2="16" y2="0" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="21" y1="-5" x2="21" y2="0" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="5" y1="26" x2="5" y2="31" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="11" y1="26" x2="11" y2="31" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="16" y1="26" x2="16" y2="31" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="21" y1="26" x2="21" y2="31" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="-5" y1="6" x2="0" y2="6" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="-5" y1="13" x2="0" y2="13" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="-5" y1="20" x2="0" y2="20" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="26" y1="6" x2="31" y2="6" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="26" y1="13" x2="31" y2="13" stroke="#0d2538" stroke-width="2.2"/>
    <line x1="26" y1="20" x2="31" y2="20" stroke="#0d2538" stroke-width="2.2"/>
    <text x="13" y="12" text-anchor="middle" fill="#0d2538" font-family="monospace" font-size="8" font-weight="bold">1101</text>
    <text x="13" y="21" text-anchor="middle" fill="#0d2538" font-family="monospace" font-size="8" font-weight="bold">010</text>
  </g>
  <g>
    <path d="M 94,142 A 26,26 0 0,1 146,142 Z" fill="#f7be2c"/>
    <g stroke="#e6b022" stroke-width="2.5" stroke-linecap="round">
      <line x1="120" y1="103" x2="120" y2="111"/>
      <line x1="105" y1="106" x2="108" y2="114"/>
      <line x1="135" y1="106" x2="132" y2="114"/>
      <line x1="92" y1="114" x2="98" y2="120"/>
      <line x1="148" y1="114" x2="142" y2="120"/>
      <line x1="83" y1="126" x2="90" y2="129"/>
      <line x1="157" y1="126" x2="150" y2="129"/>
    </g>
  </g>
  <g stroke="#0d2538" stroke-width="2.5" stroke-linejoin="round">
    <path d="M 64,178 L 76,142 C 92,140 108,144 120,152 C 132,144 148,140 164,142 L 176,178 C 156,176 136,179 120,186 C 104,179 84,176 64,178 Z" fill="#1e6b99"/>
    <path d="M 70,172 L 80,138 C 95,136 108,140 120,148 L 120,180 C 106,173 88,170 70,172 Z" fill="#ffffff"/>
    <path d="M 170,172 L 160,138 C 145,136 132,140 120,148 L 120,180 C 134,173 152,170 170,172 Z" fill="#ffffff"/>
  </g>
  <text x="96" y="160" text-anchor="middle" fill="#0d2538" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" transform="rotate(5, 96, 160)">Rigor</text>
  <text x="144" y="160" text-anchor="middle" fill="#0d2538" font-family="Arial, sans-serif" font-size="8.8" font-weight="bold" transform="rotate(-5, 144, 160)">Qualidade</text>
  <path d="M 44,193 Q 120,235 196,193 L 184,175 Q 120,212 56,175 Z" fill="#f7be2c" stroke="#0d2538" stroke-width="3" stroke-linejoin="round"/>
  <text x="120" y="217" text-anchor="middle" fill="#0d2538" font-family="Arial, sans-serif" font-size="21" font-weight="900" letter-spacing="2">I.M.G.Q</text>
</svg>`) }`;

export const COURSES_DATA: CourseInfo[] = [
  {
    id: 'bs',
    code: 'C-BS01',
    classCode: 'BS-10A',
    name: 'Banca e Seguros',
    shortName: 'Banca e Seguros',
    area: 'Administração e Serviços Financeiros',
    shift: 'Diurno (07:30 – 12:45)',
    totalSpots: 60,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 13.0,
    coordinator: 'Dr. Sebastião Lukamba',
    colorHex: '#b52332',
    badgeClass: 'bg-primary',
  },
  {
    id: 'cg',
    code: 'C-CG02',
    classCode: 'CG-10A',
    name: 'Contabilidade e Gestão',
    shortName: 'Contabilidade e Gestão',
    area: 'Ciências Económicas e Gestão',
    shift: 'Diurno / Vespertino',
    totalSpots: 70,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 13.0,
    coordinator: 'Dra. Filomena Tchipa',
    colorHex: '#49607c',
    badgeClass: 'bg-secondary',
  },
  {
    id: 'fin',
    code: 'C-FIN03',
    classCode: 'FIN-10A',
    name: 'Finanças',
    shortName: 'Finanças',
    area: 'Controlo Financeiro e Tesouraria',
    shift: 'Vespertino (13:15 – 18:15)',
    totalSpots: 50,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 12.5,
    coordinator: 'Dr. Domingos Vandúnem',
    colorHex: '#775a00',
    badgeClass: 'bg-tertiary-container',
  },
  {
    id: 'ge',
    code: 'C-GE04',
    classCode: 'GE-10A',
    name: 'Gestão Empresarial',
    shortName: 'Gestão Empresarial',
    area: 'Administração e Estratégia Organizacional',
    shift: 'Diurno (07:30 – 12:45)',
    totalSpots: 55,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 13.0,
    coordinator: 'Prof. Teresa Kwanza',
    colorHex: '#f0c044',
    badgeClass: 'bg-tertiary-fixed-dim',
  },
  {
    id: 'grh',
    code: 'C-GRH05',
    classCode: 'GRH-10A',
    name: 'Gestão de Recursos Humanos',
    shortName: 'Gestão de Recursos Humanos',
    area: 'Capital Humano e Relações Laborais',
    shift: 'Vespertino (13:15 – 18:15)',
    totalSpots: 45,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 12.5,
    coordinator: 'Dra. Margarida Kiala',
    colorHex: '#c7dfff',
    badgeClass: 'bg-secondary-container',
  },
  {
    id: 'gcm',
    code: 'C-GCM06',
    classCode: 'GCM-10A',
    name: 'Gestão Comercial e Marketing',
    shortName: 'Gestão Comercial e Marketing',
    area: 'Comércio, Vendas e Comunicação de Mercado',
    shift: 'Vespertino (13:15 – 18:15)',
    totalSpots: 40,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 12.5,
    coordinator: 'Dr. Paulo Cassule',
    colorHex: '#b0c9e8',
    badgeClass: 'bg-secondary-fixed-dim',
  },
  {
    id: 'gsi',
    code: 'C-GSI07',
    classCode: 'GSI-10A',
    name: 'Gestão de Sistemas Informáticos',
    shortName: 'Gestão de Sistemas Informáticos',
    area: 'Infraestruturas e Administração de Sistemas',
    shift: 'Diurno (07:30 – 12:45)',
    totalSpots: 65,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 13.5,
    coordinator: 'Eng.º Carlos Muhongo',
    colorHex: '#92001d',
    badgeClass: 'bg-primary-container',
  },
  {
    id: 'inf',
    code: 'C-INF08',
    classCode: 'INF-10A',
    name: 'Informática',
    shortName: 'Informática',
    area: 'Engenharia de Sistemas e Redes',
    shift: 'Diurno (07:30 – 12:45)',
    totalSpots: 80,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 14.0,
    coordinator: 'Eng.ª Helena Neto',
    colorHex: '#314863',
    badgeClass: 'bg-secondary',
  },
  {
    id: 'ig',
    code: 'C-IG09',
    classCode: 'IG-10B',
    name: 'Informática de Gestão',
    shortName: 'Informática de Gestão',
    area: 'Tecnologias de Informação e Comunicação',
    shift: 'Diurno (07:30 – 12:45)',
    totalSpots: 80,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 14.0,
    coordinator: 'Eng.º Mateus Kassoma',
    colorHex: '#b52332',
    badgeClass: 'bg-primary',
  },
  {
    id: 'sm',
    code: 'C-SM10',
    classCode: 'SM-10A',
    name: 'Sistema Multimédia',
    shortName: 'Sistema Multimédia',
    area: 'Design Digital, Produção Audiovisual e Web',
    shift: 'Diurno / Vespertino',
    totalSpots: 55,
    enrolledCount: 0,
    approvedCount: 0,
    cutoffGrade: 13.5,
    coordinator: 'Eng.ª Sónia Domingos',
    colorHex: '#cfdaf2',
    badgeClass: 'bg-surface-dim',
  },
];

// Sem dados de exemplo inseridos
export const INITIAL_CANDIDATES: Candidate[] = [];

export const TREND_DATA_BY_TAB: Record<
  'Total' | 'Aprovadas' | 'Em Análise' | 'Rejeitadas',
  {
    peakLabel: string;
    peakSub: string;
    avgLabel: string;
    avgSub: string;
    rateLabel: string;
    rateSub: string;
    peakBadge: string;
    months: [string, string, string, string, string];
    pathArea: string;
    pathLine: string;
    dots: Array<{ cx: number; cy: number; highlight?: boolean }>;
  }
> = {
  Total: {
    peakLabel: '0 submissões',
    peakSub: 'sem registos',
    avgLabel: '0 candidaturas',
    avgSub: 'aguarda início',
    rateLabel: '0%',
    rateSub: 'formulários válidos',
    peakBadge: '0 Subm.',
    months: ['Agosto (0)', 'Setembro (0)', 'Outubro (0)', 'Novembro (0)', 'Dezembro (0)'],
    pathArea: 'M 30 180 L 570 180 L 570 180 L 30 180 Z',
    pathLine: 'M 30 180 L 165 180 L 280 180 L 360 180 L 480 180 L 570 180',
    dots: [
      { cx: 30, cy: 180 },
      { cx: 165, cy: 180 },
      { cx: 280, cy: 180 },
      { cx: 360, cy: 180, highlight: true },
      { cx: 480, cy: 180 },
      { cx: 570, cy: 180 },
    ],
  },
  Aprovadas: {
    peakLabel: '0 aprovações',
    peakSub: 'sem registos',
    avgLabel: '0 aprovadas/dia',
    avgSub: 'comissão ativa',
    rateLabel: '0%',
    rateSub: 'taxa de aprovação',
    peakBadge: '0 Aprov.',
    months: ['Agosto (0)', 'Setembro (0)', 'Outubro (0)', 'Novembro (0)', 'Dezembro (0)'],
    pathArea: 'M 30 180 L 570 180 L 570 180 L 30 180 Z',
    pathLine: 'M 30 180 L 165 180 L 280 180 L 360 180 L 480 180 L 570 180',
    dots: [
      { cx: 30, cy: 180 },
      { cx: 165, cy: 180 },
      { cx: 280, cy: 180 },
      { cx: 360, cy: 180, highlight: true },
      { cx: 480, cy: 180 },
      { cx: 570, cy: 180 },
    ],
  },
  'Em Análise': {
    peakLabel: '0 em triagem',
    peakSub: 'sem registos',
    avgLabel: '0 horas',
    avgSub: 'tempo médio de resposta',
    rateLabel: '0 fichas',
    rateSub: 'em avaliação',
    peakBadge: '0 Análise',
    months: ['Agosto (0)', 'Setembro (0)', 'Outubro (0)', 'Novembro (0)', 'Dezembro (0)'],
    pathArea: 'M 30 180 L 570 180 L 570 180 L 30 180 Z',
    pathLine: 'M 30 180 L 165 180 L 280 180 L 360 180 L 480 180 L 570 180',
    dots: [
      { cx: 30, cy: 180 },
      { cx: 165, cy: 180 },
      { cx: 280, cy: 180 },
      { cx: 360, cy: 180, highlight: true },
      { cx: 480, cy: 180 },
      { cx: 570, cy: 180 },
    ],
  },
  Rejeitadas: {
    peakLabel: '0 indeferimentos',
    peakSub: 'sem registos',
    avgLabel: '0 rejeições/dia',
    avgSub: 'controlo rigoroso',
    rateLabel: '0%',
    rateSub: 'não conformes',
    peakBadge: '0 Rejeit.',
    months: ['Agosto (0)', 'Setembro (0)', 'Outubro (0)', 'Novembro (0)', 'Dezembro (0)'],
    pathArea: 'M 30 180 L 570 180 L 570 180 L 30 180 Z',
    pathLine: 'M 30 180 L 165 180 L 280 180 L 360 180 L 480 180 L 570 180',
    dots: [
      { cx: 30, cy: 180 },
      { cx: 165, cy: 180 },
      { cx: 280, cy: 180 },
      { cx: 360, cy: 180, highlight: true },
      { cx: 480, cy: 180 },
      { cx: 570, cy: 180 },
    ],
  },
};
