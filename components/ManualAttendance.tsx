import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Subject, Student, SchoolInfo } from '../types';
import { SUBJECTS, SCHOOL_ATTENDANCE_SUBJECT } from '../constants';

interface Feedback {
    message: string;
    type: 'success' | 'error' | 'info';
    student?: Student;
    attendanceType?: 'check-in' | 'check-out';
    subject?: Subject;
    time?: string;
    timeliness?: 'on-time' | 'late';
    whatsappUrl?: string;
}

interface ManualAttendanceProps {
    activeSchoolInfo: SchoolInfo;
    activeSchoolName: string;
}

const ManualAttendance: React.FC<ManualAttendanceProps> = ({ activeSchoolInfo, activeSchoolName }) => {
    const REGULAR_SUBJECTS = SUBJECTS.filter(s => s !== SCHOOL_ATTENDANCE_SUBJECT);

    const [nis, setNis] = useState<string>('');
    const [attendanceType, setAttendanceType] = useState<'subject' | 'school'>('subject');
    const [selectedSubject, setSelectedSubject] = useState<Subject>(REGULAR_SUBJECTS[0]);
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [selectedTime, setSelectedTime] = useState<string>(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
    const [onTimeDeadline, setOnTimeDeadline] = useState<string>('07:30');
    const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSystemEnabled, setIsSystemEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        const checkSystemStatus = async () => {
            const settingKey = `attendance_enabled_${activeSchoolName}`;
            const status = await dataService.getSetting<boolean>(settingKey);
            setIsSystemEnabled(status !== false);
        };
        checkSystemStatus();
    }, [activeSchoolName]);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-speech not supported in this browser.');
        }
    };
    
    const formatPhoneNumber = (phone: string) => {
        // 1. Remove spaces, dashes, parentheses etc. Keep digits and a potential leading '+'
        let formatted = phone.trim().replace(/[\s-()]/g, '');
    
        // 2. Handle the +62 prefix
        if (formatted.startsWith('+62')) {
            // Just remove the '+' and we are good
            formatted = formatted.substring(1);
        }
        // 3. Handle the '0' prefix for local numbers
        else if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        // 4. Handle numbers that are missing the '0' but are otherwise valid (e.g., 812...)
        // This is less safe but can correct common data entry errors. Indonesian numbers are 10-13 digits.
        else if (formatted.startsWith('8') && formatted.length >= 9 && formatted.length <= 13) {
             formatted = '62' + formatted;
        }
        
        // 5. Final cleanup to ensure only digits remain.
        return formatted.replace(/[^0-9]/g, '');
    }
    
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nis.trim()) {
            setFeedback({ message: 'NIS tidak boleh kosong.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setFeedback(null);
        
        try {
            const student = await dataService.getStudentByNis(nis.trim(), activeSchoolName);
            if (!student) {
                throw new Error("Siswa dengan NIS tersebut tidak ditemukan.");
            }

            const attendanceDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
            const subjectToRecord = attendanceType === 'school' ? SCHOOL_ATTENDANCE_SUBJECT : selectedSubject;

            let timelinessStatus: 'on-time' | 'late' | undefined = undefined;
            if (scanMode === 'check-in') {
                const [deadlineHour, deadlineMinute] = onTimeDeadline.split(':').map(Number);
                const scanHour = attendanceDateTime.getHours();
                const scanMinute = attendanceDateTime.getMinutes();
                const isLate = scanHour > deadlineHour || (scanHour === deadlineHour && scanMinute > deadlineMinute);
                timelinessStatus = isLate ? 'late' : 'on-time';
            }

            const result = await dataService.recordAttendance(student.id, subjectToRecord, activeSchoolName, attendanceDateTime, scanMode, timelinessStatus, selectedSemester);
            
            if (result.type === 'check-in') {
                speak(`${student.name}, Absen Masuk Berhasil, ${timelinessStatus === 'on-time' ? 'Anda Tepat Waktu' : 'Maaf, Anda Terlambat'}`);
            } else {
                speak(`${student.name}, Absen Pulang Berhasil`);
            }

            const scanDateTime = new Date(result.type === 'check-in' ? result.record.checkIn! : result.record.checkOut!);
            const time = scanDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const date = scanDateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const successMessage = `Absen ${result.type === 'check-in' ? 'Masuk' : 'Pulang'} Berhasil!`;

            let whatsappUrl: string | undefined = undefined;
            if (student.parentPhoneNumber) {
                const attendanceTypeMsg = result.type === 'check-in' ? 'MASUK' : 'PULANG';
                let statusText = '';
                if (result.type === 'check-in') {
                    statusText = timelinessStatus === 'on-time' ? '(Tepat Waktu)' : '(Terlambat)';
                }

                const subjectInfo = subjectToRecord !== SCHOOL_ATTENDANCE_SUBJECT 
                    ? `\nMata Pelajaran: *${subjectToRecord}*`
                    : '';

                const message = `Yth. Bapak/Ibu Wali Murid,\n\nDengan ini kami beritahukan bahwa ananda *${student.name}* (Kelas *${student.class}*) telah melakukan absensi *${attendanceTypeMsg}* pada:\n\nHari/Tanggal: ${date}\nPukul: ${time} ${statusText}${subjectInfo}\n\nTerima kasih atas perhatiannya.\n*${activeSchoolInfo.name}*`;

                const formattedPhone = formatPhoneNumber(student.parentPhoneNumber);
                whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
            }


            setFeedback({
                message: successMessage,
                type: 'success',
                student: student,
                attendanceType: result.type,
                subject: subjectToRecord,
                time: `${date}, pukul ${time}`,
                timeliness: timelinessStatus,
                whatsappUrl: whatsappUrl,
            });
            setNis(''); // Clear NIS after successful entry

        } catch (error: any) {
            const errorMessage = error.message || "Gagal memproses absensi.";
            setFeedback({ message: errorMessage, type: 'error' });
            speak(`Gagal. ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSystemEnabled === null) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p>Memeriksa status sistem...</p>
            </div>
        );
    }

    if (!isSystemEnabled) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Sistem Absensi Dinonaktifkan</h2>
                <p className="text-gray-600">Fitur absensi untuk <strong className="font-semibold">{activeSchoolInfo.name}</strong> saat ini sedang dimatikan oleh admin. Silakan aktifkan kembali di menu Pengaturan.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Absen Manual via NIS</h2>

            <form onSubmit={handleSubmit}>
                <fieldset disabled={isSubmitting}>
                    <div className="mb-4">
                        <label htmlFor="nis-input" className="block text-sm font-medium text-gray-700">Nomor Induk Siswa (NIS)</label>
                        <input
                            id="nis-input"
                            type="text"
                            value={nis}
                            onChange={(e) => setNis(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            placeholder="Masukkan NIS siswa"
                            required
                        />
                    </div>

                    <fieldset className="mb-4">
                        <legend className="block text-sm font-medium text-gray-700 mb-1">Bentuk Absen</legend>
                        <div className="flex items-center gap-x-6">
                            <div className="flex items-center">
                                <input
                                    id="type-subject"
                                    name="attendance-type"
                                    type="radio"
                                    value="subject"
                                    checked={attendanceType === 'subject'}
                                    onChange={() => setAttendanceType('subject')}
                                    className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor="type-subject" className="ml-2 block text-sm font-medium leading-6 text-gray-900">
                                    Per Mata Pelajaran
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="type-school"
                                    name="attendance-type"
                                    type="radio"
                                    value="school"
                                    checked={attendanceType === 'school'}
                                    onChange={() => setAttendanceType('school')}
                                    className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                                />
                                <label htmlFor="type-school" className="ml-2 block text-sm font-medium leading-6 text-gray-900">
                                    Kehadiran Sekolah
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    {attendanceType === 'subject' && (
                        <div className="mb-4">
                            <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700">Pilih Mata Pelajaran</label>
                            <select
                                id="subject-select"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            >
                                {REGULAR_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg bg-gray-50">
                        <legend className="text-sm font-medium text-gray-700 px-1">Opsi Absensi</legend>
                        <div>
                            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700">Tanggal Absen</label>
                            <input
                                type="date"
                                id="attendance-date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="attendance-time" className="block text-sm font-medium text-gray-700">Waktu Absen</label>
                            <input
                                type="time"
                                id="attendance-time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="semester-select" className="block text-sm font-medium text-gray-700">Semester</label>
                            <select
                                id="semester-select"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="on-time-deadline" className="block text-sm font-medium text-gray-700">Batas Tepat Waktu</label>
                            <input
                                type="time"
                                id="on-time-deadline"
                                value={onTimeDeadline}
                                onChange={(e) => setOnTimeDeadline(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex items-end md:col-span-2">
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Absen</label>
                                <div className="flex items-center gap-x-6">
                                    <div className="flex items-center">
                                        <input
                                            id="check-in"
                                            name="scan-mode"
                                            type="radio"
                                            value="check-in"
                                            checked={scanMode === 'check-in'}
                                            onChange={() => setScanMode('check-in')}
                                            className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                                        />
                                        <label htmlFor="check-in" className="ml-2 block text-sm font-medium leading-6 text-gray-900">Masuk</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="check-out"
                                            name="scan-mode"
                                            type="radio"
                                            value="check-out"
                                            checked={scanMode === 'check-out'}
                                            onChange={() => setScanMode('check-out')}
                                            className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                                        />
                                        <label htmlFor="check-out" className="ml-2 block text-sm font-medium leading-6 text-gray-900">Pulang</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </fieldset>
                
                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-blue text-white py-3 rounded-lg hover:bg-brand-blue-dark transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {isSubmitting ? 'Memproses...' : 'Catat Kehadiran'}
                </button>
            </form>

            {feedback && (
                <div className="mt-4">
                    {feedback.type === 'success' && feedback.student ? (
                        <div className="p-4 rounded-lg bg-green-100 text-green-900 border border-green-200">
                            <h3 className="font-bold text-lg mb-2">
                                {`Absen ${feedback.attendanceType === 'check-in' ? 'Masuk' : 'Pulang'} Berhasil!`}
                                {feedback.timeliness && (
                                    <span className={`ml-2 text-sm font-semibold px-2 py-1 rounded-full ${feedback.timeliness === 'late' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                        {feedback.timeliness === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p><strong>Nama:</strong> {feedback.student.name}</p>
                                <p><strong>Kelas:</strong> {feedback.student.class}</p>
                                {feedback.subject !== SCHOOL_ATTENDANCE_SUBJECT && (
                                    <p><strong>Mata Pelajaran:</strong> {feedback.subject}</p>
                                )}
                                <p><strong>Waktu:</strong> {feedback.time}</p>
                            </div>
                            {feedback.whatsappUrl && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                     <a 
                                        href={feedback.whatsappUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                        Kirim via WhatsApp
                                    </a>
                                    <p className="text-xs text-gray-500 mt-1">Membuka WhatsApp di tab baru.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`p-4 text-sm rounded-lg text-center ${feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            <p className="font-semibold">{feedback.message}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManualAttendance;