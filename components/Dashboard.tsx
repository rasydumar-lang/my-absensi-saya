import React, { useEffect } from 'react';
import { Page, UserType } from '../App';
import { SchoolInfo } from '../types';
import AttendanceScanner from './AttendanceScanner';
import StudentManagement from './StudentManagement';
import AttendanceReport from './AttendanceReport';
import SchoolData from './SchoolData';
import AttendanceChecklist from './AttendanceChecklist';
import Settings from './Settings';
import TeacherManagement from './TeacherManagement';
import { AcademicCapIcon, ArrowLeftOnRectangleIcon, BellAlertIcon, BuildingOfficeIcon, Cog6ToothIcon, DocumentChartBarIcon, HomeIcon, QrCodeIcon, UserGroupIcon } from './icons';

interface DashboardProps {
  userType: UserType;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  schoolInfo: SchoolInfo;
  refreshSchoolInfo: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userType, currentPage, setCurrentPage, onLogout, schoolInfo, refreshSchoolInfo }) => {
  const adminPages: Page[] = ['dashboard', 'school', 'settings', 'teachers'];
  const operatorPages: Page[] = ['dashboard', 'scanner', 'checklist', 'students', 'report', 'school', 'teachers'];
  
  // If current page is not allowed for the user type, redirect to their dashboard.
  useEffect(() => {
    if (userType === 'admin' && !adminPages.includes(currentPage)) {
      setCurrentPage('dashboard');
    }
    if (userType === 'operator' && !operatorPages.includes(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [userType, currentPage, setCurrentPage]);

  const renderPage = () => {
    if (userType === 'admin') {
        switch (currentPage) {
            case 'school':
                return <SchoolData schoolInfo={schoolInfo} onDataUpdated={refreshSchoolInfo} />;
            case 'settings':
                return <Settings />;
            case 'teachers':
                return <TeacherManagement />;
            case 'dashboard':
            default:
                return <AdminDashboardHome setCurrentPage={setCurrentPage} />;
        }
    } else { // operator
         switch (currentPage) {
            case 'scanner':
                return <AttendanceScanner />;
            case 'students':
                return <StudentManagement />;
            case 'report':
                return <AttendanceReport schoolInfo={schoolInfo} />;
            case 'checklist':
                return <AttendanceChecklist />;
            case 'school':
                 return <SchoolData schoolInfo={schoolInfo} onDataUpdated={refreshSchoolInfo} />;
            case 'teachers':
                return <TeacherManagement />;
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
  
  const logoSrc = schoolInfo.logoBase64 ? schoolInfo.logoBase64 : "https://picsum.photos/40";

  return (
    <div className="flex h-screen bg-brand-gray">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gray-900">
        <div className="flex items-center justify-center h-20 border-b border-gray-700 px-4">
          <img src={logoSrc} alt="Logo" className="rounded-full mr-3 w-10 h-10 object-cover flex-shrink-0" />
          <h1 className="text-lg font-bold text-white truncate" title={schoolInfo.name}>{schoolInfo.name}</h1>
        </div>
        <div className="flex flex-col justify-between flex-1 mt-6">
          <nav className="px-2 space-y-2">
            {userType === 'admin' ? (
                <>
                    <NavLink page="dashboard" icon={<HomeIcon className="w-6 h-6"/>}>Dashboard</NavLink>
                    <NavLink page="teachers" icon={<AcademicCapIcon className="w-6 h-6"/>}>Data Guru</NavLink>
                    <NavLink page="school" icon={<BuildingOfficeIcon className="w-6 h-6"/>}>Data Sekolah</NavLink>
                    <NavLink page="settings" icon={<Cog6ToothIcon className="w-6 h-6"/>}>Pengaturan</NavLink>
                </>
            ) : (
                 <>
                    <NavLink page="dashboard" icon={<HomeIcon className="w-6 h-6"/>}>Dashboard</NavLink>
                    <NavLink page="scanner" icon={<QrCodeIcon className="w-6 h-6"/>}>Scan Absen</NavLink>
                    <NavLink page="checklist" icon={<BellAlertIcon className="w-6 h-6"/>}>Notifikasi Absen</NavLink>
                    <NavLink page="students" icon={<UserGroupIcon className="w-6 h-6"/>}>Manajemen Siswa</NavLink>
                    <NavLink page="teachers" icon={<AcademicCapIcon className="w-6 h-6"/>}>Data Guru</NavLink>
                    <NavLink page="report" icon={<DocumentChartBarIcon className="w-6 h-6"/>}>Laporan Absensi</NavLink>
                    <NavLink page="school" icon={<BuildingOfficeIcon className="w-6 h-6"/>}>Data Sekolah</NavLink>
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
            <h1 className="text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap truncate">{schoolInfo.name}</h1>
            <p className="text-sm text-gray-500">SELAMAT DATANG, {userType === 'admin' ? 'ADMIN' : 'OPERATOR'}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => setCurrentPage('teachers')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <AcademicCapIcon className="w-12 h-12 text-blue-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Data Guru</h3>
                        <p className="text-gray-500">Kelola guru dan mata pelajaran yang diampu.</p>
                    </div>
                </div>
            </div>
             <div onClick={() => setCurrentPage('school')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-12 h-12 text-yellow-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Data Sekolah</h3>
                        <p className="text-gray-500">Kelola informasi dan logo sekolah Anda.</p>
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
            <div onClick={() => setCurrentPage('checklist')} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center">
                    <BellAlertIcon className="w-12 h-12 text-blue-500" />
                    <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-800">Notifikasi Absen</h3>
                        <p className="text-gray-500">Kirim notifikasi WA ke orang tua siswa.</p>
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

export default Dashboard;