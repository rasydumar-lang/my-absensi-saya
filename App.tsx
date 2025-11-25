import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { initializeDatabase, dataService } from './services/dataService';
import { SchoolInfo } from './types';
import { SCHOOL_NAMES } from './constants';

export type Page = 'scanner' | 'students' | 'report' | 'dashboard' | 'school' | 'checklist' | 'settings' | 'teachers' | 'manual' | 'password_log';
export type UserType = 'admin' | 'operator';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSchoolName, setActiveSchoolName] = useState<string | null>(null);
  const [activeSchoolInfo, setActiveSchoolInfo] = useState<SchoolInfo | null>(null);

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
        
        const loggedInStatus = sessionStorage.getItem('isLoggedIn');
        const storedUserType = sessionStorage.getItem('userType') as UserType | null;
        const storedUsername = sessionStorage.getItem('username');
        const storedSchoolName = sessionStorage.getItem('activeSchoolName');

        if (loggedInStatus === 'true' && storedUserType && storedUsername) {
            setIsLoggedIn(true);
            setUserType(storedUserType);
            setUsername(storedUsername);

            const schoolNameToLoad = storedUserType === 'admin' ? (storedSchoolName || SCHOOL_NAMES[0]) : storedSchoolName;

            if (schoolNameToLoad) {
                const info = await dataService.getSchoolInfo(schoolNameToLoad);
                if (info) {
                    setActiveSchoolInfo(info);
                    setActiveSchoolName(info.name);
                    document.title = `Absensi - ${info.name}`;
                }
            }
        } else {
            // Not logged in, load default school info for login page
            const defaultSchoolInfo = await dataService.getSchoolInfo(SCHOOL_NAMES[0]);
            if (defaultSchoolInfo) {
                setActiveSchoolInfo(defaultSchoolInfo);
                setActiveSchoolName(defaultSchoolInfo.name);
            }
        }

      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
      setIsLoading(false); // finish loading
    };
    init();
  }, []);
  
  const refreshSchoolInfo = async () => {
    if (activeSchoolName) {
        const info = await dataService.getSchoolInfo(activeSchoolName);
        if (info) {
            setActiveSchoolInfo(info);
            document.title = `Absensi - ${info.name}`;
        }
    }
  }

  const handleLogin = async (loggedInUserType: UserType, loggedInUsername: string, schoolName?: string) => {
    if (loggedInUserType === 'operator' && !schoolName) {
        console.error("Operator login requires a school name.");
        return;
    }
    
    const schoolForSession = schoolName || activeSchoolName || SCHOOL_NAMES[0];
    
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userType', loggedInUserType);
    sessionStorage.setItem('username', loggedInUsername);
    sessionStorage.setItem('activeSchoolName', schoolForSession);

    setIsLoggedIn(true);
    setUserType(loggedInUserType);
    setUsername(loggedInUsername);
    setActiveSchoolName(schoolForSession);
    
    const info = await dataService.getSchoolInfo(schoolForSession);
    if (info) {
      setActiveSchoolInfo(info);
      document.title = `Absensi - ${info.name}`;
    }
    
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('activeSchoolName');
    setIsLoggedIn(false);
    setUserType(null);
    setUsername(null);
    setCurrentPage('dashboard');
  };
  
  if (isLoading || !activeSchoolInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Memuat data...</h1>
          <p className="text-gray-500">Mohon tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !userType || !username) {
    return <LoginPage onLogin={handleLogin} schoolInfo={activeSchoolInfo} />;
  }

  return (
    <Dashboard 
      userType={userType}
      username={username}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onLogout={handleLogout}
      activeSchoolName={activeSchoolName!}
      activeSchoolInfo={activeSchoolInfo}
      refreshSchoolInfo={refreshSchoolInfo}
    />
  );
};

export default App;