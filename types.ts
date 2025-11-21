export interface Student {
  id: string;
  name: string;
  class: ClassName;
  nis: string; // Nomor Induk Siswa
  parentPhoneNumber?: string;
}

// FIX: Added missing pipe `|` between 'sick' and 'permission'.
export type AttendanceStatus = 'present' | 'sick' | 'permission';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subject: Subject;
  status: AttendanceStatus;
  checkIn: string | null; // ISO string
  checkOut: string | null; // ISO string
  date: string; // YYYY-MM-DD
  timeliness?: 'on-time' | 'late';
  semester?: 'Ganjil' | 'Genap';
}

export enum ClassName {
  X = 'X',
  XA = 'X-A',
  XB = 'X-B',
  XC = 'X-C',
  XD = 'X-D',
  XI = 'XI',
  XIA = 'XI-A',
  XIB = 'XI-B',
  XIC = 'XI-C',
  XID = 'XI-D',
  XII = 'XII',
  XIIA = 'XII-A',
  XIIB = 'XII-B',
  XIIC = 'XII-C',
  XIID = 'XII-D',
}

export type Subject = 
  | '-- Kehadiran Sekolah --'
  // Kelompok Mata Pelajaran Umum
  | 'Pendidikan Agama & Budi Pekerti'
  | 'Pendidikan Pancasila'
  | 'Bahasa Indonesia'
  | 'Matematika'
  | 'Bahasa Inggris'
  | 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)'
  | 'Sejarah'
  | 'Seni Budaya'
  | 'Prakarya & Kewirausahaan (PKWU)'
  | 'Informatika'
  // Kelompok MIPA (Pilihan)
  | 'Biologi'
  | 'Fisika'
  | 'Kimia'
  | 'Matematika Tingkat Lanjut'
  // Kelompok IPS (Pilihan)
  | 'Sosiologi'
  | 'Ekonomi'
  | 'Geografi'
  | 'Antropologi';


export interface QrData {
    studentId: string;
    name: string;
}

export interface SchoolInfo {
  id: number; // Use a fixed ID like 1 since there's only one entry
  name: string;
  address: string;
  headmaster: string;
  headmasterNip?: string;
  logoBase64: string | null;
}

export interface OperatorUser {
  id: string;
  username: string;
  // FIX: Changed semicolon to a colon to correctly define the password property type.
  password: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip?: string;
  subjects: Subject[];
  classes: ClassName[];
}