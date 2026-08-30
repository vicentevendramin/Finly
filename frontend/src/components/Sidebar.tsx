import React from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, List, Tags, Target, BarChart2, Plus, LogOut, ShieldCheck, Settings } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import Avatar from './Avatar';

const SidebarNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  onNavigate: () => void;
}> = ({ to, icon: Icon, label, onNavigate }) => {
  return (
    <RouterNavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => `
        flex items-center w-full px-4 py-3 rounded-lg transition-colors
        ${isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </RouterNavLink>
  );
};

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const openNewModal = useUiStore((state) => state.openNewModal);
  const isMobileMenuOpen = useUiStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUiStore((state) => state.closeMobileMenu);

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    navigate('/login');
  };

  const handleNewTransaction = () => {
    openNewModal();
    closeMobileMenu();
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop (mobile only, shown while the drawer is open) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full
          transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Title */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Finly</h1>
        </div>

        {/* New Transaction button */}
        <div className="p-6">
          <button
            onClick={handleNewTransaction}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('sidebar.newTransaction')}
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          <SidebarNavItem to="/app/dashboard" icon={Home} label={t('sidebar.dashboard')} onNavigate={closeMobileMenu} />
          <SidebarNavItem to="/app/transactions" icon={List} label={t('sidebar.transactions')} onNavigate={closeMobileMenu} />
          <SidebarNavItem to="/app/categories" icon={Tags} label={t('sidebar.categories')} onNavigate={closeMobileMenu} />
          <SidebarNavItem to="/app/goals" icon={Target} label={t('sidebar.goals')} onNavigate={closeMobileMenu} />
          <SidebarNavItem to="/app/reports" icon={BarChart2} label={t('sidebar.reports')} onNavigate={closeMobileMenu} />
          <SidebarNavItem to="/app/settings" icon={Settings} label={t('sidebar.settings')} onNavigate={closeMobileMenu} />
          {user.role === 'admin' && (
            <SidebarNavItem to="/app/admin" icon={ShieldCheck} label={t('sidebar.admin')} onNavigate={closeMobileMenu} />
          )}
        </nav>

        {/* Profile / Logout */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 mt-auto space-y-3">
          <RouterNavLink
            to="/app/settings"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t('sidebar.openSettings')}
          >
            <Avatar size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.displayName ? user.email : user.role === 'admin' ? t('sidebar.roleAdmin') : t('sidebar.roleUser')}
              </p>
            </div>
          </RouterNavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
