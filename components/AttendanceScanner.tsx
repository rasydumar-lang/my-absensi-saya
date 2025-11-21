import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';
import { Subject, QrData, Student, SchoolInfo } from '../types';
import { SUBJECTS, SCHOOL_ATTENDANCE_SUBJECT } from '../constants';
declare var Html5Qrcode: any;

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

interface AttendanceScannerProps {
    schoolInfo: SchoolInfo;
}

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ schoolInfo }) => {
    const REGULAR_SUBJECTS = SUBJECTS.filter(s => s !== SCHOOL_ATTENDANCE_SUBJECT);

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
    const [isScanning, setIsScanning] = useState(false);
    const [isSystemEnabled, setIsSystemEnabled] = useState<boolean | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const html5QrCodeRef = useRef<any>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkSystemStatus = async () => {
        const settingKey = `attendance_enabled_${schoolInfo.name}`;
        const status = await dataService.getSetting<boolean>(settingKey);
        // Default to true if setting is not found (undefined)
        setIsSystemEnabled(status !== false);
      };
      checkSystemStatus();
    }, [schoolInfo]);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Hentikan suara yang sedang berjalan
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-speech not supported in this browser.');
        }
    };

    const stopScanner = () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
                setIsScanning(false);
            }).catch((err: any) => {
                console.error("Gagal menghentikan scanner.", err);
                setIsScanning(false); // Force stop state even on error
            });
        } else {
             setIsScanning(false);
        }
    };

    const startScanner = () => {
        setFeedback(null);
        setCameraError(null);
        setIsScanning(true);

        const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
            stopScanner(); // Stop scanner after a successful scan
            handleScan(decodedText);
        };
        const config = { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true };
        
        // Ensure the reader element is clean before starting
        if (readerRef.current) {
            readerRef.current.innerHTML = "";
        }
        
        const scannerInstance = new Html5Qrcode("reader");
        html5QrCodeRef.current = scannerInstance;

        scannerInstance.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
            .catch((err: any) => {
                let errorMessage = `Gagal memulai kamera. Pastikan Anda telah memberikan izin akses kamera di browser.`;
                if (err.name === "NotAllowedError") {
                    errorMessage = "Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda untuk melanjutkan.";
                }
                setCameraError(errorMessage);
                speak("Gagal memulai kamera");
                setIsScanning(false);
            });
    };
    
    useEffect(() => {
        // Cleanup function on component unmount
        return () => {
             stopScanner();
             if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);
    
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

    const handleScan = async (data: string) => {
        try {
            const qrData: QrData = JSON.parse(data);
            if (!qrData.nis) {
                throw new Error("QR Code tidak valid atau format lama.");
            }

            const student = await dataService.getStudentByNis(qrData.nis);
            if (!student) {
                throw new Error("Siswa tidak ditemukan. Pastikan data siswa (terutama NIS) sudah ditambahkan di perangkat ini.");
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

            const result = await dataService.recordAttendance(student.id, subjectToRecord, attendanceDateTime, scanMode, timelinessStatus, selectedSemester);
            
            // --- TTS Logic ---
            if (result.type === 'check-in') {
                if (timelinessStatus === 'on-time') {
                    speak(`${student.name}, Absen Masuk Berhasil, Anda Tepat Waktu`);
                } else { // 'late'
                    speak(`${student.name}, Absen Masuk Berhasil, Maaf, Anda Terlambat`);
                }
            } else { // 'check-out'
                speak(`${student.name}, Absen Pulang Berhasil`);
            }
            // --- End TTS Logic ---

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

                const message = `Yth. Bapak/Ibu Wali Murid,\n\nDengan ini kami beritahukan bahwa ananda *${student.name}* (Kelas *${student.class}*) telah melakukan absensi *${attendanceTypeMsg}* pada:\n\nHari/Tanggal: ${date}\nPukul: ${time} ${statusText}${subjectInfo}\n\nTerima kasih atas perhatiannya.\n*${schoolInfo.name}*`;

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

        } catch (error: any) {
            const errorMessage = error.message || "Gagal memproses absensi.";
            setFeedback({ message: errorMessage, type: 'error' });
            speak(`Gagal. ${errorMessage}`);
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
                <p className="text-gray-600">Fitur scan absensi untuk <strong className="font-semibold">{schoolInfo.name}</strong> saat ini sedang dimatikan oleh admin. Silakan aktifkan kembali di menu Pengaturan.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Scan Absen Siswa</h2>

            <fieldset className="mb-4" disabled={isScanning}>
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
                        disabled={isScanning}
                    >
                        {REGULAR_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            )}
            
            <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg bg-gray-50" disabled={isScanning}>
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
                    <label htmlFor="attendance-time" className="block text-sm font-medium text-gray-700">Waktu Absen (Saat ini)</label>
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
                    <label htmlFor="on-time-deadline" className="block text-sm font-medium text-gray-700">Batas Waktu Tepat Waktu</label>
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
                                <label htmlFor="check-in" className="ml-2 block text-sm font-medium leading-6 text-gray-900">
                                    Masuk
                                </label>
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
                                 <label htmlFor="check-out" className="ml-2 block text-sm font-medium leading-6 text-gray-900">
                                    Pulang
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </fieldset>
            
            <div className="w-full aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center p-2">
                <div id="reader" ref={readerRef} className={`${isScanning ? 'block' : 'hidden'} w-full`}></div>
                {!isScanning && !feedback && !cameraError && (
                     <div className="text-center text-gray-500">
                        <p>Kamera akan muncul di sini</p>
                    </div>
                )}
                {isScanning && !cameraError && (
                    <div className="text-center text-gray-500 animate-pulse">
                        <p>Mempersiapkan kamera...</p>
                        <p className="text-sm">Posisikan QR Code di depan kamera.</p>
                    </div>
                )}
            </div>
            
            {cameraError && !isScanning && (
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100 text-center">
                    <p className="font-semibold">{cameraError}</p>
                </div>
            )}


            {!isScanning ? (
                <button onClick={startScanner} className="w-full bg-brand-blue text-white py-3 rounded-lg hover:bg-brand-blue-dark transition-colors font-semibold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125-1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625a1.125 1.125 0 011.125-1.125h4.5a1.125 1.125 0 011.125 1.125v4.5a1.125 1.125 0 01-1.125-1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" /></svg>
                    Mulai Scan
                </button>
            ) : (
                <button onClick={stopScanner} className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" /></svg>
                    Hentikan Scan
                </button>
            )}

            {feedback && !isScanning && (
                 <div className="mt-4">
                    {feedback.type === 'success' && feedback.student ? (
                        <div className="p-4 rounded-lg bg-green-100 text-green-900 border border-green-200">
                            <h3 className="font-bold text-lg mb-2">
                                {`Absen ${feedback.attendanceType === 'check-in' ? 'Masuk' : 'Pulang'} Berhasil!`}
                                {feedback.timeliness && (
                                    <span className={`ml-2 text-sm font-semibold px-2 py-1 rounded-full ${
                                        feedback.timeliness === 'late' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                                    }`}>
                                        {feedback.timeliness === 'late' ? 'Terlambat' : 'Tepat Waktu'}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-1 text-sm mb-3">
                                <p><strong>Nama:</strong> {feedback.student.name}</p>
                                <p><strong>Kelas:</strong> {feedback.student.class}</p>
                                {feedback.subject !== SCHOOL_ATTENDANCE_SUBJECT && (
                                    <p><strong>Mata Pelajaran:</strong> {feedback.subject}</p>
                                )}
                                <p><strong>Waktu:</strong> {feedback.time}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-green-200">
                                {feedback.whatsappUrl && (
                                    <div>
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
                                <button
                                    onClick={startScanner}
                                    className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium self-start"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
                                    </svg>
                                    Scan Berikutnya
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-4 text-sm rounded-lg text-center ${
                            feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            <p className="font-semibold">{feedback.message}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceScanner;