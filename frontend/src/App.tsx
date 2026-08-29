import { useState, useEffect } from 'react';
import type { User, ActiveView, NewTransactionData, Transaction } from './types';
import { apiService } from './services/apiService';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layout e Modal
import AppLayout from './layout/AppLayout';
import NewTransactionModal from './components/NewTransactionModal';

function App() {
  // Estado de Autenticação
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'login' | 'register' | 'app'>('login');
  const [isLoading, setIsLoading] = useState(true);

  // Estado da Aplicação (quando logado)
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyForRefresh, setKeyForRefresh] = useState(0); // Truque para forçar reload
  
  // Estado para guardar a transação que está sendo editada
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Verifica o status de autenticação ao carregar
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const userData = await apiService.checkAuthStatus();
        if (userData) {
          setUser(userData);
          setPage('app'); // Vai para o layout principal
        } else {
          setPage('login');
        }
      } catch (error) {
        setPage('login');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  // --- Handlers de Autenticação ---
  const handleLogin = (userData: User) => {
    setUser(userData);
    setPage('app');
    setActiveView('dashboard'); // Define a view padrão
  };

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    setPage('login');
  };

  const handleNavigateAuth = (targetPage: 'login' | 'register') => {
    setPage(targetPage);
  };

  // --- Handlers da Aplicação ---
  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
  };

  const refreshData = () => {
    setKeyForRefresh((prevKey) => prevKey + 1);
  };

  // Handlers do Modal
  const handleOpenNewModal = () => {
    setEditingTransaction(null); // Garante que é um modal de "novo"
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx); // Define a transação para editar
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null); // Limpa o estado de edição ao fechar
  };

  // Salva (Adicionando ou Editando)
  const handleSaveTransaction = async (data: NewTransactionData) => {
    try {
      if (editingTransaction) {
        // Modo Edição
        await apiService.updateTransaction(editingTransaction.id, data);
      } else {
        // Modo Novo
        await apiService.addTransaction(data);
      }
      handleCloseModal();
      refreshData(); // Força a atualização
    } catch (error) {
      console.error("Falha ao salvar transação", error);
      // Aqui você pode setar um estado de erro no modal
    }
  };

  // Handler para deletar
  const handleDeleteTransaction = async (id: string) => {
    // A boa prática seria usar um modal de confirmação
    // Para o MVP, vamos deletar direto:
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      try {
        await apiService.deleteTransaction(id);
        refreshData(); // Força a atualização
      } catch (error) {
        console.error("Falha ao deletar transação", error);
      }
    }
  };

  // --- Renderização ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-xl font-medium">
        Carregando Finly...
      </div>
    );
  }

  // Renderiza as páginas de login/registro
  if (page === 'login') {
    return <LoginPage onLogin={handleLogin} onNavigate={handleNavigateAuth} />;
  }

  if (page === 'register') {
    return <RegisterPage onRegister={handleLogin} onNavigate={handleNavigateAuth} />;
  }

  // Renderiza o layout principal da aplicação (se logado)
  if (page === 'app' && user) {
    return (
      <>
        <AppLayout
          user={user}
          onLogout={handleLogout}
          activeView={activeView}
          onViewChange={handleViewChange}
          onOpenModal={handleOpenNewModal}
          contentKey={keyForRefresh}
          onEditTransaction={handleOpenEditModal}
          onDeleteTransaction={handleDeleteTransaction}
        />
        <NewTransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTransaction}
          transactionToEdit={editingTransaction}
        />
      </>
    );
  }

  // Fallback
  return <LoginPage onLogin={handleLogin} onNavigate={handleNavigateAuth} />;
}

export default App;
