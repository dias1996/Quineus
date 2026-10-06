import React, { useState } from 'react';
import {
  ApplicationStatus,
  Candidate,
  CandidateDocument,
  DocStatus,
} from '../data/imfaData';
import { CandidateAvatar } from './CandidateAvatar';
import { exportCandidateReceiptPdf } from '../utils/exportReceiptPdf';
import { processImageFileToDataUrl } from '../utils/fileReader';

interface CandidateDetailViewProps {
  candidate: Candidate;
  allCandidates: Candidate[];
  onSelectCandidate: (candidateId: string) => void;
  onBackToDashboard: () => void;
  onBackToList: () => void;
  onUpdateStatus: (newStatus: ApplicationStatus, dispatchNote: string) => void;
  onUpdateDocumentStatus: (docId: string, newStatus: DocStatus) => void;
  onUpdateCandidatePhoto?: (
    candidateId: string,
    photoDataUrl: string,
    filename: string,
    fileSize?: string
  ) => void;
  onToggleChecklist: (key: keyof Candidate['checklist']) => void;
  onAddTechnicalComment: (comment: string) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onOpenSmsModal: (candidates: Candidate[]) => void;
  onQuickAction: (title: string, message: string) => void;
}

export const CandidateDetailView: React.FC<CandidateDetailViewProps> = ({
  candidate,
  allCandidates,
  onSelectCandidate,
  onBackToDashboard,
  onBackToList,
  onUpdateStatus,
  onUpdateDocumentStatus,
  onUpdateCandidatePhoto,
  onToggleChecklist,
  onAddTechnicalComment,
  onDeleteCandidate,
  onOpenSmsModal,
  onQuickAction,
}) => {
  const [dispatchText, setDispatchText] = useState(candidate.dispatchNote);
  const [docComment, setDocComment] = useState('');
  const [previewDoc, setPreviewDoc] = useState<CandidateDocument | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Sync dispatch text when candidate changes
  React.useEffect(() => {
    setDispatchText(candidate.dispatchNote);
    setDocComment('');
  }, [candidate.id, candidate.dispatchNote]);

  const currentIndex = allCandidates.findIndex((c) => c.id === candidate.id);
  const prevCandidate = currentIndex > 0 ? allCandidates[currentIndex - 1] : null;
  const nextCandidate =
    currentIndex >= 0 && currentIndex < allCandidates.length - 1
      ? allCandidates[currentIndex + 1]
      : null;

  const statusHeaderBadge = {
    analise: {
      label: 'Em Análise Pedagógica',
      cls: 'bg-secondary-container text-on-secondary-container',
      dot: 'bg-secondary animate-pulse',
    },
    aprovada: {
      label: 'Candidatura Aprovada',
      cls: 'bg-secondary-fixed text-on-secondary-fixed',
      dot: 'bg-primary',
    },
    pendente: {
      label: 'Documentação Pendente',
      cls: 'bg-tertiary-fixed text-on-tertiary-fixed',
      dot: 'bg-tertiary animate-pulse',
    },
    nova: {
      label: 'Nova Submissão',
      cls: 'bg-secondary-container text-on-secondary-container',
      dot: 'bg-secondary',
    },
    rejeitada: {
      label: 'Candidatura Rejeitada',
      cls: 'bg-error-container text-on-error-container',
      dot: 'bg-error',
    },
  }[candidate.status];

  const validatedDocsCount = candidate.documents.filter((d) => d.status === 'validado').length;
  const allDocsValidated = validatedDocsCount === candidate.documents.length;

  const handleCommentSubmit = () => {
    if (!docComment.trim()) return;
    onAddTechnicalComment(docComment.trim());
    setDocComment('');
  };

  return (
    <div className="px-space-md lg:px-space-xl py-space-lg space-y-space-lg">
      {/* 1. CABEÇALHO DE NAVEGAÇÃO E STATUS */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] flex flex-col gap-space-md">
        {/* Breadcrumb & Top Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm text-secondary font-label-md text-label-md">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={onBackToDashboard}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>Início
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button
              onClick={onBackToList}
              className="hover:text-primary transition-colors cursor-pointer"
              type="button"
            >
              Candidaturas
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold tabular-nums">{candidate.id}</span>

            {/* Quick Candidate Switcher */}
            <div className="ml-space-sm flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg">
              <button
                disabled={!prevCandidate}
                onClick={() => prevCandidate && onSelectCandidate(prevCandidate.id)}
                className="text-secondary hover:text-primary disabled:opacity-30 cursor-pointer flex items-center"
                title={prevCandidate ? `Anterior: ${prevCandidate.fullName}` : 'Primeira ficha'}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="font-label-sm text-[11px] text-secondary tabular-nums">
                {currentIndex + 1}/{allCandidates.length}
              </span>
              <button
                disabled={!nextCandidate}
                onClick={() => nextCandidate && onSelectCandidate(nextCandidate.id)}
                className="text-secondary hover:text-primary disabled:opacity-30 cursor-pointer flex items-center"
                title={nextCandidate ? `Próxima: ${nextCandidate.fullName}` : 'Última ficha'}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-space-md font-label-sm text-label-sm text-secondary uppercase tracking-wider tabular-nums">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>{' '}
              Submetido: {candidate.submittedDate} {candidate.submittedTime}
            </span>
            <span className="h-3 w-px bg-surface-variant"></span>
            <span className="flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-[16px]">wb_sunny</span>{' '}
              {candidate.shift}
            </span>
          </div>
        </div>

        {/* Identity Line & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex flex-wrap items-center gap-space-sm">
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                Candidatura #{candidate.id} — {candidate.fullName}
              </h1>
              <span
                className={`${statusHeaderBadge.cls} font-label-sm text-label-sm px-space-sm py-space-xs rounded-full uppercase font-bold tracking-wide flex items-center gap-1 shadow-sm`}
              >
                <span className={`w-2 h-2 rounded-full ${statusHeaderBadge.dot}`}></span>
                {statusHeaderBadge.label}
              </span>
            </div>
            <p className="font-body-md text-body-md text-secondary">
              Processo de Admissão Ordinária • Ano Letivo 2026–2027 • Instituto Médio Politécnico
              Industrial IMFA
            </p>
          </div>

          {/* Upper Action Toolbar */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <button
              onClick={() => {
                const fileName = exportCandidateReceiptPdf(candidate);
                onQuickAction(
                  'Comprovativo Exportado em PDF',
                  `O ficheiro oficial "${fileName}" foi descarregado para o seu dispositivo.`
                );
              }}
              className="flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Exportar Comprovativo PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Imprimir Ficha</span>
            </button>
            <button
              onClick={() =>
                onQuickAction(
                  `Dossier Completo (${candidate.id})`,
                  `O arquivo Dossier_${candidate.id}_${candidate.fullName.replace(/\s+/g, '_')}.zip contendo os 3 anexos e a ficha técnica foi gerado.`
                )
              }
              className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">archive</span>
              <span>Dossier ZIP/PDF</span>
            </button>
            <button
              onClick={() => onOpenSmsModal([candidate])}
              className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">chat</span>
              <span>SMS / WhatsApp</span>
            </button>
            <button
              onClick={() => setShowAllLogs(true)}
              className="flex items-center gap-space-xs bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Histórico</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FLUXO VISUAL DE STATUS (PIPELINE IMFA 10.ª CLASSE) */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] overflow-x-auto">
        <div className="min-w-[760px] flex items-center justify-between relative">
          {/* Connecting background track */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-surface-container z-0"></div>
          <div
            className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-300"
            style={{
              width:
                candidate.status === 'aprovada'
                  ? '75%'
                  : allDocsValidated
                  ? '50%'
                  : '25%',
            }}
          ></div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md ring-4 ring-surface-container-lowest">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </div>
            <span className="font-label-md text-label-md font-bold text-on-surface">
              1. Submissão Online
            </span>
            <span className="font-body-sm text-body-sm text-secondary tabular-nums">
              {candidate.submittedDate} • Concluído
            </span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-4 ${
                candidate.status === 'aprovada'
                  ? 'bg-primary text-on-primary ring-surface-container-lowest'
                  : 'bg-primary-container text-on-primary ring-primary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {candidate.status === 'aprovada' ? 'check' : 'pending_actions'}
              </span>
            </div>
            <span className="font-label-md text-label-md font-bold text-primary">
              2. Análise Pedagógica
            </span>
            <span className="font-body-sm text-body-sm text-primary font-semibold">
              {candidate.status === 'aprovada' ? 'Concluído' : 'Em Curso Ativo'}
            </span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest ${
                allDocsValidated
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {allDocsValidated ? 'verified' : 'fact_check'}
              </span>
            </div>
            <span
              className={`font-label-md text-label-md ${
                allDocsValidated ? 'font-bold text-on-surface' : 'text-secondary'
              }`}
            >
              3. Validação Documental
            </span>
            <span className="font-body-sm text-body-sm text-secondary tabular-nums">
              Fase {validatedDocsCount} de {candidate.documents.length}
            </span>
          </div>

          {/* Step 4 */}
          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-surface-container-lowest ${
                candidate.status === 'aprovada'
                  ? 'bg-primary-container text-on-primary ring-primary-fixed'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
            <span
              className={`font-label-md text-label-md ${
                candidate.status === 'aprovada' ? 'font-bold text-primary' : 'text-secondary'
              }`}
            >
              4. Prova &amp; Triagem
            </span>
            <span className="font-body-sm text-body-sm text-secondary">
              {candidate.status === 'aprovada' ? 'Convocado p/ Matrícula' : 'Aguardando Avaliação'}
            </span>
          </div>

          {/* Step 5 */}
          <div className="relative z-10 flex flex-col items-center gap-space-xs text-center">
            <div className="w-10 h-10 rounded-full bg-surface-container text-secondary flex items-center justify-center ring-4 ring-surface-container-lowest">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </div>
            <span className="font-label-md text-label-md text-secondary">
              5. Matrícula Definitiva
            </span>
            <span className="font-body-sm text-body-sm text-secondary">Abertura em Outubro</span>
          </div>
        </div>
      </div>

      {/* 3. LAYOUT OPERACIONAL DE DUAS COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* COLUNA ESQUERDA (8 / 12) - DADOS COMPLETOS E DOCUMENTOS */}
        <div className="lg:col-span-8 space-y-space-lg">
          {/* Card A: Dados Pessoais e de Identificação */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Dados Pessoais e de Identificação
                </h2>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container text-secondary px-space-sm py-space-xs rounded uppercase font-bold tracking-wider">
                Registo Oficial IMFA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center pt-space-xs">
              {/* Foto Tipo Passe */}
              <div className="md:col-span-3 flex flex-col items-center text-center p-space-sm bg-surface-container-low rounded-xl">
                <CandidateAvatar
                  src={candidate.photoUrl}
                  alt={`Fotografia tipo passe institucional do candidato ${candidate.fullName}`}
                  initials={candidate.initials}
                  variant="passport"
                  className="w-32 h-36 rounded-lg"
                />
                <span className="font-label-sm text-label-sm text-on-surface font-semibold mt-space-xs">
                  Foto Oficial 10.ª
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  Fundo Branco • 3x4
                </span>
                {onUpdateCandidatePhoto && (
                  <label className="mt-2 px-2.5 py-1 rounded-lg bg-primary text-on-primary font-label-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-container flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-[13px]">add_a_photo</span>
                    <span>{candidate.photoUrl ? 'Alterar Foto' : 'Carregar Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const processed = await processImageFileToDataUrl(file, 480, 600, 0.88);
                          onUpdateCandidatePhoto(
                            candidate.id,
                            processed.dataUrl,
                            processed.filename,
                            processed.sizeFormatted
                          );
                        } catch {
                          // ignore
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Dados de Matriz */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-x-space-md gap-y-space-sm">
                <div className="bg-surface-container-low p-space-sm rounded-lg">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Nome Completo
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">
                    {candidate.fullName}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg tabular-nums">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    N.º Bilhete de Identidade
                  </span>
                  <span className="font-label-lg text-label-lg text-primary font-bold">
                    {candidate.biNumber}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary block">
                    Validade: {candidate.biValidity}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg tabular-nums">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Nascimento &amp; Idade
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">
                    {candidate.birthDate} ({candidate.age} anos)
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Género &amp; Naturalidade
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">
                    {candidate.gender} • {candidate.naturalidade}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg tabular-nums">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Contactos Telefónicos
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold block">
                    {candidate.phonePrimary}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary block">
                    Alt: {candidate.phoneAlt}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Correio Eletrónico
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold truncate block">
                    {candidate.email}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg sm:col-span-2">
                  <span className="font-label-sm text-label-sm text-secondary uppercase block">
                    Residência Atual
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">
                    {candidate.address}
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded-lg sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary uppercase block">
                      Necessidades Educativas Especiais (NEE)
                    </span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">
                      {candidate.nee}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    check_circle
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Habilitações Literárias & Dados Académicos */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  history_edu
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Habilitações Literárias &amp; Dados Académicos
                </h2>
              </div>
              <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-space-sm py-space-xs rounded font-bold uppercase">
                Ensino Geral Concluído
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              <div className="sm:col-span-2 bg-surface-container-low p-space-md rounded-lg space-y-space-xs">
                <span className="font-label-sm text-label-sm text-secondary uppercase block">
                  Escola de Proveniência
                </span>
                <p className="font-label-lg text-label-lg text-on-surface font-bold">
                  {candidate.previousSchool}
                </p>
                <p className="font-body-sm text-body-sm text-secondary">
                  Conclusão: 9.ª Classe do Ensino Geral Regular • Ano Letivo:{' '}
                  {candidate.completionYear}
                </p>
              </div>
              <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col justify-center items-center text-center tabular-nums">
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  Média Final da 9.ª
                </span>
                <span className="font-headline-lg text-headline-lg text-primary font-bold">
                  {candidate.averageGrade.toString().replace('.', ',')}
                </span>
                <span className="font-label-sm text-label-sm text-on-secondary-container">
                  Valores (Escala 0–20)
                </span>
              </div>
            </div>

            {/* Academic Performance Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm tabular-nums">
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm text-headline-sm text-primary">
                  {candidate.grades.matematica}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    Matemática
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">Nota de Acesso</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm text-headline-sm text-primary">
                  {candidate.grades.portugues}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    L. Portuguesa
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">Nota de Acesso</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm text-headline-sm text-secondary">
                  {candidate.grades.fisica}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    Física
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Requisito Técnico
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm text-headline-sm text-secondary">
                  {candidate.grades.quimica}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                    Química
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">Complementar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Opção de Formação Pretendida */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  domain
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Opção de Formação Pretendida (10.ª Classe 2026–2027)
                </h2>
              </div>
              <span className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed px-space-sm py-space-xs rounded font-bold uppercase">
                {candidate.courseCode}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-space-md p-space-md bg-surface-container-high rounded-xl">
              <div className="space-y-space-xs flex-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                  Curso Técnico Selecionado
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {candidate.courseName}
                </h3>
                <p className="font-body-md text-body-md text-on-secondary-container">
                  Área de Formação: Tecnologias de Informação e Comunicação • Turno: Diurno (07:30 –
                  12:45)
                </p>
              </div>
              <div className="sm:w-56 p-space-sm bg-surface-container-lowest rounded-lg flex flex-col justify-center items-center text-center shadow-sm tabular-nums">
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  Disponibilidade
                </span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="font-headline-md text-headline-md text-primary font-bold">
                    18
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    / 50 vagas restantes
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-primary h-full w-[64%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Seção Crítica 'Documentos Submetidos & Validação em Tempo Real' */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  folder_open
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Documentos Submetidos &amp; Validação em Tempo Real
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tabular-nums">
                {candidate.documents.length} Ficheiros Anexados
              </span>
            </div>

            <div className="space-y-space-md">
              {candidate.documents.map((doc) => {
                const isPending = doc.status === 'verificacao';
                const isRejected = doc.status === 'ilegivel' || doc.status === 'falta';

                return (
                  <div
                    key={doc.id}
                    className={`p-space-md ${
                      isPending ? 'bg-surface-container-high' : 'bg-surface-container-low'
                    } rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-sm`}
                  >
                    <div className="flex items-start gap-space-md">
                      <div
                        className={`w-12 h-12 rounded-lg bg-surface-container ${
                          doc.type === 'image' ? 'text-tertiary' : 'text-primary'
                        } flex items-center justify-center shrink-0`}
                      >
                        <span className="material-symbols-outlined text-[28px]">
                          {doc.type === 'image'
                            ? 'image'
                            : doc.id.includes('1')
                            ? 'picture_as_pdf'
                            : 'description'}
                        </span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="font-label-lg text-label-lg font-bold text-on-surface">
                            {doc.title}
                          </span>
                          <span className="bg-surface-container text-on-surface font-label-sm text-label-sm px-space-xs py-0.5 rounded font-bold tabular-nums">
                            {doc.size}
                          </span>
                          {doc.status === 'validado' && (
                            <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                verified
                              </span>{' '}
                              Validado Oficialmente
                            </span>
                          )}
                          {doc.status === 'verificacao' && (
                            <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-space-sm py-0.5 rounded font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                hourglass_top
                              </span>{' '}
                              Em Verificação
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-space-sm py-0.5 rounded font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                warning
                              </span>{' '}
                              {doc.status === 'falta' ? 'Em Falta' : 'Ilegível / Recusado'}
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-secondary font-mono">
                          {doc.filename}
                        </p>
                        {doc.auditedBy ? (
                          <p className="font-body-sm text-body-sm text-secondary">
                            Auditado por: <strong>{doc.auditedBy}</strong> em {doc.auditedAt}
                          </p>
                        ) : (
                          <p className="font-body-sm text-body-sm text-secondary">
                            {doc.notes ||
                              'Aguardando parecer final da comissão examinadora de notas.'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-space-xs shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md px-space-md py-space-sm rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>{' '}
                        {doc.type === 'image' ? 'Ver Foto' : 'Pré-visualizar'}
                      </button>

                      {doc.status !== 'validado' && (
                        <button
                          onClick={() => onUpdateDocumentStatus(doc.id, 'validado')}
                          className="bg-primary text-on-primary font-label-md text-label-md px-space-md py-space-sm rounded-lg hover:bg-primary-container flex items-center gap-1 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">done_all</span>{' '}
                          Aprovar Doc
                        </button>
                      )}

                      {doc.status !== 'ilegivel' && (
                        <button
                          onClick={() => onUpdateDocumentStatus(doc.id, 'ilegivel')}
                          title="Sinalizar documento como ilegível/rejeitado"
                          className="bg-surface-container hover:bg-error-container hover:text-on-error-container text-secondary font-label-md text-label-md px-space-sm py-space-sm rounded-lg transition-colors cursor-pointer"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onQuickAction(
                            `Download Iniciado (${doc.filename})`,
                            `O ficheiro ${doc.filename} (${doc.size}) foi transferido para o seu dispositivo.`
                          )
                        }
                        title="Descarregar Ficheiro"
                        className="bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md p-space-sm rounded-lg transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document Observation Field */}
            <div className="pt-space-sm space-y-space-xs">
              <label className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider block">
                Observação Técnica sobre os Documentos
              </label>
              <div className="flex flex-col sm:flex-row gap-space-sm">
                <input
                  value={docComment}
                  onChange={(e) => setDocComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  className="flex-1 h-12 px-space-md bg-surface-container text-body-md font-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-high transition-colors"
                  placeholder="Escreva uma anotação técnica sobre legibilidade, autenticidade ou pendências..."
                  type="text"
                />
                <button
                  onClick={handleCommentSubmit}
                  className="h-12 px-space-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add_comment</span>
                  <span>Adicionar Parecer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (4 / 12) - DECISÃO ADMINISTRATIVA & AUDITORIA */}
        <div className="lg:col-span-4 space-y-space-lg">
          {/* Card A: Decisão da Comissão Pedagógica */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_4px_20px_-2px_rgba(16,42,69,0.08)] space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <span className="material-symbols-outlined text-primary text-[22px]">gavel</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Decisão da Comissão Pedagógica
              </h2>
            </div>

            {/* Checklist Normativa */}
            <div className="space-y-space-sm">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider block">
                Checklist de Conformidade Normativa
              </span>
              <div className="space-y-space-xs bg-surface-container-low p-space-sm rounded-lg">
                <label className="flex items-center gap-space-sm p-space-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    checked={candidate.checklist.ageValid}
                    onChange={() => onToggleChecklist('ageValid')}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Idade regulamentar 10.ª Classe (14–17 anos)
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    checked={candidate.checklist.certReadable}
                    onChange={() => onToggleChecklist('certReadable')}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Certificado 9.ª Classe legível e completo
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    checked={candidate.checklist.biValid}
                    onChange={() => onToggleChecklist('biValid')}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Bilhete de Identidade nacional válido
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    checked={candidate.checklist.guardianConfirmed}
                    onChange={() => onToggleChecklist('guardianConfirmed')}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Contactos do encarregado confirmados
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    checked={candidate.checklist.gradeAboveCutoff}
                    onChange={() => onToggleChecklist('gradeAboveCutoff')}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">
                    Média superior ao corte do curso (≥ 14,0)
                  </span>
                </label>
              </div>
            </div>

            {/* Observação / Despacho Interno */}
            <div className="space-y-space-xs">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider block">
                Despacho / Parecer Interno
              </span>
              <textarea
                value={dispatchText}
                onChange={(e) => setDispatchText(e.target.value)}
                className="w-full p-space-sm bg-surface-container text-body-md font-body-md text-on-surface rounded-lg focus:outline-none focus:bg-surface-container-high transition-colors resize-none leading-relaxed"
                rows={4}
              />
            </div>

            {/* Botões de Ação Imediata */}
            <div className="space-y-space-sm pt-space-xs">
              <button
                onClick={() => onUpdateStatus('aprovada', dispatchText)}
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs transition-colors shadow-md cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Aprovar Candidatura</span>
              </button>
              <button
                onClick={() => onUpdateStatus('analise', dispatchText)}
                className="w-full h-11 bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
                <span>Manter em Análise</span>
              </button>
              <button
                onClick={() => onUpdateStatus('pendente', dispatchText)}
                className="w-full h-11 bg-surface-container hover:bg-surface-variant text-tertiary font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Solicitar Correção / Documentos</span>
              </button>
              <button
                onClick={() => onUpdateStatus('rejeitada', dispatchText)}
                className="w-full h-11 bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Rejeitar Candidatura</span>
              </button>
              {onDeleteCandidate && (
                <button
                  onClick={() => onDeleteCandidate(candidate.id)}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>Eliminar Candidatura</span>
                </button>
              )}
            </div>

            {/* Auditoria de Segurança */}
            <div className="p-space-sm bg-surface-container-low rounded-lg text-center font-body-sm text-body-sm text-secondary">
              <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1 text-primary">
                security
              </span>
              Todas as decisões são seladas com carimbo digital criptografado.
            </div>
          </div>

          {/* Card B: Histórico e Auditoria Desta Candidatura */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_2px_12px_-2px_rgba(16,42,69,0.06)] space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-low -mx-space-lg -mt-space-lg p-space-md rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  timeline
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Histórico &amp; Auditoria
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-mono">
                CAN-2026
              </span>
            </div>

            {/* Immutability Timeline */}
            <div className="relative pl-6 space-y-space-md before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
              {(showAllLogs ? candidate.auditLogs : candidate.auditLogs.slice(0, 4)).map((log) => {
                const dotColor = {
                  primary: 'bg-primary',
                  secondary: 'bg-secondary',
                  tertiary: 'bg-tertiary-fixed-dim',
                  error: 'bg-error',
                }[log.type];

                return (
                  <div key={log.id} className="relative">
                    <div
                      className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ${dotColor} ring-4 ring-surface-container-lowest`}
                    ></div>
                    <div className="space-y-0.5">
                      <span className="font-label-sm text-label-sm text-secondary font-mono tabular-nums">
                        {log.timestamp}
                      </span>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        {log.title}
                      </p>
                      <p className="font-body-sm text-body-sm text-secondary">{log.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-space-xs">
              <button
                onClick={() => setShowAllLogs((prev) => !prev)}
                className="w-full py-space-sm bg-surface-container hover:bg-surface-variant text-secondary hover:text-on-surface font-label-md text-label-md rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>
                  {showAllLogs
                    ? 'Ocultar Registos Antigos'
                    : `Ver Todos os ${Math.max(8, candidate.auditLogs.length)} Registos`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-surface-variant">
            <div className="p-space-md bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary">
                  {previewDoc.type === 'image' ? 'image' : 'picture_as_pdf'}
                </span>
                <div>
                  <h3 className="font-headline-sm text-label-lg font-bold text-on-surface">
                    {previewDoc.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-secondary font-mono">
                    {previewDoc.filename} • {previewDoc.size}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg hover:bg-surface-container-high text-secondary hover:text-on-surface cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-space-lg bg-surface-container-low space-y-space-md">
              {previewDoc.type === 'image' ? (
                <div className="flex flex-col items-center justify-center py-6 bg-surface-container-lowest rounded-xl shadow-inner">
                  <CandidateAvatar
                    src={previewDoc.fileStorageUrl || candidate.photoUrl}
                    alt={candidate.fullName}
                    initials={candidate.initials}
                    variant="passport"
                    className="w-48 h-56 rounded-lg shadow-md"
                  />
                  <span className="mt-3 font-label-md text-label-md text-on-surface font-semibold">
                    Fotografia Tipo Passe 3x4 • {candidate.fullName}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Resolução verificada: 600 DPI • Sincronizado no Supabase
                  </span>
                </div>
              ) : (
                <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-inner border border-surface-variant space-y-space-md">
                  <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
                    <div>
                      <h4 className="font-headline-sm text-title-md text-on-surface font-bold">
                        {previewDoc.title.replace(/^\d+\.\s*/, '')}
                      </h4>
                    </div>
                    <span className="px-2 py-1 rounded bg-surface-container font-mono text-body-sm text-secondary">
                      CÓPIA AUTENTICADA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-space-sm text-body-sm">
                    <div>
                      <span className="text-secondary block">Titular do Documento:</span>
                      <strong className="text-on-surface">{candidate.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-secondary block">N.º de Identificação Civil:</span>
                      <strong className="text-primary font-mono">{candidate.biNumber}</strong>
                    </div>
                    <div>
                      <span className="text-secondary block">Instituição de Origem:</span>
                      <strong className="text-on-surface">{candidate.previousSchool}</strong>
                    </div>
                    <div>
                      <span className="text-secondary block">Média Geral Certificada:</span>
                      <strong className="text-on-surface">{candidate.averageGrade} Valores</strong>
                    </div>
                  </div>

                  <div className="p-space-sm rounded bg-surface-container-low text-body-sm text-secondary">
                    <strong>Parecer de Auditoria Digital:</strong>{' '}
                    {previewDoc.notes ||
                      'Assinatura e carimbo oficial conferidos pela comissão técnica.'}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-space-xs">
                <div className="flex items-center gap-space-xs">
                  <button
                    onClick={() => {
                      onUpdateDocumentStatus(previewDoc.id, 'validado');
                      setPreviewDoc(null);
                    }}
                    className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Validar Documento</span>
                  </button>
                  <button
                    onClick={() => {
                      onUpdateDocumentStatus(previewDoc.id, 'ilegivel');
                      setPreviewDoc(null);
                    }}
                    className="px-space-md py-space-xs rounded-lg bg-error-container text-on-error-container font-label-md text-label-md hover:opacity-90 transition-colors cursor-pointer flex items-center gap-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    <span>Sinalizar Ilegível</span>
                  </button>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md cursor-pointer"
                  type="button"
                >
                  Fechar Pré-visualização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
