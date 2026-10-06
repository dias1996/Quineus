/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ApplicationStatus,
  Candidate,
  COURSES_DATA,
  DocStatus,
  IMFA_LOGO_URL,
  INITIAL_CANDIDATES,
} from './data/imfaData';
import { DashboardView } from './components/DashboardView';
import { ApplicationsListView } from './components/ApplicationsListView';
import { CandidateDetailView } from './components/CandidateDetailView';
import {
  ManualRegistrationModal,
  SmsNotificationModal,
} from './components/PortalModals';
import { SecondaryModulesView } from './components/SecondaryModulesView';
import { AdminLoginView, AuthenticatedAdmin } from './components/AdminLoginView';
import { syncAuthorizedAccountNamesFromServer } from './lib/authRls';
import { PublicPortalView } from './components/PublicPortalView';
import { ItpgqLogo } from './components/ItpgqLogo';
import {
  deleteCandidatesFromSupabase,
  fetchCandidatesFromSupabase,
  insertSmsNotificationToSupabase,
  subscribeToSupabaseRealtime,
  upsertCandidateToSupabase,
} from './lib/supabase';
import { generateNextCandidateId } from './utils/fileReader';
import { sanitizeCandidatePhotoUrl } from './data/initialData';

export type NavPath =
  | 'visao-geral'
  | 'todas-as-candidaturas'
  | 'novas-candidaturas'
  | 'candidaturas-em-analise'
  | 'candidaturas-aprovadas'
  | 'candidaturas-rejeitadas'
  | 'detalhe-candidatura'
  | 'lista-de-candidatos'
  | 'validacao-documental'
  | 'gestao-de-cursos'
  | 'mapa-de-vagas'
  | 'relatorios-e-estatisticas'
  | 'exportacoes'
  | 'gestao-de-utilizadores'
  | 'historico-de-auditoria'
  | 'configuracoes-do-portal'
  | 'perfil-administrador';

export default function App() {
  const [portalMode, setPortalMode] = useState<'public' | 'admin'>('public');
  const [currentAdmin, setCurrentAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [pendingAdminCandidateId, setPendingAdminCandidateId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<NavPath>('visao-geral');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      localStorage.removeItem('imfa_shared_candidates_2026_v1');
      const saved = localStorage.getItem('imfa_shared_candidates_2026_clean_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: Candidate) => ({
            ...c,
            photoUrl: sanitizeCandidatePhotoUrl(c.photoUrl),
          }));
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_CANDIDATES;
  });
  const [academicYear, setAcademicYear] = useState<string>('Ano Letivo 2026–2027');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('imfa_shared_candidates_2026_clean_v2', JSON.stringify(candidates));
    } catch {
      // ignore storage errors
    }
  }, [candidates]);

  const mergeCloudWithLocalPhotos = (
    cloudList: Candidate[],
    localList: Candidate[]
  ): Candidate[] => {
    const localMap = new Map(localList.map((c) => [c.id, c]));
    return cloudList.map((cloudCand) => {
      const localCand = localMap.get(cloudCand.id);
      const bestPhoto =
        sanitizeCandidatePhotoUrl(cloudCand.photoUrl) ||
        sanitizeCandidatePhotoUrl(localCand?.photoUrl);
      return {
        ...cloudCand,
        photoUrl: bestPhoto,
        documents:
          cloudCand.documents && cloudCand.documents.length > 0
            ? cloudCand.documents
            : localCand?.documents || [],
      };
    });
  };

  const loadCandidatesFromCloud = async () => {
    try {
      const sbList = await fetchCandidatesFromSupabase();
      if (sbList !== null && Array.isArray(sbList)) {
        setCandidates((prev) => mergeCloudWithLocalPhotos(sbList, prev));
        return;
      }
    } catch {
      // ignore and try API fallback
    }

    fetch('/api/candidates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.candidates)) {
          setCandidates((prev) => mergeCloudWithLocalPhotos(data.candidates, prev));
        }
      })
      .catch(() => {
        // fallback to existing state
      });
  };

  useEffect(() => {
    loadCandidatesFromCloud();
    syncAuthorizedAccountNamesFromServer().catch(() => {});
    const unsubscribe = subscribeToSupabaseRealtime(() => {
      fetchCandidatesFromSupabase()
        .then((sbList) => {
          if (sbList !== null && Array.isArray(sbList)) {
            setCandidates((prev) => mergeCloudWithLocalPhotos(sbList, prev));
          }
        })
        .catch(() => {});
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const syncCandidateToBackend = async (cand: Candidate): Promise<boolean> => {
    const sbResult = await upsertCandidateToSupabase(cand).catch(() => ({ ok: false }));

    const token = currentAdmin?.idToken;
    if (token) {
      fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidate: cand }),
      }).catch(() => {});
    } else {
      fetch('/api/public/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate: cand }),
      }).catch(() => {});
    }

    return sbResult.ok;
  };

  // Modals & Popovers
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [smsCandidates, setSmsCandidates] = useState<Candidate[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const triggerToast = (title: string, message: string) => {
    setToast({ title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setActivePath('detalhe-candidatura');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToApplications = (statusFilter?: ApplicationStatus | '') => {
    if (statusFilter === 'nova') {
      setActivePath('novas-candidaturas');
    } else if (statusFilter === 'analise') {
      setActivePath('candidaturas-em-analise');
    } else if (statusFilter === 'aprovada') {
      setActivePath('candidaturas-aprovadas');
    } else if (statusFilter === 'rejeitada') {
      setActivePath('candidaturas-rejeitadas');
    } else {
      setActivePath('todas-as-candidaturas');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenManualRegistrationWithRls = () => {
    if (currentAdmin && !currentAdmin.permissions.canRegisterManualCandidate) {
      triggerToast(
        'Operação Restrita pela Política RLS',
        `A conta "${currentAdmin.name}" (${currentAdmin.roleTitle}) tem perfil deliberativo de avaliação. O registo presencial no balcão é realizado pela Secretaria Escolar ou Super Administrador.`
      );
      return;
    }
    setIsManualModalOpen(true);
  };

  const handleUpdateCandidatesStatus = (
    ids: string[],
    newStatus: ApplicationStatus,
    dispatchNoteOverride?: string
  ) => {
    if (
      currentAdmin &&
      (newStatus === 'aprovada' || newStatus === 'rejeitada') &&
      !currentAdmin.permissions.canApproveOrRejectCandidate
    ) {
      triggerToast(
        'Bloqueio de Política RLS (Nível Secretaria Escolar)',
        'A Secretaria Escolar pode conferir documentos e colocar processos "Em Análise" ou "Pendente", mas o despacho final de Aprovação/Rejeição é exclusivo da Comissão de Admissão e Super Administrador.'
      );
      return;
    }

    const actorLabel = currentAdmin
      ? `${currentAdmin.name} (${currentAdmin.rlsRole.toUpperCase()})`
      : 'Dr. Armando Silva';

    const statusLabelMap: Record<ApplicationStatus, string> = {
      nova: 'Nova Submissão',
      analise: 'Em Análise Pedagógica',
      pendente: 'Documentação Pendente',
      aprovada: 'Aprovada Oficialmente',
      rejeitada: 'Rejeitada pela Comissão',
    };

    setCandidates((prev) =>
      prev.map((c) => {
        if (!ids.includes(c.id)) return c;
        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: 'Agora',
          title: `Decisão: ${statusLabelMap[newStatus]}`,
          description:
            dispatchNoteOverride ||
            `Estado atualizado para ${statusLabelMap[newStatus]} por ${actorLabel}.`,
          actor: actorLabel,
          type:
            newStatus === 'aprovada'
              ? ('secondary' as const)
              : newStatus === 'rejeitada'
              ? ('error' as const)
              : ('tertiary' as const),
        };
        const updatedCandidate = {
          ...c,
          status: newStatus,
          dispatchNote: dispatchNoteOverride ?? c.dispatchNote,
          auditLogs: [newLog, ...c.auditLogs],
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );

    triggerToast(
      `Estado Atualizado (${ids.length} registo${ids.length > 1 ? 's' : ''})`,
      `Classificação alterada para "${statusLabelMap[newStatus]}" por ${actorLabel}.`
    );
  };

  const handleArchiveCandidates = (ids: string[]) => {
    const remaining = candidates.filter((c) => !ids.includes(c.id));
    setCandidates(remaining);
    if (ids.includes(selectedCandidateId)) {
      setSelectedCandidateId(remaining[0]?.id || '');
    }
    deleteCandidatesFromSupabase(ids).catch(() => {});
    const token = currentAdmin?.idToken;
    if (token) {
      fetch('/api/admin/candidates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      }).catch(() => {});
    }
    triggerToast(
      ids.length === 1 ? `Candidatura ${ids[0]} Eliminada` : 'Candidaturas Eliminadas',
      ids.length === 1
        ? `A candidatura ${ids[0]} foi removida permanentemente da base de dados.`
        : `${ids.length} processos foram removidos permanentemente da base de dados.`
    );
  };

  const handleUpdateDocumentStatus = (
    candidateId: string,
    docId: string,
    newDocStatus: DocStatus
  ) => {
    const actorLabel = currentAdmin ? currentAdmin.name : 'Dr. Armando Silva';
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updatedDocs = c.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: newDocStatus,
                auditedBy: actorLabel,
                auditedAt: 'Agora',
              }
            : d
        );
        const validCount = updatedDocs.filter((d) => d.status === 'validado').length;
        const docTitle = c.documents.find((d) => d.id === docId)?.title || 'Documento';

        const updatedCandidate = {
          ...c,
          documents: updatedDocs,
          docSummaryLabel: `${validCount}/${updatedDocs.length} Válidos`,
          auditLogs: [
            {
              id: `log-doc-${Date.now()}`,
              timestamp: 'Agora',
              title:
                newDocStatus === 'validado'
                  ? `Validação: ${docTitle}`
                  : `Recusa Documental: ${docTitle}`,
              description:
                newDocStatus === 'validado'
                  ? `Documento conferido e validado oficialmente por ${actorLabel}.`
                  : `Documento sinalizado como ilegível ou incompleto por ${actorLabel}.`,
              actor: actorLabel,
              type: newDocStatus === 'validado' ? ('secondary' as const) : ('error' as const),
            },
            ...c.auditLogs,
          ],
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );

    triggerToast(
      newDocStatus === 'validado' ? 'Documento Validado' : 'Documento Sinalizado',
      newDocStatus === 'validado'
        ? `O anexo foi autenticado por ${actorLabel}.`
        : 'O anexo foi marcado como ilegível para notificação ao encarregado.'
    );
  };

  const handleToggleChecklist = (
    candidateId: string,
    key: keyof Candidate['checklist']
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updatedCandidate = {
          ...c,
          checklist: {
            ...c.checklist,
            [key]: !c.checklist[key],
          },
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );
  };

  const handleAddTechnicalComment = (candidateId: string, comment: string) => {
    const actorLabel = currentAdmin ? currentAdmin.name : 'Dr. Armando Silva';
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updatedCandidate: Candidate = {
          ...c,
          auditLogs: [
            {
              id: `log-comment-${Date.now()}`,
              timestamp: 'Agora',
              title: 'Parecer Técnico sobre Documentos',
              description: comment,
              actor: actorLabel,
              type: 'tertiary',
            },
            ...c.auditLogs,
          ],
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );
    triggerToast('Parecer Técnico Adicionado', 'A observação foi anexada ao histórico de auditoria.');
  };

  const handleCreateManualCandidate = (data: {
    fullName: string;
    biNumber: string;
    birthDate: string;
    gender: 'Masculino' | 'Feminino';
    phonePrimary: string;
    email: string;
    municipality: Candidate['municipality'];
    previousSchool: string;
    courseId: Candidate['courseId'];
    matematica: number;
    portugues: number;
    fisica: number;
    quimica: number;
    photoUrl?: string;
    photoFileName?: string;
    photoFileSize?: string;
  }) => {
    const course = COURSES_DATA.find((c) => c.id === data.courseId) || COURSES_DATA[0];
    const avg = Number(
      ((data.matematica + data.portugues + data.fisica + data.quimica) / 4).toFixed(1)
    );
    const words = data.fullName.split(' ').filter(Boolean);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
        : data.fullName.slice(0, 2).toUpperCase();

    const newId = generateNextCandidateId(candidates);

    const newCandidate: Candidate = {
      id: newId,
      priorityLabel: 'Registo Presencial',
      fullName: data.fullName,
      biNumber: data.biNumber,
      biValidity: '15/10/2030 (Válido)',
      birthDate: data.birthDate || '14/05/2011',
      age: 15,
      gender: data.gender,
      naturalidade: 'Luanda',
      phonePrimary: data.phonePrimary,
      phoneAlt: '+244 923 000 111',
      contactNote: 'Secretaria Presencial',
      email: data.email || `${initials.toLowerCase()}.candidato@gmail.com`,
      address: `Província de Luanda, Município de ${data.municipality.toUpperCase()}`,
      municipality: data.municipality,
      municipalityLabel: data.municipality.toUpperCase(),
      nee: 'Não declaradas / Não possui',
      photoUrl: data.photoUrl || '',
      initials,
      previousSchool: data.previousSchool || 'Complexo Escolar do Ensino Geral — Luanda',
      completionYear: '2025/2026',
      averageGrade: avg,
      grades: {
        matematica: data.matematica,
        portugues: data.portugues,
        fisica: data.fisica,
        quimica: data.quimica,
      },
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      classCode: course.classCode,
      shift: 'Turno Diurno (Manhã)',
      submittedDate: '30/09/2026',
      submittedTime: 'às 12:05',
      relativeTime: 'Agora mesmo',
      status: 'analise',
      docSummaryLabel: '3/3 Válidos',
      docSubLabel: 'Conferido na Secretaria',
      documents: [
        {
          id: `doc-${newId}-1`,
          title: '1. Bilhete de Identidade (BI)',
          filename: `BI_${initials}_${data.biNumber.slice(0, 6)}.pdf`,
          size: '1.2 MB',
          type: 'pdf',
          status: 'validado',
          fileStorageUrl: `storage://itpgq-supabase/${newId}/BI_${initials}.pdf`,
          auditedBy: currentAdmin?.name || 'Secretaria ITPGQ',
          auditedAt: '30/09/2026 • Agora',
        },
        {
          id: `doc-${newId}-2`,
          title: '2. Certificado de Habilitações da 9.ª Classe',
          filename: `Certificado_9Classe_${initials}.pdf`,
          size: '1.8 MB',
          type: 'pdf',
          status: 'validado',
          fileStorageUrl: `storage://itpgq-supabase/${newId}/Certificado_${initials}.pdf`,
          auditedBy: currentAdmin?.name || 'Secretaria ITPGQ',
          auditedAt: '30/09/2026 • Agora',
        },
        {
          id: `doc-${newId}-3`,
          title: '3. Fotografia Tipo Passe Recente',
          filename: data.photoFileName || `Foto_Passe_${initials}.jpg`,
          size: data.photoFileSize || '720 KB',
          type: 'image',
          status: 'validado',
          fileStorageUrl: data.photoUrl || undefined,
          auditedBy: currentAdmin?.name || 'Secretaria ITPGQ',
          auditedAt: '30/09/2026 • Agora',
        },
      ],
      checklist: {
        ageValid: true,
        certReadable: true,
        biValid: true,
        guardianConfirmed: true,
        gradeAboveCutoff: avg >= course.cutoffGrade,
      },
      dispatchNote:
        'Candidatura registada presencialmente no balcão da Secretaria Académica do ITPGQ e sincronizada com o Supabase.',
      auditLogs: [
        {
          id: `log-${newId}-1`,
          timestamp: '30/09/2026 • Agora',
          title: 'Registo Manual na Secretaria',
          description: `Processo inserido e sincronizado no Supabase por ${
            currentAdmin?.name || 'Secretaria ITPGQ'
          }.`,
          actor: currentAdmin?.name || 'Secretaria ITPGQ',
          type: 'primary',
        },
      ],
    };

    setCandidates((prev) => [newCandidate, ...prev]);
    syncCandidateToBackend(newCandidate);
    setSelectedCandidateId(newCandidate.id);
    setActivePath('detalhe-candidatura');
    triggerToast(
      `Candidatura ${newId} Registada no Supabase`,
      `A ficha de ${data.fullName} (${course.name}) foi criada e armazenada automaticamente no Supabase.`
    );
  };

  const navLinkClass = (path: NavPath) =>
    activePath === path
      ? 'flex items-center gap-space-sm px-space-sm py-space-sm transition-colors bg-primary-container text-on-primary font-label-lg rounded-lg cursor-pointer w-full text-left'
      : 'flex items-center gap-space-sm px-space-sm py-space-sm rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer w-full text-left';

  const handlePublicApplicationSubmit = async (newCandidate: Candidate): Promise<boolean> => {
    setCandidates((prev) => [newCandidate, ...prev]);
    setSelectedCandidateId(newCandidate.id);
    const ok = await syncCandidateToBackend(newCandidate);
    triggerToast(
      `Candidatura ${newCandidate.id}`,
      `Candidatura ${newCandidate.id}, anexos documentais e fotografia do candidato armazenados automaticamente`
    );
    return ok;
  };

  const handleUpdateCandidatePhoto = (
    candidateId: string,
    photoDataUrl: string,
    filename: string,
    fileSize?: string
  ) => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updatedDocs = c.documents.map((d) =>
          d.type === 'image'
            ? {
                ...d,
                filename: filename || d.filename,
                size: fileSize || d.size,
                status: 'validado' as DocStatus,
                fileStorageUrl: photoDataUrl,
                auditedBy: currentAdmin?.name || 'Validação Automática Portal',
                auditedAt: `${dateStr} • ${timeStr}`,
              }
            : d
        );
        const updatedCandidate: Candidate = {
          ...c,
          photoUrl: photoDataUrl,
          documents: updatedDocs,
          auditLogs: [
            {
              id: `log-photo-${Date.now()}`,
              timestamp: `${dateStr} • ${timeStr}`,
              title: 'Fotografia do Candidato Atualizada',
              description: `Fotografia tipo passe "${filename}" adicionada e armazenada automaticamente no Supabase.`,
              actor: currentAdmin?.name || c.fullName,
              type: 'primary' as const,
            },
            ...c.auditLogs,
          ],
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );

    triggerToast(
      'Fotografia Gravada no Supabase',
      `A fotografia "${filename}" foi apresentada e armazenada automaticamente na base de dados do SUPABASE.`
    );
  };

  const handlePublicDocumentResubmit = (
    candidateId: string,
    docId: string,
    newFilename: string,
    fileStorageUrl?: string,
    fileSize?: string
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const updatedDocs = c.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                filename: newFilename,
                size: fileSize || d.size,
                fileStorageUrl: fileStorageUrl || d.fileStorageUrl,
                status: 'verificacao' as DocStatus,
                warningNote: undefined,
                auditedBy: 'Reenviado pelo Candidato (Portal Web)',
                auditedAt: '30/09/2026 • Agora',
              }
            : d
        );
        const updatedCandidate = {
          ...c,
          status: c.status === 'pendente' ? ('analise' as const) : c.status,
          docSubLabel: 'Novo Anexo Submetido',
          documents: updatedDocs,
          auditLogs: [
            {
              id: `log-resub-${Date.now()}`,
              timestamp: '30/09/2026 • Agora',
              title: 'Reenvio de Documento no Portal Público',
              description: `O candidato substituiu o ficheiro por "${newFilename}". Armazenado automaticamente no Supabase.`,
              actor: c.fullName,
              type: 'primary' as const,
            },
            ...c.auditLogs,
          ],
        };
        syncCandidateToBackend(updatedCandidate);
        return updatedCandidate;
      })
    );
    triggerToast(
      'Documento Sincronizado no Supabase',
      `O ficheiro "${newFilename}" foi armazenado na base de dados e aguarda validação.`
    );
  };

  const handleNavigateToAdminFromPublic = (targetCandidateId?: string) => {
    if (targetCandidateId) {
      setSelectedCandidateId(targetCandidateId);
      if (currentAdmin) {
        setActivePath('detalhe-candidatura');
      } else {
        setPendingAdminCandidateId(targetCandidateId);
      }
    }
    setPortalMode('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (portalMode === 'public') {
    return (
      <>
        <PublicPortalView
          candidates={candidates}
          onSubmitPublicApplication={handlePublicApplicationSubmit}
          onResubmitDocument={handlePublicDocumentResubmit}
          onUpdateCandidatePhoto={handleUpdateCandidatePhoto}
          onGoToAdminPortal={handleNavigateToAdminFromPublic}
          isAdminAuthenticated={Boolean(currentAdmin)}
          adminName={currentAdmin?.name}
        />
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-2xl flex items-start gap-space-sm border border-surface-container-highest/20">
            <span className="material-symbols-outlined text-tertiary-fixed-dim shrink-0 mt-0.5">
              verified
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-headline-sm text-label-md font-bold">{toast.title}</h4>
              <p className="font-body-sm text-body-sm text-secondary-fixed-dim mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-secondary-fixed-dim hover:text-inverse-on-surface cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </>
    );
  }

  if (!currentAdmin) {
    return (
      <AdminLoginView
        onBackToPublicPortal={() => setPortalMode('public')}
        onLoginSuccess={(admin) => {
          setCurrentAdmin(admin);
          if (pendingAdminCandidateId) {
            setSelectedCandidateId(pendingAdminCandidateId);
            setActivePath('detalhe-candidatura');
            setPendingAdminCandidateId(null);
          } else {
            setActivePath('visao-geral');
          }
          triggerToast(
            `Sessão Iniciada — ${admin.name}`,
            `Bem-vindo(a) ao Painel Administrativo do IMFA (${admin.roleTitle}).`
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          onClick={() => setActivePath('visao-geral')}
          className="p-space-lg bg-surface-container flex items-center gap-3 cursor-pointer"
        >
          <ItpgqLogo className="h-11 w-11 shrink-0" />
          <span className="font-headline-sm text-xl font-bold text-primary tracking-tight">
            ITPGQ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-md">
          <nav className="space-y-space-xs">
            <div className="px-space-sm pt-space-xs pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Dashboard
            </div>
            <button
              type="button"
              onClick={() => setActivePath('visao-geral')}
              className={navLinkClass('visao-geral')}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
              <span>Visão Geral</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalMode('public')}
              className="flex items-center justify-between px-space-sm py-space-sm rounded-lg font-label-md text-label-md text-primary bg-primary/8 hover:bg-primary/15 transition-colors cursor-pointer w-full text-left"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">public</span>
                <span>Portal Público</span>
              </div>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </button>

            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Candidaturas
            </div>
            <button
              type="button"
              onClick={() => setActivePath('todas-as-candidaturas')}
              className={navLinkClass('todas-as-candidaturas')}
            >
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
              <span>Todas Candidaturas</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePath('novas-candidaturas')}
              className={`flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors cursor-pointer w-full text-left ${
                activePath === 'novas-candidaturas'
                  ? 'bg-primary-container text-on-primary font-label-lg'
                  : 'font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">fiber_new</span>
                <span>Novas Candidaturas</span>
              </div>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-space-xs rounded">
                Recentes
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivePath('candidaturas-em-analise')}
              className={navLinkClass('candidaturas-em-analise')}
            >
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
              <span>Em Análise</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePath('candidaturas-aprovadas')}
              className={navLinkClass('candidaturas-aprovadas')}
            >
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>Aprovadas</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePath('candidaturas-rejeitadas')}
              className={navLinkClass('candidaturas-rejeitadas')}
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              <span>Rejeitadas</span>
            </button>

            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Candidatos &amp; Documentos
            </div>
            <button
              type="button"
              onClick={() => {
                if (candidates[0]) setSelectedCandidateId(candidates[0].id);
                setActivePath('detalhe-candidatura');
              }}
              className={navLinkClass('detalhe-candidatura')}
            >
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
              <span>Validação Documental</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePath('lista-de-candidatos')}
              className={navLinkClass('lista-de-candidatos')}
            >
              <span className="material-symbols-outlined text-[20px]">groups</span>
              <span>Lista de Candidatos</span>
            </button>

            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Cursos &amp; Vagas
            </div>
            <button
              type="button"
              onClick={() => setActivePath('gestao-de-cursos')}
              className={navLinkClass('gestao-de-cursos')}
            >
              <span className="material-symbols-outlined text-[20px]">domain</span>
              <span>Gestão de Cursos</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePath('mapa-de-vagas')}
              className={navLinkClass('mapa-de-vagas')}
            >
              <span className="material-symbols-outlined text-[20px]">event_seat</span>
              <span>Mapa de Vagas</span>
            </button>

            {currentAdmin.profileTab !== 'comissao' && (
              <>
                <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                  Relatórios &amp; Dados
                </div>
                <button
                  type="button"
                  onClick={() => setActivePath('relatorios-e-estatisticas')}
                  className={navLinkClass('relatorios-e-estatisticas')}
                >
                  <span className="material-symbols-outlined text-[20px]">monitoring</span>
                  <span>Relatórios &amp; Estatísticas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePath('exportacoes')}
                  className={navLinkClass('exportacoes')}
                >
                  <span className="material-symbols-outlined text-[20px]">file_download</span>
                  <span>Exportações</span>
                </button>
              </>
            )}

            <div className="px-space-sm pt-space-md pb-space-xs font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Administração
            </div>
            <button
              type="button"
              onClick={() => setActivePath('gestao-de-utilizadores')}
              className={navLinkClass('gestao-de-utilizadores')}
            >
              <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
              <span>Gestão de Utilizadores</span>
            </button>
            {currentAdmin.profileTab !== 'comissao' && (
              <>
                <button
                  type="button"
                  onClick={() => setActivePath('historico-de-auditoria')}
                  className={navLinkClass('historico-de-auditoria')}
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  <span>Histórico de Auditoria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePath('configuracoes-do-portal')}
                  className={navLinkClass('configuracoes-do-portal')}
                >
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                  <span>Configurações</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-space-md bg-surface-container-high m-space-sm rounded-xl">
          <div className="flex items-center gap-space-sm mb-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-headline-sm text-label-md text-on-surface font-semibold truncate">
                {currentAdmin.name}
              </span>
              <span className="font-body-sm text-body-sm text-secondary truncate">
                {currentAdmin.roleTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-space-xs">
            <button
              type="button"
              onClick={() => setActivePath('perfil-administrador')}
              className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">badge</span>Perfil
            </button>
            <button
              type="button"
              onClick={() => setCurrentAdmin(null)}
              className="font-label-sm text-label-sm text-error hover:text-on-error-container transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>Sair
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'pl-0 lg:pl-72' : 'pl-0'}`}>
        {/* TOP HEADER */}
        <header
          className={`fixed top-0 right-0 h-16 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-lg flex items-center justify-between transition-all duration-200 ${
            sidebarOpen ? 'left-0 lg:left-72' : 'left-0'
          }`}
        >
          <div className="flex items-center gap-space-md">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-space-xs rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              type="button"
              title="Alternar Menu Lateral"
            >
              <span className="material-symbols-outlined text-[24px]">menu_open</span>
            </button>
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm text-title-md text-on-surface hidden sm:inline">
                Gestão de Admissões
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="relative hidden lg:block w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary">
                search
              </span>
              <input
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (activePath === 'visao-geral' && e.target.value.trim().length > 1) {
                    setActivePath('todas-as-candidaturas');
                  }
                }}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container text-body-sm font-body-sm text-on-surface placeholder-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Buscar candidato (CAN-2026-...)"
                type="text"
              />
            </div>

            <div className="flex items-center gap-space-xs relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-space-xs rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                type="button"
                title="Alertas de Secretaria"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {candidates.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant p-space-md z-50 space-y-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-label-md font-bold text-on-surface">
                      Notificações da Comissão
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-secondary hover:text-on-surface text-body-sm cursor-pointer"
                      type="button"
                    >
                      Fechar
                    </button>
                  </div>
                  {candidates.length === 0 ? (
                    <p className="font-body-sm text-body-sm text-secondary py-2">
                      Sem notificações pendentes no momento.
                    </p>
                  ) : (
                    candidates.slice(0, 3).map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => {
                          setSelectedCandidateId(cand.id);
                          setActivePath('detalhe-candidatura');
                          setShowNotifications(false);
                        }}
                        className="p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer"
                      >
                        <p className="font-label-sm text-label-sm text-primary">
                          {cand.id} • {cand.status.toUpperCase()}
                        </p>
                        <p className="font-body-sm text-body-sm text-secondary">
                          {cand.fullName} ({cand.courseName}).
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={() => setPortalMode('public')}
                className="flex items-center gap-1.5 px-space-sm py-space-xs bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 font-label-md text-label-md transition-colors cursor-pointer whitespace-nowrap"
                type="button"
                title="Alternar para o Portal Público de Candidaturas"
              >
                <span className="material-symbols-outlined text-[17px]">public</span>
                <span className="hidden sm:inline">Portal Público</span>
              </button>

              <button
                onClick={() =>
                  setAcademicYear((prev) =>
                    prev.includes('2026–2027')
                      ? 'Ano Letivo 2025–2026 (Arquivo)'
                      : 'Ano Letivo 2026–2027'
                  )
                }
                className="hidden sm:flex items-center gap-1 px-space-sm py-space-xs bg-surface-container rounded-lg text-secondary hover:text-on-surface font-label-md text-label-md transition-colors cursor-pointer whitespace-nowrap"
                type="button"
              >
                <span>2026–2027</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              <button
                onClick={handleOpenManualRegistrationWithRls}
                className="flex items-center gap-space-xs bg-primary text-on-primary px-space-md py-space-xs rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-[0_1px_8px_rgba(0,0,0,0.04)] cursor-pointer whitespace-nowrap"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden md:inline">Nova Candidatura</span>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN VIEWPORT */}
        <main className="w-full pt-16 bg-surface min-h-screen">
          {activePath === 'visao-geral' && (
            <DashboardView
              candidates={candidates}
              academicYear={academicYear}
              onAcademicYearChange={setAcademicYear}
              onNavigateToApplications={handleNavigateToApplications}
              onSelectCandidate={handleSelectCandidate}
              onOpenManualRegistration={handleOpenManualRegistrationWithRls}
              onQuickAction={triggerToast}
              onBatchValidatePending={() => {
                const pendingIds = candidates
                  .filter((c) => c.status === 'nova' || c.status === 'analise')
                  .map((c) => c.id);
                handleUpdateCandidatesStatus(
                  pendingIds,
                  'aprovada',
                  'Lote validado e aprovado em massa.'
                );
              }}
            />
          )}

          {(activePath === 'todas-as-candidaturas' ||
            activePath === 'novas-candidaturas' ||
            activePath === 'candidaturas-em-analise' ||
            activePath === 'candidaturas-aprovadas' ||
            activePath === 'candidaturas-rejeitadas' ||
            activePath === 'lista-de-candidatos') && (
            <ApplicationsListView
              candidates={candidates}
              initialStatusFilter={
                activePath === 'novas-candidaturas'
                  ? 'nova'
                  : activePath === 'candidaturas-em-analise'
                  ? 'analise'
                  : activePath === 'candidaturas-aprovadas'
                  ? 'aprovada'
                  : activePath === 'candidaturas-rejeitadas'
                  ? 'rejeitada'
                  : ''
              }
              pageTitleOverride={
                activePath === 'novas-candidaturas'
                  ? 'Novas Candidaturas Recentes — 10.ª Classe'
                  : activePath === 'candidaturas-em-analise'
                  ? 'Candidaturas em Análise Pedagógica — 10.ª Classe'
                  : activePath === 'candidaturas-aprovadas'
                  ? 'Candidaturas Aprovadas — 10.ª Classe'
                  : activePath === 'candidaturas-rejeitadas'
                  ? 'Candidaturas Rejeitadas — 10.ª Classe'
                  : undefined
              }
              globalSearchQuery={globalSearch}
              onSelectCandidate={handleSelectCandidate}
              onUpdateCandidatesStatus={handleUpdateCandidatesStatus}
              onArchiveCandidates={handleArchiveCandidates}
              onOpenManualRegistration={handleOpenManualRegistrationWithRls}
              onQuickAction={triggerToast}
              onOpenSmsModal={(cands) => setSmsCandidates(cands)}
            />
          )}

          {(activePath === 'detalhe-candidatura' || activePath === 'validacao-documental') &&
            (selectedCandidate ? (
              <CandidateDetailView
                candidate={selectedCandidate}
                allCandidates={candidates}
                onSelectCandidate={handleSelectCandidate}
                onBackToDashboard={() => setActivePath('visao-geral')}
                onBackToList={() => setActivePath('todas-as-candidaturas')}
                onUpdateStatus={(newStatus, note) =>
                  handleUpdateCandidatesStatus([selectedCandidate.id], newStatus, note)
                }
                onUpdateDocumentStatus={(docId, newDocStatus) =>
                  handleUpdateDocumentStatus(selectedCandidate.id, docId, newDocStatus)
                }
                onUpdateCandidatePhoto={handleUpdateCandidatePhoto}
                onToggleChecklist={(key) => handleToggleChecklist(selectedCandidate.id, key)}
                onAddTechnicalComment={(comment) =>
                  handleAddTechnicalComment(selectedCandidate.id, comment)
                }
                onDeleteCandidate={(candidateId) => handleArchiveCandidates([candidateId])}
                onOpenSmsModal={(cands) => setSmsCandidates(cands)}
                onQuickAction={triggerToast}
              />
            ) : (
              <div className="p-space-xl max-w-2xl mx-auto text-center space-y-space-md">
                <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm space-y-space-sm border border-surface-container">
                  <span className="material-symbols-outlined text-[42px] text-secondary">
                    folder_off
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Nenhuma Candidatura Registada
                  </h2>
                  <p className="font-body-md text-body-md text-secondary">
                    O sistema encontra-se limpo, sem dados de exemplo inseridos. Registe uma nova
                    candidatura manualmente ou através do Portal Público para iniciar a validação
                    documental.
                  </p>
                  <div className="pt-space-sm flex justify-center gap-space-sm">
                    <button
                      type="button"
                      onClick={() => setIsManualModalOpen(true)}
                      className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Registar Candidatura Manual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePath('visao-geral')}
                      className="px-space-md py-space-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
                    >
                      Voltar ao Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {(activePath === 'gestao-de-cursos' ||
            activePath === 'mapa-de-vagas' ||
            activePath === 'relatorios-e-estatisticas' ||
            activePath === 'exportacoes' ||
            activePath === 'gestao-de-utilizadores' ||
            activePath === 'historico-de-auditoria' ||
            activePath === 'configuracoes-do-portal' ||
            activePath === 'perfil-administrador') && (
            <SecondaryModulesView
              activePath={activePath}
              candidates={candidates}
              currentAdmin={currentAdmin}
              onSwitchAdmin={(newAdmin) => {
                setCurrentAdmin(newAdmin);
                if (
                  newAdmin.profileTab === 'comissao' &&
                  (activePath === 'historico-de-auditoria' ||
                    activePath === 'configuracoes-do-portal' ||
                    activePath === 'relatorios-e-estatisticas' ||
                    activePath === 'exportacoes')
                ) {
                  setActivePath('visao-geral');
                }
                triggerToast(
                  `Sessão RLS Alternada — ${newAdmin.name}`,
                  `Nível de acesso ativo: ${newAdmin.levelBadge} (${newAdmin.email}).`
                );
              }}
              onRenameUserSuccess={(uid, newName) => {
                setCurrentAdmin((prev) =>
                  prev && prev.uid === uid ? { ...prev, name: newName } : prev
                );
              }}
              onSelectCandidate={handleSelectCandidate}
              onQuickAction={triggerToast}
              onRefreshCandidates={loadCandidatesFromCloud}
            />
          )}
        </main>
      </div>

      {/* MANUAL APPLICATION MODAL */}
      <ManualRegistrationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleCreateManualCandidate}
      />

      {/* SMS / WHATSAPP MODAL */}
      {smsCandidates.length > 0 && (
        <SmsNotificationModal
          candidates={smsCandidates}
          onClose={() => setSmsCandidates([])}
          onSend={(channel, msg) => {
            smsCandidates.forEach((cand) => {
              insertSmsNotificationToSupabase({
                candidateId: cand.id,
                recipientName: cand.fullName,
                recipientPhone: cand.phonePrimary,
                channel,
                message: msg,
                sentBy: currentAdmin?.name || 'Secretaria Académica ITPGQ',
              });
            });
            setSmsCandidates([]);
            triggerToast(
              `Notificação ${channel} Enviada`,
              `Mensagem despachada com sucesso para ${smsCandidates.length} contacto(s) (+244): "${msg.slice(0, 60)}..."`
            );
          }}
        />
      )}

      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-2xl flex items-start gap-space-sm border border-surface-container-highest/20">
          <span className="material-symbols-outlined text-tertiary-fixed-dim shrink-0 mt-0.5">
            verified
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-headline-sm text-label-md font-bold">{toast.title}</h4>
            <p className="font-body-sm text-body-sm text-secondary-fixed-dim mt-0.5">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-secondary-fixed-dim hover:text-inverse-on-surface cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
