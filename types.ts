export type PageView = 'inicio' | 'candidatura' | 'consultar' | 'comprovativo';

export interface CourseInfo {
  id: string;
  code: string;
  numberLabel: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: string;
  badgeIcon: string;
  badgeText: string;
  duration: string;
  subjects: string[];
  careerPaths: string[];
}

export interface CandidateApplication {
  id: string;
  serialCode: string;
  fullName: string;
  biNumber: string;
  gender: 'Masculino' | 'Feminino';
  birthDate: string;
  birthDateFormatted: string;
  age: number;
  naturality: string;
  province: string;
  municipality: string;
  residence: string;
  address: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email: string;
  disability: string;
  photoUrl: string;
  prevSchool: string;
  completionYear: string;
  finalGrade: number;
  mathGrade: number;
  physicsGrade: number;
  course: string;
  shift: string;
  schoolYear: string;
  examLocation: string;
  examDate: string;
  examTime: string;
  submittedDate: string;
  submittedTime: string;
  status: string;
  currentPhase: 1 | 2 | 3 | 4 | 5;
  dispatchNote?: string;
  documents: {
    certFileName: string;
    biFileName: string;
    photoFileName: string;
    guardianFileName?: string;
    biStatus?: 'validado' | 'verificacao' | 'ilegivel' | 'falta';
    certStatus?: 'validado' | 'verificacao' | 'ilegivel' | 'falta';
    photoStatus?: 'validado' | 'verificacao' | 'ilegivel' | 'falta';
  };
}
