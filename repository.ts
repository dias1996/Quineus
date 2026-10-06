import { eq, inArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  auditLogs,
  candidateDocuments,
  candidates,
  courses,
} from './schema.ts';
import {
  ApplicationStatus,
  AuditLogEntry,
  Candidate,
  CandidateDocument,
  CourseId,
  COURSES_DATA,
  DocStatus,
  INITIAL_CANDIDATES,
} from '../data/imfaData.ts';
import {
  deleteCandidatesFromSupabase,
  fetchCandidatesFromSupabase,
  seedCoursesToSupabase,
  upsertCandidateToSupabase,
} from '../lib/supabase.ts';

export async function ensureSeededDatabase(): Promise<void> {
  try {
    await seedCoursesToSupabase().catch(() => {});

    const existingCourses = await db.select().from(courses);
    if (existingCourses.length === 0) {
      for (const c of COURSES_DATA) {
        await db
          .insert(courses)
          .values({
            id: c.id,
            code: c.code,
            name: c.name,
            area: c.area,
            classCode: c.classCode,
            coordinator: c.coordinator,
            shift: c.shift,
            totalSpots: c.totalSpots,
            enrolledCount: 0,
            approvedCount: 0,
            cutoffGrade: c.cutoffGrade,
          })
          .onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error('Database seed check failed:', error);
    throw new Error('Database initialization failed. Please try again later.', { cause: error });
  }
}

export async function upsertCandidateToDb(cand: Candidate, createdByUid?: string): Promise<void> {
  try {
    // Sync to Supabase project utzebakybzqrveabnmsu
    await upsertCandidateToSupabase(cand, createdByUid).catch(() => {});

    await db
      .insert(candidates)
      .values({
        id: cand.id,
        priorityLabel: cand.priorityLabel,
        fullName: cand.fullName,
        biNumber: cand.biNumber,
        biValidity: cand.biValidity,
        birthDate: cand.birthDate,
        age: cand.age,
        gender: cand.gender,
        naturalidade: cand.naturalidade,
        phonePrimary: cand.phonePrimary,
        phoneAlt: cand.phoneAlt,
        contactNote: cand.contactNote,
        email: cand.email,
        address: cand.address,
        municipality: cand.municipality,
        municipalityLabel: cand.municipalityLabel,
        nee: cand.nee,
        photoUrl: cand.photoUrl,
        initials: cand.initials,
        previousSchool: cand.previousSchool,
        completionYear: cand.completionYear,
        averageGrade: cand.averageGrade,
        gradeMatematica: cand.grades.matematica,
        gradePortugues: cand.grades.portugues,
        gradeFisica: cand.grades.fisica,
        gradeQuimica: cand.grades.quimica,
        courseId: cand.courseId,
        courseName: cand.courseName,
        courseCode: cand.courseCode,
        classCode: cand.classCode,
        shift: cand.shift,
        submittedDate: cand.submittedDate,
        submittedTime: cand.submittedTime,
        relativeTime: cand.relativeTime,
        status: cand.status,
        docSummaryLabel: cand.docSummaryLabel,
        docSubLabel: cand.docSubLabel,
        checklistAgeValid: cand.checklist.ageValid,
        checklistCertReadable: cand.checklist.certReadable,
        checklistBiValid: cand.checklist.biValid,
        checklistGuardianConfirmed: cand.checklist.guardianConfirmed,
        checklistGradeAboveCutoff: cand.checklist.gradeAboveCutoff,
        dispatchNote: cand.dispatchNote,
        createdByUid: createdByUid || null,
      })
      .onConflictDoUpdate({
        target: candidates.id,
        set: {
          status: cand.status,
          docSummaryLabel: cand.docSummaryLabel,
          docSubLabel: cand.docSubLabel,
          checklistAgeValid: cand.checklist.ageValid,
          checklistCertReadable: cand.checklist.certReadable,
          checklistBiValid: cand.checklist.biValid,
          checklistGuardianConfirmed: cand.checklist.guardianConfirmed,
          checklistGradeAboveCutoff: cand.checklist.gradeAboveCutoff,
          dispatchNote: cand.dispatchNote,
          updatedAt: new Date(),
        },
      });

    for (const doc of cand.documents) {
      await db
        .insert(candidateDocuments)
        .values({
          id: doc.id,
          candidateId: cand.id,
          title: doc.title,
          filename: doc.filename,
          size: doc.size,
          type: doc.type,
          status: doc.status,
          auditedBy: doc.auditedBy || null,
          auditedAt: doc.auditedAt || null,
          notes: doc.notes || null,
        })
        .onConflictDoUpdate({
          target: candidateDocuments.id,
          set: {
            filename: doc.filename,
            status: doc.status,
            auditedBy: doc.auditedBy || null,
            auditedAt: doc.auditedAt || null,
            notes: doc.notes || null,
          },
        });
    }

    for (const log of cand.auditLogs) {
      await db
        .insert(auditLogs)
        .values({
          id: log.id,
          candidateId: cand.id,
          timestamp: log.timestamp,
          title: log.title,
          description: log.description,
          actor: log.actor || 'Sistema ITPGQ',
          type: log.type,
        })
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error('Database candidate upsert failed:', error);
    throw new Error('Failed to save candidate record.', { cause: error });
  }
}

export async function getAllCandidatesFromDb(): Promise<Candidate[]> {
  try {
    await ensureSeededDatabase();

    const supabaseCandidates = await fetchCandidatesFromSupabase().catch(() => null);
    if (supabaseCandidates && supabaseCandidates.length > 0) {
      return supabaseCandidates;
    }

    const rows = await db.select().from(candidates);
    const docRows = await db.select().from(candidateDocuments);
    const logRows = await db.select().from(auditLogs);

    const docsByCandidate = new Map<string, CandidateDocument[]>();
    for (const d of docRows) {
      const list = docsByCandidate.get(d.candidateId) || [];
      list.push({
        id: d.id,
        title: d.title,
        filename: d.filename,
        size: d.size,
        type: (d.type === 'image' ? 'image' : 'pdf') as 'pdf' | 'image',
        status: d.status as DocStatus,
        auditedBy: d.auditedBy || undefined,
        auditedAt: d.auditedAt || undefined,
        notes: d.notes || undefined,
      });
      docsByCandidate.set(d.candidateId, list);
    }

    const logsByCandidate = new Map<string, AuditLogEntry[]>();
    for (const l of logRows) {
      const list = logsByCandidate.get(l.candidateId) || [];
      list.push({
        id: l.id,
        timestamp: l.timestamp,
        title: l.title,
        description: l.description,
        actor: l.actor,
        type: l.type as AuditLogEntry['type'],
      });
      logsByCandidate.set(l.candidateId, list);
    }

    return rows.map((r) => ({
      id: r.id,
      priorityLabel: r.priorityLabel,
      fullName: r.fullName,
      biNumber: r.biNumber,
      biValidity: r.biValidity,
      birthDate: r.birthDate,
      age: r.age,
      gender: (r.gender === 'Feminino' ? 'Feminino' : 'Masculino') as 'Masculino' | 'Feminino',
      naturalidade: r.naturalidade,
      phonePrimary: r.phonePrimary,
      phoneAlt: r.phoneAlt,
      contactNote: r.contactNote,
      email: r.email,
      address: r.address,
      municipality: r.municipality as Candidate['municipality'],
      municipalityLabel: r.municipalityLabel,
      nee: r.nee,
      photoUrl: r.photoUrl,
      initials: r.initials,
      previousSchool: r.previousSchool,
      completionYear: r.completionYear,
      averageGrade: Number(r.averageGrade),
      grades: {
        matematica: Number(r.gradeMatematica),
        portugues: Number(r.gradePortugues),
        fisica: Number(r.gradeFisica),
        quimica: Number(r.gradeQuimica),
      },
      courseId: r.courseId as CourseId,
      courseName: r.courseName,
      courseCode: r.courseCode,
      classCode: r.classCode,
      shift: r.shift,
      submittedDate: r.submittedDate,
      submittedTime: r.submittedTime,
      relativeTime: r.relativeTime,
      status: r.status as ApplicationStatus,
      docSummaryLabel: r.docSummaryLabel,
      docSubLabel: r.docSubLabel,
      documents: docsByCandidate.get(r.id) || [],
      checklist: {
        ageValid: r.checklistAgeValid,
        certReadable: r.checklistCertReadable,
        biValid: r.checklistBiValid,
        guardianConfirmed: r.checklistGuardianConfirmed,
        gradeAboveCutoff: r.checklistGradeAboveCutoff,
      },
      dispatchNote: r.dispatchNote,
      auditLogs: logsByCandidate.get(r.id) || [],
    }));
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Failed to load candidates from database.', { cause: error });
  }
}

export async function deleteCandidatesFromDb(ids: string[]): Promise<void> {
  try {
    if (ids.length === 0) return;
    await deleteCandidatesFromSupabase(ids).catch(() => {});
    await db.delete(candidates).where(inArray(candidates.id, ids));
  } catch (error) {
    console.error('Database delete failed:', error);
    throw new Error('Failed to archive candidates.', { cause: error });
  }
}
