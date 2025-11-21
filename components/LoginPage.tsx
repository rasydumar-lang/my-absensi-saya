
import React, { useState } from 'react';
import { SchoolInfo } from '../types';
import { dataService } from '../services/dataService';

interface LoginPageProps {
  onLogin: (userType: 'admin' | 'operator') => void;
  schoolInfo: SchoolInfo;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, schoolInfo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Admin Login Check
    if (username.toLowerCase() === 'admin') {
        const storedPassword = await dataService.getSetting<string>('adminPassword');
        if (password === storedPassword) {
            setError('');
            onLogin('admin');
        } else {
            setError('Username atau password salah.');
        }
    } else {
        // Operator Login Check
        try {
            const operator = await dataService.getOperatorUserByUsername(username);
            if (operator && password === operator.password) {
                 setError('');
                 onLogin('operator');
            } else {
                setError('Username atau password salah.');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat login.');
        }
    }
    setIsLoading(false);
  };

  const logoSrc = schoolInfo.logoBase64 ? schoolInfo.logoBase64 : "https://picsum.photos/80";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <img src={logoSrc} alt="School Logo" className="mx-auto mb-4 rounded-full w-20 h-20 object-cover"/>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 whitespace-nowrap">{schoolInfo.name}</h1>
          <h2 className="text-xl text-gray-600 mt-1">SELAMAT DATANG</h2>
          <p className="text-gray-500 mt-2">Sistem Absensi Siswa</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="admin atau username operator"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="••••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-3 px-4 rounded-lg w-full focus:outline-none focus:shadow-outline transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
