import React from 'react';
import type { User, ActiveView } from '../types';
import { Home, List, Target, BarChart2, Plus, LogOut } from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenModal: () => void;
}

// Componente de Ícone e Texto
const NavLink: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center w-full px-4 py-3 rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  user,
  onLogout,
  activeView,
  onViewChange,
  onOpenModal,
}) => {
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
          onClick={onOpenModal}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Transação
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-6 space-y-2">
        <NavLink
          icon={Home}
          label="Dashboard"
          isActive={activeView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
        />
        <NavLink
          icon={List}
          label="Transações"
          isActive={activeView === 'transactions'}
          onClick={() => onViewChange('transactions')}
        />
        <NavLink
          icon={Target}
          label="Metas"
          isActive={activeView === 'goals'}
          onClick={() => onViewChange('goals')}
        />
        <NavLink
          icon={BarChart2}
          label="Relatórios"
          isActive={activeView === 'reports'}
          onClick={() => onViewChange('reports')}
        />
      </nav>

      {/* Perfil / Logout */}
      <div className="p-6 border-t mt-auto">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600 mr-3">
            {/* Pega a primeira letra do email */}
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800" title={user.email}>
              {/* Trunca o email se for muito longo */}
              {user.email.length > 20 ? `${user.email.substring(0, 17)}...` : user.email}
            </p>
            <p className="text-xs text-gray-500">Usuário</p>
          </div>
        </div>
        <button
          onClick={onLogout}
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
