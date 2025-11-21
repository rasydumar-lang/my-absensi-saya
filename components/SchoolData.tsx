import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SchoolInfo } from '../types';

interface SchoolDataProps {
    schoolInfo: SchoolInfo;
    onDataUpdated: () => void;
}

const SchoolData: React.FC<SchoolDataProps> = ({ schoolInfo, onDataUpdated }) => {
    const [formData, setFormData] = useState<SchoolInfo>(schoolInfo);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(schoolInfo.logoBase64);
    
    const [schoolList, setSchoolList] = useState<string[]>([]);
    const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetConfirmationText, setResetConfirmationText] = useState('');
    
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    const fetchSchoolList = async () => {
        const list = await dataService.getSchoolList();
        setSchoolList(list);
    };

    useEffect(() => {
        fetchSchoolList();
        setFormData(schoolInfo);
        setLogoPreview(schoolInfo.logoBase64);
    }, [schoolInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB size limit
                setFeedback({ message: 'Ukuran file logo tidak boleh melebihi 1MB.', type: 'error' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, logoBase64: base64String }));
                setLogoPreview(base64String);
            };
            // FIX: Corrected method name from readDataURL to readAsDataURL.
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        const oldName = schoolInfo.name;
        const newName = formData.name.trim();

        if (newName === oldName) {
            // Case 1: Name hasn't changed, just save other data.
            try {
                await dataService.updateSchoolInfo(formData);
                setFeedback({ message: 'Data sekolah berhasil diperbarui!', type: 'success' });
                onDataUpdated();
            } catch (error) {
                console.error(error);
                setFeedback({ message: 'Gagal memperbarui data sekolah.', type: 'error' });
            } finally {
                setTimeout(() => setFeedback(null), 3000);
            }
            return;
        }

        // Case 2: Name has changed. Check for a backup corresponding to the new name.
        const backupExists = await dataService.checkForBackup(newName);

        if (backupExists) {
            // Sub-case 2a: A backup exists. Ask user if they want to restore.
            setIsRestoreModalOpen(true);
        } else {
            // Sub-case 2b: No backup exists. This is a reset operation.
            setIsResetModalOpen(true);
        }
    };
    
    const handleConfirmRestore = async () => {
        try {
            await dataService.restoreDataFromBackup(formData.name.trim());
            await dataService.updateSchoolInfo(formData);
            setFeedback({ message: `Data untuk sekolah "${formData.name.trim()}" berhasil dipulihkan!`, type: 'success' });
            onDataUpdated();
        } catch (error) {
            console.error(error);
            setFeedback({ message: 'Gagal memulihkan data.', type: 'error' });
        } finally {
            setIsRestoreModalOpen(false);
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    const handleConfirmReset = async () => {
        if (resetConfirmationText !== 'RESET DATA') {
            return;
        }

        try {
            await dataService.backupAndResetData(schoolInfo.name);
            await dataService.updateSchoolInfo(formData);
            
            setFeedback({ message: 'Nama sekolah diubah, data lama dicadangkan, dan daftar siswa/guru dikosongkan.', type: 'success' });
            onDataUpdated();
        } catch (error) {
            console.error(error);
            setFeedback({ message: 'Terjadi kesalahan saat mereset data.', type: 'error' });
        } finally {
            setIsResetModalOpen(false);
            setResetConfirmationText('');
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    const handleAddNewSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSchoolName.trim() === '') return;
        try {
            await dataService.addSchool(newSchoolName.trim().toUpperCase());
            setFeedback({ message: 'Sekolah baru berhasil ditambahkan!', type: 'success' });
            await fetchSchoolList();
            setIsAddSchoolModalOpen(false);
            setNewSchoolName('');
        } catch (error: any) {
            setFeedback({ message: error.message || 'Gagal menambahkan sekolah.', type: 'error' });
        } finally {
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Data Sekolah</h2>
                    <button 
                        type="button" 
                        onClick={() => setIsAddSchoolModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Tambah Sekolah
                    </button>
                </div>

                {feedback && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                        <select
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        >
                            {schoolList.map(schoolName => (
                                <option key={schoolName} value={schoolName}>{schoolName}</option>
                            ))}
                        </select>
                         <p className="mt-2 text-sm text-gray-500">
                           Mengganti sekolah akan mencadangkan data siswa & guru saat ini, dan memuat data untuk sekolah baru (jika ada).
                        </p>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Sekolah</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label htmlFor="headmaster" className="block text-sm font-medium text-gray-700">Nama Kepala Sekolah</label>
                        <input
                            type="text"
                            name="headmaster"
                            id="headmaster"
                            value={formData.headmaster}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label htmlFor="headmasterNip" className="block text-sm font-medium text-gray-700">NIP Kepala Sekolah</label>
                        <input
                            type="text"
                            name="headmasterNip"
                            id="headmasterNip"
                            value={formData.headmasterNip || ''}
                            onChange={handleInputChange}
                            placeholder="Masukkan NIP Kepala Sekolah"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logo Sekolah</label>
                        <div className="mt-2 flex items-center gap-x-4">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="h-16 w-16 rounded-full object-cover" />
                            ) : (
                                <span className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    Logo
                                </span>
                            )}
                            <div>
                                <input
                                    type="file"
                                    id="logo-upload"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleLogoChange}
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    Ganti Logo
                                </label>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hingga 1MB.</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
            
            {isAddSchoolModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Tambah Sekolah Baru</h3>
                        <form onSubmit={handleAddNewSchool}>
                            <div className="mb-4">
                                <label htmlFor="newSchoolName" className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                                <input
                                    id="newSchoolName"
                                    type="text"
                                    value={newSchoolName}
                                    onChange={e => setNewSchoolName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                    placeholder="Contoh: SMAN 2 PULAU BANYAK"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setIsAddSchoolModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {isResetModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Konfirmasi Perubahan & Reset Data</h3>
                        <p className="text-sm text-gray-700 mb-4">
                            Anda akan mengubah nama sekolah. Tindakan ini akan <strong className="font-bold">membuat cadangan data siswa & guru saat ini</strong>, lalu mengosongkan daftar untuk nama sekolah yang baru.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            Untuk melanjutkan, ketik <strong className="font-mono text-red-700">RESET DATA</strong> di bawah ini.
                        </p>
                        <div className="mb-6">
                            <label htmlFor="resetConfirmation" className="sr-only">Ketik RESET DATA untuk konfirmasi</label>
                            <input
                                id="resetConfirmation"
                                type="text"
                                value={resetConfirmationText}
                                onChange={(e) => setResetConfirmationText(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="RESET DATA"
                            />
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                type="button" 
                                onClick={() => setIsResetModalOpen(false)} 
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmReset} 
                                disabled={resetConfirmationText !== 'RESET DATA'}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                            >
                                Ya, Ubah Nama dan Cadangkan Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRestoreModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold text-brand-blue mb-4">Pulihkan Data?</h3>
                        <p className="text-sm text-gray-700 mb-6">
                            Kami menemukan data siswa dan guru yang sebelumnya disimpan untuk nama sekolah <strong className="font-semibold">"{formData.name.trim()}"</strong>. Apakah Anda ingin memulihkannya? Data saat ini (jika ada) akan diganti.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button 
                                type="button" 
                                onClick={() => setIsRestoreModalOpen(false)} 
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmRestore} 
                                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark"
                            >
                                Ya, Pulihkan Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SchoolData;