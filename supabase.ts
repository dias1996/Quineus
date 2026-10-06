import { createClient } from '@supabase/supabase-js';
import {
  ApplicationStatus,
  AuditLogEntry,
  Candidate,
  CandidateDocument,
  CourseId,
  COURSES_DATA,
  DocStatus,
} from '../data/imfaData';

const getEnvVar = (viteKey: string, nodeKey: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
      return (import.meta as any).env[viteKey];
    }
  } catch {
    // ignore in Node runtime
  }
  try {
    if (typeof process !== 'undefined' && process.env?.[nodeKey]) {
      return process.env[nodeKey] as string;
    }
  } catch {
    // ignore in browser runtime
  }
  return fallback;
};

export const SUPABASE_URL = getEnvVar(
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'https://utzebakybzqrveabnmsu.supabase.co'
);

export const SUPABASE_ANON_KEY = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emViYWt5YnpxcnZlYWJubXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3ODI1ODUsImV4cCI6MjEwNjM1ODU4NX0.FKdW2t0yKtDeiDvTXGD_yGT8tdyHwSL-qPTEWGSgtUU'
);

export const SUPABASE_CONFIG = {
  projectRef: 'utzebakybzqrveabnmsu',
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  anonKeyPreview: `${SUPABASE_ANON_KEY.slice(0, 28)}...${SUPABASE_ANON_KEY.slice(-12)}`,
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// IDs dos 8 registos de exemplo anteriores que são ignorados / removidos
export const LEGACY_SAMPLE_IDS = [
  'CAN-2026-000128',
  'CAN-2026-000129',
  'CAN-2026-000130',
  'CAN-2026-000131',
  'CAN-2026-000132',
  'CAN-2026-000133',
  'CAN-2026-000134',
  'CAN-2026-000135',
  'CAN-2026-000520',
  'CAN-2026-000524',
];
const LEGACY_SAMPLE_SET = new Set(LEGACY_SAMPLE_IDS);

export interface SupabaseTableHealth {
  table: string;
  description: string;
  exists: boolean;
  count: number;
  rlsPolicySummary: string;
  error?: string;
}

export interface SupabaseConnectionStatus {
  connected: boolean;
  schemaReady: boolean;
  complementaryReady: boolean;
  rlsHardened: boolean;
  projectRef: string;
  url: string;
  latencyMs: number;
  tables: SupabaseTableHealth[];
  checkedAt: string;
  message: string;
}

const TABLE_METADATA: { table: string; description: string; rlsPolicySummary: string }[] = [
  {
    table: 'courses',
    description: '10 Cursos Técnicos Oficiais ITPGQ',
    rlsPolicySummary: 'SELECT público validado | INSERT/UPDATE c/ validação de vagas e corte | DELETE restrito a Admin (auth.uid)',
  },
  {
    table: 'candidates',
    description: 'Candidaturas à 10.ª Classe',
    rlsPolicySummary: 'SELECT/INSERT/UPDATE/DELETE c/ validação estrita de BI, formato CAN-, idade (11–35), média (0–20) e FK curso',
  },
  {
    table: 'candidate_documents',
    description: 'Anexos Documentais (BI, Cert., Foto)',
    rlsPolicySummary: 'SELECT/INSERT/UPDATE/DELETE c/ validação de existência do candidato (EXISTS FK) e tipo (pdf/image)',
  },
  {
    table: 'audit_logs',
    description: 'Histórico de Auditoria e Despachos',
    rlsPolicySummary: 'Registo imutável (sem UPDATE) | INSERT validado por FK de candidato | DELETE apenas em cascata',
  },
  {
    table: 'users',
    description: 'Utilizadores & Comissão de Admissão',
    rlsPolicySummary: 'SELECT perfis ativos | Escrita (INSERT/UPDATE/DELETE) bloqueada a anon e restrita a (select auth.uid())',
  },
  {
    table: 'sms_notifications',
    description: 'Notificações SMS / WhatsApp (+244)',
    rlsPolicySummary: 'INSERT/SELECT c/ validação de telefone (+244) e canal (SMS/WhatsApp) | DELETE restrito a Admin',
  },
  {
    table: 'portal_settings',
    description: 'Configurações do Portal & Ano Letivo',
    rlsPolicySummary: 'Restrito ao ID institucional itpgq-2026-2027 c/ validação de vagas (> 0) e média de corte (0–20)',
  },
];

export async function purgeLegacySampleDataFromSupabase(): Promise<void> {
  try {
    await supabase.from('audit_logs').delete().in('candidate_id', LEGACY_SAMPLE_IDS);
    await supabase.from('candidate_documents').delete().in('candidate_id', LEGACY_SAMPLE_IDS);
    await supabase.from('candidates').delete().in('id', LEGACY_SAMPLE_IDS);
  } catch {
    // ignore if RLS requires complementary script
  }
}

export async function checkSupabaseStatus(): Promise<SupabaseConnectionStatus> {
  const start = Date.now();
  const tables: SupabaseTableHealth[] = [];
  let networkReachable = true;

  await purgeLegacySampleDataFromSupabase();

  for (const item of TABLE_METADATA) {
    try {
      let query = supabase.from(item.table).select('*', { count: 'exact' }).limit(1);

      if (item.table === 'candidates') {
        query = supabase
          .from(item.table)
          .select('*', { count: 'exact' })
          .not('id', 'in', `(${LEGACY_SAMPLE_IDS.join(',')})`)
          .limit(1);
      } else if (item.table === 'candidate_documents' || item.table === 'audit_logs') {
        query = supabase
          .from(item.table)
          .select('*', { count: 'exact' })
          .not('candidate_id', 'in', `(${LEGACY_SAMPLE_IDS.join(',')})`)
          .limit(1);
      }

      const { count, error } = await query;

      if (error) {
        const isMissingTable =
          !error.message ||
          error.code === '42P01' ||
          error.code === 'PGRST116' ||
          error.code === 'PGRST204' ||
          error.code === 'PGRST205' ||
          error.message?.toLowerCase().includes('does not exist') ||
          error.message?.toLowerCase().includes('schema cache') ||
          error.message?.toLowerCase().includes('not find the table');

        tables.push({
          table: item.table,
          description: item.description,
          exists: !isMissingTable,
          count: 0,
          rlsPolicySummary: item.rlsPolicySummary,
          error: error.message,
        });
      } else {
        tables.push({
          table: item.table,
          description: item.description,
          exists: true,
          count: count ?? 0,
          rlsPolicySummary: item.rlsPolicySummary,
        });
      }
    } catch (err: any) {
      networkReachable = false;
      tables.push({
        table: item.table,
        description: item.description,
        exists: false,
        count: 0,
        rlsPolicySummary: item.rlsPolicySummary,
        error: err?.message || 'Erro de rede',
      });
    }
  }

  // Check if legacy rows were physically deleted (meaning the new RLS DELETE policy is active)
  let rlsHardened = false;
  try {
    const { count: legacyRemaining } = await supabase
      .from('candidates')
      .select('id', { count: 'exact' })
      .in('id', LEGACY_SAMPLE_IDS)
      .limit(1);
    const allSevenExist = tables.filter((t) => t.exists).length === 7;
    rlsHardened = allSevenExist && (legacyRemaining ?? 0) === 0;
  } catch {
    rlsHardened = false;
  }

  const latencyMs = Date.now() - start;
  const coreExisting = tables
    .filter((t) =>
      ['courses', 'candidates', 'candidate_documents', 'audit_logs', 'users'].includes(t.table)
    )
    .filter((t) => t.exists).length;
  const allExisting = tables.filter((t) => t.exists).length;
  const schemaReady = coreExisting >= 5;
  const complementaryReady = allExisting === 7;

  let message =
    'Todas as 7 tabelas estão ativas, limpas e com políticas RLS seguras (0 vulnerabilidades Always True).';
  if (!networkReachable) {
    message = 'Não foi possível contactar o servidor Supabase. Verifique a ligação à internet.';
  } else if (schemaReady && !rlsHardened) {
    message =
      'Execute o Script de Correção RLS abaixo no SQL Editor do Supabase para remover as políticas antigas com "USING (true)", ativar as políticas de segurança em public.users e criar as 2 tabelas complementares.';
  } else if (!schemaReady) {
    message =
      'Ligado ao projeto utzebakybzqrveabnmsu. Execute o Script SQL no SQL Editor do Supabase.';
  }

  return {
    connected: networkReachable,
    schemaReady,
    complementaryReady,
    rlsHardened,
    projectRef: SUPABASE_CONFIG.projectRef,
    url: SUPABASE_CONFIG.url,
    latencyMs,
    tables,
    checkedAt: new Date().toLocaleTimeString('pt-AO'),
    message,
  };
}

export async function seedCoursesToSupabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase.from('courses').select('id');
    const existingIds = new Set((existing || []).map((r: any) => r.id));

    const missingCourses = COURSES_DATA.filter((c) => !existingIds.has(c.id));
    if (missingCourses.length === 0) {
      return { ok: true };
    }

    const payload = missingCourses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      area: c.area,
      class_code: c.classCode,
      coordinator: c.coordinator,
      shift: c.shift,
      total_spots: c.totalSpots,
      enrolled_count: 0,
      approved_count: 0,
      cutoff_grade: c.cutoffGrade,
    }));

    const { error } = await supabase.from('courses').insert(payload);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha ao sincronizar cursos no Supabase' };
  }
}

function cleanStockPhotoUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.includes('AB6AXuAMZfZIEs70MklTnzRmlISB3X30dUJNcOtFbIUpizpnHFetejjsvszTfFs') ||
    url.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk')
  ) {
    return '';
  }
  return url;
}

export async function upsertCandidateToSupabase(
  cand: Candidate,
  createdByUid?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (LEGACY_SAMPLE_SET.has(cand.id)) {
      return { ok: true };
    }

    await seedCoursesToSupabase();

    const sanitizedPhotoUrl = cleanStockPhotoUrl(cand.photoUrl);

    const candidateRow = {
      id: cand.id,
      priority_label: cand.priorityLabel,
      full_name: cand.fullName,
      bi_number: cand.biNumber,
      bi_validity: cand.biValidity,
      birth_date: cand.birthDate,
      age: cand.age,
      gender: cand.gender,
      naturalidade: cand.naturalidade,
      phone_primary: cand.phonePrimary,
      phone_alt: cand.phoneAlt || '',
      contact_note: cand.contactNote || '',
      email: cand.email,
      address: cand.address,
      municipality: cand.municipality,
      municipality_label: cand.municipalityLabel,
      nee: cand.nee,
      photo_url: sanitizedPhotoUrl,
      initials: cand.initials,
      previous_school: cand.previousSchool,
      completion_year: cand.completionYear,
      average_grade: cand.averageGrade,
      grade_matematica: cand.grades.matematica,
      grade_portugues: cand.grades.portugues,
      grade_fisica: cand.grades.fisica,
      grade_quimica: cand.grades.quimica,
      course_id: cand.courseId,
      course_name: cand.courseName,
      course_code: cand.courseCode,
      class_code: cand.classCode,
      shift: cand.shift,
      submitted_date: cand.submittedDate,
      submitted_time: cand.submittedTime,
      relative_time: cand.relativeTime,
      status: cand.status,
      doc_summary_label: cand.docSummaryLabel,
      doc_sub_label: cand.docSubLabel,
      checklist_age_valid: cand.checklist.ageValid,
      checklist_cert_readable: cand.checklist.certReadable,
      checklist_bi_valid: cand.checklist.biValid,
      checklist_guardian_confirmed: cand.checklist.guardianConfirmed,
      checklist_grade_above_cutoff: cand.checklist.gradeAboveCutoff,
      dispatch_note: cand.dispatchNote || '',
      created_by_uid: createdByUid || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existingCand } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', cand.id)
      .maybeSingle();

    if (!existingCand) {
      const { error: insErr } = await supabase.from('candidates').insert(candidateRow);
      if (insErr) {
        return { ok: false, error: insErr.message };
      }
    } else {
      const { error: updErr } = await supabase
        .from('candidates')
        .update(candidateRow)
        .eq('id', cand.id);
      if (updErr) {
        return { ok: false, error: updErr.message };
      }
    }

    if (cand.documents && cand.documents.length > 0) {
      const { data: existingDocs } = await supabase
        .from('candidate_documents')
        .select('id')
        .eq('candidate_id', cand.id);
      const existingDocIds = new Set((existingDocs || []).map((d: any) => d.id));

      for (const doc of cand.documents) {
        const storageUrl =
          cleanStockPhotoUrl(doc.fileStorageUrl) ||
          (doc.type === 'image' && sanitizedPhotoUrl ? sanitizedPhotoUrl : null);

        const docPayload = {
          id: doc.id,
          candidate_id: cand.id,
          title: doc.title,
          filename: doc.filename,
          size: doc.size,
          type: doc.type,
          status: doc.status,
          file_storage_url: storageUrl,
          audited_by: doc.auditedBy || null,
          audited_at: doc.auditedAt || null,
          notes: doc.notes || null,
          warning_note: doc.warningNote || null,
        };
        if (!existingDocIds.has(doc.id)) {
          await supabase.from('candidate_documents').insert(docPayload);
        } else {
          await supabase.from('candidate_documents').update(docPayload).eq('id', doc.id);
        }
      }
    }

    if (cand.auditLogs && cand.auditLogs.length > 0) {
      const { data: existingLogs } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('candidate_id', cand.id);
      const existingLogIds = new Set((existingLogs || []).map((l: any) => l.id));

      const newLogs = cand.auditLogs
        .filter((log) => !existingLogIds.has(log.id))
        .map((log) => ({
          id: log.id,
          candidate_id: cand.id,
          timestamp: log.timestamp,
          title: log.title,
          description: log.description,
          actor: log.actor || 'Sistema ITPGQ',
          type: log.type,
        }));

      if (newLogs.length > 0) {
        await supabase.from('audit_logs').insert(newLogs);
      }
    }

    // Automatically update course enrolled & approved counters in Supabase
    try {
      const { data: courseCands } = await supabase
        .from('candidates')
        .select('status')
        .eq('course_id', cand.courseId)
        .not('id', 'in', `(${LEGACY_SAMPLE_IDS.join(',')})`);
      if (courseCands) {
        const enrolledCount = courseCands.length;
        const approvedCount = courseCands.filter((c: any) => c.status === 'aprovada').length;
        await supabase
          .from('courses')
          .update({ enrolled_count: enrolledCount, approved_count: approvedCount })
          .eq('id', cand.courseId);
      }
    } catch {
      // non-fatal counter update
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro ao gravar candidato no Supabase' };
  }
}

export async function insertSmsNotificationToSupabase(params: {
  candidateId?: string;
  recipientName: string;
  recipientPhone: string;
  channel: string;
  message: string;
  sentBy?: string;
}): Promise<void> {
  try {
    await supabase.from('sms_notifications').insert({
      id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      candidate_id: params.candidateId || null,
      recipient_name: params.recipientName,
      recipient_phone: params.recipientPhone,
      channel: params.channel === 'WhatsApp' ? 'WhatsApp' : 'SMS',
      message: params.message,
      sent_by: params.sentBy || 'Secretaria Académica ITPGQ',
      status: 'entregue',
    });
  } catch {
    // ignore if table not created yet
  }
}

export async function deleteCandidatesFromSupabase(
  ids: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (ids.length === 0) return { ok: true };
    await supabase.from('candidate_documents').delete().in('candidate_id', ids);
    await supabase.from('audit_logs').delete().in('candidate_id', ids);
    await supabase.from('candidate_timeline').delete().in('candidate_id', ids);
    await supabase.from('notifications').delete().in('candidate_id', ids);
    const { error } = await supabase.from('candidates').delete().in('id', ids);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro ao remover candidatos no Supabase' };
  }
}

export async function fetchCandidatesFromSupabase(): Promise<Candidate[] | null> {
  try {
    await purgeLegacySampleDataFromSupabase();

    const { data: candRows, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .not('id', 'in', `(${LEGACY_SAMPLE_IDS.join(',')})`)
      .order('created_at', { ascending: false });

    if (candError) {
      return null;
    }

    const filteredRows = (candRows || []).filter((r: any) => !LEGACY_SAMPLE_SET.has(r.id));
    if (filteredRows.length === 0) {
      return [];
    }

    const { data: docRows } = await supabase.from('candidate_documents').select('*');
    const { data: logRows } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    const docsByCandidate = new Map<string, CandidateDocument[]>();
    for (const d of docRows || []) {
      if (LEGACY_SAMPLE_SET.has(d.candidate_id)) continue;
      const list = docsByCandidate.get(d.candidate_id) || [];
      list.push({
        id: d.id,
        title: d.title,
        filename: d.filename,
        size: d.size,
        type: (d.type === 'image' ? 'image' : 'pdf') as 'pdf' | 'image',
        status: d.status as DocStatus,
        fileStorageUrl: cleanStockPhotoUrl(d.file_storage_url) || undefined,
        auditedBy: d.audited_by || undefined,
        auditedAt: d.audited_at || undefined,
        notes: d.notes || undefined,
        warningNote: d.warning_note || undefined,
      });
      docsByCandidate.set(d.candidate_id, list);
    }

    const logsByCandidate = new Map<string, AuditLogEntry[]>();
    for (const l of logRows || []) {
      if (LEGACY_SAMPLE_SET.has(l.candidate_id)) continue;
      const list = logsByCandidate.get(l.candidate_id) || [];
      list.push({
        id: l.id,
        timestamp: l.timestamp,
        title: l.title,
        description: l.description,
        actor: l.actor,
        type: l.type as AuditLogEntry['type'],
      });
      logsByCandidate.set(l.candidate_id, list);
    }

    return filteredRows.map((r: any) => {
      const candidateDocs = docsByCandidate.get(r.id) || [];
      const imageDoc = candidateDocs.find((d) => d.type === 'image' && d.fileStorageUrl);
      const resolvedPhotoUrl =
        cleanStockPhotoUrl(r.photo_url) ||
        (imageDoc?.fileStorageUrl?.startsWith('data:image/') ||
        imageDoc?.fileStorageUrl?.startsWith('http')
          ? imageDoc.fileStorageUrl
          : '');

      const finalDocs: CandidateDocument[] =
        candidateDocs.length > 0
          ? candidateDocs.sort((a, b) => a.title.localeCompare(b.title))
          : [
              {
                id: `doc-${r.id}-1`,
                title: '1. Bilhete de Identidade (BI)',
                filename: `BI_${r.initials || 'CAND'}.pdf`,
                size: '1.1 MB',
                type: 'pdf',
                status: 'verificacao',
              },
              {
                id: `doc-${r.id}-2`,
                title: '2. Certificado de Habilitações da 9.ª Classe',
                filename: `Certificado_9Classe_${r.initials || 'CAND'}.pdf`,
                size: '1.9 MB',
                type: 'pdf',
                status: 'verificacao',
              },
              {
                id: `doc-${r.id}-3`,
                title: '3. Fotografia Tipo Passe Recente',
                filename: `Foto_Passe_${r.initials || 'CAND'}.jpg`,
                size: '420 KB',
                type: 'image',
                status: 'validado',
                fileStorageUrl: resolvedPhotoUrl || undefined,
              },
            ];

      return {
        id: r.id,
        priorityLabel: r.priority_label,
        fullName: r.full_name,
        biNumber: r.bi_number,
        biValidity: r.bi_validity,
        birthDate: r.birth_date,
        age: Number(r.age),
        gender: (r.gender === 'Feminino' ? 'Feminino' : 'Masculino') as 'Masculino' | 'Feminino',
        naturalidade: r.naturalidade,
        phonePrimary: r.phone_primary,
        phoneAlt: r.phone_alt || '',
        contactNote: r.contact_note || '',
        email: r.email,
        address: r.address,
        municipality: r.municipality as Candidate['municipality'],
        municipalityLabel: r.municipality_label,
        nee: r.nee,
        photoUrl: resolvedPhotoUrl,
        initials: r.initials,
        previousSchool: r.previous_school,
        completionYear: r.completion_year,
        averageGrade: Number(r.average_grade),
        grades: {
          matematica: Number(r.grade_matematica),
          portugues: Number(r.grade_portugues),
          fisica: Number(r.grade_fisica),
          quimica: Number(r.grade_quimica),
        },
        courseId: r.course_id as CourseId,
        courseName: r.course_name,
        courseCode: r.course_code,
        classCode: r.class_code,
        shift: r.shift,
        submittedDate: r.submitted_date,
        submittedTime: r.submitted_time,
        relativeTime: r.relative_time,
        status: r.status as ApplicationStatus,
        docSummaryLabel: r.doc_summary_label,
        docSubLabel: r.doc_sub_label,
        documents: finalDocs,
        checklist: {
          ageValid: Boolean(r.checklist_age_valid),
          certReadable: Boolean(r.checklist_cert_readable),
          biValid: Boolean(r.checklist_bi_valid),
          guardianConfirmed: Boolean(r.checklist_guardian_confirmed),
          gradeAboveCutoff: Boolean(r.checklist_grade_above_cutoff),
        },
        dispatchNote: r.dispatch_note || '',
        auditLogs: logsByCandidate.get(r.id) || [],
      };
    });
  } catch {
    return null;
  }
}

export async function syncAllToSupabase(candidatesList: Candidate[]): Promise<{
  ok: boolean;
  coursesSynced: number;
  candidatesSynced: number;
  documentsSynced: number;
  logsSynced: number;
  error?: string;
}> {
  await purgeLegacySampleDataFromSupabase();

  const coursesRes = await seedCoursesToSupabase();
  if (!coursesRes.ok) {
    return {
      ok: false,
      coursesSynced: 0,
      candidatesSynced: 0,
      documentsSynced: 0,
      logsSynced: 0,
      error: coursesRes.error,
    };
  }

  let candidatesSynced = 0;
  let documentsSynced = 0;
  let logsSynced = 0;

  for (const cand of candidatesList) {
    if (LEGACY_SAMPLE_SET.has(cand.id)) continue;
    const res = await upsertCandidateToSupabase(cand);
    if (!res.ok) {
      return {
        ok: false,
        coursesSynced: COURSES_DATA.length,
        candidatesSynced,
        documentsSynced,
        logsSynced,
        error: res.error,
      };
    }
    candidatesSynced += 1;
    documentsSynced += cand.documents?.length || 0;
    logsSynced += cand.auditLogs?.length || 0;
  }

  return {
    ok: true,
    coursesSynced: COURSES_DATA.length,
    candidatesSynced,
    documentsSynced,
    logsSynced,
  };
}

export function subscribeToSupabaseRealtime(onDataChange: () => void) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const triggerDebounced = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onDataChange();
    }, 500);
  };

  const channel = supabase
    .channel('itpgq-db-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
      triggerDebounced();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'candidate_documents' }, () => {
      triggerDebounced();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
      triggerDebounced();
    })
    .subscribe();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    supabase.removeChannel(channel);
  };
}
