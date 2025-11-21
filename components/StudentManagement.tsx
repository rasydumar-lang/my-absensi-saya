import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Student, ClassName, QrData } from '../types';
import { CLASSES } from '../constants';
import QRCode from 'qrcode';

const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassName>(CLASSES[0]);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentNis, setNewStudentNis] = useState('');
    const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    useEffect(() => {
        loadStudents();
    }, [selectedClass]);

    const loadStudents = async () => {
        const studentData = await dataService.getStudents(selectedClass);
        setStudents(studentData);
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newStudentName.trim() && newStudentNis.trim()) {
            await dataService.addStudent(newStudentName, newStudentNis, selectedClass, newStudentParentPhone);
            setNewStudentName('');
            setNewStudentNis('');
            setNewStudentParentPhone('');
            await loadStudents();
            setFeedback({ message: 'Siswa berhasil ditambahkan!', type: 'success' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat diurungkan.")) {
            await dataService.deleteStudent(id);
            await loadStudents();
            setFeedback({ message: 'Siswa berhasil dihapus.', type: 'error' });
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    const handleEditClick = (student: Student) => {
        setEditingStudent({ ...student });
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStudent) {
            await dataService.updateStudent(editingStudent.id, {
                name: editingStudent.name,
                nis: editingStudent.nis,
                className: editingStudent.class,
                parentPhoneNumber: editingStudent.parentPhoneNumber,
            });
            setEditingStudent(null);
            await loadStudents();
            setFeedback({ message: 'Data siswa berhasil diperbarui!', type: 'success' });
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (editingStudent) {
            setEditingStudent({
                ...editingStudent,
                [e.target.name]: e.target.value,
            });
        }
    };

    const downloadQRCode = (student: Student) => {
        const qrData: QrData = { studentId: student.id, name: student.name };
        QRCode.toDataURL(JSON.stringify(qrData), { width: 300, margin: 2 }, (err, url) => {
            if (err) {
                console.error(err);
                return;
            }
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode-${student.nis}-${student.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Manajemen Siswa</h2>
            
            {feedback && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            {/* Add Student Form */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Tambah Siswa Baru</h3>
                <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                        <input
                            type="text"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Nama Lengkap"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        />
                    </div>
                     <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700">NIS</label>
                        <input
                            type="text"
                            value={newStudentNis}
                            onChange={(e) => setNewStudentNis(e.target.value)}
                            placeholder="Nomor Induk Siswa"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        />
                    </div>
                     <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700">No. WA Orang Tua</label>
                        <input
                            type="text"
                            value={newStudentParentPhone}
                            onChange={(e) => setNewStudentParentPhone(e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div className="w-full">
                         <label className="block text-sm font-medium text-gray-700">Kelas</label>
                         <input type="text" value={selectedClass} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <button type="submit" className="w-full bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-dark transition-colors">
                        Tambah
                    </button>
                </form>
            </div>

            {/* Student List */}
            <div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value as ClassName)}
                        className="mt-1 block w-full md:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    >
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">No</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nama</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">NIS</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">No. WA Ortu</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {students.map((student, index) => (
                                <tr key={student.id} className="border-b">
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4">{student.name}</td>
                                    <td className="py-3 px-4">{student.nis}</td>
                                    <td className="py-3 px-4">{student.parentPhoneNumber || '-'}</td>
                                    <td className="py-3 px-4 flex flex-wrap gap-2">
                                        <button onClick={() => downloadQRCode(student)} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600">
                                            QR Code
                                        </button>
                                        <button onClick={() => handleEditClick(student)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">
                                            Edit
                                        </button>
                                         <button onClick={() => handleDeleteStudent(student.id)} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {students.length === 0 && <p className="text-center text-gray-500 mt-4">Belum ada siswa di kelas ini.</p>}
            </div>

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Data Siswa</h3>
                        <form onSubmit={handleUpdateStudent}>
                            <div className="mb-4">
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                                <input
                                    id="editName"
                                    name="name"
                                    type="text"
                                    value={editingStudent.name}
                                    onChange={handleEditFormChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="editNis" className="block text-sm font-medium text-gray-700">NIS</label>
                                <input
                                    id="editNis"
                                    name="nis"
                                    type="text"
                                    value={editingStudent.nis}
                                    onChange={handleEditFormChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="editParentPhone" className="block text-sm font-medium text-gray-700">No. WA Orang Tua</label>
                                <input
                                    id="editParentPhone"
                                    name="parentPhoneNumber"
                                    type="text"
                                    value={editingStudent.parentPhoneNumber || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="08xxxxxxxxxx"
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="editClass" className="block text-sm font-medium text-gray-700">Kelas</label>
                                <select
                                    id="editClass"
                                    name="class"
                                    value={editingStudent.class}
                                    onChange={handleEditFormChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                >
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;