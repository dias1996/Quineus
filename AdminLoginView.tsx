import React, { useState } from 'react';
import studentsLabImg from '../assets/images/imfa_students_lab_1790772683685.jpg';
import { ItpgqLogo } from './ItpgqLogo';
import {
  AdminProfileTab,
  AuthenticatedAdmin,
  authenticateWithRlsPolicy,
} from '../lib/authRls';

export type { AuthenticatedAdmin };

interface AdminLoginViewProps {
  onLoginSuccess: (admin: AuthenticatedAdmin) => void;
  onBackToPublicPortal?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onBackToPublicPortal,
}) => {
  const [selectedTab, setSelectedTab] = useState<AdminProfileTab>('superadmin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<{
    title: string;
    message: string;
    suggestedTab?: AdminProfileTab;
  } | null>(null);

  const isLockedOut = failedAttempts >= 5;

  const handleSelectRoleTab = (tab: AdminProfileTab) => {
    setSelectedTab(tab);
    setErrorAlert(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setIsAuthenticating(true);
    setErrorAlert(null);

    try {
      const result = await authenticateWithRlsPolicy({
        email,
        password,
        selectedTab,
      });

      if (!result.ok || !result.admin) {
        setFailedAttempts((prev) => prev + 1);
        setErrorAlert({
          title: result.errorTitle || 'Acesso Negado',
          message:
            result.errorMessage ||
            'Credenciais inválidas ou sem permissão para aceder a este módulo.',
          suggestedTab: result.mismatchRoleTab,
        });
        return;
      }

      setFailedAttempts(0);
      if (rememberMe) {
        try {
          localStorage.setItem('itpgq_last_rls_tab', result.admin.profileTab);
        } catch {
          // ignore storage error
        }
      }
      onLoginSuccess(result.admin);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#f8eff2] via-[#f0f3ff] to-[#e7eeff] font-body-md text-on-surface antialiased">
      {/* TOP NAVIGATION BAR */}
      <header className="w-full bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container px-space-md lg:px-12 h-16 flex items-center justify-between z-30">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-3">
            <ItpgqLogo className="h-11 w-11 shrink-0" />
            <span className="font-headline-sm text-xl font-bold text-primary tracking-tight">
              ITPGQ
            </span>
          </div>

          <span className="hidden sm:inline-block h-5 w-px bg-surface-variant mx-1"></span>

          <button
            type="button"
            onClick={() => {
              if (onBackToPublicPortal) {
                onBackToPublicPortal();
              } else {
                setInfoBanner(
                  'A redirecionar para o Portal Público de Inscrições da 10.ª Classe (Ano Lectivo 2026–2027).'
                );
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            <span>← Voltar ao Portal Público</span>
          </button>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-low border border-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-tertiary">
              verified_user
            </span>
            <span className="font-label-sm text-[11px] text-secondary">
              Ambiente Seguro <strong className="text-on-surface">SSL 256-bit</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setInfoBanner(
                'Suporte Técnico Gabinete de TI ITPGQ: Linha directa +244 923 000 100 • suporte@itpgq.ao'
              )
            }
            className="hidden sm:inline font-label-md text-label-md text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            Suporte Técnico
          </button>

          <button
            type="button"
            onClick={() =>
              setInfoBanner(
                'Directrizes MED Angola: Despacho Presidencial do Calendário Escolar 2026–2027 em vigor.'
              )
            }
            className="hidden sm:inline font-label-md text-label-md text-on-surface hover:text-primary transition-colors cursor-pointer"
          >
            Directrizes MED
          </button>

          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </header>

      {/* INFO BANNER IF CLICKED */}
      {infoBanner && (
        <div className="max-w-5xl w-full mx-auto mt-4 px-4">
          <div className="bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between text-body-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                info
              </span>
              <span>{infoBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setInfoBanner(null)}
              className="text-secondary-fixed-dim hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN LOGIN SPLIT CARD */}
      <main className="flex-1 flex items-center justify-center px-space-md py-8 lg:py-12">
        <div className="w-full max-w-[1060px] bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(16,42,67,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-surface-container">
          {/* LEFT PANEL: DARK NAVY INSTITUTIONAL */}
          <div
            className="lg:col-span-5 bg-[#0d2137] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className="space-y-6 relative z-10">
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#b52332] text-white font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  ÁREA RESTRITA
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/10 text-slate-200 font-label-sm text-[10px] tracking-wide border border-white/10">
                  Ano Lectivo 2026–2027
                </span>
              </div>

              {/* Headline & Subtitle */}
              <div className="space-y-2.5">
                <span className="font-label-sm text-[11px] text-[#f0c044] uppercase tracking-widest font-bold block">
                  ITPGQ • LUANDA, ANGOLA
                </span>
                <h1 className="font-headline-lg text-[30px] lg:text-[34px] leading-[1.18] font-bold text-white tracking-tight">
                  Acesso Administrativo &amp; Gestão de Candidaturas
                </h1>
                <p className="font-body-md text-[13.5px] leading-relaxed text-slate-300 pt-1">
                  Painel restrito a membros autorizados da Comissão de Admissão, Direcção
                  Pedagógica e Secretaria Escolar para controlo integral das candidaturas à 10.ª
                  Classe.
                </p>
              </div>

              {/* Classroom Photo Card */}
              <div className="relative rounded-xl overflow-hidden border border-white/15 h-48 bg-[#163252] shadow-inner">
                {!photoError ? (
                  <img
                    src={studentsLabImg}
                    alt="Formação Técnico-Profissional de Excelência no ITPGQ"
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#163252] to-[#0d2137] text-slate-300 p-4 text-center">
                    <span className="material-symbols-outlined text-[36px] text-[#f0c044] mb-1">
                      computer
                    </span>
                    <span className="font-label-md text-xs">
                      Laboratórios Técnicos Homologados ITPGQ
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-3.5">
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[18px] text-[#f0c044]">
                      school
                    </span>
                    <span className="font-label-md text-[12px] font-semibold tracking-wide">
                      Formação Técnico-Profissional de Excelência
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: LOGIN FORM */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 lg:p-12 flex flex-col justify-center">
            <div className="space-y-6">
              {/* Title & Subtitle */}
              <div>
                <h2 className="font-headline-lg text-[32px] leading-tight font-bold text-on-surface">
                  Iniciar Sessão
                </h2>
                <p className="font-body-md text-secondary mt-1">
                  Introduza as suas credenciais institucionais para aceder ao sistema de validação
                  e pauta de matrículas.
                </p>
              </div>

              {/* 3-Role Selector Tabs */}
              <div>
                <div className="p-1 bg-surface-container-low rounded-xl grid grid-cols-3 gap-1 border border-surface-variant/60">
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTab('superadmin')}
                    className={`py-2.5 px-2 rounded-lg font-label-md text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                      selectedTab === 'superadmin'
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">shield_person</span>
                    <span className="truncate">Super Administrador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTab('secretaria')}
                    className={`py-2.5 px-2 rounded-lg font-label-md text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                      selectedTab === 'secretaria'
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    <span className="truncate">Secretaria Escolar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectRoleTab('comissao')}
                    className={`py-2.5 px-2 rounded-lg font-label-md text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                      selectedTab === 'comissao'
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    <span className="truncate">Comissão Admissão</span>
                  </button>
                </div>
              </div>

              {/* ERROR ALERT IF UNAUTHORIZED OR WRONG PASSWORD */}
              {errorAlert && (
                <div className="p-3.5 rounded-xl bg-error-container/90 border border-error text-on-error-container space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">
                      gpp_bad
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-sm text-[13px] font-bold text-on-error-container">
                        {errorAlert.title}
                      </h4>
                      <p className="font-body-sm text-[12px] text-on-error-container/90 mt-0.5 leading-relaxed">
                        {errorAlert.message}
                      </p>
                    </div>
                  </div>
                  {errorAlert.suggestedTab && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTab(errorAlert.suggestedTab!);
                          setErrorAlert(null);
                        }}
                        className="px-3 py-1 rounded-md bg-error text-on-error font-label-sm text-[11px] font-bold cursor-pointer"
                      >
                        Mudar para a aba autorizada desta conta →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LOCKOUT ALERT AFTER 5 FAILED ATTEMPTS */}
              {isLockedOut && (
                <div className="p-4 rounded-xl bg-error text-on-error flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[22px]">lock_clock</span>
                    <div>
                      <h4 className="font-headline-sm text-[13px] font-bold">
                        Posto Bloqueado Temporariamente (5 Tentativas Inválidas)
                      </h4>
                      <p className="text-[12px] opacity-90">
                        A política de segurança bloqueou novas submissões devido a credenciais não autorizadas.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFailedAttempts(0);
                      setErrorAlert(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white text-error font-label-sm text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-label-md text-[12px] text-on-surface font-bold block">
                    E-mail Institucional
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                      alternate_email
                    </span>
                    <input
                      type="text"
                      required
                      disabled={isLockedOut}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorAlert) setErrorAlert(null);
                      }}
                      placeholder="Introduza o seu e-mail institucional"
                      className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface font-body-md placeholder-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-[12px] text-on-surface font-bold">
                      Palavra-passe Institucional
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setInfoBanner(
                          'Contacte o Gabinete de TI do ITPGQ para reposição de credenciais institucionais.'
                        )
                      }
                      className="font-label-sm text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      Esqueceu a palavra-passe?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                      key
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLockedOut}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorAlert) setErrorAlert(null);
                      }}
                      placeholder="Introduza a sua palavra-passe"
                      className="w-full h-12 pl-10 pr-11 rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface font-body-md placeholder-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
                      title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Session */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="font-body-sm text-secondary">
                      Lembrar sessão neste posto de trabalho
                    </span>
                  </label>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isAuthenticating || isLockedOut}
                  className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-[13px] uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                >
                  <span>
                    {isAuthenticating
                      ? 'A VERIFICAR CREDENCIAIS...'
                      : 'ENTRAR NO PAINEL ADMINISTRATIVO'}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>

              {/* Lockout Warning Box */}
              <div className="p-3.5 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                  error
                </span>
                <p className="font-body-sm text-[12px] text-secondary leading-relaxed">
                  Protecção activada: Após{' '}
                  <strong className="text-on-surface font-semibold">5 tentativas inválidas</strong>{' '}
                  consecutivas, o endereço IP será bloqueado temporariamente por 30 minutos.
                </p>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setInfoBanner(
                      'Pedido de apoio enviado ao Gabinete de TI do ITPGQ (Ticket #TI-2026-884).'
                    )
                  }
                  className="inline-flex items-center gap-1.5 font-label-sm text-[11px] text-secondary hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">headset_mic</span>
                  <span>Dificuldades no início de sessão? Solicitar apoio ao Gabinete de TI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PAGE FOOTER */}
      <footer className="w-full px-space-md lg:px-12 py-5 border-t border-surface-container bg-surface-container-low/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-secondary">
        <div>
          <div className="font-label-sm text-[11.5px] text-on-surface font-bold tracking-wide">
            © 2026–2027 ITPGQ • Instituto Técnico Politécnico de Gestão Quineus
          </div>
          <div className="font-body-sm text-[11.5px] text-secondary">
            Credenciado pelo Ministério da Educação (MED Angola) • Admissões 10.ª Classe
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-body-sm text-[11.5px]">
          <button
            type="button"
            onClick={() =>
              setInfoBanner('Política de Privacidade e Protecção de Dados Escolares (APD Angola).')
            }
            className="hover:text-on-surface cursor-pointer"
          >
            Privacidade e Segurança
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() =>
              setInfoBanner('Termos de Uso Exclusivo para Funcionários e Comissão de Admissão.')
            }
            className="hover:text-on-surface cursor-pointer"
          >
            Termos de Serviço
          </button>
          <span>•</span>
          <span>Gabinete de TI: suporte@itpgq.ao</span>
        </div>
      </footer>
    </div>
  );
};
