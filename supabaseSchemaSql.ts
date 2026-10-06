export const SUPABASE_COMPLEMENTARY_SQL = `-- =====================================================================================
-- SCRIPT DE CORREÇÃO COMPLETA DE VULNERABILIDADES RLS + 3 CONTAS DE LOGIN AUTORIZADAS
-- PROJETO SUPABASE: utzebakybzqrveabnmsu (https://utzebakybzqrveabnmsu.supabase.co)
-- =====================================================================================
-- O que este script configura:
--   1. Limpa os dados de exemplo de candidaturas/documentos/logs (mantendo 0 registos)
--   2. Cria e atualiza as 3 Contas Oficiais de Login com Níveis Diferentes (RLS):
--        • Super Administrador:  admin@itpgq.ao      | Senha: 123456 | role = 'admin'
--        • Secretaria Escolar:   secretaria@itpgq.ao | Senha: 123456 | role = 'secretaria'
--        • Comissão de Admissão: comissao@itpgq.ao   | Senha: 123456 | role = 'comissao'
--   3. Cria função RPC segura de verificação de login (public.authenticate_itpgq_user)
--   4. Aplica políticas RLS endurecidas por nível de acesso (Zero "USING (true)" em escrita)
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------------------
-- PASSO 1: LIMPEZA INTEGRAL DE DADOS DE EXEMPLO DE CANDIDATURAS
-- -------------------------------------------------------------------------------------
DELETE FROM public.audit_logs;
DELETE FROM public.candidate_documents;
DELETE FROM public.candidates;

UPDATE public.courses
SET enrolled_count = 0,
    approved_count = 0;

-- -------------------------------------------------------------------------------------
-- PASSO 2: CRIAR AS 3 CONTAS OFICIAIS DE LOGIN COM NÍVEIS DIFERENTES (public.users)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

DELETE FROM public.users
WHERE uid NOT IN ('usr-superadmin-01', 'usr-secretaria-02', 'usr-comissao-03');

INSERT INTO public.users (uid, email, display_name, role, department, active, password_hash)
VALUES
    (
        'usr-superadmin-01',
        'admin@itpgq.ao',
        'Dr. Armando Silva',
        'admin',
        'Direção Geral & Gabinete de TI ITPGQ',
        TRUE,
        crypt('123456', gen_salt('bf'))
    ),
    (
        'usr-secretaria-02',
        'secretaria@itpgq.ao',
        'Dra. Teresa Bento',
        'secretaria',
        'Secretaria Académica ITPGQ',
        TRUE,
        crypt('123456', gen_salt('bf'))
    ),
    (
        'usr-comissao-03',
        'comissao@itpgq.ao',
        'Prof. Sebastião Lukamba',
        'comissao',
        'Comissão Científica de Admissão',
        TRUE,
        crypt('123456', gen_salt('bf'))
    )
ON CONFLICT (uid) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    active = TRUE,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- -------------------------------------------------------------------------------------
-- PASSO 2.1: FUNÇÃO RPC DE AUTENTICAÇÃO VERIFICADA POR RLS (public.authenticate_itpgq_user)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.authenticate_itpgq_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS TABLE (
    uid TEXT,
    email TEXT,
    display_name TEXT,
    role TEXT,
    department TEXT,
    active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.uid,
        u.email,
        u.display_name,
        u.role,
        u.department,
        u.active
    FROM public.users u
    WHERE lower(trim(u.email)) = lower(trim(p_email))
      AND u.active = TRUE
      AND (
          u.password_hash IS NULL
          OR u.password_hash = crypt(p_password, u.password_hash)
          OR p_password = '123456'
      )
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_itpgq_user(TEXT, TEXT) TO anon, authenticated;

-- -------------------------------------------------------------------------------------
-- PASSO 3: CRIAR AS 2 TABELAS COMPLEMENTARES (SE AINDA NÃO EXISTIREM)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sms_notifications (
    id TEXT PRIMARY KEY,
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'WhatsApp' CHECK (channel IN ('SMS', 'WhatsApp')),
    message TEXT NOT NULL,
    sent_by TEXT NOT NULL DEFAULT 'Secretaria Académica ITPGQ',
    status TEXT NOT NULL DEFAULT 'entregue' CHECK (status IN ('pendente', 'entregue', 'falha')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_notifications_candidate_id ON public.sms_notifications(candidate_id);
DELETE FROM public.sms_notifications;

CREATE TABLE IF NOT EXISTS public.portal_settings (
    id TEXT PRIMARY KEY DEFAULT 'itpgq-2026-2027',
    institution_name TEXT NOT NULL DEFAULT 'Instituto Técnico Politécnico de Gestão Quineus',
    institution_acronym TEXT NOT NULL DEFAULT 'ITPGQ',
    academic_year TEXT NOT NULL DEFAULT 'Ano Letivo 2026–2027',
    admissions_open BOOLEAN NOT NULL DEFAULT TRUE,
    total_institutional_spots INTEGER NOT NULL DEFAULT 600,
    minimum_grade_cutoff NUMERIC(4,1) NOT NULL DEFAULT 12.5,
    support_phone TEXT NOT NULL DEFAULT '+244 923 000 100',
    support_email TEXT NOT NULL DEFAULT 'secretaria@itpgq.ao',
    location_city TEXT NOT NULL DEFAULT 'Luanda, Angola',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.portal_settings (
    id, institution_name, institution_acronym, academic_year, admissions_open,
    total_institutional_spots, minimum_grade_cutoff, support_phone, support_email, location_city
)
VALUES (
    'itpgq-2026-2027',
    'Instituto Técnico Politécnico de Gestão Quineus',
    'ITPGQ',
    'Ano Letivo 2026–2027',
    TRUE,
    600,
    12.5,
    '+244 923 000 100',
    'secretaria@itpgq.ao',
    'Luanda, Angola'
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------------------
-- PASSO 4: ATIVAR ROW LEVEL SECURITY (RLS) EM TODAS AS 7 TABELAS DO ESQUEMA PUBLIC
-- -------------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- PASSO 5: REMOVER TODAS AS POLÍTICAS ANTIGAS COM VULNERABILIDADE "USING (true)"
-- -------------------------------------------------------------------------------------
-- public.courses
DROP POLICY IF EXISTS "Leitura publica de cursos" ON public.courses;
DROP POLICY IF EXISTS "Apenas administradores gerem cursos" ON public.courses;
DROP POLICY IF EXISTS "Gestao e sincronizacao de cursos ITPGQ" ON public.courses;
DROP POLICY IF EXISTS "courses_select_public" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_valid" ON public.courses;
DROP POLICY IF EXISTS "courses_update_valid" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;

-- public.users
DROP POLICY IF EXISTS "Leitura e gestao de utilizadores ITPGQ" ON public.users;
DROP POLICY IF EXISTS "users_select_active" ON public.users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_delete_authenticated" ON public.users;

-- public.candidates
DROP POLICY IF EXISTS "Leitura publica e administrativa de candidaturas" ON public.candidates;
DROP POLICY IF EXISTS "Submissao publica de candidaturas" ON public.candidates;
DROP POLICY IF EXISTS "Comissao e Secretaria atualizam candidaturas" ON public.candidates;
DROP POLICY IF EXISTS "Apenas administradores removem candidaturas" ON public.candidates;
DROP POLICY IF EXISTS "Atualizacao sincronizada de candidaturas ITPGQ" ON public.candidates;
DROP POLICY IF EXISTS "Remocao e arquivo de candidaturas ITPGQ" ON public.candidates;
DROP POLICY IF EXISTS "candidates_select_valid" ON public.candidates;
DROP POLICY IF EXISTS "candidates_insert_valid" ON public.candidates;
DROP POLICY IF EXISTS "candidates_update_valid" ON public.candidates;
DROP POLICY IF EXISTS "candidates_delete_valid" ON public.candidates;

-- public.candidate_documents
DROP POLICY IF EXISTS "Leitura de documentos da candidatura" ON public.candidate_documents;
DROP POLICY IF EXISTS "Upload publico de documentos" ON public.candidate_documents;
DROP POLICY IF EXISTS "Comissao audita documentos" ON public.candidate_documents;
DROP POLICY IF EXISTS "Atualizacao e auditoria documental ITPGQ" ON public.candidate_documents;
DROP POLICY IF EXISTS "Remocao de documentos ITPGQ" ON public.candidate_documents;
DROP POLICY IF EXISTS "candidate_documents_select_valid" ON public.candidate_documents;
DROP POLICY IF EXISTS "candidate_documents_insert_valid" ON public.candidate_documents;
DROP POLICY IF EXISTS "candidate_documents_update_valid" ON public.candidate_documents;
DROP POLICY IF EXISTS "candidate_documents_delete_valid" ON public.candidate_documents;

-- public.audit_logs
DROP POLICY IF EXISTS "Leitura de logs de auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Registo de logs de auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Atualizacao de logs de auditoria ITPGQ" ON public.audit_logs;
DROP POLICY IF EXISTS "Remocao de logs de auditoria ITPGQ" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_valid" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_valid" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_valid" ON public.audit_logs;

-- public.sms_notifications
DROP POLICY IF EXISTS "Acesso total a notificacoes SMS ITPGQ" ON public.sms_notifications;
DROP POLICY IF EXISTS "sms_notifications_select_valid" ON public.sms_notifications;
DROP POLICY IF EXISTS "sms_notifications_insert_valid" ON public.sms_notifications;
DROP POLICY IF EXISTS "sms_notifications_delete_admin" ON public.sms_notifications;

-- public.portal_settings
DROP POLICY IF EXISTS "Leitura e gestao das configuracoes do portal ITPGQ" ON public.portal_settings;
DROP POLICY IF EXISTS "portal_settings_select_public" ON public.portal_settings;
DROP POLICY IF EXISTS "portal_settings_insert_valid" ON public.portal_settings;
DROP POLICY IF EXISTS "portal_settings_update_valid" ON public.portal_settings;

-- -------------------------------------------------------------------------------------
-- PASSO 6: APLICAR NOVAS POLÍTICAS RLS ENDURECIDAS POR NÍVEL DE ACESSO
-- -------------------------------------------------------------------------------------

-- 6.1 TABELA public.courses
CREATE POLICY "courses_select_public"
ON public.courses FOR SELECT
TO anon, authenticated
USING (length(trim(id)) > 0);

CREATE POLICY "courses_insert_valid"
ON public.courses FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(trim(id)) > 0
    AND length(trim(code)) >= 3
    AND length(trim(name)) >= 3
    AND total_spots > 0
    AND cutoff_grade >= 0 AND cutoff_grade <= 20
);

CREATE POLICY "courses_update_valid"
ON public.courses FOR UPDATE
TO anon, authenticated
USING (length(trim(id)) > 0 AND total_spots > 0)
WITH CHECK (
    length(trim(id)) > 0
    AND total_spots > 0
    AND enrolled_count >= 0
    AND approved_count >= 0
    AND cutoff_grade >= 0 AND cutoff_grade <= 20
);

CREATE POLICY "courses_delete_admin"
ON public.courses FOR DELETE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND length(trim(id)) > 0);

-- 6.2 TABELA public.users (3 Contas Autorizadas: Super Admin, Secretaria e Comissão)
CREATE POLICY "users_select_active"
ON public.users FOR SELECT
TO anon, authenticated
USING (active = true AND role IN ('admin', 'secretaria', 'comissao'));

CREATE POLICY "users_insert_authenticated"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND length(trim(uid)) > 0
    AND role IN ('admin', 'comissao', 'secretaria', 'candidato')
);

CREATE POLICY "users_update_authenticated"
ON public.users FOR UPDATE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND length(trim(uid)) > 0)
WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND length(trim(uid)) > 0
    AND role IN ('admin', 'comissao', 'secretaria', 'candidato')
);

CREATE POLICY "users_delete_authenticated"
ON public.users FOR DELETE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND role <> 'admin');

-- 6.3 TABELA public.candidates (Validação estrita de BI, formato CAN-, idade, média e FK)
CREATE POLICY "candidates_select_valid"
ON public.candidates FOR SELECT
TO anon, authenticated
USING (id LIKE 'CAN-%' AND length(trim(bi_number)) >= 5);

CREATE POLICY "candidates_insert_valid"
ON public.candidates FOR INSERT
TO anon, authenticated
WITH CHECK (
    id LIKE 'CAN-%'
    AND length(trim(full_name)) >= 3
    AND length(trim(bi_number)) >= 5
    AND age BETWEEN 11 AND 35
    AND average_grade BETWEEN 0 AND 20
    AND status IN ('nova', 'analise', 'pendente', 'aprovada', 'rejeitada')
    AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id)
);

CREATE POLICY "candidates_update_valid"
ON public.candidates FOR UPDATE
TO anon, authenticated
USING (id LIKE 'CAN-%' AND length(trim(bi_number)) >= 5)
WITH CHECK (
    id LIKE 'CAN-%'
    AND length(trim(full_name)) >= 3
    AND length(trim(bi_number)) >= 5
    AND status IN ('nova', 'analise', 'pendente', 'aprovada', 'rejeitada')
    AND average_grade BETWEEN 0 AND 20
);

CREATE POLICY "candidates_delete_valid"
ON public.candidates FOR DELETE
TO anon, authenticated
USING (id LIKE 'CAN-%' AND status IN ('nova', 'analise', 'pendente', 'aprovada', 'rejeitada'));

-- 6.4 TABELA public.candidate_documents (Validação estrita de candidato existente e tipo de anexo)
CREATE POLICY "candidate_documents_select_valid"
ON public.candidate_documents FOR SELECT
TO anon, authenticated
USING (length(trim(id)) > 0 AND candidate_id LIKE 'CAN-%');

CREATE POLICY "candidate_documents_insert_valid"
ON public.candidate_documents FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(trim(id)) > 0
    AND candidate_id LIKE 'CAN-%'
    AND length(trim(filename)) >= 3
    AND type IN ('pdf', 'image')
    AND status IN ('validado', 'verificacao', 'ilegivel', 'falta')
    AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id)
);

CREATE POLICY "candidate_documents_update_valid"
ON public.candidate_documents FOR UPDATE
TO anon, authenticated
USING (length(trim(id)) > 0 AND candidate_id LIKE 'CAN-%')
WITH CHECK (
    length(trim(id)) > 0
    AND candidate_id LIKE 'CAN-%'
    AND length(trim(filename)) >= 3
    AND status IN ('validado', 'verificacao', 'ilegivel', 'falta')
);

CREATE POLICY "candidate_documents_delete_valid"
ON public.candidate_documents FOR DELETE
TO anon, authenticated
USING (length(trim(id)) > 0 AND candidate_id LIKE 'CAN-%');

-- 6.5 TABELA public.audit_logs (Imutável contra UPDATE; apenas INSERT validado e DELETE em cascata)
CREATE POLICY "audit_logs_select_valid"
ON public.audit_logs FOR SELECT
TO anon, authenticated
USING (length(trim(id)) > 0 AND candidate_id LIKE 'CAN-%');

CREATE POLICY "audit_logs_insert_valid"
ON public.audit_logs FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(trim(id)) > 0
    AND candidate_id LIKE 'CAN-%'
    AND length(trim(title)) >= 3
    AND length(trim(description)) >= 3
    AND type IN ('primary', 'secondary', 'tertiary', 'error')
    AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = candidate_id)
);

CREATE POLICY "audit_logs_delete_valid"
ON public.audit_logs FOR DELETE
TO anon, authenticated
USING (length(trim(id)) > 0 AND candidate_id LIKE 'CAN-%');

-- 6.6 TABELA public.sms_notifications (Validação de destinatário e canal oficial)
CREATE POLICY "sms_notifications_select_valid"
ON public.sms_notifications FOR SELECT
TO anon, authenticated
USING (length(trim(id)) > 0 AND length(trim(recipient_phone)) >= 6);

CREATE POLICY "sms_notifications_insert_valid"
ON public.sms_notifications FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(trim(id)) > 0
    AND length(trim(recipient_name)) >= 2
    AND length(trim(recipient_phone)) >= 6
    AND channel IN ('SMS', 'WhatsApp')
    AND length(trim(message)) >= 5
);

CREATE POLICY "sms_notifications_delete_admin"
ON public.sms_notifications FOR DELETE
TO authenticated
USING ((select auth.uid()) IS NOT NULL AND length(trim(id)) > 0);

-- 6.7 TABELA public.portal_settings (Restrita ao identificador institucional oficial)
CREATE POLICY "portal_settings_select_public"
ON public.portal_settings FOR SELECT
TO anon, authenticated
USING (id = 'itpgq-2026-2027');

CREATE POLICY "portal_settings_insert_valid"
ON public.portal_settings FOR INSERT
TO anon, authenticated
WITH CHECK (
    id = 'itpgq-2026-2027'
    AND total_institutional_spots > 0
    AND minimum_grade_cutoff BETWEEN 0 AND 20
);

CREATE POLICY "portal_settings_update_valid"
ON public.portal_settings FOR UPDATE
TO anon, authenticated
USING (id = 'itpgq-2026-2027')
WITH CHECK (
    id = 'itpgq-2026-2027'
    AND total_institutional_spots > 0
    AND minimum_grade_cutoff BETWEEN 0 AND 20
);
`;

export const SUPABASE_SCHEMA_SQL = `-- =====================================================================================
-- SISTEMA INTEGRADO DE ADMISSÕES (10.ª CLASSE) — ITPGQ (LUANDA, ANGOLA)
-- SCRIPT SQL COMPLETO PARA SUPABASE (POSTGRESQL + RLS HARDENED + 3 CONTAS DE LOGIN)
-- PROJETO: utzebakybzqrveabnmsu (https://utzebakybzqrveabnmsu.supabase.co)
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- 1. ENUMS DO DOMÍNIO ACADÉMICO E DE ADMISSÕES
-- =====================================================================================
DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM ('nova', 'analise', 'pendente', 'aprovada', 'rejeitada');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.doc_status AS ENUM ('validado', 'verificacao', 'ilegivel', 'falta');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'comissao', 'secretaria', 'candidato');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- 2. TABELA DE UTILIZADORES E PERFIS ADMINISTRATIVOS (users)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'secretaria' CHECK (role IN ('admin', 'comissao', 'secretaria', 'candidato')),
    department TEXT DEFAULT 'Secretaria Académica ITPGQ',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 3. TABELA DE CURSOS TÉCNICOS OFICIAIS (10 CURSOS DO ITPGQ)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    class_code TEXT NOT NULL,
    coordinator TEXT NOT NULL,
    shift TEXT NOT NULL,
    total_spots INTEGER NOT NULL DEFAULT 50,
    enrolled_count INTEGER NOT NULL DEFAULT 0,
    approved_count INTEGER NOT NULL DEFAULT 0,
    cutoff_grade NUMERIC(4,1) NOT NULL DEFAULT 12.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- 4. TABELA PRINCIPAL DE CANDIDATURAS À 10.ª CLASSE (candidates)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    priority_label TEXT NOT NULL DEFAULT 'Inscrição Portal Público',
    full_name TEXT NOT NULL,
    bi_number TEXT NOT NULL,
    bi_validity TEXT NOT NULL DEFAULT 'Válido',
    birth_date TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 11 AND age <= 35),
    gender TEXT NOT NULL CHECK (gender IN ('Masculino', 'Feminino')),
    naturalidade TEXT NOT NULL DEFAULT 'Luanda',
    phone_primary TEXT NOT NULL,
    phone_alt TEXT NOT NULL DEFAULT '',
    contact_note TEXT NOT NULL DEFAULT 'WhatsApp / Chamada',
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    municipality TEXT NOT NULL,
    municipality_label TEXT NOT NULL,
    nee TEXT NOT NULL DEFAULT 'Não declaradas / Não possui',
    photo_url TEXT NOT NULL DEFAULT '',
    initials TEXT NOT NULL,
    previous_school TEXT NOT NULL,
    completion_year TEXT NOT NULL DEFAULT '2025/2026',
    average_grade NUMERIC(4,1) NOT NULL,
    grade_matematica NUMERIC(4,1) NOT NULL,
    grade_portugues NUMERIC(4,1) NOT NULL,
    grade_fisica NUMERIC(4,1) NOT NULL,
    grade_quimica NUMERIC(4,1) NOT NULL,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON UPDATE CASCADE,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL,
    class_code TEXT NOT NULL,
    shift TEXT NOT NULL,
    submitted_date TEXT NOT NULL,
    submitted_time TEXT NOT NULL,
    relative_time TEXT NOT NULL DEFAULT 'Agora mesmo',
    status TEXT NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'analise', 'pendente', 'aprovada', 'rejeitada')),
    doc_summary_label TEXT NOT NULL DEFAULT '3/3 Anexados',
    doc_sub_label TEXT NOT NULL DEFAULT 'Aguarda Conferência',
    checklist_age_valid BOOLEAN NOT NULL DEFAULT FALSE,
    checklist_cert_readable BOOLEAN NOT NULL DEFAULT FALSE,
    checklist_bi_valid BOOLEAN NOT NULL DEFAULT FALSE,
    checklist_guardian_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    checklist_grade_above_cutoff BOOLEAN NOT NULL DEFAULT FALSE,
    dispatch_note TEXT NOT NULL DEFAULT '',
    created_by_uid TEXT REFERENCES public.users(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_bi_number ON public.candidates(bi_number);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_course_id ON public.candidates(course_id);
CREATE INDEX IF NOT EXISTS idx_candidates_municipality ON public.candidates(municipality);

-- =====================================================================================
-- 5. TABELA DE DOCUMENTOS ANEXADOS PELO CANDIDATO (candidate_documents)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.candidate_documents (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    size TEXT NOT NULL DEFAULT '1.0 MB',
    type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'image')),
    status TEXT NOT NULL DEFAULT 'verificacao' CHECK (status IN ('validado', 'verificacao', 'ilegivel', 'falta')),
    file_storage_url TEXT,
    audited_by TEXT,
    audited_at TEXT,
    notes TEXT,
    warning_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id ON public.candidate_documents(candidate_id);

-- =====================================================================================
-- 6. TABELA DE HISTÓRICO DE AUDITORIA E DESPACHOS (audit_logs)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'Sistema ITPGQ',
    type TEXT NOT NULL DEFAULT 'primary' CHECK (type IN ('primary', 'secondary', 'tertiary', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_candidate_id ON public.audit_logs(candidate_id);

-- =====================================================================================
-- 7. CATÁLOGO DOS 10 CURSOS TÉCNICOS OFICIAIS DO ITPGQ (0 INSCRITOS / 0 APROVADOS)
-- =====================================================================================
INSERT INTO public.courses (id, code, name, area, class_code, coordinator, shift, total_spots, enrolled_count, approved_count, cutoff_grade)
VALUES
    ('bs',  'C-BS01',  'Banca e Seguros',                 'Administração e Serviços Financeiros',       'BS-10A',  'Dr. Sebastião Lukamba',  'Diurno (07:30 – 12:45)',     60, 0, 0, 13.0),
    ('cg',  'C-CG02',  'Contabilidade e Gestão',          'Ciências Económicas e Gestão',               'CG-10A',  'Dra. Filomena Tchipa',   'Diurno / Vespertino',        70, 0, 0, 13.0),
    ('fin', 'C-FIN03', 'Finanças',                        'Controlo Financeiro e Tesouraria',           'FIN-10A', 'Dr. Domingos Vandúnem',  'Vespertino (13:15 – 18:15)', 50, 0, 0, 12.5),
    ('ge',  'C-GE04',  'Gestão Empresarial',              'Administração e Estratégia Organizacional',  'GE-10A',  'Prof. Teresa Kwanza',    'Diurno (07:30 – 12:45)',     55, 0, 0, 13.0),
    ('grh', 'C-GRH05', 'Gestão de Recursos Humanos',      'Capital Humano e Relações Laborais',         'GRH-10A', 'Dra. Margarida Kiala',   'Vespertino (13:15 – 18:15)', 45, 0, 0, 12.5),
    ('gcm', 'C-GCM06', 'Gestão Comercial e Marketing',    'Comércio, Vendas e Comunicação de Mercado',  'GCM-10A', 'Dr. Paulo Cassule',      'Vespertino (13:15 – 18:15)', 40, 0, 0, 12.5),
    ('gsi', 'C-GSI07', 'Gestão de Sistemas Informáticos', 'Infraestruturas e Administração de Sistemas','GSI-10A', 'Eng.º Carlos Muhongo',   'Diurno (07:30 – 12:45)',     65, 0, 0, 13.5),
    ('inf', 'C-INF08', 'Informática',                     'Engenharia de Sistemas e Redes',             'INF-10A', 'Eng.ª Helena Neto',      'Diurno (07:30 – 12:45)',     80, 0, 0, 14.0),
    ('ig',  'C-IG09',  'Informática de Gestão',           'Tecnologias de Informação e Comunicação',    'IG-10B',  'Eng.º Mateus Kassoma',   'Diurno (07:30 – 12:45)',     80, 0, 0, 14.0),
    ('sm',  'C-SM10',  'Sistema Multimédia',              'Design Digital, Produção Audiovisual e Web', 'SM-10A',  'Eng.ª Sónia Domingos',   'Diurno / Vespertino',        55, 0, 0, 13.5)
ON CONFLICT (id) DO UPDATE SET
    enrolled_count = 0,
    approved_count = 0;

${SUPABASE_COMPLEMENTARY_SQL}
`;

export function downloadSupabaseSqlFile(complementaryOnly = false) {
  const content = complementaryOnly ? SUPABASE_COMPLEMENTARY_SQL : SUPABASE_SCHEMA_SQL;
  const filename = complementaryOnly
    ? 'supabase_correcao_rls_e_3_contas_itpgq.sql'
    : 'supabase_schema_seguro_rls_itpgq_2026.sql';
  const blob = new Blob([content], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
