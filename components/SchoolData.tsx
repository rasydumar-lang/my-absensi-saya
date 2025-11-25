import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { SchoolInfo } from '../types';
import { UserType } from '../App';

interface SchoolDataProps {
    userType: UserType;
    activeSchoolInfo: SchoolInfo;
    onDataUpdated: () => void;
    onAdminProfileUpdated: () => void;
}

const OperatorSchoolData: React.FC<{ activeSchoolInfo: SchoolInfo, onDataUpdated: () => void }> = ({ activeSchoolInfo, onDataUpdated }) => {
    const [formData, setFormData] = useState(activeSchoolInfo);
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(activeSchoolInfo.logoBase64);

    useEffect(() => {
        setFormData(activeSchoolInfo);
        setLogoPreview(activeSchoolInfo.logoBase64);
    }, [activeSchoolInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        try {
            const { id, name, ...updatePayload } = formData;
            await dataService.updateSchoolInfo(name, updatePayload);
            setFeedback({ message: 'Data sekolah berhasil diperbarui!', type: 'success' });
            onDataUpdated();
        } catch (error) {
            console.error(error);
            setFeedback({ message: 'Gagal memperbarui data sekolah.', type: 'error' });
        } finally {
            setTimeout(() => setFeedback(null), 3000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Sekolah</h2>
            {feedback && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback.message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="name_disabled" className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                    <input
                        type="text"
                        name="name_disabled"
                        id="name_disabled"
                        value={formData.name}
                        className="mt-1 block w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md shadow-sm"
                        disabled
                    />
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
    );
};

const AdminSchoolData: React.FC<{ onAdminProfileUpdated: () => void }> = ({ onAdminProfileUpdated }) => {
    const [adminName, setAdminName] = useState('');
    const [adminNip, setAdminNip] = useState('');
    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [isAddSchoolModalOpen, setIsAddSchoolModalOpen] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');

    const [allSchoolList, setAllSchoolList] = useState<string[]>([]);
    
    const fetchAdminData = async () => {
        const name = await dataService.getSetting<string>('adminName');
        const nip = await dataService.getSetting<string>('adminNip');
        setAdminName(name || '');
        setAdminNip(nip || '');
    };

    const fetchAllSchoolSettings = async () => {
        try {
            const schools = await dataService.getSchoolList();
            setAllSchoolList(schools);
        } catch (error) {
            console.error("Failed to load school list:", error);
        }
    };
    
    useEffect(() => {
        fetchAdminData();
        fetchAllSchoolSettings();
    }, []);

    const showFeedback = (setter: React.Dispatch<React.SetStateAction<{ message: string; type: "success" | "error"; } | null>>, message: string, type: 'success' | 'error') => {
        setter({ message, type });
        setTimeout(() => setter(null), 3000);
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        try {
            await dataService.updateSetting('adminName', adminName);
            await dataService.updateSetting('adminNip', adminNip);
            showFeedback(setFeedback, 'Profil admin berhasil diperbarui!', 'success');
            onAdminProfileUpdated();
        } catch (error) {
            console.error(error);
            showFeedback(setFeedback, 'Gagal memperbarui profil.', 'error');
        }
    };

    const handleAddNewSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newSchoolName.trim() === '') return;
        try {
            await dataService.addSchool(newSchoolName.trim().toUpperCase());
            showFeedback(setFeedback, 'Sekolah baru berhasil ditambahkan!', 'success');
            await fetchAllSchoolSettings(); // Refresh the list
            setIsAddSchoolModalOpen(false);
            setNewSchoolName('');
        } catch (error: any) {
            showFeedback(setFeedback, error.message || 'Gagal menambahkan sekolah.', 'error');
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profil Admin</h2>
                {feedback && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.message}
                    </div>
                )}
                <form onSubmit={handleAdminSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Nama Admin</label>
                        <input
                            type="text"
                            name="adminName"
                            id="adminName"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label htmlFor="adminNip" className="block text-sm font-medium text-gray-700">NIP Admin (Opsional)</label>
                        <input
                            type="text"
                            name="adminNip"
                            id="adminNip"
                            value={adminNip}
                            onChange={(e) => setAdminNip(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                     <div className="text-right">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        >
                            Simpan Profil
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Manajemen Sekolah</h2>
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
                
                <h3 className="text-lg font-bold mb-2 text-gray-800">Daftar Sekolah Terdaftar</h3>
                 <div className="space-y-2">
                    {allSchoolList.map(schoolName => (
                        <div key={schoolName} className="p-3 border rounded-md bg-gray-50">
                            <span className="font-medium text-gray-900">{schoolName}</span>
                        </div>
                    ))}
                </div>
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
        </>
    );
};


const SchoolData: React.FC<SchoolDataProps> = ({ userType, activeSchoolInfo, onDataUpdated, onAdminProfileUpdated }) => {
    if (userType === 'admin') {
        return <AdminSchoolData onAdminProfileUpdated={onAdminProfileUpdated} />;
    }
    return <OperatorSchoolData activeSchoolInfo={activeSchoolInfo} onDataUpdated={onDataUpdated} />;
};

export default SchoolData;