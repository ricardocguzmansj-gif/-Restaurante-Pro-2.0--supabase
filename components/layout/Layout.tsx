import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../ui/Toast';
import { useAppContext } from '../../contexts/AppContext';

export const Layout: React.FC = () => {
  const { toast } = useAppContext();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};
