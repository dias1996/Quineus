import React, { useEffect, useState } from 'react';
import { Candidate, COURSES_DATA } from '../data/imfaData';
import {
  AuthenticatedAdmin,
  AuthorizedRlsAccount,
  authenticateWithRlsPolicy,
  getAuthorizedRlsAccounts,
  renameAuthorizedAccount,
  syncAuthorizedAccountNamesFromServer,
} from '../lib/authRls';
import {
  checkSupabaseStatus,
  SUPABASE_CONFIG,
  SupabaseConnectionStatus,
  syncAllToSupabase,
} from '../lib/supabase';
import {
  downloadSupabaseSqlFile,
  SUPABASE_COMPLEMENTARY_SQL,
  SUPABASE_SCHEMA_SQL,
} from '../utils/supabaseSchemaSql';

interface SecondaryModulesViewProps {
  activePath: string;
  candidates: Candidate[];
  currentAdmin: AuthenticatedAdmin;
  onSwitchAdmin?: (admin: AuthenticatedAdmin) => void;
  onRenameUserSuccess?: (uid: string, newName: string) => void;
  onSelectCandidate: (candidateId: string) => void;
  onQuickAction: (title: string, message: string) => void;
  onRefreshCandidates?: () => Promise<void> | void;
}

export const SecondaryModulesView: React.FC<SecondaryModulesViewProps> = ({
  activePath,
  candidates,
  currentAdmin,
  onSwitchAdmin,
  onRenameUserSuccess,
  onSelectCandidate,
  onQuickAction,
  onRefreshCandidates,
}) => {
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [syncingSupabase, setSyncingSupabase] = useState<boolean>(false);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);
  const [showSqlPreview, setShowSqlPreview] = useState<'none' | 'patch' | 'full'>('none');
  const [accountsList, setAccountsList] = useState<AuthorizedRlsAccount[]>(() =>
    getAuthorizedRlsAccounts()
  );
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const acc of getAuthorizedRlsAccounts()) {
      initial[acc.uid] = acc.name;
    }
    return initial;
  });
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [savingAllNames, setSavingAllNames] = useState<boolean>(false);

  const runHealthCheck = async () => {
    setCheckingStatus(true);
    try {
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    syncAuthorizedAccountNamesFromServer().then((fresh) => {
      setAccountsList(fresh);
      setDraftNames((prev) => {
        const next = { ...prev };
        for (const acc of fresh) {
          next[acc.uid] = acc.name;
        }
        return next;
      });
    });
  }, [activePath]);

  const handleRenameSingleAccount = async (acc: AuthorizedRlsAccount) => {
    if (!currentAdmin.permissions.canManageUsers) {
      onQuickAction(
        'Operação Restrita ao Super Administrador',
        'Apenas o Super Administrador tem permissão RLS para renomear os utilizadores (Administrador, Secretaria e Comissão).'
      );
      return;
    }

    const proposedName = (draftNames[acc.uid] ?? acc.name).trim();
    if (proposedName.length < 2) {
      onQuickAction('Nome Inválido', 'Introduza um nome válido com pelo menos 2 caracteres.');
      return;
    }

    setSavingUid(acc.uid);
    try {
      const res = await renameAuthorizedAccount({
        uid: acc.uid,
        newName: proposedName,
        adminToken: currentAdmin.idToken,
      });
      if (res.ok) {
        setAccountsList(res.updatedAccounts);
        if (onRenameUserSuccess) {
          onRenameUserSuccess(acc.uid, proposedName);
        }
        const roleLabel =
          acc.profileTab === 'superadmin'
            ? 'ADMINISTRADOR'
            : acc.profileTab === 'secretaria'
            ? 'SECRETARIA'
            : 'COMISSÃO';
        onQuickAction(
          `Utilizador Renomeado (${roleLabel})`,
          `O titular da conta ${acc.email} foi atualizado para "${proposedName}".`
        );
      } else {
        onQuickAction('Erro ao Renomear', res.error || 'Não foi possível guardar o novo nome.');
      }
    } finally {
      setSavingUid(null);
    }
  };

  const handleSaveAllAccountNames = async () => {
    if (!currentAdmin.permissions.canManageUsers) {
      onQuickAction(
        'Operação Restrita ao Super Administrador',
        'Apenas o Super Administrador pode renomear os utilizadores do sistema.'
      );
      return;
    }

    setSavingAllNames(true);
    try {
      for (const acc of accountsList) {
        const proposedName = (draftNames[acc.uid] ?? acc.name).trim();
        if (proposedName.length >= 2 && proposedName !== acc.name) {
          const res = await renameAuthorizedAccount({
            uid: acc.uid,
            newName: proposedName,
            adminToken: currentAdmin.idToken,
          });
          if (res.ok) {
            setAccountsList(res.updatedAccounts);
            if (onRenameUserSuccess) {
              onRenameUserSuccess(acc.uid, proposedName);
            }
          }
        }
      }
      onQuickAction(
        'Nomes dos Utilizadores Atualizados',
        'Os nomes de Administrador, Secretaria e Comissão foram guardados e sincronizados.'
      );
    } finally {
      setSavingAllNames(false);
    }
  };

  const handleSyncWithSupabase = async () => {
    if (!currentAdmin.permissions.canManagePortalSettings && !currentAdmin.permissions.canManageCoursesAndQuotas) {
      onQuickAction(
        'Operação Restrita pela Política RLS',
        `A sua conta (${currentAdmin.roleTitle}) está em modo de leitura para configurações de infraestrutura. Inicie sessão como Super Administrador (admin@itpgq.ao) para sincronizar quotas globais.`
      );
      return;
    }

    setSyncingSupabase(true);
    try {
      const res = await syncAllToSupabase(candidates);
      await runHealthCheck();
      if (res.ok) {
        if (onRefreshCandidates) {
          await onRefreshCandidates();
        }
        onQuickAction(
          'Sincronização Supabase Concluída',
          `${res.coursesSynced} cursos, ${res.candidatesSynced} candidaturas, ${res.documentsSynced} documentos e ${res.logsSynced} logs sincronizados em utzebakybzqrveabnmsu.supabase.co.`
        );
      } else {
        setShowSqlPreview('patch');
        onQuickAction(
          'Atenção — Executar Script Complementar no Supabase',
          `O projeto utzebakybzqrveabnmsu está ligado, mas necessita do Script Complementar (${res.error || 'Política RLS'}).`
        );
      }
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleCopySql = (mode: 'patch' | 'full') => {
    const content = mode === 'patch' ? SUPABASE_COMPLEMENTARY_SQL : SUPABASE_SCHEMA_SQL;
    navigator.clipboard.writeText(content).then(() => {
      if (mode === 'patch') {
        setCopiedPatch(true);
        setTimeout(() => setCopiedPatch(false), 3500);
      } else {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 3500);
      }
      onQuickAction(
        mode === 'patch' ? 'Script RLS + 3 Contas Copiado' : 'Script SQL Completo Copiado',
        'Cole e execute no SQL Editor do projeto Supabase (utzebakybzqrveabnmsu).'
      );
    });
  };

  const handleSwitchAccount = async (acc: AuthorizedRlsAccount) => {
    if (!onSwitchAdmin) return;
    const res = await authenticateWithRlsPolicy({
      email: acc.email,
      password: acc.passwordPlain,
      selectedTab: acc.profileTab,
    });
    if (res.ok && res.admin) {
      onSwitchAdmin(res.admin);
    }
  };

  // 1. GESTÃO DE UTILIZADORES & PERFIL DO ADMINISTRADOR (CONTAS RLS)
  if (activePath === 'gestao-de-utilizadores' || activePath === 'perfil-administrador') {
    const canManageUsers = currentAdmin.permissions.canManageUsers;
    const isRestrictedProfile =
      currentAdmin.profileTab === 'secretaria' || currentAdmin.profileTab === 'comissao';
    const visibleAccounts = isRestrictedProfile
      ? accountsList.filter((acc) => acc.profileTab === currentAdmin.profileTab)
      : accountsList;

    return (
      <div className="p-space-lg md:p-space-xl space-y-space-lg">
        {/* TOP HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
              CONTROLO DE ACESSO BASEADO EM POLÍTICAS RLS (public.users)
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {activePath === 'perfil-administrador'
                ? 'Perfil de Sessão & Permissões RLS Ativas'
                : 'Gestão de Contas Autorizadas & Níveis RLS'}
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Configuração das 3 contas institucionais com níveis diferenciados (Super Administrador,
              Secretaria Escolar e Comissão de Admissão).
            </p>
          </div>

          {!isRestrictedProfile && (
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-lg font-label-sm text-xs font-bold inline-flex items-center gap-1.5 ${
                  canManageUsers
                    ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {canManageUsers ? 'verified_user' : 'lock'}
                </span>
                {canManageUsers
                  ? 'Modo Escrita RLS Ativo (Super Admin)'
                  : `Modo Leitura RLS (${currentAdmin.roleTitle})`}
              </span>
            </div>
          )}
        </div>

        {/* CURRENT LOGGED-IN ADMIN RLS CARD */}
        <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-surface-container space-y-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-container pb-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[28px]">shield_person</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    {currentAdmin.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
                    {currentAdmin.levelBadge}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                  {currentAdmin.roleTitle} • {currentAdmin.department} • E-mail:{' '}
                  <strong className="text-on-surface font-mono">{currentAdmin.email}</strong>
                </p>
              </div>
            </div>

            {!isRestrictedProfile && (
              <div className="text-left md:text-right space-y-1">
                <div className="font-mono text-xs bg-surface-container px-3 py-1 rounded text-primary font-semibold">
                  Política RLS: {currentAdmin.rlsPolicyCode}
                </div>
                <p className="font-body-sm text-xs text-secondary">
                  Autenticado: {currentAdmin.authenticatedAt} ({currentAdmin.authSource})
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="p-space-md rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
              <h3 className="font-headline-sm text-label-md font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Operações Autorizadas pela RLS para a sua Conta
              </h3>
              <ul className="space-y-1.5 text-body-sm text-on-surface">
                {currentAdmin.allowedActions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant space-y-2">
              <h3 className="font-headline-sm text-label-md font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  security
                </span>
                Restrições de Segurança RLS Aplicadas ao seu Nível
              </h3>
              <ul className="space-y-1.5 text-body-sm text-secondary">
                {currentAdmin.restrictedActions.map((rest, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* RENAME USERS PANEL (ADMINISTRADOR, SECRETARIA E COMISSÃO) */}
        {!isRestrictedProfile && (
          <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-surface-container space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
                  ADMINISTRAÇÃO DE IDENTIDADE • EXCLUSIVO SUPER ADMINISTRADOR
                </span>
                <h3 className="font-headline-md text-headline-sm text-on-surface">
                  Renomear Utilizadores: ADMINISTRADOR, SECRETARIA e COMISSÃO
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  {canManageUsers
                    ? 'Altere o nome oficial dos titulares das 3 contas institucionais. As alterações são sincronizadas na base de dados e refletidas no Histórico de Auditoria.'
                    : 'Modo de leitura ativo: Inicie sessão como Super Administrador (admin@itpgq.ao) para poder renomear os utilizadores.'}
                </p>
              </div>

              {canManageUsers && (
                <button
                  type="button"
                  onClick={handleSaveAllAccountNames}
                  disabled={savingAllNames}
                  className="px-space-md py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs self-start disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>
                    {savingAllNames ? 'A Guardar Alterações...' : 'Guardar Todos os Nomes'}
                  </span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
              {visibleAccounts.map((acc) => {
                const roleHeading =
                  acc.profileTab === 'superadmin'
                    ? '1. ADMINISTRADOR (Super Admin)'
                    : acc.profileTab === 'secretaria'
                    ? '2. SECRETARIA (Secretaria Escolar)'
                    : '3. COMISSÃO (Comissão de Admissão)';
                const currentDraft = draftNames[acc.uid] ?? acc.name;
                const isUnchanged = currentDraft.trim() === acc.name;

                return (
                  <div
                    key={`rename-${acc.uid}`}
                    className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline-sm text-label-md font-bold text-primary">
                        {roleHeading}
                      </span>
                      <span className="font-mono text-[11px] text-secondary">{acc.email}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="font-label-sm text-[11px] text-secondary uppercase font-bold block">
                        Nome do Titular da Conta
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          disabled={!canManageUsers || savingUid === acc.uid}
                          value={currentDraft}
                          onChange={(e) =>
                            setDraftNames((prev) => ({
                              ...prev,
                              [acc.uid]: e.target.value,
                            }))
                          }
                          placeholder="Introduza o novo nome do utilizador"
                          className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        />
                        {canManageUsers && (
                          <button
                            type="button"
                            disabled={savingUid === acc.uid || isUnchanged}
                            onClick={() => handleRenameSingleAccount(acc)}
                            className="h-10 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-xs font-bold cursor-pointer shrink-0 inline-flex items-center gap-1 disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            <span>{savingUid === acc.uid ? '...' : 'Renomear'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11.5px] text-secondary flex items-center justify-between">
                      <span>Nome atual ativo:</span>
                      <strong className="text-on-surface">{acc.name}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OFFICIAL ACCOUNTS TABLE & QUICK SWITCHER */}
        <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm border border-surface-container space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-headline-md text-headline-sm text-on-surface">
                {currentAdmin.profileTab === 'secretaria'
                  ? 'Conta Oficial Configurada — Secretaria Escolar'
                  : currentAdmin.profileTab === 'comissao'
                  ? 'Conta Oficial Configurada — Comissão de Admissão'
                  : 'As 3 Contas Oficiais Configuradas (Tabela public.users)'}
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                {currentAdmin.profileTab === 'secretaria'
                  ? 'Detalhes da conta institucional autenticada no nível operacional da Secretaria Escolar.'
                  : currentAdmin.profileTab === 'comissao'
                  ? 'Detalhes da conta institucional autenticada no nível deliberativo da Comissão de Admissão.'
                  : 'Pode testar imediatamente qualquer um dos 3 níveis de acesso RLS clicando em "Alternar para esta Conta".'}
              </p>
            </div>
            {!isRestrictedProfile && (
              <span className="font-mono text-xs bg-surface-container px-3 py-1.5 rounded-lg text-on-surface">
                Senha simples padrão para as 3 contas: <strong>123456</strong>
              </span>
            )}
          </div>

          <div
            className={`grid grid-cols-1 ${
              isRestrictedProfile ? 'lg:grid-cols-1 max-w-xl' : 'lg:grid-cols-3'
            } gap-space-md`}
          >
            {visibleAccounts.map((acc) => {
              const isCurrent = currentAdmin.uid === acc.uid;
              return (
                <div
                  key={acc.uid}
                  className={`p-space-lg rounded-xl border flex flex-col justify-between space-y-space-md transition-all ${
                    isCurrent
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-surface-container-low border-surface-variant'
                  }`}
                >
                  <div className="space-y-space-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-mono text-[11px] font-bold">
                        RLS role = &apos;{acc.rlsRole}&apos;
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-label-sm text-[10px] uppercase font-bold">
                          Sessão Ativa
                        </span>
                      )}
                    </div>

                    <h4 className="font-headline-sm text-title-md font-bold text-on-surface pt-1">
                      {acc.name}
                    </h4>
                    <p className="font-label-sm text-label-sm text-primary font-semibold">
                      {acc.roleTitle}
                    </p>
                    <p className="font-body-sm text-body-sm text-secondary">{acc.summary}</p>

                    <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-variant/70 space-y-1 font-mono text-xs mt-2">
                      <div className="flex justify-between">
                        <span className="text-secondary">E-mail:</span>
                        <strong className="text-on-surface">{acc.email}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Senha:</span>
                        <strong className="text-primary">{acc.passwordPlain}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">UID:</span>
                        <span className="text-secondary">{acc.uid}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isCurrent ? (
                      <div className="w-full py-2 text-center rounded-lg bg-surface-container text-secondary font-label-sm text-label-sm font-bold">
                        Conta Autenticada no Momento
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchAccount(acc)}
                        className="w-full py-2.5 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">switch_account</span>
                        <span>Alternar para {acc.profileTab === 'superadmin' ? 'Super Admin' : acc.profileTab === 'secretaria' ? 'Secretaria' : 'Comissão'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. GESTÃO DE CURSOS & MAPA DE VAGAS
  if (activePath === 'gestao-de-cursos' || activePath === 'mapa-de-vagas') {
    return (
      <div className="p-space-lg md:p-space-xl space-y-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
              OFERTA FORMATIVA HOMOLOGADA • MED ANGOLA
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {activePath === 'gestao-de-cursos'
                ? 'Gestão de Cursos Técnicos (10.ª Classe)'
                : 'Mapa Oficial de Vagas — 2026–2027'}
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Controlo de lotação, médias de corte e turmas ativas nos 10 cursos técnicos do ITPGQ.
            </p>
          </div>
          <button
            onClick={handleSyncWithSupabase}
            disabled={syncingSupabase}
            className="px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 cursor-pointer self-start disabled:opacity-60"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>
              {syncingSupabase ? 'A Sincronizar com Supabase...' : 'Sincronizar Quotas no Supabase'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {COURSES_DATA.map((course) => {
            const enrolledCount = candidates.filter((c) => c.courseId === course.id).length;
            const pct = Math.min(100, Math.round((enrolledCount / course.totalSpots) * 100));
            const remaining = Math.max(0, course.totalSpots - enrolledCount);
            return (
              <div
                key={course.id}
                className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between space-y-space-md"
              >
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                      {course.code} • {course.classCode}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary uppercase">
                      Corte ≥ {course.cutoffGrade.toFixed(1).replace('.', ',')} Val.
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {course.name}
                  </h3>
                  <p className="font-body-sm text-body-sm text-secondary">{course.area}</p>
                </div>

                <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1 tabular-nums">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-secondary">Inscritos / Lotação:</span>
                    <strong className="text-on-surface">
                      {enrolledCount} / {course.totalSpots} vagas ({pct}%)
                    </strong>
                  </div>
                  <div className="w-full h-2 rounded bg-surface-container overflow-hidden">
                    <div
                      className="h-full bg-primary rounded"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-body-sm pt-1">
                    <span className="text-secondary">Vagas Disponíveis:</span>
                    <span className="font-semibold text-primary">{remaining} vagas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-space-xs text-body-sm text-secondary">
                  <span>Coord.: {course.coordinator}</span>
                  <span>{course.shift.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. HISTÓRICO GERAL DE AUDITORIA
  if (activePath === 'historico-de-auditoria') {
    const allLogs = candidates.flatMap((c) =>
      c.auditLogs.map((l) => ({ ...l, candidateId: c.id, candidateName: c.fullName }))
    );

    return (
      <div className="p-space-lg md:p-space-xl space-y-space-lg">
        <div>
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
            RASTREABILIDADE &amp; CONFORMIDADE ITPGQ
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Histórico Geral de Auditoria
          </h1>
          <p className="font-body-md text-body-sm text-secondary">
            Registo cronológico imutável de todas as validações documentais e decisões pedagógicas sincronizadas com o Supabase.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container text-secondary font-label-sm text-label-sm uppercase">
                <th className="py-space-sm px-space-md">Carimbo de Tempo</th>
                <th className="py-space-sm px-space-md">Processo</th>
                <th className="py-space-sm px-space-md">Evento Registado</th>
                <th className="py-space-sm px-space-md">Detalhe Técnico</th>
                <th className="py-space-sm px-space-md text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {allLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-space-md text-center text-secondary">
                    Nenhum registo de auditoria disponível. O histórico será preenchido
                    automaticamente à medida que novas candidaturas forem registadas.
                  </td>
                </tr>
              ) : (
                allLogs.map((log, i) => (
                  <tr key={`${log.id}-${i}`} className="hover:bg-surface-container-low/60">
                    <td className="py-space-md px-space-md font-mono text-secondary tabular-nums whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-space-md px-space-md font-bold text-primary whitespace-nowrap">
                      {log.candidateId} — {log.candidateName}
                    </td>
                    <td className="py-space-md px-space-md font-semibold text-on-surface">
                      {log.title}
                    </td>
                    <td className="py-space-md px-space-md text-secondary">{log.description}</td>
                    <td className="py-space-md px-space-md text-right">
                      <button
                        onClick={() => onSelectCandidate(log.candidateId)}
                        className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm cursor-pointer"
                        type="button"
                      >
                        Abrir Processo
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. CONFIGURAÇÕES DO PORTAL, RELATÓRIOS, EXPORTAÇÕES E DIAGNÓSTICO RLS SUPABASE
  const activeTableCount = supabaseStatus?.tables.filter((t) => t.exists).length || 0;

  return (
    <div className="p-space-lg md:p-space-xl space-y-space-lg">
      {/* HEADER CARD */}
      <div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm space-y-space-md border border-surface-container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">database</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
                AUDITORIA DE TABELAS SUPABASE &amp; CONTAS RLS • PROJETO{' '}
                {SUPABASE_CONFIG.projectRef.toUpperCase()}
              </span>
              <h1 className="font-headline-md text-headline-md text-on-surface capitalize">
                {activePath === 'configuracoes-do-portal' || activePath === 'exportacoes'
                  ? 'Base de Dados Supabase, Políticas RLS & 3 Contas Autorizadas'
                  : activePath.replace(/-/g, ' ')}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={checkingStatus}
              className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[17px]">refresh</span>
              <span>{checkingStatus ? 'A verificar...' : 'Verificar Tabelas'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncWithSupabase}
              disabled={syncingSupabase}
              className="px-space-md py-space-xs rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
              <span>
                {syncingSupabase
                  ? 'A sincronizar dados...'
                  : 'Sincronizar Dados com Supabase Agora'}
              </span>
            </button>
          </div>
        </div>

        <p className="font-body-md text-body-md text-secondary max-w-3xl">
          Diagnóstico em tempo real do projeto{' '}
          <code className="text-primary font-semibold">{SUPABASE_CONFIG.url}</code>. Inclui o script
          de criação das <strong>3 contas oficiais de Login com níveis RLS diferentes</strong> (
          <code>admin@itpgq.ao</code>, <code>secretaria@itpgq.ao</code> e{' '}
          <code>comissao@itpgq.ao</code> — Senha: <code>123456</code>).
        </p>

        {/* CONNECTION CREDENTIALS & LIVE METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
          <div className="p-space-md bg-surface-container-low rounded-xl space-y-1 border border-surface-variant/60">
            <span className="font-label-sm text-label-sm text-secondary uppercase">
              Endpoint do Projeto (SUPABASE_URL)
            </span>
            <p className="font-mono text-body-sm text-on-surface font-bold break-all">
              {SUPABASE_CONFIG.url}
            </p>
            <p className="font-body-sm text-body-sm text-secondary">
              Ref: <strong className="text-on-surface">{SUPABASE_CONFIG.projectRef}</strong> •
              Latência: {supabaseStatus ? `${supabaseStatus.latencyMs} ms` : '...'}
            </p>
          </div>

          <div className="p-space-md bg-surface-container-low rounded-xl space-y-1 border border-surface-variant/60">
            <span className="font-label-sm text-label-sm text-secondary uppercase">
              Sessão RLS Atual
            </span>
            <p className="font-mono text-body-sm text-on-surface font-bold truncate">
              {currentAdmin.email} (role: {currentAdmin.rlsRole})
            </p>
            <p className="font-body-sm text-body-sm text-secondary">
              {currentAdmin.levelBadge}
            </p>
          </div>

          <div className="p-space-md bg-surface-container-low rounded-xl space-y-1 border border-surface-variant/60">
            <span className="font-label-sm text-label-sm text-secondary uppercase">
              Cobertura de Tabelas no Supabase
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  supabaseStatus?.complementaryReady
                    ? 'bg-emerald-600'
                    : supabaseStatus?.schemaReady
                    ? 'bg-amber-500'
                    : 'bg-error'
                }`}
              ></span>
              <p className="font-headline-sm text-label-lg text-on-surface font-bold">
                {supabaseStatus
                  ? `${activeTableCount}/7 Tabelas Criadas`
                  : 'A verificar ligação...'}
              </p>
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              {supabaseStatus?.message || 'A consultar catálogo público do Supabase...'}
            </p>
          </div>
        </div>

        {/* TABLE HEALTH MATRIX (7 TABLES) */}
        {supabaseStatus && (
          <div className="pt-space-sm space-y-space-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-label-md font-bold text-on-surface uppercase tracking-wider">
                Auditoria das 7 Tabelas do Sistema ITPGQ (Esquema public)
              </h3>
              <span className="font-body-sm text-body-sm text-secondary">
                Última verificação: {supabaseStatus.checkedAt}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
              {supabaseStatus.tables.map((t) => (
                <div
                  key={t.table}
                  className="p-space-md rounded-lg bg-surface-container-low border border-surface-variant flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-label-md font-bold text-on-surface">
                        public.{t.table}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          t.exists
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-amber-500/15 text-amber-800'
                        }`}
                      >
                        {t.exists ? 'RLS Ativo' : 'Em Falta'}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-medium text-on-surface">{t.description}</p>
                    <p className="text-[10.5px] text-secondary leading-snug">
                      {t.rlsPolicySummary}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-variant/50 flex items-baseline justify-between">
                    <span className="text-body-sm text-secondary">Registos Atuais:</span>
                    <strong className="font-mono text-label-lg text-primary">{t.count}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL DDL EXPORT & COPY TOOLBAR */}
        <div className="pt-space-sm border-t border-surface-container flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
          <div>
            <h4 className="font-headline-sm text-label-md font-bold text-on-surface">
              Script de Correção Completa RLS + Criação das 3 Contas de Login no Supabase
            </h4>
            <p className="font-body-sm text-body-sm text-secondary">
              Insere as 3 contas autorizadas em <code>public.users</code> com senha encriptada (
              <code>123456</code>), cria a função RPC <code>authenticate_itpgq_user</code> e aplica as políticas RLS seguras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setShowSqlPreview((prev) => (prev === 'patch' ? 'none' : 'patch'))
              }
              className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">shield_lock</span>
              <span>
                {showSqlPreview === 'patch'
                  ? 'Ocultar Script RLS'
                  : 'Ver Script RLS + 3 Contas'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCopySql('patch')}
              className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md cursor-pointer inline-flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedPatch ? 'check' : 'content_copy'}
              </span>
              <span>{copiedPatch ? 'Script Copiado!' : 'Copiar Script RLS + 3 Contas'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadSupabaseSqlFile(true);
                onQuickAction(
                  'Script RLS + 3 Contas Descarregado',
                  'O ficheiro supabase_correcao_rls_e_3_contas_itpgq.sql foi guardado.'
                );
              }}
              className="px-space-md py-space-xs rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md cursor-pointer inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Baixar Script (.SQL)</span>
            </button>
          </div>
        </div>

        {showSqlPreview !== 'none' && (
          <div className="mt-space-sm rounded-xl bg-[#0d2137] text-slate-100 p-space-md overflow-x-auto max-h-96 border border-slate-700">
            <pre className="font-mono text-xs leading-relaxed">
              {showSqlPreview === 'patch' ? SUPABASE_COMPLEMENTARY_SQL : SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
