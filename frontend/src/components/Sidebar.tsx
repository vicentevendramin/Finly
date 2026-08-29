import React from 'react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Home, List, Target, BarChart2, Plus, LogOut } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

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
          Nova Transação
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-6 space-y-2">
        <SidebarNavItem to="/app/dashboard" icon={Home} label="Dashboard" />
        <SidebarNavItem to="/app/transactions" icon={List} label="Transações" />
        <SidebarNavItem to="/app/goals" icon={Target} label="Metas" />
        <SidebarNavItem to="/app/reports" icon={BarChart2} label="Relatórios" />
      </nav>

      {/* Perfil / Logout */}
      <div className="p-6 border-t mt-auto">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 mr-3">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800" title={user.email}>
              {user.email.length > 20 ? `${user.email.substring(0, 17)}...` : user.email}
            </p>
            <p className="text-xs text-gray-500">Usuário</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center text-gray-600 hover:bg-gray-200 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
