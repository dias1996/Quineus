import React, { useState } from 'react';
import {
  ApplicationStatus,
  Candidate,
  COURSES_DATA,
  TREND_DATA_BY_TAB,
} from '../data/imfaData';

interface DashboardViewProps {
  candidates: Candidate[];
  academicYear: string;
  onAcademicYearChange: (year: string) => void;
  onNavigateToApplications: (statusFilter?: ApplicationStatus | '') => void;
  onSelectCandidate: (candidateId: string) => void;
  onOpenManualRegistration: () => void;
  onQuickAction: (actionTitle: string, message: string) => void;
  onBatchValidatePending: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  academicYear,
  onAcademicYearChange,
  onNavigateToApplications,
  onSelectCandidate,
  onOpenManualRegistration,
  onQuickAction,
  onBatchValidatePending,
}) => {
  const [chartTab, setChartTab] = useState<'Total' | 'Aprovadas' | 'Em Análise' | 'Rejeitadas'>('Total');
  const [recentPage, setRecentPage] = useState<number>(1);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);

  const trend = TREND_DATA_BY_TAB[chartTab];

  const totalCount = candidates.length;
  const novasCount = candidates.filter((c) => c.status === 'nova').length;
  const analiseCount = candidates.filter((c) => c.status === 'analise').length;
  const aprovadasCount = candidates.filter((c) => c.status === 'aprovada').length;
  const rejeitadasCount = candidates.filter((c) => c.status === 'rejeitada').length;
  const pendentesCount = candidates.filter((c) => c.status === 'pendente').length;

  const aprovadasPct =
    totalCount > 0 ? ((aprovadasCount / totalCount) * 100).toFixed(1) : '0.0';
  const rejeitadasPct =
    totalCount > 0 ? ((rejeitadasCount / totalCount) * 100).toFixed(1) : '0.0';
  const quotaPct = Math.min(100, (totalCount / 600) * 100).toFixed(1);

  const dashboardRows = candidates.slice(0, 6);

  return (
    <div className="p-space-lg md:p-space-xl space-y-space-xl">
      {/* Top Level Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-secondary tracking-widest uppercase">
              IMFA • Gabinete de Admissões
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-body-sm text-body-sm text-secondary">
              Sistema Operacional Sincronizado
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Dashboard de Admissão — 10.ª Classe
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">
            Visão geral e métricas em tempo real das candidaturas para o {academicYear}.
          </p>
        </div>

        {/* Action Panel & Year Selection */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="relative inline-flex items-center bg-surface-container-lowest shadow-sm rounded-lg px-space-md py-space-xs">
            <span className="material-symbols-outlined text-[18px] text-primary mr-space-xs">
              calendar_month
            </span>
            <select
              value={academicYear}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer pr-space-md"
            >
              <option value="Ano Letivo 2026–2027">Ano Letivo 2026–2027</option>
              <option value="Ano Letivo 2025–2026 (Arquivo)">Ano Letivo 2025–2026 (Arquivo)</option>
              <option value="Ano Letivo 2024–2025 (Arquivo)">Ano Letivo 2024–2025 (Arquivo)</option>
            </select>
          </div>
          <button
            onClick={() => setShowAdvancedInfo((prev) => !prev)}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
            <span>Filtros Avançados</span>
          </button>
          <button
            onClick={onOpenManualRegistration}
            className="flex items-center gap-space-xs px-space-md py-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-md transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Registar Candidatura Manual</span>
          </button>
        </div>
      </div>

      {showAdvancedInfo && (
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md border border-surface-variant">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
              Atalhos de Filtro Rápido:
            </span>
            <button
              onClick={() => onNavigateToApplications('nova')}
              className="px-space-sm py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm hover:opacity-90 cursor-pointer"
              type="button"
            >
              Fila Prioritária ({novasCount})
            </button>
            <button
              onClick={() => onNavigateToApplications('analise')}
              className="px-space-sm py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm hover:opacity-90 cursor-pointer"
              type="button"
            >
              Em Avaliação Pedagógica ({analiseCount})
            </button>
            <button
              onClick={() => onNavigateToApplications('pendente')}
              className="px-space-sm py-1 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm hover:opacity-90 cursor-pointer"
              type="button"
            >
              Documentação Pendente ({pendentesCount})
            </button>
            <button
              onClick={() => onNavigateToApplications('aprovada')}
              className="px-space-sm py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm hover:opacity-90 cursor-pointer"
              type="button"
            >
              Aprovadas ({aprovadasCount})
            </button>
          </div>
          <button
            onClick={() => setShowAdvancedInfo(false)}
            className="text-secondary hover:text-on-surface font-label-sm text-label-sm cursor-pointer"
            type="button"
          >
            Fechar barra
          </button>
        </div>
      )}

      {/* 6 Primary Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
        {/* CARD 1: Total Candidaturas */}
        <div
          onClick={() => onNavigateToApplications('')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">folder_shared</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-medium">
              {totalCount > 0 ? 'Ativo' : 'Sem registos'}
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none tabular-nums">
              {totalCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Total Recebidas
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Todas as candidaturas submetidas
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant inline-flex items-center gap-0.5">
              <span>Ver todas</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* CARD 2: Novas Candidaturas */}
        <div
          onClick={() => onNavigateToApplications('nova')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[22px]">inbox</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-bold tracking-wider uppercase">
              Urgente
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none tabular-nums">
              {novasCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Novas Candidaturas
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Aguardam triagem inicial
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim"></span> Fila prioritária
            </span>
          </div>
        </div>

        {/* CARD 3: Em Análise */}
        <div
          onClick={() => onNavigateToApplications('analise')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-tertiary-fixed-dim text-on-tertiary-fixed font-bold tracking-wider uppercase">
              Em Curso
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none tabular-nums">
              {analiseCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Em Análise
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Em avaliação pedagógica
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary">group</span>{' '}
              Comissão pedagógica
            </span>
          </div>
        </div>

        {/* CARD 4: Aprovadas */}
        <div
          onClick={() => onNavigateToApplications('aprovada')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-on-surface font-semibold tabular-nums">
              {aprovadasPct}% total
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none tabular-nums">
              {aprovadasCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Aprovadas
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Candidaturas validadas e aptas
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">how_to_reg</span> Prontas p/
              matrícula
            </span>
          </div>
        </div>

        {/* CARD 5: Rejeitadas */}
        <div
          onClick={() => onNavigateToApplications('rejeitada')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">cancel</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-error-container text-on-error-container font-semibold tabular-nums">
              {rejeitadasPct}%
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-error tracking-tight leading-none tabular-nums">
              {rejeitadasCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Rejeitadas
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Não conformes c/ requisitos
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span> Justificativo
              emitido
            </span>
          </div>
        </div>

        {/* CARD 6: Documentação Pendente */}
        <div
          onClick={() => onNavigateToApplications('pendente')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">attach_file_add</span>
            </div>
            <span className="px-space-xs py-0.5 rounded font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant font-bold tracking-wider uppercase">
              Pendente
            </span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none tabular-nums">
              {pendentesCount}
            </div>
            <div className="font-label-md text-label-md text-secondary font-medium mt-1">
              Doc. Pendente
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              Aguardam BI / Certificado 9.ª
            </p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <span className="font-label-sm text-label-sm text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>{' '}
              Notificação enviada
            </span>
          </div>
        </div>
      </div>

      {/* Analytics & Graphic Charts Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Flow / Submission Trend (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-md">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    analytics
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Fluxo de Candidaturas Recebidas (2026)
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  Evolução do ritmo de inscrições ao longo do ciclo letivo.
                </p>
              </div>
              {/* Filter Tabs */}
              <div className="inline-flex p-1 bg-surface-container-low rounded-lg">
                {(['Total', 'Aprovadas', 'Em Análise', 'Rejeitadas'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`px-space-sm py-1 rounded-md font-label-sm text-label-sm transition-colors cursor-pointer whitespace-nowrap ${
                      chartTab === tab
                        ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight Metas Row */}
            <div className="grid grid-cols-3 gap-space-sm py-space-sm px-space-md bg-surface-container-low rounded-lg mb-space-md">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  Pico Diário
                </span>
                <div className="font-headline-sm text-title-md text-on-surface font-bold tabular-nums">
                  {trend.peakLabel}
                </div>
                <span className="font-body-sm text-body-sm text-secondary">{trend.peakSub}</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  Média Diária
                </span>
                <div className="font-headline-sm text-title-md text-on-surface font-bold tabular-nums">
                  {trend.avgLabel}
                </div>
                <span className="font-body-sm text-body-sm text-secondary">{trend.avgSub}</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase">
                  Taxa de Conclusão
                </span>
                <div className="font-headline-sm text-title-md text-primary font-bold tabular-nums">
                  {trend.rateLabel}
                </div>
                <span className="font-body-sm text-body-sm text-secondary">{trend.rateSub}</span>
              </div>
            </div>

            {/* Line SVG Chart */}
            <div className="relative w-full h-60 pt-4">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 600 200"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#b52332" stopOpacity="0.25"></stop>
                    <stop offset="100%" stopColor="#b52332" stopOpacity="0.0"></stop>
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#49607c"></stop>
                    <stop offset="60%" stopColor="#b52332"></stop>
                    <stop offset="100%" stopColor="#92001d"></stop>
                  </linearGradient>
                </defs>
                {/* Subtle Grid horizontal references */}
                <line stroke="#dee8ff" strokeWidth="1" x1="0" x2="600" y1="180" y2="180"></line>
                <line
                  stroke="#dee8ff"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  x1="0"
                  x2="600"
                  y1="120"
                  y2="120"
                ></line>
                <line
                  stroke="#dee8ff"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  x1="0"
                  x2="600"
                  y1="60"
                  y2="60"
                ></line>
                {/* Value Labels on Right */}
                <text
                  fill="#49607c"
                  fontFamily="Space Grotesk"
                  fontSize="10"
                  textAnchor="end"
                  x="590"
                  y="55"
                >
                  180
                </text>
                <text
                  fill="#49607c"
                  fontFamily="Space Grotesk"
                  fontSize="10"
                  textAnchor="end"
                  x="590"
                  y="115"
                >
                  90
                </text>
                <text
                  fill="#49607c"
                  fontFamily="Space Grotesk"
                  fontSize="10"
                  textAnchor="end"
                  x="590"
                  y="175"
                >
                  0
                </text>
                {/* Gradient Area fill */}
                <path d={trend.pathArea} fill="url(#areaGrad)"></path>
                {/* Main Line Stroke */}
                <path
                  d={trend.pathLine}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>
                {/* Markers & Data Dots */}
                {trend.dots.map((dot, idx) => (
                  <circle
                    key={idx}
                    cx={dot.cx}
                    cy={dot.cy}
                    fill={dot.highlight ? '#b52332' : '#ffffff'}
                    r={dot.highlight ? 6 : 4.5}
                    stroke={dot.highlight ? '#ffffff' : idx < 2 ? '#49607c' : '#b52332'}
                    strokeWidth="2.5"
                  ></circle>
                ))}
                {/* Peak annotation badge */}
                <rect
                  fill="#111c2d"
                  height="20"
                  rx="4"
                  width="74"
                  x="323"
                  y={Math.max(6, trend.dots[3].cy - 30)}
                ></rect>
                <text
                  fill="#ffffff"
                  fontFamily="Space Grotesk"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  x="360"
                  y={Math.max(20, trend.dots[3].cy - 16)}
                >
                  {trend.peakBadge}
                </text>
              </svg>
              {/* Month Axis Footers */}
              <div className="flex justify-between items-center px-6 mt-2 text-secondary font-label-sm text-label-sm tabular-nums">
                <span>{trend.months[0]}</span>
                <span>{trend.months[1]}</span>
                <span>{trend.months[2]}</span>
                <span className="font-bold text-primary">{trend.months[3]}</span>
                <span>{trend.months[4]}</span>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-xs flex items-center justify-between text-secondary">
            <span className="font-body-sm text-body-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                lightbulb
              </span>{' '}
              Período de inscrições encerra a 15 de Janeiro de 2027.
            </span>
            <button
              onClick={() =>
                onQuickAction(
                  'Série Histórica 2024–2027',
                  'A carregar comparativo plurianual de submissões da 10.ª Classe...'
                )
              }
              className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant cursor-pointer"
              type="button"
            >
              Ver série histórica completa
            </button>
          </div>
        </div>

        {/* Course Distribution Donut/Bar Chart (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    pie_chart
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Distribuição por Curso
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-secondary">
                  10 Cursos Oficiais Homologados (IMFA)
                </p>
              </div>
              <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-secondary tabular-nums">
                {totalCount} Vagas Ativas
              </span>
            </div>

            {/* Circular Donut Visual & Quick Stats */}
            <div className="flex flex-col sm:flex-row items-center gap-space-lg py-space-sm">
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    stroke="#e7eeff"
                    strokeWidth="14"
                  ></circle>
                  {totalCount > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      fill="transparent"
                      r="50"
                      stroke="#b52332"
                      strokeDasharray="314 314"
                      strokeDashoffset="0"
                      strokeWidth="14"
                    ></circle>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none tabular-nums">
                    {totalCount}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-tight">
                    Inscritos
                  </span>
                </div>
              </div>

              {/* Breakdown Key Metric Items */}
              <div className="flex-1 w-full space-y-space-xs">
                {COURSES_DATA.map((course) => {
                  const enrolledInCourse = candidates.filter((c) => c.courseId === course.id).length;
                  const pct =
                    totalCount > 0 ? Math.round((enrolledInCourse / totalCount) * 100) : 0;
                  return (
                    <div
                      key={course.id}
                      className="flex items-center justify-between text-body-sm font-body-sm"
                    >
                      <div className="flex items-center gap-space-xs truncate">
                        <span
                          className={`w-2.5 h-2.5 rounded-sm ${course.badgeClass} shrink-0`}
                        ></span>
                        <span className="text-on-surface truncate font-medium">
                          {course.shortName}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface ml-2 tabular-nums">
                        {enrolledInCourse}{' '}
                        <span className="text-secondary font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quota Progress Indicator */}
          <div className="p-space-sm bg-surface-container-low rounded-lg mt-space-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                Ocupação Global de Vagas Oficiais
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-bold tabular-nums">
                {totalCount} / 600 Vagas ({quotaPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded bg-surface-container overflow-hidden">
              <div
                className="h-full bg-primary rounded transition-all"
                style={{ width: `${quotaPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Bottom Section (Recent Table & Operational Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Recent Submissions Table (Left 8 Columns) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="p-space-lg flex items-center justify-between bg-surface-container-low/50">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  recent_patient
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Últimas Candidaturas Submetidas
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">
                Tempo real: fluxo contínuo do formulário público de ingresso.
              </p>
            </div>
            <button
              onClick={() => onNavigateToApplications('')}
              className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high font-label-md text-label-md text-on-surface transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              type="button"
            >
              <span>Ver lista completa</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md font-semibold">N.º Candidatura</th>
                  <th className="py-space-sm px-space-md font-semibold">Candidato</th>
                  <th className="py-space-sm px-space-md font-semibold">Curso Pretendido</th>
                  <th className="py-space-sm px-space-md font-semibold">Data/Hora</th>
                  <th className="py-space-sm px-space-md font-semibold">Documentos</th>
                  <th className="py-space-sm px-space-md font-semibold">Estado</th>
                  <th className="py-space-sm px-space-md font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {dashboardRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 px-space-md text-center text-secondary font-body-sm"
                    >
                      Nenhuma candidatura registada até ao momento. As novas inscrições aparecerão
                      aqui automaticamente.
                    </td>
                  </tr>
                ) : (
                  dashboardRows.map((cand, index) => {
                  const statusBadge = {
                    nova: {
                      label: 'Novo',
                      cls: 'bg-secondary-fixed text-on-secondary-fixed',
                      actionText: 'Triar',
                      actionPrimary: true,
                    },
                    analise: {
                      label: 'Em Análise',
                      cls: 'bg-tertiary-fixed text-on-tertiary-fixed',
                      actionText: 'Avaliar',
                      actionPrimary: false,
                    },
                    pendente: {
                      label: 'Doc. Pendente',
                      cls: 'bg-primary-fixed text-on-primary-fixed-variant',
                      actionText: 'Notificar',
                      actionPrimary: false,
                    },
                    aprovada: {
                      label: 'Aprovado',
                      cls: 'bg-surface-container-high text-primary',
                      actionText: 'Guia',
                      actionPrimary: false,
                    },
                    rejeitada: {
                      label: 'Rejeitado',
                      cls: 'bg-error-container text-on-error-container',
                      actionText: 'Motivo',
                      actionPrimary: false,
                    },
                  }[cand.status];

                  const avatarColors = [
                    'bg-secondary-fixed text-on-secondary-fixed',
                    'bg-primary-fixed text-primary',
                    'bg-surface-container text-secondary',
                    'bg-secondary-container text-on-secondary-container',
                    'bg-error-container text-error',
                  ];

                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        index % 2 === 1 ? 'bg-surface-container-lowest' : ''
                      }`}
                    >
                      <td className="py-space-md px-space-md font-headline-sm text-label-md text-primary font-bold whitespace-nowrap tabular-nums">
                        <button
                          onClick={() => onSelectCandidate(cand.id)}
                          className="hover:underline cursor-pointer text-left"
                          type="button"
                        >
                          {cand.id}
                        </button>
                      </td>
                      <td className="py-space-md px-space-md font-medium text-on-surface whitespace-nowrap">
                        <div className="flex items-center gap-space-xs">
                          <div
                            className={`w-7 h-7 rounded-full ${
                              avatarColors[index % avatarColors.length]
                            } font-bold font-label-sm text-label-sm flex items-center justify-center shrink-0`}
                          >
                            {cand.initials}
                          </div>
                          <div>
                            <div className="font-semibold leading-tight">{cand.fullName}</div>
                            <div className="font-body-sm text-body-sm text-secondary tabular-nums">
                              BI: {cand.biNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-medium">
                          {cand.courseName}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md text-secondary font-body-sm text-body-sm whitespace-nowrap tabular-nums">
                        {cand.relativeTime}
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        {cand.status === 'pendente' ? (
                          <span className="inline-flex items-center gap-1 text-primary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              warning
                            </span>{' '}
                            Incompleta (1 falta)
                          </span>
                        ) : cand.status === 'rejeitada' ? (
                          <span className="inline-flex items-center gap-1 text-error font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px] text-error">
                              cancel
                            </span>{' '}
                            {cand.docSummaryLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-on-surface font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px] text-tertiary">
                              check_circle
                            </span>{' '}
                            Completa (3)
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        <span
                          className={`px-space-xs py-0.5 rounded font-label-sm text-label-sm ${statusBadge.cls} font-bold uppercase tracking-wider`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-space-md px-space-md text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onSelectCandidate(cand.id)}
                            className="p-1 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Visualizar Ficha"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => onSelectCandidate(cand.id)}
                            className={`px-space-xs py-1 rounded font-label-sm text-label-sm transition-colors cursor-pointer ${
                              statusBadge.actionPrimary
                                ? 'bg-primary text-on-primary hover:bg-primary-container'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                            }`}
                            type="button"
                          >
                            {statusBadge.actionText}
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

          <div className="p-space-sm bg-surface-container-low flex items-center justify-between font-label-sm text-label-sm text-secondary">
            <span>
              Mostrando {dashboardRows.length} de {totalCount} registos submetidos
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRecentPage(1)}
                className="px-2 py-1 rounded bg-surface-container-lowest text-on-surface shadow-xs cursor-pointer"
                type="button"
              >
                1
              </button>
            </div>
          </div>
        </div>

        {/* Critical Alerts & Quick Operations (Right 4 Columns) */}
        <div className="lg:col-span-4 space-y-space-md">
          {/* Notificações Críticas Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-primary">
                  notification_important
                </span>
                <h3 className="font-headline-sm text-title-md text-on-surface font-bold">
                  Alertas Operacionais
                </h3>
              </div>
              {pendentesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              )}
            </div>
            <div className="space-y-space-sm">
              {/* Alert 1 */}
              <div className="p-space-sm rounded-lg bg-primary-fixed/40 flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                  report_problem
                </span>
                <div className="flex-1">
                  <span className="font-label-md text-label-md text-primary font-bold block">
                    Documentação Pendente
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Existem {pendentesCount} candidaturas com documentos pendentes aguardando
                    notificação por SMS/Email.
                  </p>
                </div>
              </div>
              {/* Alert 2 */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">
                  event_seat
                </span>
                <div className="flex-1">
                  <span className="font-label-md text-label-md text-on-surface font-bold block">
                    Capacidade de Vagas
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Ocupação global de {totalCount} em 600 vagas homologadas ({quotaPct}%).
                  </p>
                  <div className="w-full bg-surface-container-high h-1.5 rounded mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded"
                      style={{ width: `${quotaPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Rápidas Card */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">bolt</span>
              <h3 className="font-headline-sm text-title-md text-on-surface font-bold">
                Ações Rápidas de Secretaria
              </h3>
            </div>
            <div className="space-y-space-xs">
              {/* Action 1 */}
              <button
                onClick={() =>
                  onQuickAction(
                    'Pauta Provisória Emitida (PDF Oficial)',
                    'O documento Pauta_Provisoria_IMFA_10Classe_2026_2027.pdf foi gerado e assinado digitalmente.'
                  )
                }
                className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all text-left cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">
                      format_list_numbered
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block">Emitir Pauta Provisória</span>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Exportação em PDF oficial IMFA
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  chevron_right
                </span>
              </button>

              {/* Action 2 */}
              <button
                onClick={onBatchValidatePending}
                className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all text-left cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                  </div>
                  <div>
                    <span className="font-semibold block">Validar Lote Pendente</span>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Aprovação em massa de fichas elegíveis
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  chevron_right
                </span>
              </button>

              {/* Action 3 */}
              <button
                onClick={() =>
                  onQuickAction(
                    'Relatório Geral Excel (.xlsx) Exportado',
                    `O ficheiro Relatorio_Geral_Admissoes_IMFA_2026.xlsx (${totalCount} registos) foi descarregado com sucesso.`
                  )
                }
                className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all text-left cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">
                      download_for_offline
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block">Descarregar Relatório Geral</span>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Formato Excel estruturado (.xlsx)
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Institutional Badge Card */}
          <div className="p-space-md rounded-xl bg-gradient-to-br from-surface-container to-surface-container-high flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">shield</span>
            </div>
            <div className="space-y-0.5">
              <div className="font-label-md text-label-md font-bold text-on-surface">
                Homologação Oficial 2026/2027
              </div>
              <div className="font-body-sm text-body-sm text-secondary">
                Instituto Médio de Formação de Administração (IMFA) • Luanda, Angola
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
