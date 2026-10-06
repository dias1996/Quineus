import React, { useMemo, useState } from 'react';
import { ApplicationStatus, Candidate, COURSES_DATA } from '../data/imfaData';
import { CandidateAvatar } from './CandidateAvatar';

interface ApplicationsListViewProps {
  candidates: Candidate[];
  initialStatusFilter?: ApplicationStatus | '';
  globalSearchQuery: string;
  onSelectCandidate: (candidateId: string) => void;
  onUpdateCandidatesStatus: (ids: string[], newStatus: ApplicationStatus, reason?: string) => void;
  onArchiveCandidates: (ids: string[]) => void;
  onOpenManualRegistration: () => void;
  onQuickAction: (title: string, message: string) => void;
  onOpenSmsModal: (candidates: Candidate[]) => void;
  pageTitleOverride?: string;
}

export const ApplicationsListView: React.FC<ApplicationsListViewProps> = ({
  candidates,
  initialStatusFilter = '',
  globalSearchQuery,
  onSelectCandidate,
  onUpdateCandidatesStatus,
  onArchiveCandidates,
  onOpenManualRegistration,
  onQuickAction,
  onOpenSmsModal,
  pageTitleOverride,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>(initialStatusFilter);
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [docAuditFilter, setDocAuditFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('30d');
  const [perPage, setPerPage] = useState('15');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBatchStateMenu, setShowBatchStateMenu] = useState(false);

  // Sync when sidebar changes statusFilter prop
  React.useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const effectiveSearch = (localSearch || globalSearchQuery).trim().toLowerCase();

  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      if (effectiveSearch) {
        const matchSearch =
          cand.fullName.toLowerCase().includes(effectiveSearch) ||
          cand.id.toLowerCase().includes(effectiveSearch) ||
          cand.biNumber.toLowerCase().includes(effectiveSearch) ||
          cand.phonePrimary.toLowerCase().includes(effectiveSearch);
        if (!matchSearch) return false;
      }

      if (courseFilter && cand.courseId !== courseFilter) return false;
      if (statusFilter && cand.status !== statusFilter) return false;
      if (municipalityFilter && cand.municipality !== municipalityFilter) return false;

      if (docAuditFilter) {
        const validDocs = cand.documents.filter((d) => d.status === 'validado').length;
        const hasRejected = cand.documents.some(
          (d) => d.status === 'ilegivel' || d.status === 'falta'
        );
        if (docAuditFilter === 'completa' && validDocs < 3 && cand.docSummaryLabel !== '3/3 Válidos')
          return false;
        if (docAuditFilter === 'pendente' && cand.status !== 'pendente' && cand.status !== 'nova')
          return false;
        if (docAuditFilter === 'recusada' && !hasRejected) return false;
      }

      if (dateFilter === 'hoje' && cand.submittedDate !== '29/09/2026') return false;

      return true;
    });
  }, [
    candidates,
    effectiveSearch,
    courseFilter,
    statusFilter,
    municipalityFilter,
    docAuditFilter,
    dateFilter,
  ]);

  const visibleIds = filteredCandidates.map((c) => c.id);
  const selectedVisibleIds = selectedIds.filter((id) => visibleIds.includes(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setCourseFilter('');
    setStatusFilter('');
    setMunicipalityFilter('');
    setDocAuditFilter('');
    setDateFilter('30d');
    setCurrentPage(1);
  };

  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? candidates.filter((c) => selectedIds.includes(c.id))
      : filteredCandidates;

    const headers = [
      'N. Candidatura',
      'Nome Completo',
      'Bilhete de Identidade',
      'Curso Pretendido',
      'Turma',
      'Media 9. Classe',
      'Telefone',
      'Data Submissao',
      'Estado',
    ];
    const rows = listToExport.map((c) => [
      c.id,
      `"${c.fullName}"`,
      c.biNumber,
      `"${c.courseName}"`,
      c.classCode,
      c.averageGrade.toString().replace('.', ','),
      `"${c.phonePrimary}"`,
      c.submittedDate,
      c.status.toUpperCase(),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      onlySelected
        ? `Candidaturas_Selecionadas_IMFA_${selectedIds.length}.csv`
        : 'Pauta_Candidaturas_IMFA_10Classe_2026.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onQuickAction(
      'Exportação Concluída',
      `Foram exportados ${listToExport.length} registos oficiais para ficheiro estruturado.`
    );
  };

  return (
    <div className="px-space-md lg:px-margin py-space-lg flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="space-y-space-xs max-w-3xl">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>ADMINISTRAÇÃO ESCOLAR · SISTEMA INTEGRADO IMFA</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {pageTitleOverride || 'Gestão de Candidaturas — 10.ª Classe'}
          </h1>
          <p className="font-body-md text-body-md text-secondary leading-relaxed">
            Pesquise, filtre, audite e efetue operações em massa nas candidaturas submetidas para o
            ano letivo 2026–2027. Processo rigoroso de ingresso no Ensino Técnico-Profissional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            onClick={() => handleExportCSV(false)}
            className="h-10 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">table_view</span>
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() =>
              onQuickAction(
                'PDF Oficial Gerado',
                'O documento Pauta_Geral_Candidaturas_IMFA_2026.pdf foi preparado com selo oficial.'
              )
            }
            className="h-10 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              picture_as_pdf
            </span>
            <span>PDF Oficial</span>
          </button>
          <button
            onClick={() => window.print()}
            className="h-10 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Imprimir Pauta</span>
          </button>
          <button
            onClick={onOpenManualRegistration}
            className="h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-space-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>+ Nova Candidatura Manual</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-space-sm">
        <div
          onClick={() => setStatusFilter('')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === '' ? 'ring-1 ring-primary' : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Total Inscritos</span>
            <span className="material-symbols-outlined text-[18px]">group</span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.length}
            </span>
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-1.5 py-0.5 rounded">
              {candidates.length > 0 ? '100%' : '0%'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('nova')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'nova' ? 'ring-1 ring-primary' : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Novas</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">fiber_new</span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.filter((c) => c.status === 'nova').length}
            </span>
            <span className="font-label-sm text-label-sm text-on-secondary-container bg-secondary-container px-1.5 py-0.5 rounded font-semibold">
              Aguardam
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('analise')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'analise' ? 'ring-1 ring-primary' : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Em Análise</span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              hourglass_top
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.filter((c) => c.status === 'analise').length}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-fixed bg-tertiary-fixed px-1.5 py-0.5 rounded font-semibold">
              Comissão
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pendente')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'pendente'
              ? 'ring-1 ring-primary'
              : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Doc. Pendente</span>
            <span className="material-symbols-outlined text-[18px] text-tertiary-container">
              warning
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.filter((c) => c.status === 'pendente').length}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary bg-tertiary-container px-1.5 py-0.5 rounded font-semibold">
              Notificados
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('aprovada')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'aprovada'
              ? 'ring-1 ring-primary'
              : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Aprovadas</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">task_alt</span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.filter((c) => c.status === 'aprovada').length}
            </span>
            <span className="font-label-sm text-label-sm text-on-secondary-fixed bg-secondary-fixed px-1.5 py-0.5 rounded font-semibold">
              {candidates.length > 0
                ? `${Math.round(
                    (candidates.filter((c) => c.status === 'aprovada').length / candidates.length) *
                      100
                  )}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('rejeitada')}
          className={`p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            statusFilter === 'rejeitada'
              ? 'ring-1 ring-primary'
              : 'hover:bg-surface-container-low/40'
          }`}
        >
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-sm text-label-sm uppercase">Rejeitadas</span>
            <span className="material-symbols-outlined text-[18px] text-error">cancel</span>
          </div>
          <div className="mt-space-sm flex items-baseline justify-between tabular-nums">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold">
              {candidates.filter((c) => c.status === 'rejeitada').length}
            </span>
            <span className="font-label-sm text-label-sm text-on-error-container bg-error-container px-1.5 py-0.5 rounded font-semibold">
              Inaptos
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters Panel */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
              search
            </span>
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-secondary focus:outline-none focus:bg-surface-container"
              placeholder="Pesquisar por nome do candidato, N.º CAN-2026-..., Bilhete de Identidade ou telefone (+244)..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-space-xs shrink-0">
            <button
              onClick={() =>
                onQuickAction(
                  'Filtros Sincronizados',
                  `A exibir ${filteredCandidates.length} registos correspondentes aos critérios ativos.`
                )
              }
              className="h-11 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
              <span>Filtros Avançados</span>
            </button>
            <button
              onClick={handleClearFilters}
              className="h-11 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm pt-space-xs">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Curso Técnico (10 Cursos)
            </label>
            <div className="relative">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface appearance-none focus:outline-none pr-8 cursor-pointer"
              >
                <option value="">Todos os 10 Cursos</option>
                {COURSES_DATA.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Estado do Processo
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface appearance-none focus:outline-none pr-8 cursor-pointer"
              >
                <option value="">Todos os Estados</option>
                <option value="nova">Novas Submissões</option>
                <option value="analise">Em Análise Técnica</option>
                <option value="pendente">Documentação Pendente</option>
                <option value="aprovada">Candidatura Aprovada</option>
                <option value="rejeitada">Candidatura Rejeitada</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Província / Município
            </label>
            <div className="relative">
              <select
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface appearance-none focus:outline-none pr-8 cursor-pointer"
              >
                <option value="">Luanda (Todos os Municípios)</option>
                <option value="luanda">Luanda — Ingombota / Maianga</option>
                <option value="cazenga">Cazenga</option>
                <option value="viana">Viana</option>
                <option value="talatona">Talatona</option>
                <option value="belas">Belas / Kilamba</option>
                <option value="cacuaco">Cacuaco</option>
                <option value="outras">Outras Províncias</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Auditoria Documental
            </label>
            <div className="relative">
              <select
                value={docAuditFilter}
                onChange={(e) => setDocAuditFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface appearance-none focus:outline-none pr-8 cursor-pointer"
              >
                <option value="">Todos os Registos</option>
                <option value="completa">3/3 Válidos (Completa)</option>
                <option value="pendente">Pendente de Verificação</option>
                <option value="recusada">Documentos Rejeitados / Ilegíveis</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
              Data de Submissão
            </label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-body-sm font-body-sm text-on-surface appearance-none focus:outline-none pr-8 cursor-pointer"
              >
                <option value="30d">Últimos 30 dias</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="hoje">Hoje (29 Set 2026)</option>
                <option value="todas">Período Integral</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-space-md shadow-md flex flex-wrap items-center justify-between gap-space-md transition-all">
          <div className="flex items-center gap-space-md">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest/20 flex items-center justify-center font-headline-sm text-label-md text-on-primary">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-label-lg font-semibold tracking-tight tabular-nums">
                <span>{selectedIds.length}</span> candidaturas selecionadas
              </span>
              <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
                Operações automáticas em lote com registo no diário de auditoria IMFA
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            <div className="relative">
              <button
                onClick={() => setShowBatchStateMenu((prev) => !prev)}
                className="h-9 px-space-sm rounded-lg bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                type="button"
              >
                <span>Alterar Estado em Massa</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              {showBatchStateMenu && (
                <div className="absolute left-0 top-10 w-52 bg-surface-container-lowest text-on-surface rounded-lg shadow-xl border border-surface-variant py-1 z-30">
                  {(
                    [
                      { status: 'aprovada', label: 'Marcar como Aprovada' },
                      { status: 'analise', label: 'Mover para Em Análise' },
                      { status: 'pendente', label: 'Sinalizar Doc. Pendente' },
                      { status: 'rejeitada', label: 'Rejeitar Selecionadas' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.status}
                      onClick={() => {
                        onUpdateCandidatesStatus(selectedIds, opt.status);
                        setShowBatchStateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onUpdateCandidatesStatus(selectedIds, 'aprovada')}
              className="h-9 px-space-sm rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Aprovar Selecionadas</span>
            </button>

            <button
              onClick={() =>
                onOpenSmsModal(candidates.filter((c) => selectedIds.includes(c.id)))
              }
              className="h-9 px-space-sm rounded-lg bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">sms</span>
              <span>Notificar SMS / WhatsApp</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="h-9 px-space-sm rounded-lg bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Exportar Selecionados</span>
            </button>

            <button
              onClick={() =>
                onQuickAction(
                  'Impressão em Lote Iniciada',
                  `A preparar ${selectedIds.length} fichas individuais oficiais da 10.ª Classe para impressão.`
                )
              }
              className="h-9 px-space-sm rounded-lg bg-surface-container-highest/20 hover:bg-surface-container-highest/30 text-inverse-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Imprimir Fichas</span>
            </button>

            <button
              onClick={() => {
                onArchiveCandidates(selectedIds);
                setSelectedIds([]);
              }}
              className="h-9 px-space-sm rounded-lg bg-error text-on-error font-label-md text-label-md flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">archive</span>
              <span>Arquivar</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="h-9 w-9 rounded-lg hover:bg-surface-container-highest/20 text-secondary-fixed-dim hover:text-inverse-on-surface flex items-center justify-center transition-colors ml-space-xs cursor-pointer"
              title="Desmarcar todas"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Rich Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-space-md pl-space-md pr-space-xs w-10" scope="col">
                  <input
                    checked={allVisibleSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    type="checkbox"
                  />
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  N.º Candidatura
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Candidato &amp; BI
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Curso (10.ª Classe)
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Contacto Angolano
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Submissão
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Auditoria Docs
                </th>
                <th className="py-space-md px-space-sm font-semibold" scope="col">
                  Estado
                </th>
                <th className="py-space-md pr-space-md pl-space-sm text-right font-semibold" scope="col">
                  Ações Operacionais
                </th>
              </tr>
            </thead>
            <tbody className="text-on-surface font-body-sm text-body-sm">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-secondary">
                        manage_search
                      </span>
                      <p className="font-headline-sm text-label-lg text-on-surface">
                        Nenhuma candidatura encontrada com os filtros atuais
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">
                        Ajuste os filtros de curso, município ou estado para visualizar todos os
                        registos.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md cursor-pointer"
                        type="button"
                      >
                        Repor Todos os Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const isChecked = selectedIds.includes(cand.id);
                  const priorityColor =
                    cand.status === 'pendente'
                      ? 'text-tertiary-container font-semibold'
                      : cand.status === 'rejeitada'
                      ? 'text-error font-medium'
                      : 'text-secondary';

                  const coursePillStyle =
                    cand.courseId === 'inf'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : cand.courseId === 'ig'
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-surface-container-high text-on-surface';

                  const docDotColor =
                    cand.status === 'pendente'
                      ? 'bg-tertiary-fixed-dim'
                      : cand.status === 'rejeitada'
                      ? 'bg-error'
                      : cand.status === 'nova'
                      ? 'bg-secondary-fixed-dim'
                      : 'bg-secondary';

                  const docTextColor =
                    cand.status === 'pendente'
                      ? 'text-tertiary'
                      : cand.status === 'rejeitada'
                      ? 'text-error'
                      : 'text-secondary';

                  const statusChip = {
                    analise: {
                      cls: 'bg-tertiary-fixed text-on-tertiary-fixed',
                      icon: 'pending',
                      label: 'EM ANÁLISE',
                    },
                    aprovada: {
                      cls: 'bg-secondary-fixed text-on-secondary-fixed',
                      icon: 'check_circle',
                      label: 'APROVADA',
                    },
                    pendente: {
                      cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
                      icon: 'error',
                      label: 'DOC. PENDENTE',
                    },
                    nova: {
                      cls: 'bg-secondary-container text-on-secondary-container',
                      icon: 'fiber_new',
                      label: 'NOVA',
                    },
                    rejeitada: {
                      cls: 'bg-error-container text-on-error-container',
                      icon: 'cancel',
                      label: 'REJEITADA',
                    },
                  }[cand.status];

                  return (
                    <tr
                      key={cand.id}
                      className="hover:bg-surface-container-low/70 transition-colors"
                    >
                      <td className="py-space-md pl-space-md pr-space-xs">
                        <input
                          checked={isChecked}
                          onChange={() => handleToggleRow(cand.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                          type="checkbox"
                        />
                      </td>
                      <td className="py-space-md px-space-sm tabular-nums">
                        <button
                          onClick={() => onSelectCandidate(cand.id)}
                          className="font-headline-sm text-label-md text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer text-left"
                          type="button"
                        >
                          <span>{cand.id}</span>
                          <span className="material-symbols-outlined text-[14px]">
                            open_in_new
                          </span>
                        </button>
                        <span className={`${priorityColor} font-body-sm text-body-sm block`}>
                          {cand.priorityLabel}
                        </span>
                      </td>
                      <td className="py-space-md px-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <CandidateAvatar
                            src={cand.photoUrl}
                            alt={cand.fullName}
                            initials={cand.initials}
                            className="w-9 h-9"
                          />
                          <div className="flex flex-col min-w-0">
                            <button
                              onClick={() => onSelectCandidate(cand.id)}
                              className="font-headline-sm text-label-md text-on-surface font-bold truncate hover:text-primary text-left cursor-pointer"
                              type="button"
                            >
                              {cand.fullName}
                            </button>
                            <span className="text-secondary font-body-sm text-body-sm tabular-nums">
                              BI: {cand.biNumber}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-sm">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-headline-sm text-label-md text-on-surface font-semibold">
                            {cand.courseName}
                          </span>
                          <span
                            className={`${coursePillStyle} px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold`}
                          >
                            {cand.classCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-sm tabular-nums">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface">
                            {cand.phonePrimary}
                          </span>
                          <div className="flex items-center gap-1 text-secondary text-body-sm">
                            <span className="material-symbols-outlined text-[14px]">
                              {cand.contactNote.includes('WhatsApp')
                                ? 'chat'
                                : cand.contactNote.includes('SMS')
                                ? 'schedule'
                                : 'call'}
                            </span>
                            <span>{cand.contactNote}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-sm tabular-nums">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface">
                            {cand.submittedDate}
                          </span>
                          <span className="text-secondary text-body-sm">{cand.submittedTime}</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${docDotColor}`}></span>
                          <span
                            className={`font-label-md text-label-md font-semibold ${docTextColor}`}
                          >
                            {cand.docSummaryLabel}
                          </span>
                        </div>
                        <span
                          className={`${
                            cand.status === 'pendente' || cand.status === 'rejeitada'
                              ? 'text-error'
                              : 'text-secondary'
                          } font-body-sm text-body-sm`}
                        >
                          {cand.docSubLabel}
                        </span>
                      </td>
                      <td className="py-space-md px-space-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded ${statusChip.cls} font-label-sm text-label-sm font-bold uppercase tracking-wider`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {statusChip.icon}
                          </span>
                          {statusChip.label}
                        </span>
                      </td>
                      <td className="py-space-md pr-space-md pl-space-sm text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {cand.status === 'nova' ? (
                            <button
                              onClick={() => {
                                onUpdateCandidatesStatus([cand.id], 'analise');
                                onSelectCandidate(cand.id);
                              }}
                              className="h-8 px-2.5 bg-primary text-on-primary rounded font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                              title="Iniciar Análise"
                              type="button"
                            >
                              Iniciar Análise
                            </button>
                          ) : cand.status === 'rejeitada' ? (
                            <>
                              <button
                                onClick={() => onSelectCandidate(cand.id)}
                                className="h-8 px-2.5 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                title="Ver Motivo de Rejeição"
                                type="button"
                              >
                                Ver Motivo
                              </button>
                              <button
                                onClick={() => onSelectCandidate(cand.id)}
                                className="h-8 px-2 bg-surface-container hover:bg-surface-container-high rounded text-secondary transition-colors cursor-pointer"
                                title="Histórico"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  history
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onSelectCandidate(cand.id)}
                                className="h-8 px-2.5 bg-surface-container hover:bg-surface-container-high rounded text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                title="Ver Detalhes"
                                type="button"
                              >
                                Detalhes
                              </button>
                              {cand.status === 'analise' && (
                                <button
                                  onClick={() => onSelectCandidate(cand.id)}
                                  className="h-8 px-2 bg-surface-container hover:bg-surface-container-high rounded text-primary transition-colors cursor-pointer"
                                  title="Validar Documentos"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    fact_check
                                  </span>
                                </button>
                              )}
                              {cand.status === 'aprovada' && (
                                <button
                                  onClick={() =>
                                    onQuickAction(
                                      `Guia de Matrícula — ${cand.id}`,
                                      `Guia oficial de admissão de ${cand.fullName} pronta para impressão.`
                                    )
                                  }
                                  className="h-8 px-2 bg-surface-container hover:bg-surface-container-high rounded text-secondary transition-colors cursor-pointer"
                                  title="Imprimir Guia"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    print
                                  </span>
                                </button>
                              )}
                              {cand.status === 'pendente' && (
                                <button
                                  onClick={() => onOpenSmsModal([cand])}
                                  className="h-8 px-2 bg-surface-container hover:bg-surface-container-high rounded text-tertiary transition-colors cursor-pointer"
                                  title="Reenviar Notificação"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    forward_to_inbox
                                  </span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => onSelectCandidate(cand.id)}
                            className="h-8 w-8 rounded hover:bg-surface-container text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                            title="Abrir Processo Completo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-space-md bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md text-secondary font-body-sm text-body-sm tabular-nums">
            <span>
              Exibindo <strong className="text-on-surface font-semibold">{filteredCandidates.length}</strong> de{' '}
              <strong className="text-on-surface font-semibold">
                {candidates.length}
              </strong>{' '}
              candidaturas registadas
            </span>
            <div className="flex items-center gap-space-xs">
              <span className="hidden sm:inline">Exibir:</span>
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(e.target.value)}
                  className="h-8 pl-2 pr-7 rounded bg-surface-container font-label-md text-label-md text-on-surface appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="15">15 por página</option>
                  <option value="30">30 por página</option>
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 tabular-nums">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 px-space-sm rounded-lg bg-surface-container text-secondary hover:text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                className="w-9 h-9 rounded-lg font-label-md text-label-md bg-primary text-on-primary font-semibold transition-colors cursor-pointer"
                type="button"
              >
                1
              </button>
            </div>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={filteredCandidates.length <= Number(perPage)}
              className="h-9 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              type="button"
            >
              <span className="hidden sm:inline">Próxima</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Admission Notice Footer */}
      <div className="p-space-md bg-surface-container-high rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm text-secondary">
          <span className="material-symbols-outlined text-[20px] text-tertiary">info</span>
          <span className="font-body-sm text-body-sm">
            <strong>Período de Admissão:</strong> 15 de Setembro a 15 de Outubro de 2026. Todas as
            alterações em lote e aprovações são assinadas digitalmente com carimbo de tempo no
            servidor central do IMFA.
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold shrink-0">
          Secretaria Geral IMFA • Luanda
        </span>
      </div>
    </div>
  );
};
