import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { OperatorUser } from '../types';
import { Cog6ToothIcon, UsersIcon } from './icons';

type Feedback = {
    message: string;
    type: 'success' | 'error';
};

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'operators'>('general');

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'general' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <Cog6ToothIcon className="w-5 h-5" />
                            Pengaturan Umum
                        </button>
                        <button
                            onClick={() => setActiveTab('operators')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'operators' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            <UsersIcon className="w-5 h-5" />
                            Manajemen Operator
                        </button>
                    </nav>
                </div>
            </div>
            
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'operators' && <OperatorManagement />}
        </div>
    );
};

const GeneralSettings: React.FC = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);

    const [schoolList, setSchoolList] = useState<string[]>([]);
    const [schoolStatuses, setSchoolStatuses] = useState<Map<string, boolean>>(new Map());
    const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(true);
    const [statusFeedback, setStatusFeedback] = useState<Feedback | null>(null);

    useEffect(() => {
        const fetchAllSettings = async () => {
            setIsLoadingStatuses(true);
            const schools = await dataService.getSchoolList();
            setSchoolList(schools);
            
            const statuses = new Map<string, boolean>();
            for (const schoolName of schools) {
                const settingKey = `attendance_enabled_${schoolName}`;
                const status = await dataService.getSetting<boolean>(settingKey);
                // Default to true if setting is not found (undefined)
                statuses.set(schoolName, status !== false);
            }
            setSchoolStatuses(statuses);
            setIsLoadingStatuses(false);
        };
        fetchAllSettings();
    }, []);

    const showFeedback = (setter: React.Dispatch<React.SetStateAction<Feedback | null>>, message: string, type: 'success' | 'error') => {
        setter({ message, type });
        setTimeout(() => setter(null), 3000);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordFeedback(null);

        if (newPassword !== confirmPassword) {
            showFeedback(setPasswordFeedback, 'Password baru tidak cocok.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showFeedback(setPasswordFeedback, 'Password baru minimal harus 6 karakter.', 'error');
            return;
        }

        const currentPassword = await dataService.getSetting<string>('adminPassword');
        if (oldPassword !== currentPassword) {
            showFeedback(setPasswordFeedback, 'Password lama salah.', 'error');
            return;
        }

        try {
            await dataService.updateSetting('adminPassword', newPassword);
            showFeedback(setPasswordFeedback, 'Password Admin berhasil diperbarui!', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            showFeedback(setPasswordFeedback, 'Gagal memperbarui password.', 'error');
        }
    };

    const handleStatusToggle = async (schoolName: string) => {
        const currentStatus = schoolStatuses.get(schoolName) !== false;
        const newStatus = !currentStatus;
        const settingKey = `attendance_enabled_${schoolName}`;

        try {
            await dataService.updateSetting(settingKey, newStatus);
            setSchoolStatuses(prev => new Map(prev).set(schoolName, newStatus));
            showFeedback(setStatusFeedback, `Sistem absensi untuk "${schoolName}" berhasil di-${newStatus ? 'aktifkan' : 'nonaktifkan'}.`, 'success');
        } catch (error) {
            console.error(error);
            showFeedback(setStatusFeedback, 'Gagal mengubah status sistem.', 'error');
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Ubah Password Admin</h2>
                {passwordFeedback && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${passwordFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passwordFeedback.message}
                    </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="oldPassword">
                            Password Lama
                        </label>
                        <input
                            id="oldPassword"
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="newPassword">
                            Password Baru
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                            required
                        />
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-bold mb-2 text-gray-800">Status Sistem Absensi per Sekolah</h2>
                 <p className="text-sm text-gray-600 mb-6">Aktifkan atau nonaktifkan fitur scan QR code untuk setiap sekolah yang terdaftar.</p>
                 {statusFeedback && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${statusFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {statusFeedback.message}
                    </div>
                )}
                 {isLoadingStatuses ? (
                    <p className="text-gray-500">Memuat status sekolah...</p>
                ) : (
                    <div className="space-y-4">
                        {schoolList.map(schoolName => {
                            const isEnabled = schoolStatuses.get(schoolName) !== false;
                            return (
                                <div key={schoolName} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                                    <span className="font-medium text-gray-900">{schoolName}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusToggle(schoolName)}
                                        className={`${
                                            isEnabled ? 'bg-brand-blue' : 'bg-gray-200'
                                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2`}
                                        role="switch"
                                        aria-checked={isEnabled}
                                    >
                                        <span className="sr-only">Ubah status untuk {schoolName}</span>
                                        <span
                                            aria-hidden="true"
                                            className={`${
                                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                                            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                        ></span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

const OperatorManagement = () => {
    const [operators, setOperators] = useState<OperatorUser[]>([]);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [schoolList, setSchoolList] = useState<string[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>('');


    useEffect(() => {
        loadOperators();
        loadSchoolList();
    }, []);

    const loadOperators = async () => {
        const users = await dataService.getOperatorUsers();
        setOperators(users);
    };

    const loadSchoolList = async () => {
        const schools = await dataService.getSchoolList();
        setSchoolList(schools);
        if (schools.length > 0) {
            setSelectedSchool(schools[0]);
        }
    };

    const showFeedback = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleAddOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUsername.trim() === '' || newPassword.trim() === '') {
            showFeedback('Username dan password tidak boleh kosong.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showFeedback('Password minimal harus 6 karakter.', 'error');
            return;
        }
        if (selectedSchool === '') {
            showFeedback('Anda harus memilih sekolah.', 'error');
            return;
        }
        try {
            await dataService.addOperatorUser(newUsername, newPassword, selectedSchool);
            showFeedback('Operator berhasil ditambahkan!', 'success');
            setIsAddModalOpen(false);
            setNewUsername('');
            setNewPassword('');
            loadOperators();
        } catch (error: any) {
            showFeedback(error.message || 'Gagal menambahkan operator.', 'error');
        }
    };
    
    const handleDeleteOperator = async (id: string, username: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus operator "${username}"?`)) {
            try {
                await dataService.deleteOperatorUser(id);
                showFeedback('Operator berhasil dihapus.', 'success');
                loadOperators();
            } catch (error) {
                 showFeedback('Gagal menghapus operator.', 'error');
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Daftar Pengguna Operator</h2>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                >
                    Tambah Operator
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
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Username</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Sekolah</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {operators.map(op => (
                            <tr key={op.id} className="border-b">
                                <td className="py-3 px-4">{op.username}</td>
                                <td className="py-3 px-4">{op.schoolName}</td>
                                <td className="py-3 px-4 flex gap-2">
                                     <button disabled className="bg-yellow-300 text-white px-3 py-1 text-sm rounded cursor-not-allowed" title="Segera Hadir">
                                        Ubah Password
                                    </button>
                                     <button onClick={() => handleDeleteOperator(op.id, op.username)} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {operators.length === 0 && <p className="text-center text-gray-500 mt-4">Belum ada operator.</p>}
            </div>

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Tambah Operator Baru</h3>
                        <form onSubmit={handleAddOperator}>
                             <div className="mb-4">
                                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">Sekolah</label>
                                <select
                                    id="schoolName"
                                    value={selectedSchool}
                                    onChange={e => setSelectedSchool(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                >
                                    {schoolList.map(school => (
                                        <option key={school} value={school}>{school}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    id="newUsername"
                                    type="text"
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter.</p>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
                                    Tambah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;