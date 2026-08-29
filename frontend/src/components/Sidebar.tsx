import React from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, List, Target, BarChart2, Plus, LogOut } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import LanguageSwitcher from './LanguageSwitcher';

const SidebarNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
}> = ({ to, icon: Icon, label }) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) => `
        flex items-center w-full px-4 py-3 rounded-lg transition-colors
        ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}
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

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col h-full">
      {/* Logo / Título */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">
          Finly
        </h1>
      </div>

      {/* Botão Nova Transação */}
      <div className="p-6">
        <button
          onClick={openNewModal}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('sidebar.newTransaction')}
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-6 space-y-2">
        <SidebarNavItem to="/app/dashboard" icon={Home} label={t('sidebar.dashboard')} />
        <SidebarNavItem to="/app/transactions" icon={List} label={t('sidebar.transactions')} />
        <SidebarNavItem to="/app/goals" icon={Target} label={t('sidebar.goals')} />
        <SidebarNavItem to="/app/reports" icon={BarChart2} label={t('sidebar.reports')} />
      </nav>

      {/* Perfil / Logout */}
      <div className="p-6 border-t mt-auto space-y-4">
        <LanguageSwitcher />
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 mr-3">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800" title={user.email}>
              {user.email.length > 20 ? `${user.email.substring(0, 17)}...` : user.email}
            </p>
            <p className="text-xs text-gray-500">{t('sidebar.role')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center text-gray-600 hover:bg-gray-200 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
