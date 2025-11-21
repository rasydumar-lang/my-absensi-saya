import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { initializeDatabase, dataService } from './services/dataService';
import { SchoolInfo } from './types';

export type Page = 'scanner' | 'students' | 'report' | 'dashboard' | 'school' | 'checklist' | 'settings' | 'teachers';
export type UserType = 'admin' | 'operator';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    // Register Service Worker for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('Service Worker registered with scope: ', registration.scope))
                .catch(error => console.log('Service Worker registration failed: ', error));
        });
    }

    const init = async () => {
      try {
        await initializeDatabase(); // Seed data if needed
        const info = await dataService.getSchoolInfo();
        if (info) {
          setSchoolInfo(info);
          document.title = `Absensi - ${info.name}`;
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
      const loggedInStatus = sessionStorage.getItem('isLoggedIn');
      const storedUserType = sessionStorage.getItem('userType') as UserType | null;
      if (loggedInStatus === 'true' && storedUserType) {
        setIsLoggedIn(true);
        setUserType(storedUserType);
      }
      setIsLoading(false); // finish loading
    };
    init();
  }, []);
  
  const refreshSchoolInfo = async () => {
    const info = await dataService.getSchoolInfo();
    if (info) {
      setSchoolInfo(info);
      document.title = `Absensi - ${info.name}`;
    }
  }

  const handleLogin = (loggedInUserType: UserType) => {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userType', loggedInUserType);
    setIsLoggedIn(true);
    setUserType(loggedInUserType);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userType');
    setIsLoggedIn(false);
    setUserType(null);
    setCurrentPage('dashboard');
  };
  
  if (isLoading || !schoolInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Memuat data...</h1>
          <p className="text-gray-500">Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !userType) {
    return <LoginPage onLogin={handleLogin} schoolInfo={schoolInfo} />;
  }

  return (
    <Dashboard 
      userType={userType}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onLogout={handleLogout}
      schoolInfo={schoolInfo}
      refreshSchoolInfo={refreshSchoolInfo}
    />
  );
};

export default App;