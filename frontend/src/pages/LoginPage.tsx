import { useState } from 'react';
import type { User } from '../types';
// Importa o serviço
import { apiService } from '../services/apiService'; 

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: 'register') => void;
}

export default function LoginPage({ onLogin, onNavigate }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // O mock espera (email, password_hash), mas só valida o email
      const user = await apiService.login(email, password); 
      onLogin(user); // Chama a função do App.tsx para mudar de página
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Layout centralizado do Tailwind
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
}
