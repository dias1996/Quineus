import React, { useState } from 'react';
import { PageView, CourseInfo } from '../types';
import {
  COURSES_DATA as PUBLIC_COURSES_INFO,
  HERO_LAB_BG,
  DEFAULT_CANDIDATE_PHOTO,
  candidateToPublicApp,
} from '../data/initialData';
import {
  Candidate,
  CourseId,
  COURSES_DATA as ADMIN_COURSES_DATA,
  IMFA_LOGO_URL,
} from '../data/imfaData';
import { CandidateAvatar } from './CandidateAvatar';
import { ItpgqLogo } from './ItpgqLogo';
import { exportCandidateReceiptPdf } from '../utils/exportReceiptPdf';
import {
  processImageFileToDataUrl,
  processDocumentFile,
  generateNextCandidateId,
} from '../utils/fileReader';
import campusBuildingImg from '../assets/images/itpgq_campus_building_1790776658067.jpg';

interface PublicPortalViewProps {
  candidates: Candidate[];
  onSubmitPublicApplication: (newCandidate: Candidate) => Promise<boolean> | void;
  onResubmitDocument: (
    candidateId: string,
    docId: string,
    newFilename: string,
    fileStorageUrl?: string,
    fileSize?: string
  ) => void;
  onUpdateCandidatePhoto?: (
    candidateId: string,
    photoDataUrl: string,
    filename: string,
    fileSize?: string
  ) => void;
  onGoToAdminPortal: (targetCandidateId?: string) => void;
  isAdminAuthenticated: boolean;
  adminName?: string;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  candidates,
  onSubmitPublicApplication,
  onResubmitDocument,
  onUpdateCandidatePhoto,
  onGoToAdminPortal,
  isAdminAuthenticated,
  adminName,
}) => {
  const [activePage, setActivePage] = useState<PageView>('inicio');
  const [logoError, setLogoError] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  // Course modal state
  const [selectedCourseModal, setSelectedCourseModal] = useState<CourseInfo | null>(null);

  // Consultation / Comprovativo state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lookedUpCandidateId, setLookedUpCandidateId] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resubmitFeedback, setResubmitFeedback] = useState<string | null>(null);
  const [pdfExportFeedback, setPdfExportFeedback] = useState<string | null>(null);

  const handleExportPdf = (cand: Candidate) => {
    const fileName = exportCandidateReceiptPdf(cand);
    setPdfExportFeedback(`Comprovativo oficial exportado com sucesso: ${fileName}`);
    setTimeout(() => {
      setPdfExportFeedback((prev) => (prev?.includes(fileName) ? null : prev));
    }, 5000);
  };

  // Application Form State
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [biNumber, setBiNumber] = useState('');
  const [birthDate, setBirthDate] = useState('2011-05-14');
  const [gender, setGender] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [naturalidade, setNaturalidade] = useState('Luanda');
  const [municipality, setMunicipality] = useState<Candidate['municipality']>('luanda');
  const [address, setAddress] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('+244 923 ');
  const [phoneAlt, setPhoneAlt] = useState('+244 912 ');
  const [email, setEmail] = useState('');
  const [nee, setNee] = useState('Não declaradas / Não possui');

  const [previousSchool, setPreviousSchool] = useState('');
  const [completionYear, setCompletionYear] = useState('2025/2026');
  const [matematica, setMatematica] = useState<number>(15);
  const [portugues, setPortugues] = useState<number>(15);
  const [fisica, setFisica] = useState<number>(14);
  const [quimica, setQuimica] = useState<number>(14);

  const [selectedCourseId, setSelectedCourseId] = useState<CourseId>('ig');
  const [shift, setShift] = useState<'Turno Diurno (Manhã)' | 'Turno Vespertino (Tarde)'>(
    'Turno Diurno (Manhã)'
  );
  const [biFileName, setBiFileName] = useState('BI_Candidato_2026.pdf');
  const [biFileSize, setBiFileSize] = useState('1.1 MB');
  const [biDataUrl, setBiDataUrl] = useState('');
  const [certFileName, setCertFileName] = useState('Certificado_9Classe_Autenticado.pdf');
  const [certFileSize, setCertFileSize] = useState('1.9 MB');
  const [certDataUrl, setCertDataUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('Fotografia_Passe_Candidato.jpg');
  const [photoFileSize, setPhotoFileSize] = useState('540 KB');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseSavedBanner, setSupabaseSavedBanner] = useState<string | null>(null);

  const handlePhotoFileSelect = async (file?: File | null) => {
    if (!file) return;
    setPhotoFileName(file.name);
    try {
      const processed = await processImageFileToDataUrl(file, 480, 600, 0.88);
      setPhotoDataUrl(processed.dataUrl);
      setPhotoFileSize(processed.sizeFormatted);
      setFormError(null);
    } catch {
      // ignore read error
    }
  };

  const handleBiFileSelect = async (file?: File | null) => {
    if (!file) return;
    setBiFileName(file.name);
    try {
      const processed = await processDocumentFile(file);
      setBiFileSize(processed.sizeFormatted);
      setBiDataUrl(processed.dataUrl);
    } catch {
      // ignore read error
    }
  };

  const handleCertFileSelect = async (file?: File | null) => {
    if (!file) return;
    setCertFileName(file.name);
    try {
      const processed = await processDocumentFile(file);
      setCertFileSize(processed.sizeFormatted);
      setCertDataUrl(processed.dataUrl);
    } catch {
      // ignore read error
    }
  };

  const handleDirectPhotoUpdate = async (candidateId: string, file?: File | null) => {
    if (!file) return;
    try {
      const processed = await processImageFileToDataUrl(file, 480, 600, 0.88);
      if (onUpdateCandidatePhoto) {
        onUpdateCandidatePhoto(
          candidateId,
          processed.dataUrl,
          processed.filename,
          processed.sizeFormatted
        );
      }
      setSupabaseSavedBanner(
        `Fotografia "${processed.filename}" carregada e armazenada automaticamente`
      );
      setResubmitFeedback(
        `Fotografia "${processed.filename}" atualizada e gravada automaticamente`
      );
    } catch {
      // ignore
    }
  };

  const lookedUpCandidate: Candidate | undefined =
    candidates.find((c) => c.id === lookedUpCandidateId) || candidates[0];
  const publicAppView = lookedUpCandidate ? candidateToPublicApp(lookedUpCandidate) : null;

  // Calculate live metrics from shared candidates state
  const dynamicTotalCount = candidates.length;

  const handleSearchCandidate = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery ?? searchQuery).trim().toLowerCase();
    if (!q) {
      setSearchError('Por favor, introduza um Nº de Processo (CAN-2026-...) ou Nº de BI.');
      return;
    }

    const found = candidates.find((c) => {
      const pub = candidateToPublicApp(c);
      return (
        c.id.toLowerCase() === q ||
        c.id.toLowerCase().includes(q) ||
        c.biNumber.toLowerCase() === q ||
        c.biNumber.toLowerCase().includes(q) ||
        pub.serialCode.toLowerCase() === q ||
        c.fullName.toLowerCase().includes(q)
      );
    });

    if (found) {
      setLookedUpCandidateId(found.id);
      setSearchError(null);
      setActivePage('consultar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSearchError(
        `Nenhum processo encontrado para "${customQuery ?? searchQuery}". Verifique o código CAN-2026-... ou o Nº do Bilhete de Identidade.`
      );
    }
  };

  const handleStartApplicationForCourse = (courseId: string) => {
    setSelectedCourseId(courseId as CourseId);
    setSelectedCourseModal(null);
    setFormError(null);
    setFormStep(1);
    setActivePage('candidatura');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOnlineApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !biNumber.trim()) {
      setFormStep(1);
      setFormError(
        'Por favor, preencha o Nome Completo e o Nº do Bilhete de Identidade (BI) no Passo 1.'
      );
      return;
    }

    const resolvedSchool =
      previousSchool.trim() || 'Complexo Escolar do Ensino Geral — Luanda';

    setIsSubmitting(true);

    const courseMeta =
      ADMIN_COURSES_DATA.find((c) => c.id === selectedCourseId) || ADMIN_COURSES_DATA[0];
    const safeMat = Number.isFinite(matematica) ? Math.min(20, Math.max(0, matematica)) : 14;
    const safePort = Number.isFinite(portugues) ? Math.min(20, Math.max(0, portugues)) : 14;
    const safeFis = Number.isFinite(fisica) ? Math.min(20, Math.max(0, fisica)) : 14;
    const safeQui = Number.isFinite(quimica) ? Math.min(20, Math.max(0, quimica)) : 14;
    const avg = Number(((safeMat + safePort + safeFis + safeQui) / 4).toFixed(1));
    const words = fullName.trim().split(' ').filter(Boolean);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

    const newId = generateNextCandidateId(candidates);

    // Format birthDate from YYYY-MM-DD to DD/MM/YYYY
    const parts = birthDate.split('-');
    const formattedBirth =
      parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '14/05/2011';
    const birthYear = parseInt(parts[0], 10) || 2011;
    const age = Math.max(13, Math.min(25, 2026 - birthYear));

    const municipalityLabels: Record<Candidate['municipality'], string> = {
      luanda: 'Luanda (Maianga / Ingombota)',
      viana: 'Município de Viana',
      cacuaco: 'Município de Cacuaco',
      belas: 'Município de Belas (Talatona)',
      cazenga: 'Município do Cazenga',
      talatona: 'Município de Talatona',
      outras: 'Outras Províncias / Municípios',
    };

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newCandidate: Candidate = {
      id: newId,
      priorityLabel: 'Inscrição Portal Público',
      fullName: fullName.trim(),
      biNumber: biNumber.trim().toUpperCase(),
      biValidity: '14/05/2031 (Válido)',
      birthDate: formattedBirth,
      age,
      gender,
      naturalidade: naturalidade.trim() || 'Luanda',
      phonePrimary: phonePrimary.trim() || '+244 923 400 500',
      phoneAlt: phoneAlt.trim() || '+244 912 000 111',
      contactNote: 'Portal Online (WhatsApp)',
      email: email.trim() || `${initials.toLowerCase()}.candidato@gmail.com`,
      address: address.trim() || `${municipalityLabels[municipality]}, Luanda`,
      municipality,
      municipalityLabel: municipalityLabels[municipality],
      nee,
      photoUrl: photoDataUrl || DEFAULT_CANDIDATE_PHOTO,
      initials,
      previousSchool: resolvedSchool,
      completionYear,
      averageGrade: avg,
      grades: {
        matematica: safeMat,
        portugues: safePort,
        fisica: safeFis,
        quimica: safeQui,
      },
      courseId: courseMeta.id,
      courseName: courseMeta.name,
      courseCode: courseMeta.code,
      classCode: courseMeta.classCode,
      shift,
      submittedDate: dateStr,
      submittedTime: `às ${timeStr}`,
      relativeTime: 'Agora mesmo (Portal Público)',
      status: 'nova',
      docSummaryLabel: '3/3 Anexados',
      docSubLabel: 'Aguarda Conferência',
      documents: [
        {
          id: `doc-${newId}-1`,
          title: '1. Bilhete de Identidade (BI)',
          filename: biFileName || `BI_${initials}.pdf`,
          size: biFileSize || '1.1 MB',
          type: 'pdf',
          status: 'verificacao',
          fileStorageUrl:
            biDataUrl ||
            `storage://itpgq-supabase/${newId}/${encodeURIComponent(
              biFileName || `BI_${initials}.pdf`
            )}`,
        },
        {
          id: `doc-${newId}-2`,
          title: '2. Certificado de Habilitações da 9.ª Classe',
          filename: certFileName || `Certificado_9Classe_${initials}.pdf`,
          size: certFileSize || '1.9 MB',
          type: 'pdf',
          status: 'verificacao',
          fileStorageUrl:
            certDataUrl ||
            `storage://itpgq-supabase/${newId}/${encodeURIComponent(
              certFileName || `Certificado_9Classe_${initials}.pdf`
            )}`,
        },
        {
          id: `doc-${newId}-3`,
          title: '3. Fotografia Tipo Passe Recente',
          filename: photoFileName || `Foto_Passe_${initials}.jpg`,
          size: photoFileSize || '540 KB',
          type: 'image',
          status: 'validado',
          fileStorageUrl: photoDataUrl || undefined,
          auditedBy: 'Validação Automática Portal',
          auditedAt: `${dateStr} • ${timeStr}`,
        },
      ],
      checklist: {
        ageValid: age >= 13 && age <= 22,
        certReadable: true,
        biValid: true,
        guardianConfirmed: true,
        gradeAboveCutoff: avg >= courseMeta.cutoffGrade,
      },
      dispatchNote:
        'Candidatura submetida online pelo estudante no Portal Público do ITPGQ. Dados, documentos e fotografia armazenados automaticamente no Supabase.',
      auditLogs: [
        {
          id: `log-${newId}-1`,
          timestamp: `${dateStr} • ${timeStr}`,
          title: 'Submissão Online no Portal Público',
          description: `Inscrição submetida pelo candidato para o curso de ${courseMeta.name} (${shift}) e sincronizada automaticamente com a base de dados Supabase.`,
          actor: fullName.trim(),
          type: 'primary',
        },
      ],
    };

    try {
      await onSubmitPublicApplication(newCandidate);
      setSupabaseSavedBanner(
        `Candidatura ${newCandidate.id}, anexos documentais e fotografia do candidato armazenados automaticamente`
      );
    } finally {
      setIsSubmitting(false);
    }

    setLookedUpCandidateId(newCandidate.id);
    setSearchQuery(newCandidate.id);
    setActivePage('comprovativo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const statusBadgeStyle = (status: Candidate['status']) => {
    switch (status) {
      case 'aprovada':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          dot: 'bg-emerald-600',
          icon: 'verified',
          title: 'CANDIDATURA APROVADA OFICIALMENTE',
        };
      case 'rejeitada':
        return {
          bg: 'bg-red-50 border-red-300 text-red-900',
          dot: 'bg-red-600',
          icon: 'cancel',
          title: 'CANDIDATURA INDEFERIDA / NÃO ADMITIDO',
        };
      case 'pendente':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          dot: 'bg-amber-600',
          icon: 'warning',
          title: 'DOCUMENTAÇÃO PENDENTE — REENVIO SOLICITADO',
        };
      case 'analise':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-900',
          dot: 'bg-blue-600',
          icon: 'pending_actions',
          title: 'EM ANÁLISE PELA COMISSÃO PEDAGÓGICA',
        };
      default:
        return {
          bg: 'bg-purple-50 border-purple-300 text-purple-900',
          dot: 'bg-purple-600',
          icon: 'fiber_new',
          title: 'SUBMISSÃO RECEBIDA — AGUARDANDO TRIAGEM',
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface antialiased">
      {/* INSTITUTIONAL TOP RIBBON */}
      <div className="bg-[#102A43] text-white px-space-md lg:px-12 py-2 text-[12px] border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4A72C]/20 text-[#f0c044] font-label-sm text-[10px] font-bold uppercase tracking-wider border border-[#D4A72C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0c044]"></span>
              Processo Seletivo 2026–2027 Aberto
            </span>
            <span className="hidden md:inline text-slate-300">
              Instituto Técnico Privado de Gestão Quineus
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-slate-300">
              Total de Inscrições: <strong className="text-white">{dynamicTotalCount}</strong>
            </span>
            <span className="text-white/25">|</span>
            <button
              type="button"
              onClick={() => onGoToAdminPortal()}
              className="inline-flex items-center gap-1.5 text-[#f0c044] hover:text-white font-label-sm text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>
                {isAdminAuthenticated
                  ? `Painel Admin Ativo (${adminName})`
                  : 'Acesso Administrativo (Secretaria / Comissão)'}
              </span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* PUBLIC PORTAL HEADER */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-space-md lg:px-12 h-20 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => setActivePage('inicio')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <ItpgqLogo className="h-12 w-12 shrink-0" />
            <span className="font-headline-sm text-xl font-bold text-primary tracking-tight">
              ITPGQ
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActivePage('inicio')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePage === 'inicio'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Início &amp; Cursos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormStep(1);
                setActivePage('candidatura');
              }}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePage === 'candidatura'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              <span>Nova Candidatura Online</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('comprovativo')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activePage === 'comprovativo'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Comprovativo Oficial</span>
            </button>
          </nav>

          {/* Right CTA Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onGoToAdminPortal()}
              className="px-3.5 py-2 rounded-lg border border-surface-variant bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Aceder ao Painel Administrativo"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">shield_person</span>
              <span className="hidden sm:inline">Área Administrativa</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION BAR */}
      <div className="md:hidden bg-surface-container-low border-b border-surface-container px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActivePage('inicio')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activePage === 'inicio' ? 'bg-primary text-white' : 'text-secondary'
          }`}
        >
          Início &amp; 10 Cursos
        </button>
        <button
          type="button"
          onClick={() => setActivePage('candidatura')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activePage === 'candidatura' ? 'bg-primary text-white' : 'text-secondary'
          }`}
        >
          Candidatura Online
        </button>
        <button
          type="button"
          onClick={() => setActivePage('comprovativo')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activePage === 'comprovativo' ? 'bg-primary text-white' : 'text-secondary'
          }`}
        >
          Comprovativo
        </button>
      </div>

      {/* =========================================================
          VIEW 1: PÁGINA INICIAL & CATÁLOGO DOS 10 CURSOS TÉCNICOS
          ========================================================= */}
      {activePage === 'inicio' && (
        <main className="flex-1">
          {/* HERO SECTION */}
          <section className="relative bg-gradient-to-br from-[#102A43] via-[#163252] to-[#3a0d16] text-white py-12 lg:py-20 px-space-md lg:px-12 overflow-hidden">
            {/* Soft & Transparent Campus Building Background */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              <img
                src={campusBuildingImg}
                alt="Edifício do Instituto Técnico Privado de Gestão Quineus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center opacity-22 scale-[1.02] filter blur-[0.5px] transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#102A43]/90 via-[#102A43]/75 to-[#3a0d16]/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/85 via-transparent to-[#102A43]/50" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/15 text-[#f0c044] font-label-sm text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>Ensino Técnico-Profissional Homologado pelo MED Angola</span>
                </div>

                <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.12] tracking-tight">
                  Candidaturas Online para a{' '}
                  <span className="text-[#f0c044]">10.ª Classe</span> — Ano Lectivo 2026–2027
                </h1>

                <p className="font-body-lg text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl">
                  Construa o seu futuro num dos <strong className="text-white">10 Cursos Técnicos</strong> do
                  Instituto Técnico Privado de Gestão &apos;QUINEUS&apos; (ITPGQ). Submeta a sua inscrição online,
                  anexe os seus documentos e acompanhe o despacho da Comissão Pedagógica em tempo
                  real.
                </p>

                {/* Quick Action CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormStep(1);
                      setActivePage('candidatura');
                    }}
                    className="px-6 py-3.5 rounded-xl bg-[#8F1725] hover:bg-[#a91d2d] text-white font-label-lg text-sm uppercase tracking-wider font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_document</span>
                    <span>Submeter Candidatura Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage('consultar')}
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-label-lg text-sm uppercase tracking-wider font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">manage_search</span>
                    <span>Consultar Processo / Resultado</span>
                  </button>
                </div>

                {/* Quick Process Lookup Box */}
                <form
                  onSubmit={(e) => handleSearchCandidate(e)}
                  className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 max-w-xl mt-4"
                >
                  <label className="block font-label-sm text-[11px] uppercase tracking-wider text-[#f0c044] mb-1.5">
                    Consulta Rápida de Candidatura (Sincronizada com a Secretaria):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nº Processo (ex: CAN-2026-000128) ou Nº do BI..."
                      className="flex-1 h-11 px-3.5 rounded-lg bg-white text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f0c044]"
                    />
                    <button
                      type="submit"
                      className="h-11 px-5 rounded-lg bg-[#D4A72C] hover:bg-[#e3b638] text-slate-950 font-label-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">search</span>
                      <span>Verificar Estado</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Hero Visual & Live Stats */}
              <div className="lg:col-span-5">
                <div className="bg-surface-container-lowest text-on-surface rounded-2xl p-4 shadow-2xl border border-white/20 space-y-4">
                  <div className="relative h-60 rounded-xl overflow-hidden bg-[#102A43]">
                    {!heroImgError ? (
                      <img
                        src={HERO_LAB_BG}
                        alt="Estudantes IMFA Laboratório"
                        onError={() => setHeroImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-5xl">school</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="font-label-sm text-[10px] uppercase tracking-widest text-[#f0c044] font-bold">
                        INFRAESTRUTURA MODERNA EM LUANDA
                      </span>
                      <p className="font-headline-sm text-base font-bold">
                        Laboratórios Tecnológicos e Ensino Prático Certificado
                      </p>
                    </div>
                  </div>

                  {/* Live Synchronized Metrics Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-3 rounded-xl bg-surface-container-low text-center">
                      <div className="font-headline-md text-xl font-bold text-primary">10</div>
                      <div className="font-label-sm text-[10px] text-secondary uppercase">
                        Cursos Técnicos
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container-low text-center">
                      <div className="font-headline-md text-xl font-bold text-emerald-700">
                        {dynamicTotalCount}
                      </div>
                      <div className="font-label-sm text-[10px] text-secondary uppercase">
                        Inscritos 2026
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 10 OFFICIAL TECHNICAL COURSES SECTION */}
          <section className="py-14 px-space-md lg:px-12 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-label-sm text-xs text-primary uppercase tracking-widest font-bold">
                  OFERTA FORMATIVA HOMOLOGADA (10.ª À 13.ª CLASSE)
                </span>
                <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                  10 Cursos Técnicos Oficiais do ITPGQ
                </h2>
                <p className="font-body-md text-secondary mt-1 max-w-2xl">
                  Escolha a sua área vocacional. As vagas e médias de corte estão ligadas em tempo
                  real ao Mapa de Vagas da Secretaria Académica.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormStep(1);
                  setActivePage('candidatura');
                }}
                className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Iniciar Inscrição na 10.ª Classe</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PUBLIC_COURSES_INFO.map((course) => {
                const adminCourse = ADMIN_COURSES_DATA.find((ac) => ac.id === course.id);
                const enrolled = candidates.filter((c) => c.courseId === course.id).length;
                const totalSpots = adminCourse?.totalSpots ?? 50;
                const occupancyPct = Math.min(100, Math.round((enrolled / totalSpots) * 100));
                const remainingSpots = Math.max(0, totalSpots - enrolled);

                return (
                  <div
                    key={course.id}
                    className="bg-surface-container-lowest rounded-xl border border-surface-container p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[24px]">
                            {course.icon}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-mono text-[11px] font-semibold">
                          {course.code} • {adminCourse?.classCode || '10A'}
                        </span>
                      </div>

                      <div>
                        <span className="font-label-sm text-[10px] text-secondary uppercase tracking-wider">
                          {course.numberLabel}
                        </span>
                        <h3 className="font-headline-md text-lg font-bold text-on-surface mt-0.5">
                          {course.name}
                        </h3>
                        <p className="font-body-sm text-secondary mt-1.5 leading-relaxed">
                          {course.shortDesc}
                        </p>
                      </div>

                      {/* Live Vacancy Progress Bar */}
                      <div className="p-3 rounded-lg bg-surface-container-low space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-label-sm text-secondary">
                            Lotação ({enrolled}/{totalSpots} vagas)
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {remainingSpots} livres
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${occupancyPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-secondary pt-0.5">
                          <span>Média de corte: {adminCourse?.cutoffGrade ?? 13.0} val.</span>
                          <span>{course.badgeText.split('•')[1] || 'Diurno'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-5 mt-4 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={() => setSelectedCourseModal(course)}
                        className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Plano Curricular
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartApplicationForCourse(course.id)}
                        className="py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Candidatar-se</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ADMISSION PIPELINE STEPS SECTION */}
          <section className="bg-surface-container-low py-12 px-space-md lg:px-12 border-t border-surface-container">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <span className="font-label-sm text-xs text-primary uppercase tracking-widest font-bold">
                  FLUXO INTEGRADO COM A COMISSÃO DE ADMISSÃO
                </span>
                <h2 className="font-headline-md text-2xl font-bold text-on-surface mt-1">
                  Como Funciona o Processo Seletivo 2026–2027
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    step: '01',
                    title: 'Inscrição Online',
                    desc: 'Preenchimento do formulário da 10.ª Classe e envio do BI, Certificado e Foto.',
                    icon: 'cloud_upload',
                  },
                  {
                    step: '02',
                    title: 'Análise Pedagógica',
                    desc: 'Conferência das notas da 9.ª Classe (Matemática, Português, Física e Química).',
                    icon: 'analytics',
                  },
                  {
                    step: '03',
                    title: 'Validação Documental',
                    desc: 'Auditoria técnica dos anexos pela Secretaria Académica do IMFA.',
                    icon: 'fact_check',
                  },
                  {
                    step: '04',
                    title: 'Prova / Triagem',
                    desc: 'Exame de admissão presencial e publicação da pauta oficial de apurados.',
                    icon: 'quiz',
                  },
                  {
                    step: '05',
                    title: 'Matrícula Definitiva',
                    desc: 'Emissão da ficha oficial de admissão e integração na turma da 10.ª Classe.',
                    icon: 'verified',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="bg-surface-container-lowest p-5 rounded-xl border border-surface-container space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        ETAPA {item.step}
                      </span>
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        {item.icon}
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-base font-bold text-on-surface">
                      {item.title}
                    </h3>
                    <p className="font-body-sm text-xs text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =========================================================
          VIEW 2: FORMULÁRIO DE CANDIDATURA ONLINE (10.ª CLASSE)
          ========================================================= */}
      {activePage === 'candidatura' && (
        <main className="flex-1 py-10 px-space-md lg:px-12 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs">
            <div>
              <span className="font-label-sm text-xs text-primary uppercase font-bold tracking-wider">
                FORMULÁRIO OFICIAL DE INSCRIÇÃO • ANO LECTIVO 2026–2027
              </span>
              <h1 className="font-headline-md text-2xl font-bold text-on-surface mt-0.5">
                Nova Candidatura à 10.ª Classe (IMFA)
              </h1>
              <p className="font-body-sm text-secondary mt-0.5">
                Ao submeter este formulário, o processo entra imediatamente na fila de triagem do
                Painel Administrativo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormStep(s as 1 | 2 | 3)}
                  className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    formStep === s
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container text-secondary hover:text-on-surface'
                  }`}
                >
                  0{s}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateOnlineApplication}
            className="bg-surface-container-lowest rounded-xl border border-surface-container p-6 lg:p-8 shadow-xs space-y-6"
          >
            {formError && (
              <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="hover:opacity-80 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* STEP 1: DADOS PESSOAIS */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <span>1. Identificação do Candidato &amp; Contactos</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setFullName('Mário Sebastião Domingos');
                      setBiNumber('009184522LA048');
                      setBirthDate('2011-03-19');
                      setGender('Masculino');
                      setNaturalidade('Luanda');
                      setMunicipality('viana');
                      setAddress('Vila de Viana, Rua Direita do Zango 1, Casa n.º 42');
                      setPhonePrimary('+244 924 881 209');
                      setPhoneAlt('+244 912 440 118');
                      setEmail('mario.domingos2026@gmail.com');
                      setPreviousSchool('Complexo Escolar Público n.º 4018 — Viana');
                      setFormError(null);
                    }}
                    className="text-xs font-label-md text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                    <span>Preencher Exemplo Rápido</span>
                  </button>
                </div>

                {/* Live Candidate Photo Upload & Preview Box in Step 1 */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CandidateAvatar
                      src={photoDataUrl}
                      alt={fullName || 'Candidato'}
                      initials={
                        fullName.trim()
                          ? fullName
                              .trim()
                              .split(' ')
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join('')
                              .toUpperCase()
                          : 'FT'
                      }
                      variant="passport"
                      className="w-20 h-24 rounded-lg shadow-xs shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
                        <span>Fotografia Tipo Passe do Candidato (3x4)</span>
                        {photoDataUrl && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                            Foto Anexada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary">
                        {photoDataUrl
                          ? `Ficheiro carregado: ${photoFileName} (${photoFileSize})`
                          : 'Carregue a fotografia do candidato (JPG ou PNG) para constar no Comprovativo Oficial e na base de dados Supabase.'}
                      </p>
                    </div>
                  </div>
                  <label className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-sm text-xs font-bold cursor-pointer hover:bg-primary-container transition-colors flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    <span>{photoDataUrl ? 'Substituir Fotografia' : 'Adicionar Fotografia'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoFileSelect(e.target.files?.[0])}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Nome Completo do Candidato (Conforme o BI) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Mário Sebastião Domingos"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Nº do Bilhete de Identidade (BI) *
                    </label>
                    <input
                      type="text"
                      required
                      value={biNumber}
                      onChange={(e) => setBiNumber(e.target.value)}
                      placeholder="Ex: 009184522LA048"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Género *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Masculino' | 'Feminino')}
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Município de Residência (Luanda) *
                    </label>
                    <select
                      value={municipality}
                      onChange={(e) =>
                        setMunicipality(e.target.value as Candidate['municipality'])
                      }
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="luanda">Luanda (Maianga / Ingombota / Rangel)</option>
                      <option value="viana">Município de Viana</option>
                      <option value="cacuaco">Município de Cacuaco</option>
                      <option value="belas">Município de Belas / Talatona</option>
                      <option value="cazenga">Município do Cazenga</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Telefone Principal (Estudante / WhatsApp) *
                    </label>
                    <input
                      type="text"
                      required
                      value={phonePrimary}
                      onChange={(e) => setPhonePrimary(e.target.value)}
                      placeholder="+244 923 000 000"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Telefone do Encarregado de Educação
                    </label>
                    <input
                      type="text"
                      value={phoneAlt}
                      onChange={(e) => setPhoneAlt(e.target.value)}
                      placeholder="+244 912 000 000"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Morada Completa em Luanda
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Bairro, Rua e referência da residência"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName.trim() || !biNumber.trim()) {
                        setFormError(
                          'Por favor, preencha o Nome Completo e o Nº do Bilhete de Identidade (BI) antes de avançar.'
                        );
                        return;
                      }
                      setFormError(null);
                      setFormStep(2);
                    }}
                    className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Seguinte: Curso &amp; Notas da 9.ª Classe</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: HISTÓRICO 9.ª CLASSE & ESCOLHA DOS 10 CURSOS */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="border-b border-surface-container pb-3">
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span>
                    <span>2. Habilitações da 9.ª Classe &amp; Opção de Curso Técnico</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Escola de Proveniência (Conclusão da 9.ª Classe) *
                    </label>
                    <input
                      type="text"
                      required
                      value={previousSchool}
                      onChange={(e) => setPreviousSchool(e.target.value)}
                      placeholder="Ex: Complexo Escolar Ngola Kiluanje — Luanda"
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Curso Técnico Pretendido (10 Cursos IMFA) *
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value as CourseId)}
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ADMIN_COURSES_DATA.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code} • Corte: {c.cutoffGrade} val.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-label-sm text-xs uppercase font-bold text-secondary mb-1">
                      Turno Pretendido *
                    </label>
                    <select
                      value={shift}
                      onChange={(e) =>
                        setShift(
                          e.target.value as
                            | 'Turno Diurno (Manhã)'
                            | 'Turno Vespertino (Tarde)'
                        )
                      }
                      className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Turno Diurno (Manhã)">Turno Diurno (Manhã — 07:30)</option>
                      <option value="Turno Vespertino (Tarde)">
                        Turno Vespertino (Tarde — 13:00)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Grades Input Grid */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-xs uppercase font-bold text-on-surface">
                      Classificações Finais no Certificado da 9.ª Classe (0 a 20 Valores)
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      Média Calculada:{' '}
                      {((matematica + portugues + fisica + quimica) / 4).toFixed(1)} Valores
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-secondary mb-1">Matemática</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step="0.5"
                        value={matematica}
                        onChange={(e) => setMatematica(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-variant font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">L. Portuguesa</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step="0.5"
                        value={portugues}
                        onChange={(e) => setPortugues(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-variant font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Física</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step="0.5"
                        value={fisica}
                        onChange={(e) => setFisica(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-variant font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-secondary mb-1">Química</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step="0.5"
                        value={quimica}
                        onChange={(e) => setQuimica(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-variant font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setFormStep(1);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!previousSchool.trim()) {
                        setFormError(
                          'Por favor, indique a Escola de Proveniência (Conclusão da 9.ª Classe) antes de avançar.'
                        );
                        return;
                      }
                      setFormError(null);
                      setFormStep(3);
                    }}
                    className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Seguinte: Anexos Documentais</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTOS & SUBMISSÃO */}
            {formStep === 3 && (
              <div className="space-y-5">
                <div className="border-b border-surface-container pb-3">
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">folder_check</span>
                    <span>3. Anexos Documentais Obrigatórios (Para Auditoria da Secretaria)</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        badge
                      </span>
                      <div>
                        <div className="font-headline-sm text-sm font-bold text-on-surface">
                          1. Bilhete de Identidade da República de Angola (PDF/JPG)
                        </div>
                        <div className="font-mono text-xs text-secondary">
                          {biFileName} ({biFileSize})
                        </div>
                      </div>
                    </div>
                    <label className="px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-xs font-semibold cursor-pointer hover:bg-surface-container text-center">
                      <span>Selecionar Ficheiro</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleBiFileSelect(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        workspace_premium
                      </span>
                      <div>
                        <div className="font-headline-sm text-sm font-bold text-on-surface">
                          2. Certificado de Habilitações da 9.ª Classe Autenticado
                        </div>
                        <div className="font-mono text-xs text-secondary">
                          {certFileName} ({certFileSize})
                        </div>
                      </div>
                    </div>
                    <label className="px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant text-xs font-semibold cursor-pointer hover:bg-surface-container text-center">
                      <span>Selecionar Ficheiro</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleCertFileSelect(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {photoDataUrl ? (
                        <CandidateAvatar
                          src={photoDataUrl}
                          alt={fullName || 'Candidato'}
                          initials="FT"
                          variant="passport"
                          className="w-14 h-16 rounded-lg shadow-2xs shrink-0"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-2xl">
                          account_box
                        </span>
                      )}
                      <div>
                        <div className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                          <span>3. Fotografia Tipo Passe Recente (Fundo Branco)</span>
                          {photoDataUrl && (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                              Pré-visualização Ativa
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-secondary">
                          {photoFileName} ({photoFileSize})
                        </div>
                      </div>
                    </div>
                    <label className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer hover:bg-primary-container text-center flex items-center gap-1.5 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                      <span>
                        {photoDataUrl ? 'Alterar Fotografia' : 'Selecionar Fotografia'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoFileSelect(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3.5 rounded-lg bg-surface-container-low cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    required
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <span className="text-xs text-secondary leading-relaxed">
                    Declaro, sob compromisso de honra, que as informações prestadas e as notas da
                    9.ª Classe correspondem aos documentos originais que serão validados pela
                    Comissão de Admissão do ITPGQ.
                  </span>
                </label>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setFormStep(2)}
                    className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-xs font-semibold cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3.5 rounded-xl bg-primary hover:bg-primary-container disabled:opacity-60 text-on-primary font-label-lg text-xs uppercase tracking-wider font-bold shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isSubmitting ? 'sync' : 'send'}
                    </span>
                    <span>
                      {isSubmitting
                        ? 'Aguardar um instante'
                        : 'Submeter Candidatura e Gerar Comprovativo'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </main>
      )}

      {/* =========================================================
          VIEW 3: CONSULTAR ESTADO DA CANDIDATURA (TEMPO REAL)
          ========================================================= */}
      {activePage === 'consultar' && (
        <main className="flex-1 py-10 px-space-md lg:px-12 max-w-5xl w-full mx-auto space-y-6">
          {/* Search Header Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="font-label-sm text-xs text-primary uppercase font-bold tracking-wider">
                  LIGAÇÃO EM TEMPO REAL COM O PAINEL ADMINISTRATIVO
                </span>
                <h1 className="font-headline-md text-2xl font-bold text-on-surface">
                  Consultar Estado do Processo de Admissão
                </h1>
              </div>
              {lookedUpCandidate && (
                <button
                  type="button"
                  onClick={() => onGoToAdminPortal(lookedUpCandidate.id)}
                  className="px-3.5 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Abrir {lookedUpCandidate.id} no Painel Admin</span>
                </button>
              )}
            </div>

            <form onSubmit={(e) => handleSearchCandidate(e)} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Introduza o Nº Processo (ex: CAN-2026-000001), Nº BI ou Nome..."
                className="flex-1 h-11 px-4 rounded-lg bg-surface-container-low border border-surface-variant font-mono text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-11 px-6 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Pesquisar Processo
              </button>
            </form>

            {searchError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                {searchError}
              </div>
            )}
          </div>

          {!lookedUpCandidate || !publicAppView ? (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-10 text-center space-y-3 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-secondary">
                folder_open
              </span>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                Nenhuma Candidatura Registada no Momento
              </h2>
              <p className="font-body-sm text-sm text-secondary max-w-md mx-auto">
                Ainda não existem processos submetidos no sistema. Submeta uma nova inscrição online
                para gerar o seu Nº de Processo e consultar o estado em tempo real.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormStep(1);
                  setActivePage('candidatura');
                }}
                className="mt-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                <span>Iniciar Nova Candidatura</span>
              </button>
            </div>
          ) : (
            /* Candidate Live Status Card */
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-6 lg:p-8 shadow-xs space-y-6">
            {/* Status Banner */}
            {(() => {
              const st = statusBadgeStyle(lookedUpCandidate.status);
              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${st.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">{st.icon}</span>
                    <div>
                      <div className="font-label-sm text-[10px] uppercase tracking-wider opacity-80">
                        ESTADO ATUAL DO PROCESSO {lookedUpCandidate.id}
                      </div>
                      <div className="font-headline-sm text-base font-bold">{st.title}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePage('comprovativo')}
                      className="px-3.5 py-2 rounded-lg bg-white/90 text-slate-900 font-label-sm text-xs font-bold shadow-2xs hover:bg-white cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      <span>Ver Comprovativo Oficial</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Candidate Summary Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-container">
              <div className="flex items-center gap-4">
                <CandidateAvatar
                  src={lookedUpCandidate.photoUrl}
                  alt={lookedUpCandidate.fullName}
                  initials={lookedUpCandidate.initials}
                  variant="passport"
                  className="w-16 h-20 rounded-xl shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {lookedUpCandidate.id}
                    </span>
                    <span className="text-secondary">•</span>
                    <span className="font-mono text-xs text-secondary">
                      Serial: {publicAppView.serialCode}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-xl font-bold text-on-surface mt-0.5">
                    {lookedUpCandidate.fullName}
                  </h2>
                  <p className="font-body-sm text-secondary">
                    BI: <strong className="text-on-surface">{lookedUpCandidate.biNumber}</strong> •
                    Curso:{' '}
                    <strong className="text-primary">{lookedUpCandidate.courseName}</strong> (
                    {lookedUpCandidate.shift})
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low text-right">
                <div className="font-label-sm text-[10px] text-secondary uppercase">
                  Média Final 9.ª Classe
                </div>
                <div className="font-headline-md text-2xl font-bold text-on-surface">
                  {lookedUpCandidate.averageGrade.toFixed(1)} <span className="text-xs">val.</span>
                </div>
              </div>
            </div>

            {/* 5-Stage Visual Pipeline */}
            <div className="space-y-3">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                Progresso nas 5 Etapas do Processo Seletivo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {[
                  { phase: 1, title: '1. Submissão Online', sub: lookedUpCandidate.submittedDate },
                  { phase: 2, title: '2. Análise Pedagógica', sub: 'Comissão IMFA' },
                  {
                    phase: 3,
                    title: '3. Validação Documental',
                    sub: lookedUpCandidate.docSummaryLabel,
                  },
                  { phase: 4, title: '4. Prova / Admissão', sub: 'Sala 10 • IMFA' },
                  {
                    phase: 5,
                    title: '5. Matrícula 10.ª Classe',
                    sub: lookedUpCandidate.classCode,
                  },
                ].map((step) => {
                  const isDone =
                    lookedUpCandidate.status === 'aprovada'
                      ? step.phase <= 4
                      : step.phase < publicAppView.currentPhase;
                  const isCurrent = step.phase === publicAppView.currentPhase;
                  return (
                    <div
                      key={step.phase}
                      className={`p-3 rounded-xl border ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : isCurrent
                          ? 'bg-primary/10 border-primary text-on-surface'
                          : 'bg-surface-container-low border-surface-container text-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{step.title}</span>
                        <span className="material-symbols-outlined text-[16px]">
                          {isDone ? 'check_circle' : isCurrent ? 'radio_button_checked' : 'schedule'}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">{step.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dispatch Note from Pedagogical Commission */}
            <div className="p-4 rounded-xl bg-surface-container-low border-l-4 border-primary space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs uppercase font-bold text-primary">
                  Parecer / Despacho Oficial da Comissão Pedagógica (Sincronizado):
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  Atualizado em Tempo Real
                </span>
              </div>
              <p className="font-body-md text-sm text-on-surface leading-relaxed">
                {lookedUpCandidate.dispatchNote}
              </p>
            </div>

            {/* Document Status & Re-upload Interactive List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                  Estado de Validação dos Documentos Anexados ({lookedUpCandidate.docSummaryLabel})
                </h3>
                {resubmitFeedback && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                    {resubmitFeedback}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {lookedUpCandidate.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-xs font-bold text-on-surface">
                          {doc.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            doc.status === 'validado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'ilegivel'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status === 'validado'
                            ? 'Validado'
                            : doc.status === 'ilegivel'
                            ? 'Ilegível / Recusado'
                            : 'Em Verificação'}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-secondary truncate">
                        {doc.filename}
                      </div>
                      {doc.warningNote && (
                        <p className="text-[11px] text-error font-medium pt-1">
                          Nota: {doc.warningNote}
                        </p>
                      )}
                    </div>

                    <label className="w-full py-1.5 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-[11px] font-bold text-center cursor-pointer hover:bg-primary-container transition-colors flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        {doc.type === 'image' ? 'add_a_photo' : 'upload_file'}
                      </span>
                      <span>
                        {doc.type === 'image'
                          ? 'Carregar / Atualizar Fotografia'
                          : 'Substituir / Reenviar Anexo'}
                      </span>
                      <input
                        type="file"
                        accept={doc.type === 'image' ? 'image/*' : undefined}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (doc.type === 'image') {
                            await handleDirectPhotoUpdate(lookedUpCandidate.id, file);
                          } else {
                            const processed = await processDocumentFile(file);
                            onResubmitDocument(
                              lookedUpCandidate.id,
                              doc.id,
                              processed.filename,
                              processed.dataUrl,
                              processed.sizeFormatted
                            );
                            setResubmitFeedback(
                              `Anexo "${processed.filename}" gravado automaticamente no Supabase!`
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </main>
      )}

      {/* =========================================================
          VIEW 4: COMPROVATIVO OFICIAL DE INSCRIÇÃO (FICHA IMFA)
          ========================================================= */}
      {activePage === 'comprovativo' && (!lookedUpCandidate || !publicAppView) && (
        <main className="flex-1 py-12 px-space-md lg:px-12 max-w-3xl w-full mx-auto">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-10 text-center space-y-3 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-secondary">badge</span>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface">
              Nenhum Comprovativo Emitido no Momento
            </h2>
            <p className="font-body-sm text-sm text-secondary max-w-md mx-auto">
              O sistema encontra-se sem candidaturas inseridas. Submeta uma nova candidatura online
              para emitir e descarregar o seu Comprovativo Oficial.
            </p>
            <button
              type="button"
              onClick={() => {
                setFormStep(1);
                setActivePage('candidatura');
              }}
              className="mt-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              <span>Submeter Nova Candidatura</span>
            </button>
          </div>
        </main>
      )}

      {activePage === 'comprovativo' && lookedUpCandidate && publicAppView && (
        <main className="flex-1 py-10 px-space-md lg:px-12 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActivePage('consultar')}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-xs font-semibold cursor-pointer"
            >
              ← Voltar à Consulta do Processo
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onGoToAdminPortal(lookedUpCandidate.id)}
                className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Auditar esta Ficha no Painel Administrativo</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Imprimir Comprovativo</span>
              </button>
            </div>
          </div>

          {supabaseSavedBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs print:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">
                  cloud_done
                </span>
                <span>{supabaseSavedBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSupabaseSavedBanner(null)}
                className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {pdfExportFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">
                  check_circle
                </span>
                <span>{pdfExportFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfExportFeedback(null)}
                className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Official Printable Receipt Card */}
          <div className="bg-white text-slate-900 rounded-2xl border-2 border-[#102A43]/20 shadow-lg overflow-hidden">
            {/* Header Banner */}
            <div className="bg-[#102A43] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#8F1725]">
              <div className="flex items-center gap-3">
                <ItpgqLogo className="h-12 w-12 shrink-0" />
                <div>
                  <h1 className="font-headline-md text-lg sm:text-xl font-bold">
                    COMPROVATIVO OFICIAL DE CANDIDATURA — 10.ª CLASSE
                  </h1>
                  <div className="text-xs text-slate-300">
                    Instituto Técnico Privado de Gestão Quineus (ITPGQ) • Ano Lectivo 2026–2027
                  </div>
                </div>
              </div>

              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15 text-right font-mono">
                <div className="text-[10px] text-[#f0c044] uppercase">Nº de Processo Oficial</div>
                <div className="text-base font-bold text-white">{lookedUpCandidate.id}</div>
                <div className="text-[11px] text-slate-300">Código: {publicAppView.serialCode}</div>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-3 flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <CandidateAvatar
                    src={lookedUpCandidate.photoUrl}
                    alt={lookedUpCandidate.fullName}
                    initials={lookedUpCandidate.initials}
                    variant="passport"
                    className="w-28 h-36 rounded-lg shadow-xs"
                  />
                  <span className="mt-2 font-mono text-xs font-bold text-slate-700">
                    {publicAppView.serialCode}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase mt-0.5">
                    Fotografia Validada
                  </span>
                  <label className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#1a3a5a] text-white font-label-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-colors print:hidden">
                    <span className="material-symbols-outlined text-[13px]">add_a_photo</span>
                    <span>
                      {lookedUpCandidate.photoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleDirectPhotoUpdate(lookedUpCandidate.id, e.target.files?.[0])
                      }
                    />
                  </label>
                </div>

                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Nome Completo do Candidato
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      {lookedUpCandidate.fullName}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Bilhete de Identidade (BI)
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                      {lookedUpCandidate.biNumber}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Curso Técnico Homologado
                    </div>
                    <div className="font-bold text-sm text-[#8F1725] mt-0.5">
                      {lookedUpCandidate.courseName} ({lookedUpCandidate.courseCode})
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Turma / Turno Atribuído
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      Turma {lookedUpCandidate.classCode} • {lookedUpCandidate.shift}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Escola de Proveniência (9.ª Classe)
                    </div>
                    <div className="font-semibold text-xs text-slate-800 mt-0.5">
                      {lookedUpCandidate.previousSchool}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Média de Acesso &amp; Estado Atual
                    </div>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      {lookedUpCandidate.averageGrade.toFixed(1)} Valores •{' '}
                      <span className="text-[#8F1725]">{publicAppView.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission & Commission Stamp Footer */}
              <div className="p-4 rounded-xl bg-[#102A43]/5 border border-[#102A43]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-[11px] text-slate-500">
                  Submetido em: {lookedUpCandidate.submittedDate}{' '}
                  {lookedUpCandidate.submittedTime}
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>REGISTO SINCRONIZADO COM A SECRETARIA ITPGQ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* COURSE CURRICULUM MODAL */}
      {selectedCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 lg:p-8 shadow-2xl border border-surface-container space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                  {selectedCourseModal.code} • {selectedCourseModal.duration}
                </span>
                <h3 className="font-headline-md text-2xl font-bold text-on-surface mt-2">
                  {selectedCourseModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseModal(null)}
                className="p-1.5 rounded-lg text-secondary hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-sm text-secondary leading-relaxed">
              {selectedCourseModal.fullDesc}
            </p>

            <div className="space-y-2">
              <h4 className="font-label-sm text-xs uppercase font-bold text-on-surface">
                Disciplinas Técnicas Nucleares:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCourseModal.subjects.map((sub) => (
                  <li
                    key={sub}
                    className="p-2.5 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      check_circle
                    </span>
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-label-sm text-xs uppercase font-bold text-on-surface">
                Saídas Profissionais &amp; Mercado de Trabalho:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedCourseModal.careerPaths.map((career) => (
                  <span
                    key={career}
                    className="px-3 py-1 rounded-md bg-secondary-container text-on-secondary-container text-xs font-semibold"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setSelectedCourseModal(null)}
                className="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleStartApplicationForCourse(selectedCourseModal.id)}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                <span>Candidatar-se a {selectedCourseModal.name}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC PORTAL FOOTER */}
      <footer className="bg-[#102A43] text-slate-300 py-8 px-space-md lg:px-12 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-bold text-white">
              © 2026–2027 ITPGQ • Instituto Técnico Politécnico de Gestão Quineus
            </div>
            <div className="text-slate-400 mt-0.5">
              Portal Público do Candidato integrado em tempo real com o Sistema de Gestão da
              Secretaria Académica.
            </div>
            <div className="text-slate-400 mt-0.5">
              Sistema Elaborado por Dianzenza Canga Manuel &apos;@dias&apos;
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActivePage('consultar')}
                className="hover:text-white cursor-pointer"
              >
                Consultar Processo
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onGoToAdminPortal()}
                className="text-[#f0c044] hover:underline font-semibold cursor-pointer"
              >
                Área Administrativa (Comissão / Secretaria)
              </button>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5 text-slate-300 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#f0c044]">
                  location_on
                </span>
                <span>Luanda, Cacuaco-Balumuca</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.494 5.457 5.604-1.471c1.911 1.199 4.172 1.894 6.606 1.894 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
                </svg>
                <span>936 827 003 - 926 060 354</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#f0c044]">
                  mail
                </span>
                <span>itpg.quineus@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
