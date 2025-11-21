import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { PasswordChangeLogEntry } from '../types';

const PasswordChangeLog: React.FC = () => {
    const [log, setLog] = useState<PasswordChangeLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLog();
    }, []);

    const loadLog = async () => {
        setIsLoading(true);
        try {
            const logData = await dataService.getPasswordChangeLog();
            setLog(logData);
        } catch (error) {
            console.error("Failed to load password change log:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearEntry = async (entry: PasswordChangeLogEntry) => {
        if (window.confirm(`Tandai notifikasi untuk "${entry.operatorUsername}" dari "${entry.schoolName}" sebagai selesai?`)) {
            try {
                await dataService.clearPasswordChangeLogEntry(entry.id);
                loadLog();
            } catch (error) {
                console.error("Failed to clear log entry:", error);
                alert("Gagal menghapus entri log.");
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Log Perubahan Password Operator</h2>
            <p className="text-sm text-gray-600 mb-6">Daftar ini menunjukkan operator yang passwordnya telah diubah, baik oleh operator sendiri maupun direset oleh admin. Hapus notifikasi setelah Anda meninjaunya.</p>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Sekolah</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Operator</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Waktu Perubahan</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-4">Memuat log...</td></tr>
                        ) : log.length > 0 ? log.map(entry => (
                            <tr key={entry.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">{entry.schoolName}</td>
                                <td className="py-3 px-4 font-medium">{entry.operatorUsername}</td>
                                <td className="py-3 px-4">{new Date(entry.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</td>
                                <td className="py-3 px-4">
                                    <button 
                                        onClick={() => handleClearEntry(entry)}
                                        className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 transition-colors"
                                        title="Hapus notifikasi ini dari daftar"
                                    >
                                        Tandai Selesai
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500">Tidak ada notifikasi perubahan password.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PasswordChangeLog;
