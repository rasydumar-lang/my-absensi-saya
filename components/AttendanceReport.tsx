import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { AttendanceRecord, ClassName, Subject, Student, SchoolInfo, Teacher } from '../types';
import { CLASSES, SUBJECTS } from '../constants';

interface AttendanceReportProps {
    schoolInfo: SchoolInfo;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ schoolInfo }) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [subjectTeacher, setSubjectTeacher] = useState<Teacher | null>(null);
    const [selectedClass, setSelectedClass] = useState<ClassName>(CLASSES[0]);
    const [selectedSubject, setSelectedSubject] = useState<Subject>(SUBJECTS[0]);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
    
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        student: Student | null;
        day: number | null;
    }>({ isOpen: false, student: null, day: null });
    
    useEffect(() => {
        const teacher = allTeachers.find(t => 
            t.classes.includes(selectedClass) && 
            t.subjects.includes(selectedSubject)
        ) || null;
        setSubjectTeacher(teacher);
    }, [selectedClass, selectedSubject, allTeachers]);

    useEffect(() => {
        loadReportData();
    }, [selectedClass, selectedSubject, selectedMonth, selectedYear]);

    const loadReportData = async () => {
        const studentData = await dataService.getStudents(selectedClass);
        setStudents(studentData);
        
        const recordData = await dataService.getAttendanceRecords({
            className: selectedClass,
            subject: selectedSubject,
            month: selectedMonth,
            year: selectedYear
        });
        setRecords(recordData);

        const teacherData = await dataService.getTeachers();
        setAllTeachers(teacherData);
    };
    
    const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    const handlePrint = () => {
        const printSection = document.getElementById('print-section');
        if (!printSection) return;

        const printWindow = window.open('', '_blank', 'height=800,width=1200');
        if (!printWindow) {
            alert("Gagal membuka tab baru. Mohon izinkan pop-up untuk situs ini.");
            return;
        }

        const logoElement = schoolInfo.logoBase64 ? `<img src="${schoolInfo.logoBase64}" alt="Logo" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 16px;">` : '';

        const today = new Date();
        const printDate = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const signatureBlock = `
            <div style="margin-top: 40px; font-size: 0.875rem; display: flex; justify-content: space-between; page-break-inside: avoid;">
                <div style="text-align: center; width: 45%;">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 0;">${schoolInfo.headmaster || '_____________________'}</p>
                    <p style="margin-top: 2px;">NIP. ${schoolInfo.headmasterNip || '-'}</p>
                </div>
                <div style="text-align: center; width: 45%;">
                    <p>Pulau Banyak Barat, ${printDate}</p>
                    <p>Guru Mata Pelajaran</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 0;">${subjectTeacher?.name || '_____________________'}</p>
                    <p style="margin-top: 2px;">NIP. ${subjectTeacher?.nip || '-'}</p>
                </div>
            </div>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cetak Laporan Absensi - ${schoolInfo.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 1cm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            margin: 0;
                        }
                        .no-print { display: none; }
                        #print-header {
                            display: flex !important;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            border-bottom: 2px solid black;
                            padding-bottom: 1rem;
                            margin-bottom: 1rem;
                        }
                    }
                    body {
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                    }
                </style>
            </head>
            <body>
                <div id="print-header" style="display: none;">
                    ${logoElement}
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: bold; margin: 0; white-space: nowrap;">${schoolInfo.name}</h3>
                        <p style="margin: 0; font-size: 1.1rem;">REKAPITULASI ABSENSI SISWA</p>
                        <p style="margin: 0; font-size: 0.875rem;">${schoolInfo.address}</p>
                    </div>
                </div>
                ${printSection.innerHTML}
                ${signatureBlock}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500); // Delay to allow styles to render
        };
    };

    const handleCellClick = (student: Student, day: number, record: AttendanceRecord | undefined) => {
        if (record && record.status === 'present') {
            return;
        }
        setModalState({ isOpen: true, student, day });
    };

    const handleManualStatusChange = async (newStatus: 'sick' | 'permission' | null) => {
        if (!modalState.student || modalState.day === null) return;

        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(modalState.day).padStart(2, '0')}`;
        
        try {
            await dataService.setManualAttendance(modalState.student.id, selectedSubject, dateStr, newStatus, selectedSemester);
            await loadReportData();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setModalState({ isOpen: false, student: null, day: null });
        }
    };
    
    const renderCell = (student: Student, day: number) => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = records.find(r => r.studentId === student.id && r.date === dateStr);
        const dayOfWeek = new Date(dateStr).getDay();

        let content: React.ReactNode;
        let cellClassName = "border p-1 text-center";
        let isClickable = false;

        if (dayOfWeek === 0) { // Sunday
            content = <span className="text-red-400">-</span>;
        } else if (record) {
            switch(record.status) {
                case 'present':
                    if (record.timeliness === 'late') {
                        content = <span className="text-red-600 font-bold">T</span>;
                    } else if (record.checkOut) {
                        content = <span className="text-green-600 font-bold">✓</span>;
                    } else {
                        content = <span className="text-blue-600 font-bold">M</span>;
                    }
                    break;
                case 'sick':
                    content = <span className="text-orange-500 font-bold">S</span>;
                    isClickable = true;
                    break;
                case 'permission':
                    content = <span className="text-blue-500 font-bold">I</span>;
                    isClickable = true;
                    break;
                default:
                    content = <span className="text-gray-400">A</span>;
                    isClickable = true;
            }
        } else {
            content = <span className="text-gray-400">A</span>;
            isClickable = true;
        }
        
        if (isClickable) {
            cellClassName += " cursor-pointer hover:bg-gray-100 transition-colors";
        }

        return (
            <td onClick={isClickable ? () => handleCellClick(student, day, record) : undefined} className={cellClassName}>
                {content}
            </td>
        );
    };

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="no-print">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Laporan Absensi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {/* Filters */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kelas</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value as ClassName)} className="mt-1 block w-full p-2 border rounded-md">
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
                            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value as Subject)} className="mt-1 block w-full p-2 border rounded-md">
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Semester</label>
                            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')} className="mt-1 block w-full p-2 border rounded-md">
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bulan</label>
                             <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="mt-1 block w-full p-2 border rounded-md">
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('id-ID', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tahun</label>
                            <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                    </div>
                     <button onClick={handlePrint} className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-dark">
                        Cetak Laporan
                    </button>
                </div>

                <div id="print-section" className="mt-6">
                    <div className="text-center mb-4 hidden">
                        <h3 className="text-xl font-bold">REKAPITULASI ABSENSI SISWA</h3>
                        <p>{schoolInfo.name}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 text-sm mb-4 gap-x-4">
                        <div>
                            <p><strong>Kelas:</strong> {selectedClass}</p>
                            <p><strong>Mata Pelajaran:</strong> {selectedSubject}</p>
                            <p><strong>Bulan:</strong> {new Date(0, selectedMonth-1).toLocaleString('id-ID', { month: 'long' })} {selectedYear}</p>
                        </div>
                         <div>
                            <p><strong>Semester:</strong> {selectedSemester}</p>
                            <p><strong>Guru:</strong> {subjectTeacher?.name || '-'}</p>
                            <p><strong>NIP:</strong> {subjectTeacher?.nip || '-'}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                         <table className="min-w-full bg-white border text-xs">
                            <thead>
                                <tr>
                                    <th className="border p-1" rowSpan={2}>No</th>
                                    <th className="border p-1" rowSpan={2}>Nama Siswa</th>
                                    <th className="border p-1" colSpan={daysInMonth}>Tanggal</th>
                                </tr>
                                <tr>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                        <th key={day} className="border p-1 font-normal w-6">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                               {students.map((student, index) => (
                                   <tr key={student.id}>
                                       <td className="border p-1 text-center">{index + 1}</td>
                                       <td className="border p-1 whitespace-nowrap">{student.name}</td>
                                       {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                           renderCell(student, day)
                                       ))}
                                   </tr>
                               ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="mt-4 text-xs">
                        <strong>Keterangan:</strong> ✓ = Hadir (Pulang), M = Masuk (Tepat Waktu), T = Terlambat, A = Alpa/Absen, S = Sakit, I = Izin, - = Hari Libur
                    </div>
                </div>
            </div>

            {modalState.isOpen && modalState.student && modalState.day !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 no-print" aria-modal="true" role="dialog">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">Ubah Status Absensi</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            <strong>Siswa:</strong> {modalState.student.name}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                            <strong>Tanggal:</strong> {modalState.day} {new Date(0, selectedMonth - 1).toLocaleString('id-ID', { month: 'long' })} {selectedYear}
                        </p>
                        <div className="flex flex-col space-y-3">
                            <button onClick={() => handleManualStatusChange('sick')} className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
                                Sakit (S)
                            </button>
                            <button onClick={() => handleManualStatusChange('permission')} className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                Izin (I)
                            </button>
                            <button onClick={() => handleManualStatusChange(null)} className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                                Hapus Keterangan (Alpa)
                            </button>
                        </div>
                        <div className="mt-6 text-right">
                            <button onClick={() => setModalState({ isOpen: false, student: null, day: null })} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReport;