import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { Student, ClassName, Subject, AttendanceRecord } from '../types';
import { CLASSES, SUBJECTS, SCHOOL_ATTENDANCE_SUBJECT } from '../constants';

const ALL_SUBJECTS_KEY = "ALL_SUBJECTS";

const AttendanceChecklist: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
    const [selectedClass, setSelectedClass] = useState<ClassName>(CLASSES[0]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | typeof ALL_SUBJECTS_KEY>(SUBJECTS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sentNotifications, setSentNotifications] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, [selectedClass, selectedSubject]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            const studentData = await dataService.getStudents(selectedClass);
            studentData.sort((a, b) => a.name.localeCompare(b.name));
            setStudents(studentData);

            const recordData = await dataService.getAttendanceRecords({
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
    
    const formatPhoneNumber = (phone: string) => {
      let formatted = phone.trim().replace(/[- ]/g, '');
      if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
      } else if (formatted.startsWith('+62')) {
        formatted = formatted.substring(1);
      }
      return formatted.replace(/[^0-9]/g, '');
    }

    const generateWhatsappUrl = (student: Student, record: AttendanceRecord) => {
        if (!student.parentPhoneNumber) return null;
        
        const isCheckIn = record.checkIn && !record.checkOut;
        const attendanceTypeMsg = isCheckIn ? 'Masuk' : 'Pulang';
        const dateTime = new Date(isCheckIn ? record.checkIn! : record.checkOut!);
        const time = dateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const date = dateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        let statusText = '';
        if (isCheckIn && record.timeliness) {
            statusText = record.timeliness === 'on-time' ? '(Tepat Waktu)' : '(Terlambat)';
        }
        
        const subjectLine = record.subject === SCHOOL_ATTENDANCE_SUBJECT ? '' : `Mata Pelajaran: *${record.subject}*\n`;

        const message = `Pemberitahuan Absensi SMAN 1 Pulau Banyak Barat:\n\nSiswa *${student.name}* (Kelas *${student.class}*) telah melakukan absen *${attendanceTypeMsg}* pada ${date}, pukul ${time} ${statusText}.\n\nTerima kasih.`;
        
        const formattedPhone = formatPhoneNumber(student.parentPhoneNumber);
        return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    }

    const handleSendNotification = (student: Student, record: AttendanceRecord) => {
        const url = generateWhatsappUrl(student, record);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const notifiableStudents = useMemo(() => {
        return students.filter(student => {
            const record = attendance.get(student.id);
            return record && record.status === 'present' && student.parentPhoneNumber;
        });
    }, [students, attendance]);

    const handleOpenMassalModal = () => {
        if (notifiableStudents.length === 0) return;
        setSentNotifications(new Set()); // Reset sent status when opening modal
        setIsModalOpen(true);
    };
    
    const handleSendFromModal = (student: Student, record: AttendanceRecord) => {
        handleSendNotification(student, record);
        setSentNotifications(prev => new Set(prev).add(student.id));
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
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Notifikasi Absensi Harian</h2>
                <p className="text-sm text-gray-600 mb-6">Pilih kelas dan mata pelajaran untuk melihat status absensi siswa hari ini dan kirim notifikasi WhatsApp ke orang tua.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-end">
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
                    <div>
                        <button
                            onClick={handleOpenMassalModal}
                            disabled={notifiableStudents.length === 0}
                            className="w-full bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Kirim Notifikasi Massal ({notifiableStudents.length})
                        </button>
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
                                const record = attendance.get(student.id);
                                const canNotify = record && record.status === 'present' && student.parentPhoneNumber;
                                return (
                                    <tr key={student.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{index + 1}</td>
                                        <td className="py-3 px-4">{student.name}</td>
                                        <td className="py-3 px-4">{student.nis}</td>
                                        <td className="py-3 px-4">{getStatusComponent(student)}</td>
                                        <td className="py-3 px-4">
                                            {canNotify ? (
                                                <button 
                                                    onClick={() => handleSendNotification(student, record)}
                                                    className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 transition-colors inline-flex items-center gap-1"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                    </svg>
                                                    Kirim Notifikasi
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr><td colSpan={5} className="text-center py-4 text-gray-500">Belum ada siswa di kelas ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Kirim Notifikasi Massal</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Klik tombol "Kirim" untuk membuka tab WhatsApp untuk setiap siswa. Anda harus mengirim pesan secara manual di setiap tab.
                            <span className="font-semibold"> ({sentNotifications.size} / {notifiableStudents.length} terkirim)</span>
                        </p>
                        <div className="overflow-y-auto border-t border-b py-2 flex-grow">
                            <ul className="divide-y divide-gray-200">
                                {notifiableStudents.map(student => {
                                    const record = attendance.get(student.id)!;
                                    const isSent = sentNotifications.has(student.id);
                                    return (
                                        <li key={student.id} className="py-3 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-gray-500">{student.nis}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSendFromModal(student, record)}
                                                disabled={isSent}
                                                className={`px-4 py-2 text-sm rounded-md transition-colors inline-flex items-center gap-2 ${
                                                    isSent
                                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                                }`}
                                            >
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10.894 2.553a1 1 0 00-1.789 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                 </svg>
                                                {isSent ? 'Terkirim' : 'Kirim'}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div className="mt-6 text-right flex-shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AttendanceChecklist;
