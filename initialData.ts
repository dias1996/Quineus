import { CandidateApplication, CourseInfo } from '../types';
import { Candidate, CourseId } from './imfaData';
import studentsLabImg from '../assets/images/imfa_students_lab_1790772683685.jpg';

export const HERO_LAB_BG = studentsLabImg;
export const HERO_LAB_CARD = studentsLabImg;
export const EXCELLENCE_CLASSROOM_IMG = studentsLabImg;
export const CONSULTA_LAB_IMG = studentsLabImg;

export const STUDENT_DOCTORA_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBNqac250JODmoCvd_w5uIkb04CbMQywBe-27j7scQ3dhHrCo-yW6ea5Bqwgg9m2ILqXVbv_-4Lpg8gYit6a8V3rV9q1jfQOx1J-gltlZrQasekMrQUljs5qNREZNT0inkQOrNfh4NdrUlxIljEwZzViVr_bOFRUN5HKOMjlhpJLbAj5NtGpnKEwtWoR_OS43LgVUsOOa3eNZrDzYkgwTLWS-LZo1R-c75QSPVouogdecTW5dUumaSh';

export const STUDENT_PORTRAIT_ROUND =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBSAXmkMpviRg-cK5Hfd2v_5Kf2GFMncee4DhvRWXlNM28OR-OggGuthfhO5XvnA77-Gv1Fl3O84aotgunWZFZsDSCzAWjpc__MfLcrYwp7pdTWTCepGNtZhttC4YJ_aDS4PTPUnmV9oHKMNv-SEv5g8m_gBU7uM2BYk3kyoA_F3q-Q8u6XIQOigQRoTOO-O6bfnSMUNddYzpeTkdUfQ3p0EwbBZY6upG90fGLD0jc8PHuufrZhBf_L';

export const DEFAULT_CANDIDATE_PHOTO = '';

export function sanitizeCandidatePhotoUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.includes('AB6AXuAMZfZIEs70MklTnzRmlISB3X30dUJNcOtFbIUpizpnHFetejjsvszTfFs') ||
    url.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk')
  ) {
    return '';
  }
  return url;
}

export const COURSES_DATA: CourseInfo[] = [
  {
    id: 'bs',
    code: 'C-BS01',
    numberLabel: 'Curso 01 • Finanças & Banca',
    name: 'Banca e Seguros',
    shortDesc:
      'Operações bancárias, análise de risco, gestão de apólices e produtos financeiros do mercado angolano.',
    fullDesc:
      'O curso técnico de Banca e Seguros forma quadros médios altamente qualificados para instituições bancárias, seguradoras, fundos de pensões e corretoras financeiras em Angola.',
    icon: 'account_balance',
    badgeIcon: 'verified',
    badgeText: '60 Vagas • Diurno',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Operações Bancárias e Mercado de Capitais',
      'Técnicas de Seguros e Resseguros',
      'Matemática Financeira e Atuarial',
      'Direito Comercial e Bancário',
    ],
    careerPaths: [
      'Gestor de Conta e Atendimento Bancário',
      'Técnico de Subscrição e Sinistros em Seguradoras',
      'Analista de Crédito e Risco Financeiro',
    ],
  },
  {
    id: 'cg',
    code: 'C-CG02',
    numberLabel: 'Curso 02 • Ciências Económicas',
    name: 'Contabilidade e Gestão',
    shortDesc:
      'Plano Geral de Contabilidade (PGC Angola), fiscalidade, auditoria patrimonial e controlo de gestão.',
    fullDesc:
      'Prepara técnicos capazes de organizar e executar a contabilidade geral e analítica de empresas públicas e privadas, cumprindo as normas da AGT e do PGC angolano.',
    icon: 'calculate',
    badgeIcon: 'verified',
    badgeText: '70 Vagas • Diurno / Tarde',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Contabilidade Geral e Analítica (PGC)',
      'Fiscalidade e Impostos em Angola',
      'Gestão Orçamental e Tesouraria',
      'Aplicações Informáticas de Contabilidade',
    ],
    careerPaths: [
      'Técnico Oficial de Contas Júnior',
      'Assistente de Auditoria e Fiscalidade',
      'Analista Administrativo e Financeiro',
    ],
  },
  {
    id: 'fin',
    code: 'C-FIN03',
    numberLabel: 'Curso 03 • Controlo Financeiro',
    name: 'Finanças',
    shortDesc:
      'Planeamento financeiro, análise de investimentos, tesouraria empresarial e finanças públicas.',
    fullDesc:
      'Curso vocacionado para o domínio dos fluxos de caixa, avaliação de projectos de investimento, execução orçamental e mercados financeiros.',
    icon: 'payments',
    badgeIcon: 'verified',
    badgeText: '50 Vagas • Vespertino',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Análise Económica e Financeira',
      'Finanças Públicas e Empresariais',
      'Cálculo Financeiro e Estatística',
      'Controlo Interno e Tesouraria',
    ],
    careerPaths: [
      'Técnico de Tesouraria e Finanças',
      'Assistente de Planeamento Orçamental',
      'Operador de Mercados Financeiros',
    ],
  },
  {
    id: 'ge',
    code: 'C-GE04',
    numberLabel: 'Curso 04 • Administração',
    name: 'Gestão Empresarial',
    shortDesc:
      'Estratégia organizacional, logística, empreendedorismo e liderança de pequenas, médias e grandes empresas.',
    fullDesc:
      'Desenvolve competências transversais para administrar recursos materiais, financeiros e operacionais em organizações modernas do sector industrial e de serviços.',
    icon: 'business_center',
    badgeIcon: 'verified',
    badgeText: '55 Vagas • Diurno',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Organização e Gestão de Empresas',
      'Gestão de Aprovisionamento e Logística',
      'Empreendedorismo e Plano de Negócios',
      'Economia Aplicada',
    ],
    careerPaths: [
      'Gestor Operacional e Administrativo',
      'Coordenador de Logística e Operações',
      'Consultor Júnior de Negócios',
    ],
  },
  {
    id: 'grh',
    code: 'C-GRH05',
    numberLabel: 'Curso 05 • Capital Humano',
    name: 'Gestão de Recursos Humanos',
    shortDesc:
      'Recrutamento, processamento salarial, legislação laboral angolana (LGT) e desenvolvimento de equipas.',
    fullDesc:
      'Forma especialistas na administração de pessoal, aplicação da Lei Geral do Trabalho de Angola, gestão de carreiras e formação profissional.',
    icon: 'groups',
    badgeIcon: 'verified',
    badgeText: '45 Vagas • Vespertino',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Gestão Administrativa de Pessoal',
      'Direito e Legislação do Trabalho (LGT)',
      'Psicossociologia das Organizações',
      'Sistemas de Processamento Salarial',
    ],
    careerPaths: [
      'Técnico de Recursos Humanos',
      'Especialista em Processamento Salarial',
      'Analista de Recrutamento e Formação',
    ],
  },
  {
    id: 'gcm',
    code: 'C-GCM06',
    numberLabel: 'Curso 06 • Mercado & Vendas',
    name: 'Gestão Comercial e Marketing',
    shortDesc:
      'Estudos de mercado, marketing digital, gestão de vendas, distribuição e comunicação institucional.',
    fullDesc:
      'Capacita jovens profissionais para liderar estratégias comerciais, posicionamento de marcas, comércio electrónico e atendimento de excelência.',
    icon: 'campaign',
    badgeIcon: 'verified',
    badgeText: '40 Vagas • Vespertino',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Marketing Estratégico e Digital',
      'Técnicas de Negociação e Vendas',
      'Estudos de Mercado e Comportamento do Consumidor',
      'Comércio Internacional e Distribuição',
    ],
    careerPaths: [
      'Gestor Comercial e de Produto',
      'Especialista em Marketing Digital',
      'Supervisor de Vendas e Relacionamento',
    ],
  },
  {
    id: 'gsi',
    code: 'C-GSI07',
    numberLabel: 'Curso 07 • Sistemas & Redes',
    name: 'Gestão de Sistemas Informáticos',
    shortDesc:
      'Administração de servidores, redes corporativas, segurança cibernética e suporte a infraestruturas de TI.',
    fullDesc:
      'Une a engenharia de infraestruturas informáticas à gestão de parques tecnológicos, administração de redes locais/cloud e suporte técnico empresarial.',
    icon: 'dns',
    badgeIcon: 'verified',
    badgeText: '65 Vagas • Diurno',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Arquitectura e Manutenção de Computadores',
      'Redes de Computadores e Cibersegurança',
      'Sistemas Operativos e Servidores',
      'Gestão de Projectos Informáticos',
    ],
    careerPaths: [
      'Administrador de Sistemas e Redes',
      'Técnico de Infraestrutura e Cloud',
      'Especialista de Suporte Técnico (Helpdesk)',
    ],
  },
  {
    id: 'inf',
    code: 'C-INF08',
    numberLabel: 'Curso 08 • Engenharia de Software',
    name: 'Informática',
    shortDesc:
      'Algoritmia, desenvolvimento de aplicações web e móveis, bases de dados SQL e arquitectura de computadores.',
    fullDesc:
      'Focado no desenvolvimento de software moderno, programação estruturada e orientada a objectos, desenho de bases de dados e engenharia tecnológica.',
    icon: 'terminal',
    badgeIcon: 'verified',
    badgeText: '80 Vagas • Diurno',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Técnicas e Linguagens de Programação',
      'Sistemas de Gestão de Bases de Dados',
      'Desenvolvimento Web e Mobile',
      'Redes e Comunicação de Dados',
    ],
    careerPaths: [
      'Programador de Software Júnior',
      'Administrador de Bases de Dados',
      'Técnico de Sistemas Tecnológicos',
    ],
  },
  {
    id: 'ig',
    code: 'C-IG09',
    numberLabel: 'Curso 09 • Tecnologia & Negócios',
    name: 'Informática de Gestão',
    shortDesc:
      'Sistemas ERP, automação de processos empresariais, análise de dados de negócio e programação comercial.',
    fullDesc:
      'Integra o desenvolvimento de sistemas de informação com a gestão financeira e contabilística, preparando profissionais para liderar a transformação digital.',
    icon: 'analytics',
    badgeIcon: 'verified',
    badgeText: '80 Vagas • Diurno',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Sistemas de Informação e ERP (Primavera/SAP)',
      'Programação Aplicada à Gestão',
      'Contabilidade e Gestão Empresarial',
      'Bases de Dados Relacionais',
    ],
    careerPaths: [
      'Consultor de Sistemas ERP e Gestão',
      'Analista de Sistemas de Informação',
      'Gestor de Dados e Processos Digitais',
    ],
  },
  {
    id: 'sm',
    code: 'C-SM10',
    numberLabel: 'Curso 10 • Criatividade Digital',
    name: 'Sistema Multimédia',
    shortDesc:
      'Design gráfico, produção audiovisual, modelação 3D, interfaces UI/UX e desenvolvimento de plataformas interactivas.',
    fullDesc:
      'Forma técnicos criativos e tecnológicos para a indústria de media, televisão, agências de publicidade, design de interfaces digitais e animação.',
    icon: 'movie_edit',
    badgeIcon: 'verified',
    badgeText: '55 Vagas • Diurno / Tarde',
    duration: '4 Anos Lectivos (10.ª à 13.ª Classe)',
    subjects: [
      'Design Gráfico e Comunicação Visual',
      'Produção e Edição de Áudio e Vídeo',
      'Desenvolvimento de Interfaces Web (UI/UX)',
      'Animação 2D/3D e Computação Gráfica',
    ],
    careerPaths: [
      'Designer Multimédia e UI/UX',
      'Produtor e Editor Audiovisual',
      'Criador de Conteúdos Digitais e Web',
    ],
  },
];

const COURSE_NAME_TO_ID: Record<string, { id: CourseId; code: string; classCode: string }> = {
  'Banca e Seguros': { id: 'bs', code: 'C-BS01', classCode: 'BS-10A' },
  'Contabilidade e Gestão': { id: 'cg', code: 'C-CG02', classCode: 'CG-10A' },
  'Contabilidade e gestão': { id: 'cg', code: 'C-CG02', classCode: 'CG-10A' },
  Finanças: { id: 'fin', code: 'C-FIN03', classCode: 'FIN-10A' },
  'Gestão Empresarial': { id: 'ge', code: 'C-GE04', classCode: 'GE-10A' },
  'Gestão de Recursos Humanos': { id: 'grh', code: 'C-GRH05', classCode: 'GRH-10A' },
  'Gestão de Recursos humanos': { id: 'grh', code: 'C-GRH05', classCode: 'GRH-10A' },
  'Gestão Comercial e Marketing': { id: 'gcm', code: 'C-GCM06', classCode: 'GCM-10A' },
  'Gestão de Sistemas Informáticos': { id: 'gsi', code: 'C-GSI07', classCode: 'GSI-10A' },
  Informática: { id: 'inf', code: 'C-INF08', classCode: 'INF-10A' },
  'Informática de Gestão': { id: 'ig', code: 'C-IG09', classCode: 'IG-10B' },
  'Sistema Multimédia': { id: 'sm', code: 'C-SM10', classCode: 'SM-10A' },
};

export function candidateToPublicApp(c: Candidate): CandidateApplication {
  const numPart = parseInt(c.id.replace(/\D/g, '').slice(-4), 10) || 128;
  const serialCode = c.id === 'CAN-2026-000001' ? 'SC-173667' : `SC-${173540 + numPart}`;

  const statusTextMap: Record<Candidate['status'], string> = {
    nova: 'RECEBIDA / AGUARDANDO TRIAGEM',
    analise: 'EM ANÁLISE PEDAGÓGICA',
    pendente: 'DOCUMENTAÇÃO PENDENTE (REENVIO)',
    aprovada: 'ADMITIDO / APROVADO OFICIALMENTE',
    rejeitada: 'NÃO ADMITIDO / INDEFERIDO',
  };

  const phaseMap: Record<Candidate['status'], 1 | 2 | 3 | 4 | 5> = {
    nova: 1,
    analise: 2,
    pendente: 2,
    aprovada: 4,
    rejeitada: 3,
  };

  return {
    id: c.id,
    serialCode,
    fullName: c.fullName,
    biNumber: c.biNumber,
    gender: c.gender,
    birthDate: '2010-09-21',
    birthDateFormatted: c.birthDate,
    age: c.age,
    naturality: c.naturalidade,
    province: 'Luanda',
    municipality: c.municipalityLabel,
    residence: 'Luanda, Angola',
    address: c.address,
    phonePrimary: c.phonePrimary.replace('+244 ', ''),
    phoneSecondary: c.phoneAlt.replace('+244 ', ''),
    email: c.email,
    disability: c.nee.includes('Não') ? 'Não Possui' : c.nee,
    photoUrl: sanitizeCandidatePhotoUrl(c.photoUrl),
    prevSchool: c.previousSchool,
    completionYear: c.completionYear,
    finalGrade: c.averageGrade,
    mathGrade: c.grades.matematica,
    physicsGrade: c.grades.fisica,
    course: c.courseName,
    shift: c.shift.toUpperCase(),
    schoolYear: '2026 / 2027',
    examLocation: 'INSTITUTO MÉDIO FUTURO DE ANGOLA: SALA 10',
    examDate: '23/09/2026',
    examTime: '09:00 às 11:00',
    submittedDate: c.submittedDate,
    submittedTime: c.submittedTime.replace('às ', ''),
    status: statusTextMap[c.status],
    currentPhase: phaseMap[c.status],
    dispatchNote: c.dispatchNote,
    documents: {
      biFileName: c.documents[0]?.filename || 'BI_Candidato.pdf',
      certFileName: c.documents[1]?.filename || 'Certificado_9Classe.pdf',
      photoFileName: c.documents[2]?.filename || 'Foto_Passe.jpg',
      biStatus: c.documents[0]?.status || 'validado',
      certStatus: c.documents[1]?.status || 'verificacao',
      photoStatus: c.documents[2]?.status || 'validado',
    },
  };
}

export function publicAppToCandidate(app: CandidateApplication): Candidate {
  const courseMeta = COURSE_NAME_TO_ID[app.course] || {
    id: 'inf' as CourseId,
    code: 'C-INF08',
    classCode: 'INF-10A',
  };

  const words = app.fullName.split(' ').filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : app.fullName.slice(0, 2).toUpperCase();

  const phoneFormatted = app.phonePrimary.startsWith('+244')
    ? app.phonePrimary
    : `+244 ${app.phonePrimary}`;
  const phoneAltFormatted = app.phoneSecondary
    ? app.phoneSecondary.startsWith('+244')
      ? app.phoneSecondary
      : `+244 ${app.phoneSecondary}`
    : '+244 923 114 892';

  return {
    id: app.id,
    priorityLabel: 'Inscrição Portal Público',
    fullName: app.fullName,
    biNumber: app.biNumber,
    biValidity: '21/09/2030 (Válido)',
    birthDate: app.birthDateFormatted,
    age: app.age,
    gender: app.gender,
    naturalidade: app.naturality,
    phonePrimary: phoneFormatted,
    phoneAlt: phoneAltFormatted,
    contactNote: 'WhatsApp Ativo',
    email: app.email,
    address: app.address || `${app.municipality}, ${app.province}`,
    municipality: 'luanda',
    municipalityLabel: app.municipality || 'Luanda',
    nee: app.disability === 'Não Possui' ? 'Não declaradas / Não possui' : app.disability,
    photoUrl: app.photoUrl || DEFAULT_CANDIDATE_PHOTO,
    initials,
    previousSchool: app.prevSchool,
    completionYear: app.completionYear,
    averageGrade: app.finalGrade,
    grades: {
      matematica: app.mathGrade,
      portugues: Math.round(app.finalGrade),
      fisica: app.physicsGrade,
      quimica: Math.round(app.finalGrade),
    },
    courseId: courseMeta.id,
    courseName: app.course,
    courseCode: courseMeta.code,
    classCode: courseMeta.classCode,
    shift: app.shift.includes('TARDE') ? 'Turno Vespertino (Tarde)' : 'Turno Diurno (Manhã)',
    submittedDate: app.submittedDate,
    submittedTime: `às ${app.submittedTime}`,
    relativeTime: 'Hoje, Portal Público',
    status: 'nova',
    docSummaryLabel: '3/3 Válidos',
    docSubLabel: 'Submetido via Portal Web',
    documents: [
      {
        id: `doc-${app.id}-1`,
        title: '1. Bilhete de Identidade (BI)',
        filename: app.documents.biFileName,
        size: '940 KB',
        type: 'pdf',
        status: 'verificacao',
      },
      {
        id: `doc-${app.id}-2`,
        title: '2. Certificado de Habilitações da 9.ª Classe',
        filename: app.documents.certFileName,
        size: '1.8 MB',
        type: 'pdf',
        status: 'verificacao',
      },
      {
        id: `doc-${app.id}-3`,
        title: '3. Fotografia Tipo Passe Recente',
        filename: app.documents.photoFileName,
        size: '420 KB',
        type: 'image',
        status: 'validado',
      },
    ],
    checklist: {
      ageValid: app.age >= 13 && app.age <= 18,
      certReadable: true,
      biValid: true,
      guardianConfirmed: true,
      gradeAboveCutoff: app.finalGrade >= 12.5,
    },
    dispatchNote:
      'Candidatura submetida online através do Portal Público do Candidato. Aguarda conferência documental e validação final pela Comissão de Admissão.',
    auditLogs: [
      {
        id: `log-${app.id}-1`,
        timestamp: `${app.submittedDate} • ${app.submittedTime}`,
        title: 'Candidatura Submetida via Portal Público',
        description: `Registo online concluído pelo candidato (${app.serialCode} / ${app.id}).`,
        type: 'primary',
      },
    ],
  };
}
