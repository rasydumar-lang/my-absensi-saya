import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Student, ClassName, Subject, AttendanceRecord, SchoolInfo } from '../types';
import { CLASSES, SUBJECTS, SCHOOL_ATTENDANCE_SUBJECT } from '../constants';

interface AttendanceChecklistProps {
    activeSchoolInfo: SchoolInfo | null;
    activeSchoolName: string;
}

const ALL_SUBJECTS_KEY = "ALL_SUBJECTS";

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

const AttendanceChecklist: React.FC<AttendanceChecklistProps> = ({ activeSchoolInfo, activeSchoolName }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
    const [selectedClass, setSelectedClass] = useState<ClassName>(CLASSES[0]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | typeof ALL_SUBJECTS_KEY>(SUBJECTS[0]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        loadData();
    }, [selectedClass, selectedSubject, activeSchoolName]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            const studentData = await dataService.getStudents(activeSchoolName, selectedClass);
            studentData.sort((a, b) => a.name.localeCompare(b.name));
            setStudents(studentData);

            const recordData = await dataService.getAttendanceRecords(activeSchoolName, {
                className: selectedClass,
                subject: selectedSubject === ALL_SUBJECTS_KEY ? undefined : selectedSubject,
                month: month,
                year: year
            });

            const todayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const todayRecords = recordData.filter(r => r.date === todayDateStr);
            
            const attendanceMap = new Map<string, AttendanceRecord>();

            if (selectedSubject === ALL_SUBJECTS_KEY) {
                // Aggregate to find the latest record for each student for the day
                const studentLatestRecord = new Map<string, AttendanceRecord>();
                todayRecords.forEach(record => {
                    const existing = studentLatestRecord.get(record.studentId);
                    if (!existing) {
                        studentLatestRecord.set(record.studentId, record);
                        return;
                    }
                     // Prioritize sick/permission over presence
                    if ((record.status === 'sick' || record.status === 'permission') && existing.status === 'present') {
                        studentLatestRecord.set(record.studentId, record);
                        return;
                    }
                    if ((existing.status === 'sick' || existing.status === 'permission')) {
                        return; // Don't override sick/permission
                    }

                    // If both are present, find the latest one based on time
                    const existingTime = existing.checkOut || existing.checkIn!;
                    const newTime = record.checkOut || record.checkIn!;
                    if (new Date(newTime) > new Date(existingTime)) {
                        studentLatestRecord.set(record.studentId, record);
                    }
                });
                 studentLatestRecord.forEach((value, key) => attendanceMap.set(key, value));
            } else {
                 todayRecords.forEach(record => {
                    attendanceMap.set(record.studentId, record);
                });
            }
           
            setAttendance(attendanceMap);

        } catch (error) {
            console.error("Failed to load attendance data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateWhatsappUrl = (student: Student): string | null => {
        const record = attendance.get(student.id);
        if (!record || !student.parentPhoneNumber || !activeSchoolInfo) return null;

        const date = new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let statusMessage = '';
        
        switch (record.status) {
            case 'present':
                if (record.checkOut) {
                    const time = new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    statusMessage = `telah melakukan absensi *PULANG* pada:\n\nHari/Tanggal: ${date}\nPukul: ${time}`;
                } else if (record.checkIn) {
                    const time = new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const timeliness = record.timeliness === 'late' ? '(Terlambat)' : '(Tepat Waktu)';
                    statusMessage = `telah melakukan absensi *MASUK* pada:\n\nHari/Tanggal: ${date}\nPukul: ${time} ${timeliness}`;
                }
                break;
            case 'sick':
                statusMessage = `tercatat *SAKIT* pada hari ini, ${date}.`;
                break;
            case 'permission':
                statusMessage = `tercatat *IZIN* pada hari ini, ${date}.`;
                break;
        }

        const subjectInfo = record.subject !== SCHOOL_ATTENDANCE_SUBJECT && record.status === 'present'
            ? `\nMata Pelajaran: *${record.subject}*`
            : '';

        const message = `Yth. Bapak/Ibu Wali Murid,\n\nDengan ini kami beritahukan bahwa ananda *${student.name}* (Kelas *${student.class}*) ${statusMessage}${subjectInfo}\n\nTerima kasih atas perhatiannya.\n*${activeSchoolInfo.name}*`;

        const formattedPhone = formatPhoneNumber(student.parentPhoneNumber);
        return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    };

    const getStatusComponent = (student: Student) => {
        const record = attendance.get(student.id);

        if (record) {
            if (record.status === 'present') {
                 if (record.checkOut) {
                    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Sudah Pulang</span>;
                }
                if (record.checkIn) {
                    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sudah Masuk</span>;
                }
            }
            if (record.status === 'sick') {
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Sakit</span>;
            }
            if (record.status === 'permission') {
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Izin</span>;
            }
        }
        
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Belum Absen</span>;
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Daftar Hadir Harian</h2>
            <p className="text-sm text-gray-600 mb-6">Pilih kelas dan mata pelajaran untuk memantau status absensi siswa secara langsung hari ini.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-end">
                <div>
                    <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
                    <select
                        id="class-select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value as ClassName)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700">Pilih Mata Pelajaran</label>
                    <select
                        id="subject-select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value as Subject | typeof ALL_SUBJECTS_KEY)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                        <option value={ALL_SUBJECTS_KEY}>Semua Mata Pelajaran</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">No</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nama Siswa</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">NIS</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status Absen (Hari Ini)</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-4">Memuat data...</td></tr>
                        ) : students.length > 0 ? students.map((student, index) => {
                            const whatsappUrl = generateWhatsappUrl(student);

                            return (
                                <tr key={student.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4">{student.name}</td>
                                    <td className="py-3 px-4">{student.nis}</td>
                                    <td className="py-3 px-4">{getStatusComponent(student)}</td>
                                    <td className="py-3 px-4">
                                        {whatsappUrl ? (
                                            <a 
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 text-xs rounded hover:bg-green-600 transition-colors"
                                                title="Kirim notifikasi WhatsApp ke orang tua (membuka tab baru)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                  <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                </svg>
                                                <span>WA Ortu</span>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">Belum ada siswa di kelas ini.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceChecklist;