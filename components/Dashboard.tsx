import React, { useState, useEffect } from 'react';
import { Page, UserType } from '../App';
import { SchoolInfo } from '../types';
import AttendanceScanner from './AttendanceScanner';
import StudentManagement from './StudentManagement';
import AttendanceReport from './AttendanceReport';
import SchoolData from './SchoolData';
import AttendanceChecklist from './AttendanceChecklist';
import Settings from './Settings';
import TeacherManagement from './TeacherManagement';
import ManualAttendance from './ManualAttendance';
import PasswordChangeLog from './PasswordChangeLog';
import { dataService } from '../services/dataService';
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, ClipboardDocumentCheckIcon, BuildingOfficeIcon, Cog6ToothIcon, DocumentChartBarIcon, HomeIcon, QrCodeIcon, UserGroupIcon, PencilSquareIcon, ShieldCheckIcon } from './icons';

interface DashboardProps {
  userType: UserType;
  username: string;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  activeSchoolName: string;
  activeSchoolInfo: SchoolInfo;
  refreshSchoolInfo: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userType, username, currentPage, setCurrentPage, onLogout, activeSchoolName, activeSchoolInfo, refreshSchoolInfo }) => {
  const adminPages: Page[] = ['dashboard', 'school', 'settings', 'teachers', 'password_log'];
  const operatorPages: Page[] = ['dashboard', 'scanner', 'manual', 'checklist', 'students', 'report', 'school', 'teachers', 'settings'];
  const [adminName, setAdminName] = useState<string>('Panel Admin');
  
  // If current page is not allowed for the user type, redirect to their dashboard.
  useEffect(() => {
    if (userType === 'admin' && !adminPages.includes(currentPage)) {
      setCurrentPage('dashboard');
    }
    if (userType === 'operator' && !operatorPages.includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [userType, currentPage, setCurrentPage]);

  const refreshAdminName = async () => {
    const name = await dataService.getSetting<string>('adminName');
    setAdminName(name || 'Administrator');
  };

  useEffect(() => {
    if (userType === 'admin') {
      refreshAdminName();
    }
  }, [userType]);

  const renderPage = () => {
    if (userType === 'admin') {
        switch (currentPage) {
            case 'school':
                return <SchoolData activeSchoolInfo={activeSchoolInfo} onDataUpdated={refreshSchoolInfo} userType={userType} onAdminProfileUpdated={refreshAdminName} />;
            case 'settings':
                return <Settings />;
            case 'teachers':
                return <TeacherManagement activeSchoolName={activeSchoolName} />;
            case 'password_log':
                return <PasswordChangeLog />;
            case 'dashboard':
            default:
                return <AdminDashboardHome setCurrentPage={setCurrentPage} />;
        }
    } else { // operator
         switch (currentPage) {
            case 'scanner':
                return <AttendanceScanner activeSchoolInfo={activeSchoolInfo} activeSchoolName={activeSchoolName} />;
            case 'manual':
                return <ManualAttendance activeSchoolInfo={activeSchoolInfo} activeSchoolName={activeSchoolName} />;
            case 'students':
                return <StudentManagement activeSchoolName={activeSchoolName} />;
            case 'report':
                return <AttendanceReport activeSchoolInfo={activeSchoolInfo} activeSchoolName={activeSchoolName} />;
            case 'checklist':
                return <AttendanceChecklist activeSchoolInfo={activeSchoolInfo} activeSchoolName={activeSchoolName} />;
            case 'school':
                 return <SchoolData activeSchoolInfo={activeSchoolInfo} onDataUpdated={refreshSchoolInfo} userType={userType} onAdminProfileUpdated={() => {}} />;
            case 'teachers':
                return <TeacherManagement activeSchoolName={activeSchoolName} />;
            case 'settings':
                return <OperatorSettings username={username} activeSchoolInfo={activeSchoolInfo} />;
            case 'dashboard':
            default:
                return <OperatorDashboardHome setCurrentPage={setCurrentPage} />;
        }
    }
  };

  const NavLink: React.FC<{
      page: Page, 
      icon: React.ReactNode, 
      children: React.ReactNode 
    }> = ({ page, icon, children }) => (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
      className={`flex items-center px-4 py-3 text-gray-300 rounded-lg transition-colors duration-200 ${
        currentPage === page
          ? 'bg-brand-blue text-white'
          : 'hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="mx-4 font-medium">{children}</span>
    </a>
  );
  
  const headerTitle = userType === 'admin' ? adminName : activeSchoolInfo.name;

  return (
    <div className="flex h-screen bg-brand-gray">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gray-900">
        <div className="flex items-center justify-center h-20 border-b border-gray-700 px-4">
          {userType === 'admin' ? (
              <div className="rounded-full mr-3 w-10 h-10 bg-brand-blue flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
          ) : (
              <img src={activeSchoolInfo.logoBase64 || "https://picsum.photos/40"} alt="Logo" className="rounded-full mr-3 w-10 h-10 object-cover flex-shrink-0" />
          )}
          <h1 className="text-lg font-bold text-white truncate" title={headerTitle}>{headerTitle}</h1>
        </div>
        <div className="flex flex-col justify-between flex-1 mt-6">
          <nav className="px-2 space-y-2">
            {userType === 'admin' ? (
                <>
                    <NavLink page="dashboard" icon={<HomeIcon className="w-6 h-6"/>}>Dashboard</NavLink>
                    <NavLink page="teachers" icon={<AcademicCapIcon className="w-6 h-6"/>}>Data Guru</NavLink>
                    <NavLink page="school" icon={<BuildingOfficeIcon className="w-6 h-6"/>}>Profil & Sekolah</NavLink>
                    <NavLink page="password_log" icon={<ShieldCheckIcon className="w-6 h-6"/>}>Log Password</NavLink>
                    <NavLink page="settings" icon={<Cog6ToothIcon className="w-6 h-6"/>}>Pengaturan</NavLink>
                </>
            ) : (
                 <>
                    <NavLink page="dashboard" icon={<HomeIcon className="w-6 h-6"/>}>Dashboard</NavLink>
                    <NavLink page="scanner" icon={<QrCodeIcon className="w-6 h-6"/>}>Scan Absen</NavLink>
                    <NavLink page="manual" icon={<PencilSquareIcon className="w-6 h-6"/>}>Absen Manual</NavLink>
                    <NavLink page="checklist" icon={<ClipboardDocumentCheckIcon className="w-6 h-6"/>}>Daftar Hadir Harian</NavLink>
                    <NavLink page="students" icon={<UserGroupIcon className="w-6 h-6"/>}>Manajemen Siswa</NavLink>
                    <NavLink page="teachers" icon={<AcademicCapIcon className="w-6 h-6"/>}>Data Guru</NavLink>
                    <NavLink page="report" icon={<DocumentChartBarIcon className="w-6 h-6"/>}>Laporan Absensi</NavLink>
                    <NavLink page="school" icon={<BuildingOfficeIcon className="w-6 h-6"/>}>Data Sekolah</NavLink>
                    <NavLink page="settings" icon={<Cog6ToothIcon className="w-6 h-6"/>}>Pengaturan</NavLink>
                </>
            )}
          </nav>
          <div className="px-2 pb-4">
             <a href="#" onClick={onLogout} className="flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-red-400 transition-colors">
                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                <span className="mx-4 font-medium">Logout</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center justify-between h-20 px-6 bg-white border-b">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap truncate">{headerTitle}</h1>
            <p className="text-sm text-gray-500">SELAMAT DATANG, {userType === 'admin' ? 'ADMIN' : `OPERATOR ${activeSchoolInfo.name}`}</p>
          </div>
          <button onClick={onLogout} className="md:hidden text-gray-600 hover:text-brand-blue">
            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
        <main className="p-6">
          {currentPage !== 'dashboard' && (
              <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="mb-6 inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Kembali ke Dashboard
              </button>
          )}
          {renderPage()}
        </main>
      </div>
    </div>
  );
};


const AdminDashboardHome: React.FC<{setCurrentPage: (page: Page) => void}> = ({setCurrentPage}) => (
    <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Selamat Datang, Admin!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <div onClick={() => setCurrentPage('teachers')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <AcademicCapIcon className="w-12 h-12 text-blue-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Data Guru</h3>
                        <p className="text-gray-500">Kelola data guru untuk semua sekolah.</p>
                    </div>
                </div>
            </div>
             <div onClick={() => setCurrentPage('school')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-12 h-12 text-yellow-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Profil & Sekolah</h3>
                        <p className="text-gray-500">Kelola profil admin dan daftar sekolah.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('password_log')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <ShieldCheckIcon className="w-12 h-12 text-green-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Log Password</h3>
                        <p className="text-gray-500">Lihat riwayat perubahan password operator.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('settings')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <Cog6ToothIcon className="w-12 h-12 text-gray-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Pengaturan</h3>
                        <p className="text-gray-500">Ubah password, status sistem & kelola operator.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const OperatorDashboardHome: React.FC<{setCurrentPage: (page: Page) => void}> = ({setCurrentPage}) => (
    <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Selamat Datang, Operator!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => setCurrentPage('scanner')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <QrCodeIcon className="w-12 h-12 text-brand-blue" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Scan Absen QR</h3>
                        <p className="text-gray-500">Mulai sesi absensi dengan memindai QR code siswa.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('manual')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <PencilSquareIcon className="w-12 h-12 text-indigo-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Absen Manual (NIS)</h3>
                        <p className="text-gray-500">Catat kehadiran siswa secara manual via NIS.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('checklist')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <ClipboardDocumentCheckIcon className="w-12 h-12 text-teal-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Daftar Hadir Harian</h3>
                        <p className="text-gray-500">Lihat status kehadiran siswa pada hari ini.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('students')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <UserGroupIcon className="w-12 h-12 text-green-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Manajemen Siswa</h3>
                        <p className="text-gray-500">Tambah, lihat, dan kelola data siswa per kelas.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('teachers')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <AcademicCapIcon className="w-12 h-12 text-blue-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Data Guru</h3>
                        <p className="text-gray-500">Kelola guru dan mata pelajaran yang diampu.</p>
                    </div>
                </div>
            </div>
            <div onClick={() => setCurrentPage('report')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <DocumentChartBarIcon className="w-12 h-12 text-purple-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Laporan Absensi</h3>
                        <p className="text-gray-500">Cetak rekapitulasi absensi bulanan per kelas.</p>
                    </div>
                </div>
            </div>
             <div onClick={() => setCurrentPage('school')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-12 h-12 text-yellow-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Data Sekolah</h3>
                        <p className="text-gray-500">Kelola informasi detail sekolah.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

type OperatorFeedback = {
    message: string;
    type: 'success' | 'error';
};

const OperatorSettings: React.FC<{ username: string, activeSchoolInfo: SchoolInfo }> = ({ username, activeSchoolInfo }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [feedback, setFeedback] = useState<OperatorFeedback | null>(null);

    const showFeedback = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (newPassword !== confirmPassword) {
            showFeedback('Password baru tidak cocok.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showFeedback('Password baru minimal harus 6 karakter.', 'error');
            return;
        }

        try {
            const operator = await dataService.getOperatorUserByUsernameAndSchool(username, activeSchoolInfo.name);
            if (!operator) {
                showFeedback('Gagal menemukan data operator.', 'error');
                return;
            }

            if (oldPassword !== operator.password) {
                showFeedback('Password lama salah.', 'error');
                return;
            }

            await dataService.updateOperatorUserPassword(operator.id, newPassword);
            showFeedback('Password Anda berhasil diperbarui!', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            showFeedback('Gagal memperbarui password.', 'error');
        }
    };
    
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Ubah Password Operator</h2>
                {feedback && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {feedback.message}
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
        </div>
    );
}

export default Dashboard;