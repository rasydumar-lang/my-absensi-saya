import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Teacher, ClassName, Subject } from '../types';
import { CLASSES, SUBJECTS } from '../constants';

const TeacherManagement: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [nip, setNip] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<ClassName[]>([]);

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        setIsLoading(true);
        const teacherData = await dataService.getTeachers();
        setTeachers(teacherData);
        setIsLoading(false);
    };
    
    const resetForm = () => {
        setName('');
        setNip('');
        setSelectedSubjects([]);
        setSelectedClasses([]);
        setEditingTeacher(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setName(teacher.name);
        setNip(teacher.nip || '');
        setSelectedSubjects(teacher.subjects);
        setSelectedClasses(teacher.classes);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };
    
    const showFeedback = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };
    
    const handleSubjectChange = (subject: Subject) => {
        setSelectedSubjects(prev => 
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };
    
    const handleClassChange = (className: ClassName) => {
        setSelectedClasses(prev => 
            prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '') {
            showFeedback('Nama guru tidak boleh kosong.', 'error');
            return;
        }

        const teacherData = { name, nip, subjects: selectedSubjects, classes: selectedClasses };
        
        try {
            if (editingTeacher) {
                await dataService.updateTeacher(editingTeacher.id, teacherData);
                showFeedback('Data guru berhasil diperbarui!', 'success');
            } else {
                await dataService.addTeacher(teacherData);
                showFeedback('Guru baru berhasil ditambahkan!', 'success');
            }
            closeModal();
            loadTeachers();
        } catch (error) {
            console.error(error);
            showFeedback('Gagal menyimpan data guru.', 'error');
        }
    };
    
    const handleDelete = async (teacher: Teacher) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus data guru "${teacher.name}"?`)) {
            try {
                await dataService.deleteTeacher(teacher.id);
                showFeedback('Data guru berhasil dihapus.', 'success');
                loadTeachers();
            } catch (error) {
                console.error(error);
                showFeedback('Gagal menghapus data guru.', 'error');
            }
        }
    };

    const availableSubjects = SUBJECTS.filter(s => s !== '-- Kehadiran Sekolah --');

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manajemen Data Guru</h2>
                <button
                    onClick={openAddModal}
                    className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-dark transition-colors"
                >
                    Tambah Guru
                </button>
            </div>
            
            {feedback && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">No</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nama</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">NIP</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Mata Pelajaran</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Kelas yang Diajar</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-4">Memuat data guru...</td></tr>
                        ) : teachers.length > 0 ? teachers.map((teacher, index) => (
                            <tr key={teacher.id} className="border-b">
                                <td className="py-3 px-4">{index + 1}</td>
                                <td className="py-3 px-4 font-medium">{teacher.name}</td>
                                <td className="py-3 px-4">{teacher.nip || '-'}</td>
                                <td className="py-3 px-4 text-xs">{teacher.subjects.join(', ') || '-'}</td>
                                <td className="py-3 px-4 text-xs">{teacher.classes.join(', ') || '-'}</td>
                                <td className="py-3 px-4 flex flex-wrap gap-2">
                                    <button onClick={() => openEditModal(teacher)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">
                                        Edit
                                    </button>
                                     <button onClick={() => handleDelete(teacher)} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        )) : (
                             <tr><td colSpan={6} className="text-center py-4 text-gray-500">Belum ada data guru.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-10" aria-modal="true" role="dialog">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                        <h3 className="text-xl font-semibold mb-6 text-gray-800">{editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="nip" className="block text-sm font-medium text-gray-700">NIP (Opsional)</label>
                                    <input
                                        id="nip"
                                        type="text"
                                        value={nip}
                                        onChange={(e) => setNip(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mata Pelajaran yang Diampu</label>
                                <div className="mt-2 p-3 border border-gray-300 rounded-md max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {availableSubjects.map(subject => (
                                        <label key={subject} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubjects.includes(subject)}
                                                onChange={() => handleSubjectChange(subject)}
                                                className="rounded border-gray-300 text-brand-blue shadow-sm focus:ring-brand-blue"
                                            />
                                            <span>{subject}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Kelas yang Diajar</label>
                                <div className="mt-2 p-3 border border-gray-300 rounded-md max-h-40 overflow-y-auto grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {CLASSES.map(className => (
                                        <label key={className} className="flex items-center space-x-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedClasses.includes(className)}
                                                onChange={() => handleClassChange(className)}
                                                className="rounded border-gray-300 text-brand-blue shadow-sm focus:ring-brand-blue"
                                            />
                                            <span>{className}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
                                    {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherManagement;
