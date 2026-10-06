import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. UTILIZADORES E ADMINISTRADORES (Sincronizados com Firebase Auth / Supabase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').default('Utilizador ITPGQ'),
  role: text('role').default('comissao').notNull(), // 'comissao' | 'secretaria' | 'superadmin'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. CURSOS TÉCNICOS OFICIAIS DO ITPGQ (10 Cursos)
export const courses = pgTable('courses', {
  id: text('id').primaryKey(), // ex: 'bs', 'cg', 'fin', 'ge', 'grh', 'gcm', 'gsi', 'inf', 'ig', 'sc'
  code: text('code').notNull(),
  name: text('name').notNull(),
  area: text('area').notNull(),
  classCode: text('class_code').notNull(),
  coordinator: text('coordinator').notNull(),
  shift: text('shift').notNull(),
  totalSpots: integer('total_spots').notNull().default(50),
  enrolledCount: integer('enrolled_count').notNull().default(0),
  approvedCount: integer('approved_count').notNull().default(0),
  cutoffGrade: real('cutoff_grade').notNull().default(13.0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. CANDIDATOS À 10.ª CLASSE (Inscrições Online e Presenciais)
export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(), // ex: 'CAN-2026-000128'
  priorityLabel: text('priority_label').notNull(),
  fullName: text('full_name').notNull(),
  biNumber: text('bi_number').notNull(),
  biValidity: text('bi_validity').notNull(),
  birthDate: text('birth_date').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  naturalidade: text('naturalidade').notNull(),
  phonePrimary: text('phone_primary').notNull(),
  phoneAlt: text('phone_alt').notNull(),
  contactNote: text('contact_note').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  municipality: text('municipality').notNull(),
  municipalityLabel: text('municipality_label').notNull(),
  nee: text('nee').notNull(),
  photoUrl: text('photo_url').notNull(),
  initials: text('initials').notNull(),
  previousSchool: text('previous_school').notNull(),
  completionYear: text('completion_year').notNull(),
  averageGrade: real('average_grade').notNull(),
  gradeMatematica: real('grade_matematica').notNull(),
  gradePortugues: real('grade_portugues').notNull(),
  gradeFisica: real('grade_fisica').notNull(),
  gradeQuimica: real('grade_quimica').notNull(),
  courseId: text('course_id')
    .references(() => courses.id)
    .notNull(),
  courseName: text('course_name').notNull(),
  courseCode: text('course_code').notNull(),
  classCode: text('class_code').notNull(),
  shift: text('shift').notNull(),
  submittedDate: text('submitted_date').notNull(),
  submittedTime: text('submitted_time').notNull(),
  relativeTime: text('relative_time').notNull(),
  status: text('status').notNull().default('nova'), // 'nova' | 'analise' | 'pendente' | 'aprovada' | 'rejeitada'
  docSummaryLabel: text('doc_summary_label').notNull(),
  docSubLabel: text('doc_sub_label').notNull(),
  checklistAgeValid: boolean('checklist_age_valid').notNull().default(true),
  checklistCertReadable: boolean('checklist_cert_readable').notNull().default(true),
  checklistBiValid: boolean('checklist_bi_valid').notNull().default(true),
  checklistGuardianConfirmed: boolean('checklist_guardian_confirmed').notNull().default(true),
  checklistGradeAboveCutoff: boolean('checklist_grade_above_cutoff').notNull().default(true),
  dispatchNote: text('dispatch_note').notNull(),
  createdByUid: text('created_by_uid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. DOCUMENTOS ANEXADOS PELOS CANDIDATOS
export const candidateDocuments = pgTable('candidate_documents', {
  id: text('id').primaryKey(), // ex: 'doc-CAN-2026-000128-1'
  candidateId: text('candidate_id')
    .references(() => candidates.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  filename: text('filename').notNull(),
  size: text('size').notNull(),
  type: text('type').notNull(), // 'pdf' | 'image'
  status: text('status').notNull().default('verificacao'), // 'validado' | 'verificacao' | 'ilegivel' | 'falta'
  auditedBy: text('audited_by'),
  auditedAt: text('audited_at'),
  notes: text('notes'),
  warningNote: text('warning_note'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. HISTÓRICO DE AUDITORIA E DESPACHOS
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id')
    .references(() => candidates.id, { onDelete: 'cascade' })
    .notNull(),
  timestamp: text('timestamp').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  actor: text('actor').notNull(),
  type: text('type').notNull().default('primary'), // 'primary' | 'secondary' | 'tertiary' | 'error'
  createdAt: timestamp('created_at').defaultNow(),
});

// RELAÇÕES DRIZZLE ORM
export const coursesRelations = relations(courses, ({ many }) => ({
  candidates: many(candidates),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  course: one(courses, {
    fields: [candidates.courseId],
    references: [courses.id],
  }),
  documents: many(candidateDocuments),
  auditLogs: many(auditLogs),
}));

export const candidateDocumentsRelations = relations(candidateDocuments, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateDocuments.candidateId],
    references: [candidates.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  candidate: one(candidates, {
    fields: [auditLogs.candidateId],
    references: [candidates.id],
  }),
}));
